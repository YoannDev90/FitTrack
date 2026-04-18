import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import Constants from 'expo-constants';
import {
  ArrowLeft,
  Camera,
  Circle,
  Square,
  Share2,
  Save,
  Trash2,
  Activity,
} from 'lucide-react-native';
import { KnownPoseLandmarks } from 'react-native-mediapipe-posedetection';

import { GlassCard, PoseCameraView } from '../../src/components/ui';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../src/constants';
import { useAppStore } from '../../src/stores';
import type { PoseLandmarks } from '../../src/utils/poseDetection';

const SAMPLE_INTERVAL_MS = 90;
const STATS_REFRESH_MS = 220;

interface CaptureLandmark {
  x: number;
  y: number;
  z: number;
  visibility: number | null;
  presence: number | null;
}

interface PoseCaptureFrame {
  timestampIso: string;
  elapsedMs: number;
  landmarks: CaptureLandmark[] | null;
}

interface PoseCapturePayload {
  schemaVersion: number;
  type: 'spix.pose_capture';
  metadata: {
    generatedAt: string;
    appVersion: string;
    platform: string;
    cameraFacing: 'front';
    sampleIntervalMs: number;
    movementLabel: string;
    landmarkOrder: string;
    keyPointIndexes: Record<string, number>;
  };
  summary: {
    durationMs: number;
    totalFrames: number;
    poseFrames: number;
    noPoseFrames: number;
    poseDetectionRate: number;
    averageVisibility: number;
    sampleRateFps: number;
  };
  frames: PoseCaptureFrame[];
}

interface PointDebugStat {
  key: string;
  label: string;
  index: number;
  visibility: number | null;
  x: number | null;
  y: number | null;
}

const KEY_POINTS: Array<{ key: string; label: string; index: number }> = [
  { key: 'nose', label: 'Nose', index: KnownPoseLandmarks.nose },
  { key: 'leftShoulder', label: 'L Shoulder', index: KnownPoseLandmarks.leftShoulder },
  { key: 'rightShoulder', label: 'R Shoulder', index: KnownPoseLandmarks.rightShoulder },
  { key: 'leftElbow', label: 'L Elbow', index: KnownPoseLandmarks.leftElbow },
  { key: 'rightElbow', label: 'R Elbow', index: KnownPoseLandmarks.rightElbow },
  { key: 'leftHip', label: 'L Hip', index: KnownPoseLandmarks.leftHip },
  { key: 'rightHip', label: 'R Hip', index: KnownPoseLandmarks.rightHip },
  { key: 'leftKnee', label: 'L Knee', index: KnownPoseLandmarks.leftKnee },
  { key: 'rightKnee', label: 'R Knee', index: KnownPoseLandmarks.rightKnee },
  { key: 'leftAnkle', label: 'L Ankle', index: KnownPoseLandmarks.leftAnkle },
  { key: 'rightAnkle', label: 'R Ankle', index: KnownPoseLandmarks.rightAnkle },
];

const KEY_POINT_INDEXES: Record<string, number> = KEY_POINTS.reduce((acc, point) => {
  acc[point.key] = point.index;
  return acc;
}, {} as Record<string, number>);

const round4 = (value: number): number => {
  return Math.round(value * 10000) / 10000;
};

const sanitizeMovementLabel = (value: string): string => {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  if (!normalized) {
    return 'movement';
  }

  return normalized.slice(0, 40);
};

const formatPercent = (value: number): string => `${Math.round(value * 100)}%`;

const formatNullable = (value: number | null): string => {
  if (value == null) return '-';
  return value.toFixed(3);
};

const getVisibilityColor = (value: number | null): string => {
  if (value == null) return Colors.muted;
  if (value >= 0.7) return Colors.successStrong;
  if (value >= 0.45) return Colors.warning;
  return Colors.error;
};

const serializeLandmarks = (landmarks: PoseLandmarks | null): CaptureLandmark[] | null => {
  if (!landmarks || landmarks.length === 0) {
    return null;
  }

  return landmarks.map((landmark) => ({
    x: round4(landmark.x),
    y: round4(landmark.y),
    z: round4(landmark.z),
    visibility: typeof landmark.visibility === 'number' ? round4(landmark.visibility) : null,
    presence: typeof landmark.presence === 'number' ? round4(landmark.presence) : null,
  }));
};

export default function PoseDebugScreen() {
  const { t } = useTranslation();
  const developerModeEnabled = useAppStore((state) => state.settings.developerMode ?? false);

  const [movementLabel, setMovementLabel] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedFileUri, setLastSavedFileUri] = useState<string | null>(null);

  const [totalFrames, setTotalFrames] = useState(0);
  const [poseFrames, setPoseFrames] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [averageVisibility, setAverageVisibility] = useState(0);
  const [sampleRateFps, setSampleRateFps] = useState(0);
  const [pointStats, setPointStats] = useState<PointDebugStat[]>(
    KEY_POINTS.map((point) => ({
      key: point.key,
      label: point.label,
      index: point.index,
      visibility: null,
      x: null,
      y: null,
    }))
  );

  const framesRef = useRef<PoseCaptureFrame[]>([]);
  const latestPoseRef = useRef<PoseLandmarks | null>(null);
  const recordingStartedAtRef = useRef<number | null>(null);
  const frozenDurationMsRef = useRef<number>(0);
  const lastSampleAtRef = useRef<number>(0);
  const visibilityAccumulatorRef = useRef<{ sum: number; count: number }>({ sum: 0, count: 0 });

  useEffect(() => {
    if (!developerModeEnabled) {
      router.replace('/settings');
    }
  }, [developerModeEnabled]);

  useEffect(() => {
    const timer = setInterval(() => {
      const frames = framesRef.current;
      const total = frames.length;
      const withPose = frames.reduce((count, frame) => count + (frame.landmarks ? 1 : 0), 0);
      const liveDuration =
        isRecording && recordingStartedAtRef.current != null
          ? Date.now() - recordingStartedAtRef.current
          : frozenDurationMsRef.current;

      const visibility = visibilityAccumulatorRef.current;
      const avgVisibility = visibility.count > 0 ? visibility.sum / visibility.count : 0;
      const fps = liveDuration > 0 ? total / (liveDuration / 1000) : 0;

      const pose = latestPoseRef.current;
      const nextPointStats: PointDebugStat[] = KEY_POINTS.map((point) => {
        const landmark = pose?.[point.index];
        return {
          key: point.key,
          label: point.label,
          index: point.index,
          visibility: typeof landmark?.visibility === 'number' ? landmark.visibility : null,
          x: typeof landmark?.x === 'number' ? landmark.x : null,
          y: typeof landmark?.y === 'number' ? landmark.y : null,
        };
      });

      setTotalFrames(total);
      setPoseFrames(withPose);
      setDurationMs(Math.max(0, liveDuration));
      setAverageVisibility(avgVisibility);
      setSampleRateFps(fps);
      setPointStats(nextPointStats);
    }, STATS_REFRESH_MS);

    return () => clearInterval(timer);
  }, [isRecording]);

  const onPoseDetected = useCallback(
    (landmarks: PoseLandmarks | null) => {
      latestPoseRef.current = landmarks;

      if (!isRecording) {
        return;
      }

      const now = Date.now();
      if (now - lastSampleAtRef.current < SAMPLE_INTERVAL_MS) {
        return;
      }
      lastSampleAtRef.current = now;

      if (recordingStartedAtRef.current == null) {
        recordingStartedAtRef.current = now;
      }

      const elapsedMs = now - recordingStartedAtRef.current;
      const serialized = serializeLandmarks(landmarks);

      if (serialized) {
        for (const point of serialized) {
          if (typeof point.visibility === 'number') {
            visibilityAccumulatorRef.current.sum += point.visibility;
            visibilityAccumulatorRef.current.count += 1;
          }
        }
      }

      framesRef.current.push({
        timestampIso: new Date(now).toISOString(),
        elapsedMs,
        landmarks: serialized,
      });
    },
    [isRecording]
  );

  const startRecording = useCallback(() => {
    framesRef.current = [];
    visibilityAccumulatorRef.current = { sum: 0, count: 0 };
    recordingStartedAtRef.current = Date.now();
    frozenDurationMsRef.current = 0;
    lastSampleAtRef.current = 0;
    setLastSavedFileUri(null);
    setIsRecording(true);
  }, []);

  const stopRecording = useCallback(() => {
    if (recordingStartedAtRef.current != null) {
      frozenDurationMsRef.current = Math.max(0, Date.now() - recordingStartedAtRef.current);
    }
    recordingStartedAtRef.current = null;
    setIsRecording(false);
  }, []);

  const clearCapture = useCallback(() => {
    setIsRecording(false);
    framesRef.current = [];
    recordingStartedAtRef.current = null;
    frozenDurationMsRef.current = 0;
    lastSampleAtRef.current = 0;
    visibilityAccumulatorRef.current = { sum: 0, count: 0 };
    setLastSavedFileUri(null);
  }, []);

  const buildPayloadSnapshot = useCallback((): PoseCapturePayload => {
    const snapshot = [...framesRef.current];
    const total = snapshot.length;
    const withPose = snapshot.reduce((count, frame) => count + (frame.landmarks ? 1 : 0), 0);
    const noPose = total - withPose;
    const duration = total > 0 ? snapshot[total - 1].elapsedMs : 0;

    let visibilitySum = 0;
    let visibilityCount = 0;
    for (const frame of snapshot) {
      if (!frame.landmarks) continue;
      for (const landmark of frame.landmarks) {
        if (typeof landmark.visibility === 'number') {
          visibilitySum += landmark.visibility;
          visibilityCount += 1;
        }
      }
    }

    const average = visibilityCount > 0 ? visibilitySum / visibilityCount : 0;
    const sampleRate = duration > 0 ? total / (duration / 1000) : 0;

    return {
      schemaVersion: 1,
      type: 'spix.pose_capture',
      metadata: {
        generatedAt: new Date().toISOString(),
        appVersion: Constants.expoConfig?.version ?? 'unknown',
        platform: Platform.OS,
        cameraFacing: 'front',
        sampleIntervalMs: SAMPLE_INTERVAL_MS,
        movementLabel: movementLabel.trim() || 'unspecified',
        landmarkOrder: 'MediaPipe Pose Landmarker (33 landmarks, index-based)',
        keyPointIndexes: KEY_POINT_INDEXES,
      },
      summary: {
        durationMs: duration,
        totalFrames: total,
        poseFrames: withPose,
        noPoseFrames: noPose,
        poseDetectionRate: total > 0 ? withPose / total : 0,
        averageVisibility: average,
        sampleRateFps: sampleRate,
      },
      frames: snapshot,
    };
  }, [movementLabel]);

  const saveCaptureToFile = useCallback(async (): Promise<string | null> => {
    if (framesRef.current.length === 0) {
      Alert.alert(
        t('common.warning'),
        t('settings.developer.poseCaptureNoData', 'No capture data yet. Record a movement first.')
      );
      return null;
    }

    const payload = buildPayloadSnapshot();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safeLabel = sanitizeMovementLabel(movementLabel);
    const filename = `spix-pose-capture-${safeLabel}-${timestamp}.json`;
    const uri = `${FileSystem.documentDirectory}${filename}`;

    await FileSystem.writeAsStringAsync(uri, JSON.stringify(payload, null, 2), {
      encoding: FileSystem.EncodingType.UTF8,
    });

    setLastSavedFileUri(uri);
    return uri;
  }, [buildPayloadSnapshot, movementLabel, t]);

  const handleSave = useCallback(async () => {
    try {
      setIsSaving(true);
      const savedUri = await saveCaptureToFile();
      if (!savedUri) return;

      Alert.alert(
        t('common.success'),
        t('settings.developer.poseCaptureSaved', 'Capture saved to app storage.')
      );
    } catch (error) {
      console.error('Failed to save pose capture', error);
      Alert.alert(t('common.error'), t('settings.developer.poseCaptureSaveError', 'Failed to save capture.'));
    } finally {
      setIsSaving(false);
    }
  }, [saveCaptureToFile, t]);

  const handleShare = useCallback(async () => {
    try {
      setIsSaving(true);

      let uri = lastSavedFileUri;
      if (!uri) {
        uri = await saveCaptureToFile();
      }

      if (!uri) return;

      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert(
          t('common.warning'),
          t('settings.developer.poseCaptureShareUnavailable', 'Sharing is not available on this device.')
        );
        return;
      }

      await Sharing.shareAsync(uri, {
        mimeType: 'application/json',
        dialogTitle: t('settings.developer.poseCaptureShareTitle', 'Share pose capture JSON'),
        UTI: 'public.json',
      });
    } catch (error) {
      console.error('Failed to share pose capture', error);
      Alert.alert(t('common.error'), t('settings.developer.poseCaptureShareError', 'Failed to share capture.'));
    } finally {
      setIsSaving(false);
    }
  }, [lastSavedFileUri, saveCaptureToFile, t]);

  const durationLabel = useMemo(() => {
    const seconds = Math.floor(durationMs / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const mm = mins.toString().padStart(2, '0');
    const ss = secs.toString().padStart(2, '0');
    return `${mm}:${ss}`;
  }, [durationMs]);

  const poseRate = totalFrames > 0 ? poseFrames / totalFrames : 0;
  const lastSavedFileName = lastSavedFileUri ? lastSavedFileUri.split('/').pop() ?? lastSavedFileUri : null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={[Colors.overlayTeal20, Colors.transparent]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={styles.topGlow}
        pointerEvents="none"
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeIn.delay(40)} style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.eyebrow}>{t('settings.eyebrow', 'SPIX')}</Text>
            <Text style={styles.screenTitle}>
              {t('settings.developer.poseCaptureScreenTitle', 'Pose Capture Debug')}
            </Text>
          </View>
          <View style={styles.headerIconWrap}>
            <Camera size={18} color={Colors.teal} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).springify()}>
          <GlassCard style={styles.cameraCard}>
            <Text style={styles.cardTitle}>{t('settings.developer.poseCaptureCameraTitle', 'Front Camera')}</Text>
            <Text style={styles.cardSubtitle}>
              {t(
                'settings.developer.poseCaptureCameraSubtitle',
                'Repeat your target movement. Landmarks are sampled continuously for JSON analysis.'
              )}
            </Text>

            <View style={styles.cameraPreviewWrap}>
              <PoseCameraView
                facing="front"
                showDebugOverlay
                exerciseType="squats"
                onPoseDetected={onPoseDetected}
                isActive
                style={styles.cameraPreview}
              />
            </View>

            <View style={styles.controlRow}>
              <TouchableOpacity
                style={isRecording ? styles.recordButtonActive : styles.recordButton}
                onPress={isRecording ? stopRecording : startRecording}
                disabled={isSaving}
              >
                {isRecording ? (
                  <Square size={16} color={Colors.white} fill={Colors.white} />
                ) : (
                  <Circle size={16} color={Colors.white} fill={Colors.error} />
                )}
                <Text style={styles.recordButtonText}>
                  {isRecording
                    ? t('settings.developer.poseCaptureStop', 'Stop recording')
                    : t('settings.developer.poseCaptureStart', 'Start recording')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.clearButton} onPress={clearCapture} disabled={isSaving}>
                <Trash2 size={16} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.samplingHint}>
              {t('settings.developer.poseCaptureSampleRate', {
                defaultValue: 'Sampling every {{ms}} ms',
                ms: SAMPLE_INTERVAL_MS,
              })}
            </Text>
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(110).springify()}>
          <GlassCard style={styles.exportCard}>
            <Text style={styles.cardTitle}>{t('settings.developer.poseCaptureExportTitle', 'Export')}</Text>
            <TextInput
              value={movementLabel}
              onChangeText={setMovementLabel}
              placeholder={t('settings.developer.poseCaptureLabelPlaceholder', 'Movement label (example: pushup-side-v1)')}
              placeholderTextColor={Colors.muted2}
              style={styles.input}
              editable={!isSaving}
              autoCapitalize="none"
            />

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionButton} onPress={handleSave} disabled={isSaving}>
                <Save size={16} color={Colors.text} />
                <Text style={styles.actionButtonText}>{t('common.save')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={handleShare} disabled={isSaving}>
                <Share2 size={16} color={Colors.text} />
                <Text style={styles.actionButtonText}>{t('settings.developer.poseCaptureSend', 'Send')}</Text>
              </TouchableOpacity>
            </View>

            {lastSavedFileName ? (
              <Text style={styles.savedFileText}>
                {t('settings.developer.poseCaptureLastFile', {
                  defaultValue: 'Last file: {{name}}',
                  name: lastSavedFileName,
                })}
              </Text>
            ) : null}
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(140).springify()}>
          <GlassCard style={styles.statsCard}>
            <Text style={styles.cardTitle}>{t('settings.developer.poseCaptureStatsTitle', 'Live Stats')}</Text>

            <View style={styles.metricGrid}>
              <View style={styles.metricCell}>
                <Text style={styles.metricValue}>{durationLabel}</Text>
                <Text style={styles.metricLabel}>{t('common.time')}</Text>
              </View>
              <View style={styles.metricCell}>
                <Text style={styles.metricValue}>{totalFrames}</Text>
                <Text style={styles.metricLabel}>{t('settings.developer.poseCaptureFrames', 'Frames')}</Text>
              </View>
              <View style={styles.metricCell}>
                <Text style={styles.metricValue}>{formatPercent(poseRate)}</Text>
                <Text style={styles.metricLabel}>{t('settings.developer.poseCapturePoseRate', 'Pose rate')}</Text>
              </View>
              <View style={styles.metricCell}>
                <Text style={styles.metricValue}>{sampleRateFps.toFixed(1)}</Text>
                <Text style={styles.metricLabel}>FPS</Text>
              </View>
              <View style={styles.metricCell}>
                <Text style={styles.metricValue}>{formatPercent(averageVisibility)}</Text>
                <Text style={styles.metricLabel}>{t('settings.developer.poseCaptureVisibility', 'Avg visibility')}</Text>
              </View>
              <View style={styles.metricCell}>
                <Text style={styles.metricValue}>{poseFrames}</Text>
                <Text style={styles.metricLabel}>{t('settings.developer.poseCapturePoseFrames', 'Pose frames')}</Text>
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(170).springify()}>
          <GlassCard style={styles.pointsCard}>
            <View style={styles.pointsHeader}>
              <Activity size={16} color={Colors.teal} />
              <Text style={styles.cardTitle}>{t('settings.developer.poseCapturePointsTitle', 'Key Points')}</Text>
            </View>

            {pointStats.map((point) => (
              <View key={point.key} style={styles.pointRow}>
                <View style={styles.pointLeft}>
                  <Text style={styles.pointName}>{point.label}</Text>
                  <Text style={styles.pointMeta}>#{point.index}</Text>
                </View>
                <View style={styles.pointRight}>
                  <Text style={[styles.pointVisibility, { color: getVisibilityColor(point.visibility) }]}>
                    v={formatNullable(point.visibility)}
                  </Text>
                  <Text style={styles.pointCoords}>
                    x={formatNullable(point.x)} y={formatNullable(point.y)}
                  </Text>
                </View>
              </View>
            ))}
          </GlassCard>
        </Animated.View>

        <View style={{ height: 48 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 260,
    zIndex: 0,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: 96,
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleWrap: {
    flex: 1,
  },
  eyebrow: {
    fontSize: FontSize.xs,
    color: Colors.muted,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  screenTitle: {
    fontSize: 25,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  headerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.overlayTeal20,
    borderWidth: 1,
    borderColor: Colors.overlayTeal15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  cardTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  cardSubtitle: {
    marginTop: 4,
    fontSize: FontSize.xs,
    color: Colors.muted,
  },
  cameraPreviewWrap: {
    marginTop: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.overlayWhite15,
    height: 300,
    backgroundColor: Colors.overlayBlack60,
  },
  cameraPreview: {
    width: '100%',
    height: '100%',
  },
  controlRow: {
    marginTop: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  recordButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.overlayError30,
    backgroundColor: Colors.overlayError15,
  },
  recordButtonActive: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.overlayError30,
    backgroundColor: Colors.errorStrong,
  },
  recordButtonText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  clearButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.overlayWhite15,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  samplingHint: {
    marginTop: 8,
    fontSize: FontSize.xs,
    color: Colors.muted,
  },
  exportCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  input: {
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.overlayWhite15,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.overlayBlack25,
    color: Colors.text,
    fontSize: FontSize.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.overlayWhite15,
    backgroundColor: Colors.overlay,
    paddingVertical: Spacing.md,
  },
  actionButtonText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  savedFileText: {
    marginTop: Spacing.sm,
    fontSize: FontSize.xs,
    color: Colors.muted,
  },
  statsCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  metricGrid: {
    marginTop: Spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  metricCell: {
    width: '31%',
    minWidth: 92,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.overlayBlack25,
    borderWidth: 1,
    borderColor: Colors.overlayWhite10,
  },
  metricValue: {
    fontSize: FontSize.md,
    color: Colors.text,
    fontWeight: FontWeight.bold,
  },
  metricLabel: {
    marginTop: 2,
    fontSize: FontSize.xs,
    color: Colors.muted,
  },
  pointsCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  pointsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.sm,
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.overlayWhite10,
  },
  pointLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pointName: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  pointMeta: {
    color: Colors.muted2,
    fontSize: FontSize.xs,
  },
  pointRight: {
    alignItems: 'flex-end',
  },
  pointVisibility: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  pointCoords: {
    marginTop: 2,
    fontSize: FontSize.xs,
    color: Colors.muted,
  },
});