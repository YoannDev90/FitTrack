// ============================================================================
// RUN TRACKER COMPONENT — Full-screen run tracking with MapLibre + motivation
// ============================================================================

import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Location from 'expo-location';
import {
  Play,
  Pause,
  Square,
  X,
  ArrowLeft,
  Navigation,
  Clock3,
  MapPin,
  Shield,
  CheckCircle2,
  Siren,
  TriangleAlert,
} from 'lucide-react-native';
import { useRunStore, type LatLng, type RunSegment } from '../../stores/runStore';
import { useAppStore } from '../../stores';
import { useSafetyStore, type SafetyAutoAlertType } from '../../stores/safetyStore';
import { getMapLibreModule } from '../../services/maplibre';
import { BuildConfig } from '../../config/buildConfig';
import {
  startTracking,
  stopTracking,
  requestLocationPermission,
  haversineDistance,
  calculateInstantPace,
  calculateAvgPace,
  calculateElevationGain,
} from '../../services/runTracker';
import i18n from '../../i18n';
import { SafetyCheckConfig } from '@/components/run/SafetyCheckConfig';
import { sendSafetyAlert, sendAllClearSafetyAlert, type AlertPayload } from '@/services/safetyAlert';
import type { SafetyContact } from '../../types';
import { getDefaultSafetySettings } from '../../utils/safety';
import { startFallDetection } from '../../services/fallDetection';
import { simplifyRouteRdp } from '../../utils/geoUtils';
import { serviceLogger } from '../../utils/logger';
import { SafetyCheckOverlay } from './SafetyCheckOverlay';
import { CountdownBanner } from './CountdownBanner';

const { width: SW, height: SH } = Dimensions.get('window');
const MapLibreRN = getMapLibreModule();

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  bg:          '#070709',
  surface:     '#0e0f14',
  surfaceUp:   '#13151e',
  border:      'rgba(255,255,255,0.07)',
  borderUp:    'rgba(255,255,255,0.12)',
  text:        '#f0ece4',
  textSub:     'rgba(240,236,228,0.55)',
  textMuted:   'rgba(240,236,228,0.28)',
  blue:        '#5599ff',
  blueSoft:    'rgba(85,153,255,0.10)',
  green:       '#34d370',
  greenSoft:   'rgba(52,211,112,0.10)',
  greenBorder: 'rgba(52,211,112,0.22)',
  orange:      '#f5a623',
  orangeSoft:  'rgba(245,166,35,0.15)',
  red:         '#f87171',
  redSoft:     'rgba(248,113,113,0.15)',
  gold:        '#e8b84b',
  goldSoft:    'rgba(232,184,75,0.10)',
  violet:      '#a78bfa',
  violetSoft:  'rgba(167,139,250,0.12)',
};
const S = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 };
const R = { sm: 6, md: 10, lg: 14, xl: 18, xxl: 22, full: 999 };
const T = { nano: 9, xs: 11, sm: 13, md: 15, lg: 17, xl: 20, xxl: 26, xxxl: 34, display: 48 };
const W = { reg: '400', med: '500', semi: '600', bold: '700', xbold: '800', black: '900' } as const;

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/dark';

// ============================================================================
// HELPERS
// ============================================================================

function formatPace(secPerKm: number): string {
  if (secPerKm <= 0 || !isFinite(secPerKm) || secPerKm < 60 || secPerKm > 1800) return '--:--';
  const min = Math.floor(secPerKm / 60);
  const sec = Math.floor(secPerKm % 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

/** Pick a random hardcoded motivation message from i18n arrays */
function pickMotivation(key: string): string | null {
  const messages = i18n.t(key, { returnObjects: true });
  if (!Array.isArray(messages) || messages.length === 0) return null;
  return messages[Math.floor(Math.random() * messages.length)];
}

/** Check if a motivation message should be shown based on segment progress */
function checkSegmentMotivation(
  segments: RunSegment[],
  currentSegmentIndex: number,
  distanceKm: number,
  elapsedSeconds: number,
  triggeredMilestones: number[],
  plan: { targetDistanceKm?: number; targetPaceSecPerKm?: number; planType?: string } | null,
  currentPace: number,
): string | null {
  if (!plan) return null;

  // Segment change messages
  if (segments.length > 0 && currentSegmentIndex < segments.length) {
    const seg = segments[currentSegmentIndex];
    if (seg.type === 'run') return pickMotivation('run.motivation.interval.startRun');
    if (seg.type === 'walk') return pickMotivation('run.motivation.interval.startWalk');
    if (seg.type === 'rest') return pickMotivation('run.motivation.interval.startRest');
  }

  const targetDist = plan.targetDistanceKm ?? 0;
  if (targetDist <= 0) return null;
  const progress = distanceKm / targetDist;

  // Long run milestones
  if (plan.planType === 'long_run') {
    if (progress >= 0.25 && !triggeredMilestones.includes(25)) return pickMotivation('run.motivation.longRun.quarter');
    if (progress >= 0.50 && !triggeredMilestones.includes(50)) return pickMotivation('run.motivation.longRun.half');
    if (progress >= 0.75 && !triggeredMilestones.includes(75)) return pickMotivation('run.motivation.longRun.threeQuarters');
    if (progress >= 0.90 && !triggeredMilestones.includes(90)) return pickMotivation('run.motivation.longRun.almostDone');
  }

  // Interval milestones
  if (plan.planType === 'interval' && segments.length > 0) {
    const halfwayIdx = Math.floor(segments.length / 2);
    if (currentSegmentIndex === halfwayIdx && !triggeredMilestones.includes(50)) {
      return pickMotivation('run.motivation.interval.halfway');
    }
    if (currentSegmentIndex === segments.length - 1 && !triggeredMilestones.includes(99)) {
      return pickMotivation('run.motivation.interval.lastSegment');
    }
  }

  // Pace feedback (only with valid pace + target)
  const targetPace = plan.targetPaceSecPerKm ?? 0;
  if (targetPace > 0 && currentPace > 60 && currentPace < 1800) {
    if (currentPace > targetPace * 1.15) return pickMotivation('run.motivation.tooSlow');
    if (currentPace < targetPace * 0.85) return pickMotivation('run.motivation.tooFast');
  }

  return null;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(2)} km`;
}

type GeoJSONPointGeometry = {
  type: 'Point';
  coordinates: [number, number];
};

type GeoJSONLineStringGeometry = {
  type: 'LineString';
  coordinates: [number, number][];
};

type GeoJSONFeature = {
  type: 'Feature';
  properties: Record<string, never>;
  geometry: GeoJSONPointGeometry | GeoJSONLineStringGeometry;
};

type GeoJSONFeatureCollection = {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
};

function buildGeoJSON(coords: LatLng[]): GeoJSONFeatureCollection {
  return {
    type: 'FeatureCollection',
    features: coords.length >= 2 ? [{
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: coords.map(c => [c.longitude, c.latitude] as [number, number]),
      },
    }] : [],
  };
}

function buildPointGeoJSON(coord: LatLng | null): GeoJSONFeatureCollection {
  if (!coord) {
    return { type: 'FeatureCollection', features: [] };
  }

  return {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      properties: {},
      geometry: { type: 'Point', coordinates: [coord.longitude, coord.latitude] },
    }],
  };
}

const EMPTY_GEOJSON: GeoJSONFeatureCollection = { type: 'FeatureCollection', features: [] };
const RING_SIZE = 128;

// ============================================================================
// METRIC CARD
// ============================================================================

const MetricCard = ({ label, value, color }: { label: string; value: string; color?: string }) => (
  <View style={styles.metricCard}>
    <Text style={styles.metricLabel}>{label}</Text>
    <Text style={[styles.metricValue, color ? { color } : {}]}>{value}</Text>
  </View>
);

// ============================================================================
// MOTIVATION BUBBLE (8s display, hardcoded i18n messages)
// ============================================================================

const MotivationBubble = React.memo(({ message }: { message: string | null }) => {
  const [visible, setVisible] = useState(false);
  const [displayedMsg, setDisplayedMsg] = useState<string | null>(null);
  const prevMessage = useRef<string | null>(null);

  useEffect(() => {
    if (message && message !== prevMessage.current) {
      prevMessage.current = message;
      setDisplayedMsg(message);
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  if (!visible || !displayedMsg) return null;

  return (
    <Animated.View
      entering={SlideInDown.duration(300)}
      exiting={FadeOut.duration(300)}
      style={styles.coachBubble}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => setVisible(false)}
        style={styles.coachBubbleInner}
      >
        <Text style={styles.coachBubbleText}>{displayedMsg}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
});

// ============================================================================
// SEGMENT INDICATOR (shows current segment for interval plans)
// ============================================================================

const SegmentIndicator = ({ segment, index, total }: {
  segment: RunSegment; index: number; total: number;
}) => {
  const segColor = segment.type === 'run' ? C.green
    : segment.type === 'walk' ? C.orange
    : C.textMuted;

  return (
    <View style={[styles.segmentIndicator, { borderColor: `${segColor}44` }]}>
      <Text style={styles.segmentEmoji}>{segment.emoji}</Text>
      <View style={{ flex: 1 }}>
        <Text style={[styles.segmentLabel, { color: segColor }]}>{segment.label}</Text>
        <Text style={styles.segmentMeta}>
          {index + 1}/{total}
          {segment.distanceKm ? ` · ${segment.distanceKm} km` : ''}
          {segment.durationMinutes ? ` · ${segment.durationMinutes} min` : ''}
        </Text>
      </View>
    </View>
  );
};

// ============================================================================
// SEGMENTED PROGRESS BAR (colored by segment type)
// ============================================================================

const SegmentedProgressBar = ({ segments, currentIndex, progressInSegment }: {
  segments: RunSegment[];
  currentIndex: number;
  progressInSegment: number; // 0-1 within current segment
}) => {
  const total = segments.length;
  if (total === 0) return null;

  return (
    <View style={styles.segProgressContainer}>
      {segments.map((seg, i) => {
        const segColor = seg.type === 'run' ? C.green
          : seg.type === 'walk' ? C.orange
          : C.textMuted;
        const fill = i < currentIndex ? 1
          : i === currentIndex ? Math.min(1, progressInSegment)
          : 0;

        return (
          <View key={`${seg.type}-${seg.label}-${i}`} style={[styles.segProgressSlot, { flex: 1 }]}>
            <View style={[styles.segProgressBg, i === 0 && { borderTopLeftRadius: 3, borderBottomLeftRadius: 3 }, i === total - 1 && { borderTopRightRadius: 3, borderBottomRightRadius: 3 }]}>
              <View style={[styles.segProgressFill, {
                width: `${fill * 100}%`,
                backgroundColor: segColor,
              }, i === 0 && { borderTopLeftRadius: 3, borderBottomLeftRadius: 3 }, i === total - 1 && fill >= 1 && { borderTopRightRadius: 3, borderBottomRightRadius: 3 }]} />
            </View>
          </View>
        );
      })}
    </View>
  );
};

// ============================================================================
// CONFIRMATION MODAL (replaces Alert.alert)
// ============================================================================

const ConfirmOverlay = ({
  visible, title, onCancel, onConfirm, confirmLabel, confirmColor,
}: {
  visible: boolean; title: string;
  onCancel: () => void; onConfirm: () => void;
  confirmLabel: string; confirmColor?: string;
}) => {
  if (!visible) return null;
  return (
    <View style={styles.modalOverlay}>
      <Animated.View entering={FadeIn.duration(200)} style={styles.modalCard}>
        <Text style={styles.modalTitle}>{title}</Text>
        <View style={styles.modalBtns}>
          <TouchableOpacity onPress={onCancel} style={styles.modalCancelBtn}>
            <Text style={styles.modalCancelText}>{i18n.t('common.cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onConfirm}
            style={[styles.modalConfirmBtn, confirmColor ? { backgroundColor: `${confirmColor}22`, borderColor: `${confirmColor}44` } : {}]}
          >
            <Text style={[styles.modalConfirmText, confirmColor ? { color: confirmColor } : {}]}>
              {confirmLabel}
            </Text>
          </TouchableOpacity> 
        </View>
      </Animated.View>
    </View>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface RunTrackerProps {
  mode: 'simple' | 'ai';
}

export function RunTracker({ mode }: RunTrackerProps) {
  const { t } = useTranslation();
  const settings = useAppStore(s => s.settings);
  const safety = useSafetyStore();
  const store = useRunStore();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  const cameraRef = useRef<any>(null);
  const routeSourceRef = useRef<any>(null);
  const markerSourceRef = useRef<any>(null);
  const fallDetectionCleanupRef = useRef<(() => void) | null>(null);
  const coordsRef = useRef<LatLng[]>([]);
  const lastPointRef = useRef<LatLng | null>(null);
  const distanceRef = useRef<number>(0);
  const throttledUpdateRef = useRef<number>(0);
  const latestSpeedRef = useRef<number>(0);
  const isMountedRef = useRef(true);
  const alertHapticsLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const alertGlow = useSharedValue(0.35);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [motivationMessage, setMotivationMessage] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    visible: boolean; title: string; onConfirm: () => void;
    confirmLabel: string; confirmColor?: string;
  }>({ visible: false, title: '', onConfirm: () => {}, confirmLabel: '' });
  const [showSafetyConfig, setShowSafetyConfig] = useState(false);
  const [showFossMapNotice, setShowFossMapNotice] = useState(BuildConfig.isFoss);
  const [iosSendPromptVisible, setIosSendPromptVisible] = useState(false);
  const sendingRef = useRef(false);

  const alertGlowStyle = useAnimatedStyle(() => ({
    opacity: alertGlow.value,
  }));

  // Initialize mode
  useEffect(() => {
    store.setMode(mode);
  }, [mode]);

  useEffect(() => {
    coordsRef.current = store.coords;
    lastPointRef.current = store.coords.length > 0 ? store.coords[store.coords.length - 1] : null;
    distanceRef.current = store.distanceKm;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (fallDetectionCleanupRef.current) {
        fallDetectionCleanupRef.current();
        fallDetectionCleanupRef.current = null;
      }
      if (alertHapticsLoopRef.current) {
        clearInterval(alertHapticsLoopRef.current);
        alertHapticsLoopRef.current = null;
      }
      stopTracking();
      useSafetyStore.getState().resetCheck();
    };
  }, []);

  // Immediate geolocation on mount — get position before starting
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted' || cancelled) return;
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (cancelled || !isMountedRef.current) return;
        const pos: LatLng = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          altitude: loc.coords.altitude ?? undefined,
          timestamp: loc.timestamp,
          accuracy: loc.coords.accuracy ?? undefined,
        };
        store.setInitialPosition(pos);
        // Center camera on initial position
        if (cameraRef.current) {
          cameraRef.current.setCamera({
            centerCoordinate: [pos.longitude, pos.latitude],
            zoomLevel: 16,
            animationDuration: 800,
          });
        }
      } catch (error) {
        serviceLogger.warn('[RunTracker] Initial position lookup failed', error);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Timer
  useEffect(() => {
    if (store.status === 'running') {
      if (startTimeRef.current === 0) {
        startTimeRef.current = Date.now() - pausedTimeRef.current * 1000;
      }
      timerRef.current = setInterval(() => {
        if (!isMountedRef.current) return;
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        store.setElapsedSeconds(Math.floor(elapsed));
      }, 1000);
    } else if (store.status === 'paused') {
      pausedTimeRef.current = store.elapsedSeconds;
      if (timerRef.current) clearInterval(timerRef.current);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [store.status]);

  useEffect(() => {
    if (store.status !== 'running' && store.status !== 'paused') return;

    const interval = setInterval(() => {
      const current = useSafetyStore.getState();
      if (!current.isEnabled) return;
      if (current.checkStatus === 'pending' || current.checkStatus === 'fall_detected') {
        current.tickPending();
      } else {
        current.tickCountdown();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [store.status]);

  // Motivation message check (every 30s or on segment change)
  useEffect(() => {
    if (store.status !== 'running' || mode !== 'ai' || !store.plan) return;

    const segments = store.plan.segments ?? [];
    const msg = checkSegmentMotivation(
      segments,
      store.currentSegmentIndex,
      store.distanceKm,
      store.elapsedSeconds,
      store.triggeredMilestones,
      store.plan,
      store.currentPaceSecPerKm,
    );
    if (msg) {
      setMotivationMessage(msg);
      // Track milestone to avoid re-triggering
      const targetDist = store.plan.targetDistanceKm ?? 0;
      if (targetDist > 0) {
        const progress = store.distanceKm / targetDist;
        if (progress >= 0.25 && !store.triggeredMilestones.includes(25)) store.addTriggeredMilestone(25);
        if (progress >= 0.50 && !store.triggeredMilestones.includes(50)) store.addTriggeredMilestone(50);
        if (progress >= 0.75 && !store.triggeredMilestones.includes(75)) store.addTriggeredMilestone(75);
        if (progress >= 0.90 && !store.triggeredMilestones.includes(90)) store.addTriggeredMilestone(90);
        if (store.currentSegmentIndex === segments.length - 1 && !store.triggeredMilestones.includes(99)) {
          store.addTriggeredMilestone(99);
        }
      }
      store.updateMotivationCheckpoint(store.distanceKm, Date.now());
    }
  }, [store.currentSegmentIndex, Math.floor(store.distanceKm * 4)]);

  // Segment tracking — advance segment index based on distance/duration
  useEffect(() => {
    if (store.status !== 'running' || !store.plan?.segments) return;
    const segments = store.plan.segments;
    if (segments.length === 0 || store.currentSegmentIndex >= segments.length) return;

    let accumulatedDistance = 0;
    let accumulatedDuration = 0;
    for (let i = 0; i < segments.length; i++) {
      if (segments[i].distanceKm) accumulatedDistance += segments[i].distanceKm!;
      if (segments[i].durationMinutes) accumulatedDuration += segments[i].durationMinutes!;

      if (i > store.currentSegmentIndex) break;

      // Check if we've passed this segment
      const passedByDistance = segments[i].distanceKm && store.distanceKm >= accumulatedDistance;
      const passedByDuration = segments[i].durationMinutes && (store.elapsedSeconds / 60) >= accumulatedDuration;

      if (i === store.currentSegmentIndex && (passedByDistance || passedByDuration)) {
        if (i + 1 < segments.length) {
          store.setCurrentSegmentIndex(i + 1);
        }
        break;
      }
    }
  }, [store.distanceKm, store.elapsedSeconds]);

  // Position handler
  const handlePosition = useCallback((pos: LatLng) => {
    if (!isMountedRef.current) return;
    const state = useRunStore.getState();
    if (state.status !== 'running') return;

    coordsRef.current.push(pos);

    if (lastPointRef.current) {
      const delta = haversineDistance(
        lastPointRef.current.latitude,
        lastPointRef.current.longitude,
        pos.latitude,
        pos.longitude,
      );
      distanceRef.current += delta;
    }

    lastPointRef.current = pos;

    if (typeof pos.speed === 'number' && pos.speed > 0) {
      latestSpeedRef.current = pos.speed;
    }

    const routePoints = coordsRef.current.length > 500
      ? simplifyRouteRdp(coordsRef.current, 0.00001)
      : coordsRef.current;

    routeSourceRef.current?.setNativeProps({ shape: buildGeoJSON(routePoints) });
    markerSourceRef.current?.setNativeProps({ shape: buildPointGeoJSON(pos) });

    cameraRef.current?.setCamera({
      centerCoordinate: [pos.longitude, pos.latitude],
      zoomLevel: 16,
      animationDuration: 800,
    });

    useSafetyStore.getState().updatePosition(pos);

    const now = Date.now();
    if (now - throttledUpdateRef.current < 1000) {
      return;
    }

    throttledUpdateRef.current = now;

    state.appendPosition(pos);
    state.setDistanceKm(distanceRef.current);

    const paceFromSpeed = latestSpeedRef.current > 0 ? 1000 / latestSpeedRef.current : 0;
    const instantPace = paceFromSpeed > 0
      ? paceFromSpeed
      : calculateInstantPace(coordsRef.current, 5);
    const avgPace = calculateAvgPace(distanceRef.current, state.elapsedSeconds);

    state.setCurrentPaceSecPerKm(instantPace);
    state.setAvgPaceSecPerKm(avgPace);
  }, []);

  const sendAlert = useCallback(async (type: SafetyAutoAlertType, contactsOverride?: SafetyContact[]) => {
    if (sendingRef.current) return;

    sendingRef.current = true;
    void useSafetyStore.getState().markAlertSending(type);

    const currentSafety = useSafetyStore.getState();
    const contacts = contactsOverride ?? currentSafety.contacts;

    try {
      if (!contacts.length) {
        void useSafetyStore.getState().markAlertSent({
          type,
          success: [],
          failed: [],
        });
        return;
      }

      if (!currentSafety.lastKnownPosition) {
        void useSafetyStore.getState().markAlertSent({
          type,
          success: [],
          failed: contacts,
        });
        return;
      }

      const payload: AlertPayload = {
        type,
        position: currentSafety.lastKnownPosition,
        runDurationMinutes: store.elapsedSeconds / 60,
        distanceKm: store.distanceKm,
        timestamp: new Date(),
      };

      const result = await sendSafetyAlert(contacts, payload);
      void useSafetyStore.getState().markAlertSent({
        type,
        success: result.success,
        failed: result.failed,
      });

      if (result.iosUserActionRequired) {
        setIosSendPromptVisible(true);
      }
    } catch (error) {
      serviceLogger.warn('[RunTracker] Automatic safety alert failed', error);
      void useSafetyStore.getState().markAlertSent({
        type,
        success: [],
        failed: contacts,
      });
    } finally {
      sendingRef.current = false;
    }
  }, [store.distanceKm, store.elapsedSeconds]);

  useEffect(() => {
    if (!safety.isEnabled) return;
    if (safety.checkStatus === 'auto_alerting' && safety.alertSummary === null) {
      const runAutoAlert = async () => {
        await sendAlert(safety.autoAlertType ?? 'no_response');
      };
      void runAutoAlert();
    }
  }, [sendAlert, safety.alertSummary, safety.autoAlertType, safety.checkStatus, safety.isEnabled]);

  useEffect(() => {
    if (store.status === 'running' && safety.fallDetectionEnabled) {
      fallDetectionCleanupRef.current?.();
      fallDetectionCleanupRef.current = startFallDetection(
        () => {
          useSafetyStore.getState().triggerFallCheck();
        },
        () => useRunStore.getState().status === 'running',
        () => latestSpeedRef.current,
      );
      return;
    }

    if (fallDetectionCleanupRef.current) {
      fallDetectionCleanupRef.current();
      fallDetectionCleanupRef.current = null;
    }
  }, [safety.fallDetectionEnabled, store.status]);

  useEffect(() => {
    if (safety.checkStatus !== 'fall_detected') return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => undefined);
  }, [safety.checkStatus]);

  useEffect(() => {
    if (safety.checkStatus !== 'alert_sent') {
      if (alertHapticsLoopRef.current) {
        clearInterval(alertHapticsLoopRef.current);
        alertHapticsLoopRef.current = null;
      }
      return;
    }

    alertGlow.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 900 }),
        withTiming(0.8, { duration: 1100 }),
      ),
      -1,
      true,
    );

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => undefined);
    alertHapticsLoopRef.current = setInterval(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    }, 2000);

    return () => {
      if (alertHapticsLoopRef.current) {
        clearInterval(alertHapticsLoopRef.current);
        alertHapticsLoopRef.current = null;
      }
    };
  }, [alertGlow, safety.checkStatus]);

  // Start GPS tracking
  const handleStart = useCallback(async () => {
    try {
      await requestLocationPermission();
      coordsRef.current = [];
      lastPointRef.current = null;
      distanceRef.current = 0;
      throttledUpdateRef.current = 0;
      latestSpeedRef.current = 0;
      routeSourceRef.current?.setNativeProps({ shape: EMPTY_GEOJSON });
      store.start();
      startTimeRef.current = Date.now();
      await startTracking(handlePosition);
    } catch (error: unknown) {
      if (error instanceof Error && error.message === 'PERMISSION_DENIED') {
        setPermissionDenied(true);
        return;
      }
      serviceLogger.warn('[RunTracker] Failed to start tracking', error);
    }
  }, [handlePosition]);

  const handlePause = useCallback(async () => {
    store.pause();
    await stopTracking();
  }, []);

  const handleResume = useCallback(async () => {
    store.resume();
    startTimeRef.current = Date.now() - store.elapsedSeconds * 1000;
    await startTracking(handlePosition);
  }, [handlePosition]);

  const handleStop = useCallback(() => {
    setConfirmModal({
      visible: true,
      title: t('run.confirmStop'),
      confirmLabel: t('run.stop'),
      confirmColor: C.red,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, visible: false }));
        await stopTracking();
        useRunStore.getState().setCoords(coordsRef.current);
        useRunStore.getState().setDistanceKm(distanceRef.current);
        store.finish();
        useSafetyStore.getState().resetCheck();
      },
    });
  }, [t]);

  const handleBack = useCallback(() => {
    if (store.status === 'running' || store.status === 'paused') {
      setConfirmModal({
        visible: true,
        title: t('run.confirmStop'),
        confirmLabel: t('run.stop'),
        confirmColor: C.red,
        onConfirm: async () => {
          setConfirmModal(prev => ({ ...prev, visible: false }));
          await stopTracking();
          useRunStore.getState().setCoords(coordsRef.current);
          useRunStore.getState().setDistanceKm(distanceRef.current);
          store.reset();
          useSafetyStore.getState().resetCheck();
          router.back();
        },
      });
    } else {
      store.reset();
      router.back();
    }
  }, [store.status, t]);

  // Permission denied screen
  if (permissionDenied) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.permissionScreen} edges={['top']}>
          <MapPin size={48} color={C.red} />
          <Text style={styles.permissionTitle}>{t('run.permissionDenied')}</Text>
          <TouchableOpacity
            style={styles.permissionBtn}
            onPress={async () => {
              setPermissionDenied(false);
              try {
                await requestLocationPermission();
              } catch (error) {
                serviceLogger.warn('[RunTracker] Permission retry failed', error);
                setPermissionDenied(true);
              }
            }}
          >
            <Text style={styles.permissionBtnText}>{t('run.permissionButton')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.back()} style={{ marginTop: S.lg }}>
            <Text style={{ color: C.textSub, fontSize: T.sm }}>{t('common.back')}</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  // Derived metrics
  const runSettings = (settings as { runSettings?: { displayedMetrics?: string[] } }).runSettings;
  const safetyDefaults = settings.safety ?? getDefaultSafetySettings();

  useEffect(() => {
    useSafetyStore.getState().setContacts(safetyDefaults.contacts);
    useSafetyStore.getState().setFallDetectionEnabled(Boolean(safetyDefaults.fallDetectionEnabled));
  }, [safetyDefaults.contacts, safetyDefaults.fallDetectionEnabled]);
  const displayedMetrics: string[] = runSettings?.displayedMetrics ?? [
    'distance', 'duration', 'currentPace', 'avgPace',
  ];
  const plan = store.plan;
  const segments = plan?.segments ?? [];
  const progressPercent = plan?.targetDistanceKm
    ? Math.min(100, Math.round((store.distanceKm / plan.targetDistanceKm) * 100))
    : null;

  // Current segment progress (for segmented bar)
  let progressInSegment = 0;
  if (segments.length > 0 && store.currentSegmentIndex < segments.length) {
    const seg = segments[store.currentSegmentIndex];
    if (seg.distanceKm) {
      let prevDist = 0;
      for (let i = 0; i < store.currentSegmentIndex; i++) {
        prevDist += segments[i].distanceKm ?? 0;
      }
      progressInSegment = Math.min(1, Math.max(0, (store.distanceKm - prevDist) / seg.distanceKm));
    } else if (seg.durationMinutes) {
      let prevDur = 0;
      for (let i = 0; i < store.currentSegmentIndex; i++) {
        prevDur += segments[i].durationMinutes ?? 0;
      }
      progressInSegment = Math.min(1, Math.max(0, ((store.elapsedSeconds / 60) - prevDur) / seg.durationMinutes));
    }
  }

  const routeGeoJSON = coordsRef.current.length > 0
    ? buildGeoJSON(coordsRef.current)
    : EMPTY_GEOJSON;
  const lastCoord = lastPointRef.current;
  const initialPos = store.initialPosition;
  const nextMinutes = safety.nextCheckAt
    ? Math.max(0, Math.ceil((safety.nextCheckAt - Date.now()) / 60000))
    : 0;

  // Map center: prefer last coord → initial position → fallback
  const mapCenter = lastCoord
    ? [lastCoord.longitude, lastCoord.latitude]
    : initialPos
    ? [initialPos.longitude, initialPos.latitude]
    : [2.3522, 48.8566];

  const markerGeoJSON = buildPointGeoJSON(lastCoord);
  const mapModule = BuildConfig.isFoss ? null : MapLibreRN;
  const shouldShowFossMapNotice = BuildConfig.isFoss && showFossMapNotice;
  const planTopOffset = shouldShowFossMapNotice ? 174 : 100;
  const segmentTopOffset = shouldShowFossMapNotice ? 222 : 148;

  // Initial position marker (shown before run starts)
  const initialMarkerGeoJSON: GeoJSONFeatureCollection = (!lastCoord && initialPos) ? {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      properties: {},
      geometry: { type: 'Point', coordinates: [initialPos.longitude, initialPos.latitude] },
    }],
  } : { type: 'FeatureCollection', features: [] };

  return (
    <View style={styles.container}>
      {/* MAP — Full screen background */}
      {mapModule ? (
        <mapModule.MapView
          style={StyleSheet.absoluteFill}
          mapStyle={MAP_STYLE}
          logoEnabled={false}
          attributionEnabled={false}
          compassEnabled={false}
        >
          <mapModule.Camera
            ref={cameraRef}
            defaultSettings={{
              centerCoordinate: mapCenter as [number, number],
              zoomLevel: 16,
            }}
          />

          {/* Route polyline */}
          <mapModule.ShapeSource ref={routeSourceRef} id="routeSource" shape={routeGeoJSON}>
            <mapModule.LineLayer
              id="routeLine"
              style={{
                lineColor: C.blue,
                lineWidth: 4,
                lineJoin: 'round',
                lineCap: 'round',
              }}
            />
          </mapModule.ShapeSource>

          {/* Current position marker */}
          {lastCoord && (
            <mapModule.ShapeSource ref={markerSourceRef} id="markerSource" shape={markerGeoJSON}>
              <mapModule.CircleLayer
                id="markerOuter"
                style={{
                  circleRadius: 12,
                  circleColor: 'rgba(85,153,255,0.25)',
                  circleStrokeWidth: 0,
                }}
              />
              <mapModule.CircleLayer
                id="markerInner"
                style={{
                  circleRadius: 6,
                  circleColor: C.blue,
                  circleStrokeWidth: 2,
                  circleStrokeColor: '#fff',
                }}
              />
            </mapModule.ShapeSource>
          )}

          {/* Initial position marker (pulsing, before run starts) */}
          {!lastCoord && initialPos && (
            <mapModule.ShapeSource id="initialMarkerSource" shape={initialMarkerGeoJSON}>
              <mapModule.CircleLayer
                id="initialMarkerOuter"
                style={{
                  circleRadius: 16,
                  circleColor: 'rgba(52,211,112,0.15)',
                  circleStrokeWidth: 0,
                }}
              />
              <mapModule.CircleLayer
                id="initialMarkerInner"
                style={{
                  circleRadius: 7,
                  circleColor: C.green,
                  circleStrokeWidth: 2,
                  circleStrokeColor: '#fff',
                }}
              />
            </mapModule.ShapeSource>
          )}
        </mapModule.MapView>
      ) : (
        <LinearGradient
          colors={['#06070b', '#0a0e18', '#111827']}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}

      <LinearGradient
        pointerEvents="none"
        colors={['rgba(8,12,24,0.72)', 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.topAmbientGlow}
      />
      <LinearGradient
        pointerEvents="none"
        colors={['transparent', 'rgba(9,13,22,0.9)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.bottomAmbientGlow}
      />

      {/* Top bar */}
      <SafeAreaView edges={['top']} style={styles.topBar}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <ArrowLeft size={22} color={C.text} />
        </TouchableOpacity>
        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, {
            backgroundColor: store.status === 'running' ? C.green
              : store.status === 'paused' ? C.orange
              : C.textMuted,
          }]} />
          <Text style={styles.statusText}>
            {store.status === 'running' ? t('run.tracking')
              : store.status === 'paused' ? t('run.pause')
              : t('run.ready')}
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.safetyButton,
            safety.isEnabled ? styles.safetyButtonActive : styles.safetyButtonInactive,
          ]}
          onPress={() => setShowSafetyConfig(true)}
          activeOpacity={0.85}
        >
          <Shield size={18} color={safety.isEnabled ? C.green : C.textSub} />
          <Text style={[styles.safetyButtonText, safety.isEnabled && { color: C.green }]}>
            {safety.isEnabled ? `${nextMinutes} ${t('common.minShort')}` : '--'}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>

      {shouldShowFossMapNotice ? (
        <Animated.View entering={FadeIn.duration(220)} style={styles.fossMapNotice}>
          <View style={styles.fossMapNoticeIconBox}>
            <TriangleAlert size={16} color={C.orange} />
          </View>
          <View style={styles.fossMapNoticeTextWrap}>
            <Text style={styles.fossMapNoticeTitle}>{t('run.fossMapDisabled.title')}</Text>
            <Text style={styles.fossMapNoticeBody}>{t('run.fossMapDisabled.message')}</Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowFossMapNotice(false)}
            style={styles.fossMapNoticeCloseBtn}
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
          >
            <X size={16} color={C.textSub} />
          </TouchableOpacity>
        </Animated.View>
      ) : null}

      {/* Plan objective banner */}
      {plan && (
        <Animated.View entering={FadeIn.delay(200)} style={[styles.planBanner, { top: planTopOffset }]}>
          <Text style={styles.planBannerText}>
            🎯 {plan.targetDistanceKm ? `${plan.targetDistanceKm} km` : ''}
            {plan.targetDurationMinutes ? ` · ~${plan.targetDurationMinutes} min` : ''}
            {plan.targetPaceSecPerKm ? ` · ${formatPace(plan.targetPaceSecPerKm)}/km` : ''}
          </Text>
          {/* Segmented progress bar for interval plans */}
          {segments.length > 0 ? (
            <SegmentedProgressBar
              segments={segments}
              currentIndex={store.currentSegmentIndex}
              progressInSegment={progressInSegment}
            />
          ) : progressPercent !== null ? (
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
            </View>
          ) : null}
        </Animated.View>
      )}

      {/* Current segment indicator */}
      {segments.length > 0 && store.currentSegmentIndex < segments.length && (
        <Animated.View entering={FadeIn.delay(300)} style={[styles.segmentBannerWrap, { top: segmentTopOffset }]}>
          <SegmentIndicator
            segment={segments[store.currentSegmentIndex]}
            index={store.currentSegmentIndex}
            total={segments.length}
          />
        </Animated.View>
      )}

      {/* Motivation bubble — above bottom sheet */}
      {mode === 'ai' && (
        <MotivationBubble message={motivationMessage} />
      )}

      {/* Bottom metric sheet */}
      <View style={styles.bottomSheet}>
        <LinearGradient
          colors={['rgba(85,153,255,0.10)', 'rgba(14,15,20,0.96)', 'rgba(14,15,20,0.98)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.bottomSheetGradient}
          pointerEvents="none"
        />
        <View style={styles.bottomSheetHandle} />

        {/* Big distance + time */}
        <View style={styles.bigRow}>
          <View style={styles.bigMetric}>
            <View style={styles.bigMetricLabelRow}>
              <Navigation size={13} color={C.blue} />
              <Text style={styles.bigMetricLabel}>{t('run.distance', { defaultValue: 'Distance' })}</Text>
            </View>
            <View style={styles.bigMetricValueRow}>
              <Text style={styles.bigValue}>{store.distanceKm.toFixed(2)}</Text>
              <Text style={styles.bigUnit}>km</Text>
            </View>
          </View>
          <View style={styles.bigDivider} />
          <View style={styles.bigMetric}>
            <View style={styles.bigMetricLabelRow}>
              <Clock3 size={13} color={C.gold} />
              <Text style={styles.bigMetricLabel}>{t('common.duration', { defaultValue: 'Durée' })}</Text>
            </View>
            <View style={styles.bigMetricValueRow}>
              <Text style={styles.bigValue}>{formatDuration(store.elapsedSeconds)}</Text>
            </View>
          </View>
        </View>

        {/* Metrics grid */}
        <View style={styles.metricsGrid}>
          {displayedMetrics.includes('currentPace') && (
            <MetricCard label={t('run.pace')} value={`${formatPace(store.currentPaceSecPerKm)}/km`} color={C.green} />
          )}
          {displayedMetrics.includes('avgPace') && (
            <MetricCard label={t('run.avgPace')} value={`${formatPace(store.avgPaceSecPerKm)}/km`} />
          )}
          {displayedMetrics.includes('remainingKm') && plan?.targetDistanceKm && (
            <MetricCard label={t('run.remainingKm')} value={formatDistance(Math.max(0, plan.targetDistanceKm - store.distanceKm))} color={C.gold} />
          )}
          {displayedMetrics.includes('progress') && progressPercent !== null && (
            <MetricCard label={t('run.progress')} value={`${progressPercent}%`} color={C.violet} />
          )}
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          {store.status === 'idle' && (
            <TouchableOpacity onPress={handleStart} activeOpacity={0.8}>
              <LinearGradient colors={[C.green, '#28b860']} style={styles.mainBtn}>
                <Play size={28} color="#fff" fill="#fff" />
                <Text style={styles.mainBtnText}>{t('run.start')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
          {store.status === 'running' && (
            <TouchableOpacity onPress={handlePause} activeOpacity={0.8}>
              <LinearGradient colors={[C.orange, '#d48e1e']} style={styles.mainBtn}>
                <Pause size={28} color="#fff" fill="#fff" />
                <Text style={styles.mainBtnText}>{t('run.pause')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
          {store.status === 'paused' && (
            <View style={styles.pausedControls}>
              <TouchableOpacity onPress={handleResume} activeOpacity={0.8}>
                <LinearGradient colors={[C.green, '#28b860']} style={styles.secondaryBtn}>
                  <Play size={22} color="#fff" fill="#fff" />
                  <Text style={styles.secondaryBtnText}>{t('run.resume')}</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleStop} activeOpacity={0.8}>
                <View style={styles.stopBtn}>
                  <Square size={22} color={C.red} fill={C.red} />
                  <Text style={[styles.secondaryBtnText, { color: C.red }]}>{t('run.stop')}</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <View style={styles.safetyCountdownBottomWrap}>
        <CountdownBanner
          visible={safety.checkStatus === 'countdown'}
          seconds={safety.countdownSeconds}
          onPress={() => useSafetyStore.getState().startPendingCheck()}
        />
      </View>

      {/* Confirm modal */}
      <ConfirmOverlay
        visible={confirmModal.visible}
        title={confirmModal.title}
        onCancel={() => setConfirmModal(prev => ({ ...prev, visible: false }))}
        onConfirm={confirmModal.onConfirm}
        confirmLabel={confirmModal.confirmLabel}
        confirmColor={confirmModal.confirmColor}
      />

      <SafetyCheckOverlay
        visible={safety.checkStatus === 'pending' || safety.checkStatus === 'fall_detected' || safety.checkStatus === 'auto_alerting'}
        isFallMode={safety.checkStatus === 'fall_detected' || safety.pendingReason === 'fall'}
        pendingSeconds={safety.pendingSeconds}
        autoAlertDelaySeconds={safety.autoAlertDelaySeconds}
        isSending={safety.checkStatus === 'auto_alerting'}
        onImOk={() => useSafetyStore.getState().dismissCheck()}
        onNeedHelp={() => {
          useSafetyStore.getState().triggerHelp();
          void sendAlert('help_requested');
        }}
        onCall112={() => {
          void Linking.openURL('tel:112');
        }}
        onExtendTime={(minutes) => {
          useSafetyStore.getState().extendCheck(minutes);
        }}
      />

      {safety.checkStatus === 'alert_sent' && safety.alertSummary && (
        <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(300)} style={styles.alertSentOverlay}>
          <Animated.View style={[styles.alertSentGlowEdges, alertGlowStyle]} />
          <SafeAreaView style={styles.alertSentSafeArea} edges={['top', 'bottom']}>
            <View style={styles.alertSentContent}>
              <View style={styles.alertSentIconWrap}>
                <Siren size={56} color="#ffd4d4" />
              </View>
              <Text style={styles.alertSentTitle}>{t('safety.alertSent.title')}</Text>
              <Text style={styles.alertSentSubtitle}>{t('safety.alertSent.subtitle')}</Text>

              <View style={styles.alertSentContactsCard}>
                <Text style={styles.alertSentContactsTitle}>{t('safety.alertSent.contacts')}</Text>
                {[...safety.alertSummary.success.map((contact) => ({ contact, ok: true })), ...safety.alertSummary.failed.map((contact) => ({ contact, ok: false }))].map(({ contact, ok }) => (
                  <View key={contact.id} style={styles.alertSentContactRow}>
                    {ok ? <CheckCircle2 size={14} color={C.green} /> : <TriangleAlert size={14} color={C.orange} />}
                    <Text style={styles.alertSentContactName}>{contact.name}</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.alertSentMeta}>
                {t('safety.alertSent.timestamp', { time: new Date(safety.alertSummary.sentAt).toLocaleTimeString() })}
              </Text>

              {safety.lastKnownPosition && (
                <TouchableOpacity
                  onPress={() => Linking.openURL(`https://maps.google.com/?q=${safety.lastKnownPosition?.latitude},${safety.lastKnownPosition?.longitude}`)}
                  style={styles.alertSentMapLinkBtn}
                >
                  <Text style={styles.alertSentMapLinkText}>
                    {t('safety.alertSent.position', {
                      latitude: safety.lastKnownPosition.latitude.toFixed(5),
                      longitude: safety.lastKnownPosition.longitude.toFixed(5),
                    })}
                  </Text>
                  <Text style={styles.alertSentMapLinkSecondary}>{t('safety.alertSent.openMap')}</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.alertSentActions}>
              <TouchableOpacity style={styles.alertSentCallButton} onPress={() => Linking.openURL('tel:112')}>
                <Text style={styles.alertSentCallButtonText}>{t('safety.alertSent.callEmergency')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.alertSentOkButton}
                onPress={async () => {
                  const result = await sendAllClearSafetyAlert(useSafetyStore.getState().contacts);
                  if (result.iosUserActionRequired) {
                    setIosSendPromptVisible(true);
                  }
                  useSafetyStore.getState().clearAlertSummary();
                }}
              >
                <Text style={styles.alertSentOkButtonText}>{t('safety.alertSent.imOkCancel')}</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Animated.View>
      )}

      <SafetyCheckConfig
        visible={showSafetyConfig}
        contacts={safetyDefaults.contacts}
        initialEnabled={safety.isEnabled}
        defaultIntervalMinutes={safetyDefaults.defaultIntervalMinutes}
        defaultAutoAlertDelaySeconds={safetyDefaults.defaultAutoAlertDelaySeconds}
        defaultFallDetectionEnabled={Boolean(safetyDefaults.fallDetectionEnabled)}
        onClose={() => setShowSafetyConfig(false)}
        onGoToSettings={() => {
          setShowSafetyConfig(false);
          router.push('/settings/safety');
        }}
        onActivate={({
          enabled,
          intervalMinutes,
          autoAlertDelaySeconds,
          fallDetectionEnabled,
        }: {
          enabled: boolean;
          intervalMinutes: number;
          autoAlertDelaySeconds: number;
          fallDetectionEnabled: boolean;
        }) => {
          if (!enabled) {
            useSafetyStore.getState().resetCheck();
            return;
          }
          useSafetyStore.getState().initCheck(
            intervalMinutes,
            autoAlertDelaySeconds,
            safetyDefaults.contacts,
            fallDetectionEnabled,
          );
        }}
      />

      {iosSendPromptVisible && (
        <View style={styles.iosPromptOverlay}>
          <View style={styles.iosPromptCard}>
            <Text style={styles.iosPromptTitle}>{t('safety.alert.sendSuccess')}</Text>
            <Text style={styles.iosPromptText}>{t('safety.alert.iosSendPrompt')}</Text>
            <TouchableOpacity style={styles.iosPromptButton} onPress={() => setIosSendPromptVisible(false)}>
              <Text style={styles.iosPromptButtonText}>{t('common.ok')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  topAmbientGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SH * 0.42,
    zIndex: 10,
  },
  bottomAmbientGlow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: SH * 0.5,
    zIndex: 10,
  },

  // Top bar
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: S.lg, paddingTop: S.sm,
  },
  backBtn: {
    width: 42, height: 42, borderRadius: R.full,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.border,
  },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: S.sm,
    paddingHorizontal: S.md, paddingVertical: S.xs,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: R.full, borderWidth: 1, borderColor: C.border,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: T.xs, fontWeight: W.semi, color: C.textSub },
  safetyButton: {
    minWidth: 64,
    height: 42,
    borderRadius: R.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: S.xs,
    paddingHorizontal: S.md,
  },
  safetyButtonActive: {
    backgroundColor: 'rgba(52,211,112,0.12)',
    borderColor: C.greenBorder,
  },
  safetyButtonInactive: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderColor: C.border,
  },
  safetyButtonText: {
    color: C.textSub,
    fontSize: T.xs,
    fontWeight: W.bold,
  },
  fossMapNotice: {
    position: 'absolute',
    top: 96,
    left: S.lg,
    right: S.lg,
    zIndex: 22,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: S.sm,
    paddingVertical: S.sm,
    paddingHorizontal: S.md,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: 'rgba(245,166,35,0.28)',
    backgroundColor: 'rgba(16,12,6,0.86)',
  },
  fossMapNoticeIconBox: {
    width: 26,
    height: 26,
    borderRadius: R.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245,166,35,0.16)',
    marginTop: 1,
  },
  fossMapNoticeTextWrap: {
    flex: 1,
    gap: 2,
  },
  fossMapNoticeTitle: {
    color: '#ffd7a3',
    fontSize: T.xs,
    fontWeight: W.bold,
  },
  fossMapNoticeBody: {
    color: C.textSub,
    fontSize: T.nano,
    lineHeight: 14,
  },
  fossMapNoticeCloseBtn: {
    width: 26,
    height: 26,
    borderRadius: R.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  safetyCountdownBottomWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: Platform.OS === 'ios' ? 280 : 256,
    zIndex: 45,
  },

  // Plan banner
  planBanner: {
    position: 'absolute', top: 100, left: S.lg, right: S.lg, zIndex: 15,
    padding: S.md,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: R.lg, borderWidth: 1, borderColor: 'rgba(85,153,255,0.22)',
  },
  planBannerText: { fontSize: T.xs, fontWeight: W.semi, color: C.blue, textAlign: 'center' },
  progressBar: {
    marginTop: S.sm, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 2, backgroundColor: C.blue },

  // Motivation bubble
  coachBubble: {
    position: 'absolute', bottom: 340, left: S.lg, right: S.lg, zIndex: 25,
  },
  coachBubbleInner: {
    flexDirection: 'row', alignItems: 'center', gap: S.sm,
    padding: S.md,
    backgroundColor: 'rgba(14,15,20,0.92)',
    borderRadius: R.xl, borderWidth: 1,
    borderColor: 'rgba(52,211,112,0.22)',
  },
  coachBubbleText: { flex: 1, fontSize: T.sm, color: C.text, lineHeight: 20 },

  // Segment indicator
  segmentBannerWrap: {
    position: 'absolute', top: 148, left: S.lg, right: S.lg, zIndex: 14,
  },
  segmentIndicator: {
    flexDirection: 'row', alignItems: 'center', gap: S.sm,
    padding: S.md,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: R.lg, borderWidth: 1,
  },
  segmentEmoji: { fontSize: 20 },
  segmentLabel: { fontSize: T.sm, fontWeight: W.bold },
  segmentMeta: { fontSize: T.nano, color: C.textMuted, marginTop: 2 },

  // Segmented progress bar
  segProgressContainer: {
    flexDirection: 'row', marginTop: S.sm, height: 6, gap: 2,
  },
  segProgressSlot: { overflow: 'hidden' },
  segProgressBg: {
    height: '100%', backgroundColor: 'rgba(255,255,255,0.08)',
  },
  segProgressFill: { height: '100%' },

  // Bottom sheet
  bottomSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 20,
    backgroundColor: 'rgba(14,15,20,0.94)',
    borderTopLeftRadius: R.xxl, borderTopRightRadius: R.xxl,
    borderTopWidth: 1, borderTopColor: C.border,
    paddingHorizontal: S.lg, paddingTop: S.xl,
    paddingBottom: Platform.OS === 'ios' ? 44 : S.xxl,
    overflow: 'hidden',
  },
  bottomSheetGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  bottomSheetHandle: {
    width: 44,
    height: 4,
    borderRadius: R.full,
    backgroundColor: 'rgba(255,255,255,0.24)',
    alignSelf: 'center',
    marginBottom: S.md,
  },
  bigRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginBottom: S.lg,
  },
  bigMetric: { flex: 1, alignItems: 'center', gap: S.xs },
  bigMetricLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.xs,
  },
  bigMetricLabel: {
    fontSize: T.nano,
    fontWeight: W.bold,
    color: C.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.3,
  },
  bigMetricValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: S.xs,
  },
  bigValue: { fontSize: 38, fontWeight: W.black, color: C.text, letterSpacing: -1 },
  bigUnit: { fontSize: T.lg, fontWeight: W.semi, color: C.textSub },
  bigDivider: {
    width: 1, height: 52, backgroundColor: C.border, marginHorizontal: S.lg,
  },

  // Metrics
  metricsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: S.sm, marginBottom: S.lg,
  },
  metricCard: {
    flex: 1, minWidth: (SW - S.lg * 2 - S.sm) / 2 - 1,
    padding: S.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: R.lg, borderWidth: 1, borderColor: C.border,
  },
  metricLabel: { fontSize: T.nano, fontWeight: W.bold, color: C.textMuted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: S.xs },
  metricValue: { fontSize: T.xl, fontWeight: W.xbold, color: C.text },

  // Controls
  controls: { alignItems: 'center', paddingBottom: S.sm },
  mainBtn: {
    flexDirection: 'row', alignItems: 'center', gap: S.md,
    paddingHorizontal: 48, paddingVertical: 18, borderRadius: R.full,
  },
  mainBtnText: { fontSize: T.lg, fontWeight: W.bold, color: '#fff' },
  pausedControls: { flexDirection: 'row', gap: S.lg },
  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: S.sm,
    paddingHorizontal: 28, paddingVertical: 16, borderRadius: R.full,
  },
  secondaryBtnText: { fontSize: T.md, fontWeight: W.bold, color: '#fff' },
  stopBtn: {
    flexDirection: 'row', alignItems: 'center', gap: S.sm,
    paddingHorizontal: 28, paddingVertical: 16, borderRadius: R.full,
    backgroundColor: C.redSoft,
    borderWidth: 1, borderColor: 'rgba(248,113,113,0.25)',
  },

  // Confirm modal
  modalOverlay: {
    ...StyleSheet.absoluteFillObject, zIndex: 100,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center', alignItems: 'center',
  },
  modalCard: {
    width: SW - 64, padding: S.xl,
    backgroundColor: '#13151e', borderRadius: R.xxl,
    borderWidth: 1, borderColor: C.borderUp,
    alignItems: 'center', gap: S.xl,
  },
  modalTitle: { fontSize: T.lg, fontWeight: W.bold, color: C.text, textAlign: 'center' },
  modalBtns: { flexDirection: 'row', gap: S.md, width: '100%' },
  modalCancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: R.lg,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', borderWidth: 1, borderColor: C.border,
  },
  modalCancelText: { fontSize: T.md, fontWeight: W.semi, color: C.textSub },
  modalConfirmBtn: {
    flex: 1, paddingVertical: 14, borderRadius: R.lg,
    backgroundColor: 'rgba(248,113,113,0.15)',
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(248,113,113,0.3)',
  },
  modalConfirmText: { fontSize: T.md, fontWeight: W.bold, color: C.red },
  safetyOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 120,
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  safetyOverlayBackdrop: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: S.lg,
  },
  safetyOverlayCard: {
    backgroundColor: 'rgba(9,16,28,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(132,170,230,0.35)',
    borderRadius: R.xxl,
    padding: S.xl,
    gap: S.md,
  },
  safetyOverlayCardFall: {
    backgroundColor: 'rgba(38,18,16,0.92)',
    borderColor: 'rgba(232,134,79,0.4)',
  },
  safetyOverlayHeaderStack: {
    alignItems: 'center',
    gap: S.xs,
  },
  safetyIconGlow: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(121,180,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: S.xs,
  },
  safetyOverlayTitle: {
    color: C.text,
    fontSize: T.xxl,
    fontWeight: W.bold,
    textAlign: 'center',
  },
  safetyOverlaySubtitle: {
    color: C.textSub,
    fontSize: T.md,
    textAlign: 'center',
    marginBottom: S.sm,
  },
  ringWrap: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringValue: {
    color: C.text,
    fontSize: 40,
    fontWeight: W.bold,
    letterSpacing: -1,
  },
  sendingWrap: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    gap: S.sm,
    minHeight: RING_SIZE,
  },
  sendingText: {
    color: C.text,
    fontSize: T.sm,
    fontWeight: W.semi,
  },
  slideTrack: {
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: S.md,
    overflow: 'hidden',
  },
  slideFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  slideLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: S.sm,
  },
  slideChevrons: {
    fontSize: T.sm,
    fontWeight: W.bold,
    letterSpacing: 1,
  },
  slideLabel: {
    fontSize: T.md,
    fontWeight: W.semi,
  },
  slideThumb: {
    position: 'absolute',
    left: 4,
    width: 56,
    height: 56,
    borderRadius: R.full,
    justifyContent: 'center',
    alignItems: 'center',
    top: 4,
  },
  addTimeLink: {
    marginTop: S.sm,
    alignSelf: 'center',
    paddingVertical: S.xs,
    paddingHorizontal: S.md,
  },
  addTimeLinkText: {
    color: C.gold,
    fontSize: T.sm,
    fontWeight: W.semi,
    textDecorationLine: 'underline',
  },
  alertSentOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 130,
    backgroundColor: '#5a0f16',
  },
  alertSentGlowEdges: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 6,
    borderColor: 'rgba(255,120,120,0.65)',
    shadowColor: '#ff6b6b',
    shadowOpacity: 0.8,
    shadowRadius: 24,
    elevation: 8,
  },
  alertSentSafeArea: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: S.xl,
    paddingVertical: S.xl,
  },
  alertSentContent: {
    alignItems: 'center',
    gap: S.md,
  },
  alertSentIconWrap: {
    marginTop: S.xl,
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertSentTitle: {
    color: '#fff0f0',
    fontSize: 34,
    fontWeight: W.black,
    textAlign: 'center',
  },
  alertSentSubtitle: {
    color: 'rgba(255,233,233,0.9)',
    fontSize: T.lg,
    fontWeight: W.semi,
    textAlign: 'center',
  },
  alertSentContactsCard: {
    width: '100%',
    borderRadius: R.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,209,209,0.3)',
    backgroundColor: 'rgba(36,7,10,0.5)',
    padding: S.md,
    gap: S.xs,
  },
  alertSentContactsTitle: {
    color: '#ffe3e3',
    fontSize: T.sm,
    fontWeight: W.bold,
    marginBottom: 2,
  },
  alertSentContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.xs,
  },
  alertSentContactName: {
    color: '#fff3f3',
    fontSize: T.sm,
  },
  alertSentMeta: {
    color: 'rgba(255,225,225,0.88)',
    fontSize: T.xs,
  },
  alertSentMapLinkBtn: {
    paddingVertical: S.sm,
    paddingHorizontal: S.md,
    borderRadius: R.lg,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,214,214,0.28)',
    gap: 2,
  },
  alertSentMapLinkText: {
    color: '#fff3f3',
    fontSize: T.xs,
  },
  alertSentMapLinkSecondary: {
    color: '#ffd8d8',
    fontSize: T.xs,
    textDecorationLine: 'underline',
  },
  alertSentActions: {
    gap: S.sm,
  },
  alertSentCallButton: {
    borderRadius: R.full,
    backgroundColor: '#d82727',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
  },
  alertSentCallButtonText: {
    color: '#fff',
    fontSize: T.md,
    fontWeight: W.bold,
  },
  alertSentOkButton: {
    borderRadius: R.full,
    borderWidth: 1,
    borderColor: 'rgba(255,218,218,0.35)',
    backgroundColor: 'rgba(0,0,0,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
  },
  alertSentOkButtonText: {
    color: '#ffe2e2',
    fontSize: T.sm,
    fontWeight: W.semi,
  },
  addTimeSheetOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 132,
    justifyContent: 'flex-end',
  },
  addTimeSheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  addTimeSheetCard: {
    margin: S.lg,
    borderRadius: R.xxl,
    borderWidth: 1,
    borderColor: C.borderUp,
    backgroundColor: '#10131d',
    padding: S.lg,
    gap: S.sm,
  },
  addTimeSheetTitle: {
    color: C.text,
    fontSize: T.sm,
    fontWeight: W.semi,
    textAlign: 'center',
  },
  addTimePillsRow: {
    flexDirection: 'row',
    gap: S.sm,
  },
  addTimePill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: R.full,
    borderWidth: 1,
    borderColor: 'rgba(245,166,35,0.35)',
    backgroundColor: 'rgba(245,166,35,0.12)',
    minHeight: 42,
  },
  addTimePillText: {
    color: C.gold,
    fontSize: T.xs,
    fontWeight: W.bold,
  },
  iosPromptOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 135,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: S.xl,
  },
  iosPromptCard: {
    width: '100%',
    borderRadius: R.xl,
    borderWidth: 1,
    borderColor: C.borderUp,
    backgroundColor: '#111827',
    padding: S.lg,
    gap: S.md,
  },
  iosPromptTitle: {
    color: C.text,
    fontSize: T.lg,
    fontWeight: W.bold,
    textAlign: 'center',
  },
  iosPromptText: {
    color: C.textSub,
    fontSize: T.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  iosPromptButton: {
    borderRadius: R.full,
    backgroundColor: C.blue,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iosPromptButtonText: {
    color: '#fff',
    fontSize: T.sm,
    fontWeight: W.bold,
  },

  // Permission screen
  permissionScreen: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: S.xl, gap: S.lg,
  },
  permissionTitle: { fontSize: T.lg, fontWeight: W.bold, color: C.text, textAlign: 'center' },
  permissionBtn: {
    paddingHorizontal: 32, paddingVertical: 14,
    backgroundColor: C.blue, borderRadius: R.full,
  },
  permissionBtnText: { fontSize: T.md, fontWeight: W.bold, color: '#fff' },
});
