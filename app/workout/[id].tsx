// ============================================================================
// WORKOUT DETAIL — Full screen session detail page
// Replaces the old EntryDetailModal for workout entries
// ============================================================================

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInRight,
} from 'react-native-reanimated';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Home,
  Footprints,
  Gamepad2,
  UtensilsCrossed,
  Ruler,
  Clock,
  TrendingUp,
  Flame,
  Activity,
  Zap,
  Calendar,
  Bot,
  Trash2,
  Edit3,
  RefreshCw,
  Navigation,
  Mountain,
  Share2,
} from 'lucide-react-native';
import { shareGPXFile } from '../../src/services/gpxExport';
import { getMapLibreModule } from '../../src/services/maplibre';
import { storageHelpers } from '../../src/storage/mmkv';
import { useAppStore, useSettings, useSportsConfig } from '../../src/stores';
import { useGamificationStore } from '../../src/stores';
import { formatDisplayDate, getRelativeTime, isInCurrentWeek } from '../../src/utils/date';
import { generateTextAnalysis } from '../../src/services/pollination/textAnalysis';
import { isPollinationConnected } from '../../src/services/pollination';
import i18n from '../../src/i18n';
import type {
  Entry,
  HomeWorkoutEntry,
  RunEntry,
  BeatSaberEntry,
  MealEntry,
  MeasureEntry,
  CustomSportEntry,
  SportConfig,
} from '../../src/types';

const { width: SW } = Dimensions.get('window');
const MapLibreRN = getMapLibreModule();

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  bg:          '#070709',
  surface:     '#0e0f14',
  surfaceUp:   '#13151e',
  surfaceHigh: '#1a1d28',
  border:      'rgba(255,255,255,0.07)',
  borderUp:    'rgba(255,255,255,0.12)',
  text:        '#f0ece4',
  textSub:     'rgba(240,236,228,0.55)',
  textMuted:   'rgba(240,236,228,0.28)',
  ember:       '#ff5533',
  emberMid:    '#ff7a55',
  emberGlow:   'rgba(255,85,51,0.15)',
  emberBorder: 'rgba(255,85,51,0.25)',
  gold:        '#e8b84b',
  goldSoft:    'rgba(232,184,75,0.10)',
  goldBorder:  'rgba(232,184,75,0.22)',
  blue:        '#5599ff',
  blueSoft:    'rgba(85,153,255,0.10)',
  blueBorder:  'rgba(85,153,255,0.22)',
  teal:        '#2dd4bf',
  tealSoft:    'rgba(45,212,191,0.10)',
  tealBorder:  'rgba(45,212,191,0.22)',
  green:       '#34d370',
  greenSoft:   'rgba(52,211,112,0.10)',
  greenBorder: 'rgba(52,211,112,0.22)',
  violet:      '#a78bfa',
  violetSoft:  'rgba(167,139,250,0.10)',
  violetBorder:'rgba(167,139,250,0.22)',
  error:       '#f87171',
};
const S = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, xxxl: 44 };
const R = { sm: 6, md: 10, lg: 14, xl: 18, xxl: 22, xxxl: 32, full: 999 };
const T = {
  nano: 9, micro: 10, xs: 11, sm: 13, md: 15, lg: 17, xl: 20,
  xxl: 26, xxxl: 34, display: 48,
};
const W: Record<string, any> = {
  light: '300', reg: '400', med: '500',
  semi: '600', bold: '700', xbold: '800', black: '900',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getEntryTypeConfig = (type: string, sportConfig?: SportConfig) => {
  switch (type) {
    case 'home':      return { icon: <Home size={22} color={C.green} />,       color: C.green,  bg: C.greenSoft,  border: C.greenBorder, emoji: '💪' };
    case 'run':       return { icon: <Footprints size={22} color={C.blue} />,  color: C.blue,   bg: C.blueSoft,   border: C.blueBorder, emoji: '🏃' };
    case 'beatsaber': return { icon: <Gamepad2 size={22} color={C.violet} />,  color: C.violet, bg: C.violetSoft, border: C.violetBorder, emoji: '🕹️' };
    case 'meal':      return { icon: <UtensilsCrossed size={22} color={C.gold} />, color: C.gold, bg: C.goldSoft, border: C.goldBorder, emoji: '🍽️' };
    case 'measure':   return { icon: <Ruler size={22} color={C.teal} />,       color: C.teal,   bg: C.tealSoft,   border: C.tealBorder, emoji: '📏' };
    case 'custom':
      if (sportConfig) {
        const color = sportConfig.color;
        return { icon: <Text style={{ fontSize: 20 }}>{sportConfig.emoji}</Text>, color, bg: `${color}15`, border: `${color}28`, emoji: sportConfig.emoji };
      }
      return { icon: <Flame size={22} color={C.ember} />, color: C.ember, bg: C.emberGlow, border: C.emberBorder, emoji: '🔥' };
    default:
      return { icon: <Flame size={22} color={C.ember} />, color: C.ember, bg: C.emberGlow, border: C.emberBorder, emoji: '🔥' };
  }
};

const getTypeLabel = (type: string, t: any) => {
  const labels: Record<string, string> = {
    home: t('entries.workout'),
    run: t('entries.run'),
    beatsaber: t('entries.beatsaber'),
    meal: t('entries.meal'),
    measure: t('entries.measure'),
    custom: t('entries.custom'),
  };
  return labels[type] || type;
};

// ─── Stat Row Component ───────────────────────────────────────────────────────
const StatRow = ({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color?: string }) => (
  <View style={styles.statRow}>
    <View style={[styles.statIcon, color ? { backgroundColor: `${color}15` } : {}]}>
      {icon}
    </View>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={[styles.statValue, color ? { color } : {}]}>{value}</Text>
  </View>
);

// ============================================================================
// LOCAL STATS CALCULATOR
// ============================================================================

function computeSessionStats(entry: Entry, allEntries: Entry[]) {
  const sameTypeEntries = allEntries
    .filter(e => e.type === entry.type && e.id !== entry.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const lastSameType = sameTypeEntries[0] || null;
  const last3SameType = sameTypeEntries.slice(0, 3);

  // Get numeric metrics for comparison
  const getMetrics = (e: Entry) => {
    const m: Record<string, number> = {};
    if ('durationMinutes' in e && (e as any).durationMinutes) m.duration = (e as any).durationMinutes;
    if ('distanceKm' in e && (e as any).distanceKm) m.distance = (e as any).distanceKm;
    if ('totalReps' in e && (e as any).totalReps) m.reps = (e as any).totalReps;
    if ('calories' in e && (e as any).calories) m.calories = (e as any).calories;
    return m;
  };

  const currentMetrics = getMetrics(entry);
  const lastMetrics = lastSameType ? getMetrics(lastSameType) : null;

  // Compute deltas
  const deltas: Record<string, number> = {};
  if (lastMetrics) {
    for (const key of Object.keys(currentMetrics)) {
      if (lastMetrics[key]) {
        deltas[key] = ((currentMetrics[key] - lastMetrics[key]) / lastMetrics[key]) * 100;
      }
    }
  }

  // Check if best session ever (by looking at XP from gamification history or raw metrics)
  const allSameType = allEntries.filter(e => e.type === entry.type);
  let isBestSession = false;

  if (entry.type === 'run') {
    const bestDistance = Math.max(...allSameType.map(e => (e as RunEntry).distanceKm || 0));
    isBestSession = ((entry as RunEntry).distanceKm || 0) >= bestDistance;
  } else if (entry.type === 'home') {
    const bestReps = Math.max(...allSameType.map(e => (e as HomeWorkoutEntry).totalReps || 0));
    isBestSession = ((entry as HomeWorkoutEntry).totalReps || 0) >= bestReps && bestReps > 0;
  } else if (entry.type === 'beatsaber' || entry.type === 'custom') {
    const bestDuration = Math.max(...allSameType.map(e => (e as any).durationMinutes || 0));
    isBestSession = ((entry as any).durationMinutes || 0) >= bestDuration && bestDuration > 0;
  }

  // Progression over last 3
  const progressionMetrics = last3SameType.map(e => getMetrics(e));

  return {
    lastSameType,
    last3SameType,
    currentMetrics,
    lastMetrics,
    deltas,
    isBestSession,
    progressionMetrics,
    sameTypeCount: allSameType.length,
  };
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { entries, deleteEntry } = useAppStore();
  const settings = useSettings();
  const sportsConfig = useSportsConfig();
  const { xp, level } = useGamificationStore();



  const entry = useMemo(() => entries.find(e => e.id === id), [entries, id]);

  const sportConfig = useMemo(() => {
    if (entry?.type === 'custom') {
      return sportsConfig.find((s: SportConfig) => s.id === (entry as CustomSportEntry).sportId);
    }
    return undefined;
  }, [entry, sportsConfig]);

  const typeConfig = useMemo(() => {
    if (!entry) return null;
    return getEntryTypeConfig(entry.type, sportConfig);
  }, [entry, sportConfig]);

  const sessionStats = useMemo(() => {
    if (!entry) return null;
    return computeSessionStats(entry, entries);
  }, [entry, entries]);

  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  const fetchAnalysis = useCallback(async (force: boolean = false) => {
    if (!entry || !settings.aiWorkoutEnabled || !isConnected) return;
    if (!['home', 'run', 'beatsaber', 'custom'].includes(entry.type)) return;
    if (!sessionStats) return;

    const cacheKey = `aiAnalysis:${entry.id}:${settings.aiModel || 'openai'}:${i18n.language}:${settings.aiTone || 'neutral'}`;
    if (!force) {
      const cached = await storageHelpers.getString(cacheKey) as string | null;
      if (cached) {
        setAiAnalysis(cached);
        return;
      }
    }

    setAiLoading(true);
    setAiError(false);
    try {
      const lang = ({ fr: 'français', it: 'italiano', de: 'Deutsch' } as Record<string, string>)[i18n.language] ?? 'English';
      const typeLabel = getTypeLabel(entry.type, t);

      const toneDesc = settings.aiTone === 'technical'
        ? 'Use a precise, technical tone.'
        : settings.aiTone === 'warm'
        ? 'Use a very warm and encouraging tone.'
        : 'Use a neutral balanced tone.';

      // Build pre-calculated stats for the prompt
      const statsLines: string[] = [];
      statsLines.push(`Activity type: ${typeLabel}`);
      statsLines.push(`Date: ${formatDisplayDate(entry.date)}`);

      const cm = sessionStats.currentMetrics;
      if (cm.duration) statsLines.push(`Duration: ${cm.duration} min`);
      if (cm.distance) statsLines.push(`Distance: ${cm.distance} km`);
      if (cm.reps) statsLines.push(`Total reps: ${cm.reps}`);
      if (cm.calories) statsLines.push(`Calories: ${cm.calories}`);

      if (sessionStats.isBestSession) {
        statsLines.push('⭐ This is the BEST session ever for this activity type!');
      }

      if (sessionStats.lastMetrics) {
        statsLines.push('\nComparison with last session of the same type:');
        for (const [key, delta] of Object.entries(sessionStats.deltas)) {
          const sign = delta >= 0 ? '+' : '';
          statsLines.push(`  ${key}: ${sign}${delta.toFixed(1)}%`);
        }
      }

      if (sessionStats.last3SameType.length > 0) {
        statsLines.push(`\nTotal sessions of this type: ${sessionStats.sameTypeCount}`);
        statsLines.push(`Last 3 sessions metrics:`);
        sessionStats.progressionMetrics.forEach((m, i) => {
          const parts = Object.entries(m).map(([k, v]) => `${k}=${v}`).join(', ');
          statsLines.push(`  Session ${i + 1}: ${parts || 'N/A'}`);
        });
      }

      if (entry.type === 'home') {
        const he = entry as HomeWorkoutEntry;
        if (he.exercises) statsLines.push(`\nExercises done:\n${he.exercises}`);
        if (he.absBlock) statsLines.push('Includes abs block');
      }

      const systemPrompt = `You are Ploppy, a motivating and friendly fitness coach assistant. ${toneDesc} You analyze workout sessions and provide encouraging, personalized feedback. Respond in ${lang}. Keep your response concise (4-6 sentences). Use emojis sparingly. Be specific about the data provided.`;

      const userPrompt = `Here are the pre-calculated statistics for this workout session:\n\n${statsLines.join('\n')}\n\nProvide a brief analysis: what went well, areas for improvement, and a motivational tip for the next session of this type. Be specific about the numbers provided.`;

      const result = await generateTextAnalysis({
        systemPrompt,
        userPrompt,
        model: settings.aiModel || 'openai',
      });
      setAiAnalysis(result);
      await storageHelpers.setString(cacheKey, result);
    } catch {
      setAiError(true);
    } finally {
      setAiLoading(false);
    }
  }, [entry?.id, settings.aiWorkoutEnabled, isConnected, sessionStats, t, settings.aiModel, settings.aiTone]);

  // Check Pollination connection
  useEffect(() => {
    isPollinationConnected().then(setIsConnected);
  }, []);

  // Fetch AI analysis whenever dependencies change
  useEffect(() => {
    if (entry && settings.aiWorkoutEnabled && isConnected && isSport && sessionStats) {
      fetchAnalysis();
    }
  }, [entry?.id, settings.aiWorkoutEnabled, isConnected, sessionStats, settings.aiModel, settings.aiTone, i18n.language]);


  if (!entry || !typeConfig) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.center}>
          <Text style={styles.errorText}>{t('errors.notFound')}</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>{t('common.back')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleDelete = () => setDeleteModalVisible(true);

  const confirmDelete = () => {
    setDeleteModalVisible(false);
    deleteEntry(entry.id);
    router.back();
  };

  // ─── Render Entry-Specific Content ──────────────────────────────────────────
  const renderContent = () => {
    switch (entry.type) {
      case 'home': {
        const e = entry as HomeWorkoutEntry;
        return (
          <>
            {e.name && (
              <StatRow icon={<Home size={16} color={C.green} />} label={t('forms.workoutName')} value={e.name} />
            )}
            {e.durationMinutes !== undefined && (
              <StatRow icon={<Clock size={16} color={C.textSub} />} label={t('workout.detail.duration')} value={`${e.durationMinutes} min`} />
            )}
            {e.totalReps !== undefined && e.totalReps > 0 && (
              <StatRow icon={<TrendingUp size={16} color={C.green} />} label={t('workout.detail.reps')} value={`${e.totalReps}`} color={C.green} />
            )}
            {e.absBlock && (
              <View style={[styles.tagBadge, { backgroundColor: C.emberGlow, borderColor: C.emberBorder }]}>
                <Flame size={12} color={C.ember} />
                <Text style={[styles.tagText, { color: C.ember }]}>{t('workout.detail.absBlock')}</Text>
              </View>
            )}
            {e.exercises && (
              <Animated.View entering={FadeInDown.delay(200)} style={styles.exercisesCard}>
                <Text style={styles.exercisesLabel}>{t('workout.detail.exercises')}</Text>
                <Text style={styles.exercisesText}>{e.exercises}</Text>
              </Animated.View>
            )}
          </>
        );
      }
      case 'run': {
        const e = entry as RunEntry;
        const hasRoute = e.route && e.route.length >= 2;
        const routeGeoJSON: GeoJSON.FeatureCollection = hasRoute ? {
          type: 'FeatureCollection',
          features: [{
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: e.route!.map((c: any) => [c.longitude, c.latitude]),
            },
          }],
        } : { type: 'FeatureCollection', features: [] };

        // Calculate bounds for the route
        const routeBounds = hasRoute ? (() => {
          const lngs = e.route!.map((c: any) => c.longitude);
          const lats = e.route!.map((c: any) => c.latitude);
          return {
            ne: [Math.max(...lngs) + 0.002, Math.max(...lats) + 0.002] as [number, number],
            sw: [Math.min(...lngs) - 0.002, Math.min(...lats) - 0.002] as [number, number],
          };
        })() : null;

        return (
          <>
            {/* Mini-map */}
            {hasRoute && MapLibreRN && (
              <View style={styles.miniMapWrap}>
                <MapLibreRN.MapView
                  style={styles.miniMap}
                  mapStyle="https://tiles.openfreemap.org/styles/dark"
                  logoEnabled={false}
                  attributionEnabled={false}
                  compassEnabled={false}
                  scrollEnabled={false}
                  pitchEnabled={false}
                  rotateEnabled={false}
                  zoomEnabled={false}
                >
                  <MapLibreRN.Camera
                    defaultSettings={{
                      centerCoordinate: [
                        (routeBounds!.ne[0] + routeBounds!.sw[0]) / 2,
                        (routeBounds!.ne[1] + routeBounds!.sw[1]) / 2,
                      ],
                      zoomLevel: 14,
                    }}
                    bounds={{
                      ne: routeBounds!.ne,
                      sw: routeBounds!.sw,
                      paddingLeft: 30,
                      paddingRight: 30,
                      paddingTop: 30,
                      paddingBottom: 30,
                    }}
                  />
                  <MapLibreRN.ShapeSource id="routeDetail" shape={routeGeoJSON}>
                    <MapLibreRN.LineLayer
                      id="routeDetailLine"
                      style={{
                        lineColor: C.blue,
                        lineWidth: 3,
                        lineJoin: 'round',
                        lineCap: 'round',
                      }}
                    />
                  </MapLibreRN.ShapeSource>
                </MapLibreRN.MapView>
              </View>
            )}

            <StatRow icon={<Navigation size={16} color={C.blue} />} label={t('workout.detail.distance')} value={`${e.distanceKm} km`} color={C.blue} />
            <StatRow icon={<Clock size={16} color={C.textSub} />} label={t('workout.detail.duration')} value={`${e.durationMinutes} min`} />
            {(e as any).avgPaceSecPerKm != null && (
              <StatRow icon={<Zap size={16} color={C.green} />} label={t('run.avgPace')} value={`${Math.floor((e as any).avgPaceSecPerKm / 60)}:${String(Math.floor((e as any).avgPaceSecPerKm % 60)).padStart(2, '0')}/km`} color={C.green} />
            )}
            {e.avgSpeed != null && (
              <StatRow icon={<Zap size={16} color={C.gold} />} label={t('workout.detail.speed')} value={`${e.avgSpeed} km/h`} color={C.gold} />
            )}
            {(e as any).elevationGainM != null && (e as any).elevationGainM > 0 && (
              <StatRow icon={<Mountain size={16} color={C.textSub} />} label={t('run.elevation')} value={`+${(e as any).elevationGainM} m`} />
            )}
            {(e as any).calories != null && (
              <StatRow icon={<Flame size={16} color={C.gold} />} label={t('run.calories')} value={`${(e as any).calories} kcal`} color={C.gold} />
            )}
            {e.bpmAvg != null && (
              <StatRow icon={<Activity size={16} color={C.error} />} label={t('workout.detail.bpmAvg')} value={`${e.bpmAvg}`} color={C.error} />
            )}
            {e.bpmMax != null && (
              <StatRow icon={<Activity size={16} color={C.error} />} label={t('workout.detail.bpmMax')} value={`${e.bpmMax}`} color={C.error} />
            )}
            {e.cardiacLoad != null && (
              <StatRow icon={<Zap size={16} color={C.violet} />} label={t('workout.detail.cardiacLoad')} value={`${e.cardiacLoad}`} color={C.violet} />
            )}

            {/* GPX share button */}
            {(e as any).gpxFilePath && (
              <TouchableOpacity
                onPress={() => shareGPXFile((e as any).gpxFilePath)}
                style={styles.gpxShareBtn}
              >
                <Share2 size={16} color={C.blue} />
                <Text style={styles.gpxShareText}>{t('run.shareGPX')}</Text>
              </TouchableOpacity>
            )}
          </>
        );
      }
      case 'beatsaber': {
        const e = entry as BeatSaberEntry;
        return (
          <>
            <StatRow icon={<Clock size={16} color={C.textSub} />} label={t('workout.detail.duration')} value={`${e.durationMinutes} min`} />
            {e.bpmAvg !== undefined && (
              <StatRow icon={<Activity size={16} color={C.error} />} label={t('workout.detail.bpmAvg')} value={`${e.bpmAvg}`} color={C.error} />
            )}
            {e.bpmMax !== undefined && (
              <StatRow icon={<Activity size={16} color={C.error} />} label={t('workout.detail.bpmMax')} value={`${e.bpmMax}`} color={C.error} />
            )}
            {e.cardiacLoad !== undefined && (
              <StatRow icon={<Zap size={16} color={C.violet} />} label={t('workout.detail.cardiacLoad')} value={`${e.cardiacLoad}`} color={C.violet} />
            )}
          </>
        );
      }
      case 'meal': {
        const e = entry as MealEntry;
        return (
          <>
            {e.mealName && (
              <StatRow icon={<UtensilsCrossed size={16} color={C.gold} />} label={t('workout.detail.mealName')} value={e.mealName} />
            )}
            {e.description && (
              <Animated.View entering={FadeInDown.delay(200)} style={styles.exercisesCard}>
                <Text style={styles.exercisesLabel}>{t('workout.detail.description')}</Text>
                <Text style={styles.exercisesText}>{e.description}</Text>
              </Animated.View>
            )}
            {e.score !== undefined && (
              <StatRow icon={<Zap size={16} color={C.gold} />} label={t('workout.detail.score')} value={`${e.score}/100`} color={C.gold} />
            )}
            {e.suggestions && e.suggestions.length > 0 && (
              <Animated.View entering={FadeInDown.delay(250)} style={styles.exercisesCard}>
                <Text style={styles.exercisesLabel}>{t('workout.detail.suggestions')}</Text>
                {e.suggestions.map((s, i) => (
                  <Text key={i} style={styles.exercisesText}>• {s}</Text>
                ))}
              </Animated.View>
            )}
          </>
        );
      }
      case 'measure': {
        const e = entry as MeasureEntry;
        return (
          <>
            {e.weight !== undefined && (
              <StatRow icon={<Ruler size={16} color={C.teal} />} label={t('workout.detail.weight')} value={`${e.weight} kg`} color={C.teal} />
            )}
            {e.bodyFatPercent !== undefined && (
              <StatRow icon={<TrendingUp size={16} color={C.gold} />} label={t('workout.detail.bodyFat')} value={`${e.bodyFatPercent}%`} color={C.gold} />
            )}
            {e.waist !== undefined && (
              <StatRow icon={<Ruler size={16} color={C.textSub} />} label={t('workout.detail.waist')} value={`${e.waist} cm`} />
            )}
            {e.arm !== undefined && (
              <StatRow icon={<Ruler size={16} color={C.textSub} />} label={t('workout.detail.arm')} value={`${e.arm} cm`} />
            )}
            {e.hips !== undefined && (
              <StatRow icon={<Ruler size={16} color={C.textSub} />} label={t('workout.detail.hips')} value={`${e.hips} cm`} />
            )}
          </>
        );
      }
      case 'custom': {
        const e = entry as CustomSportEntry;
        return (
          <>
            {e.durationMinutes !== undefined && (
              <StatRow icon={<Clock size={16} color={C.textSub} />} label={t('workout.detail.duration')} value={`${e.durationMinutes} min`} />
            )}
            {e.distanceKm !== undefined && (
              <StatRow icon={<TrendingUp size={16} color={C.blue} />} label={t('workout.detail.distance')} value={`${e.distanceKm} km`} color={C.blue} />
            )}
            {e.totalReps !== undefined && e.totalReps > 0 && (
              <StatRow icon={<TrendingUp size={16} color={C.green} />} label={t('workout.detail.reps')} value={`${e.totalReps}`} color={C.green} />
            )}
            {e.calories !== undefined && (
              <StatRow icon={<Flame size={16} color={C.gold} />} label={t('workout.detail.calories')} value={`${e.calories} kcal`} color={C.gold} />
            )}
            {e.bpmAvg !== undefined && (
              <StatRow icon={<Activity size={16} color={C.error} />} label={t('workout.detail.bpmAvg')} value={`${e.bpmAvg}`} color={C.error} />
            )}
            {e.exercises && (
              <Animated.View entering={FadeInDown.delay(200)} style={styles.exercisesCard}>
                <Text style={styles.exercisesLabel}>{t('workout.detail.exercises')}</Text>
                <Text style={styles.exercisesText}>{e.exercises}</Text>
              </Animated.View>
            )}
          </>
        );
      }
      default:
        return null;
    }
  };

  const isSport = ['home', 'run', 'beatsaber', 'custom'].includes(entry.type);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Background glow */}
      <LinearGradient
        colors={[`${typeConfig.color}12`, 'transparent']}
        style={styles.bgGlow}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.6 }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeIn.delay(50)} style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={22} color={C.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          <TouchableOpacity style={styles.actionBtn} onPress={handleDelete}>
            <Trash2 size={18} color={C.error} />
          </TouchableOpacity>
        </Animated.View>

        {/* Type badge + title */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.typeBadgeRow}>
          <View style={[styles.typeBadge, { backgroundColor: typeConfig.bg, borderColor: typeConfig.border }]}>
            {typeConfig.icon}
            <Text style={[styles.typeBadgeText, { color: typeConfig.color }]}>
              {sportConfig?.name || getTypeLabel(entry.type, t)}
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150)}>
          <Text style={styles.title}>{t('workout.detail.title')}</Text>
          <View style={styles.dateRow}>
            <Calendar size={13} color={C.textMuted} />
            <Text style={styles.dateText}>{formatDisplayDate(entry.date)}</Text>
            <View style={styles.dot} />
            <Text style={styles.dateText}>{getRelativeTime(entry.createdAt)}</Text>
          </View>
        </Animated.View>

        {/* Best session badge */}
        {sessionStats?.isBestSession && isSport && (
          <Animated.View entering={FadeInRight.delay(250)} style={styles.bestBadge}>
            <LinearGradient
              colors={['rgba(232,184,75,0.15)', 'rgba(232,184,75,0.05)']}
              style={styles.bestBadgeGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.bestBadgeText}>{t('workout.ai.bestSession')}</Text>
            </LinearGradient>
          </Animated.View>
        )}

        {/* Stats card */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.statsCard}>
          {renderContent()}
        </Animated.View>

        {/* AI Analysis Section */}
        {isSport && (
          <Animated.View entering={FadeInDown.delay(350)} style={styles.aiSection}>
            <View style={[styles.aiHeader, { justifyContent: 'space-between' }]}>  
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: S.sm }}>
                <Bot size={18} color={C.violet} />
                <Text style={styles.aiTitle}>{t('workout.ai.title')}</Text>
              </View>
              {aiAnalysis && !aiLoading && !aiError && (
                <TouchableOpacity
                  onPress={() => fetchAnalysis(true)}
                  style={styles.regenBtn}
                  accessibilityLabel={t('workout.ai.regenerate')}
                >
                  <RefreshCw size={18} color={C.violet} />
                </TouchableOpacity>
              )}
            </View>

            {!settings.aiWorkoutEnabled ? (
              <View style={styles.aiDisabled}>
                <Text style={styles.aiDisabledText}>{t('workout.ai.disabled')}</Text>
                <Text style={styles.aiDisabledHint}>{t('workout.ai.enableInSettings')}</Text>
              </View>
            ) : !isConnected ? (
              <View style={styles.aiDisabled}>
                <Text style={styles.aiDisabledText}>{t('workout.ai.connectRequired')}</Text>
              </View>
            ) : aiLoading ? (
              <View style={styles.aiLoading}>
                <ActivityIndicator size="small" color={C.violet} />
                <Text style={styles.aiLoadingText}>{t('workout.ai.loading')}</Text>
              </View>
            ) : aiError ? (
              <View style={styles.aiDisabled}>
                <Text style={styles.aiDisabledText}>{t('workout.ai.error')}</Text>
              </View>
            ) : aiAnalysis ? (
              <Text style={styles.aiText}>{aiAnalysis}</Text>
            ) : null}
          </Animated.View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Delete confirm modal */}
      {deleteModalVisible && (
        <View style={styles.modalOverlay}>
          <Animated.View entering={FadeIn.duration(200)} style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('entries.deleteConfirm.title')}</Text>
            <Text style={styles.modalMessage}>{t('entries.deleteConfirm.message')}</Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity onPress={() => setDeleteModalVisible(false)} style={styles.modalCancelBtn}>
                <Text style={styles.modalCancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmDelete} style={styles.modalConfirmBtn}>
                <Text style={styles.modalConfirmText}>{t('common.delete')}</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: S.xl },
  errorText: { fontSize: T.lg, color: C.textSub, marginBottom: S.lg },
  backBtn: { paddingVertical: S.md, paddingHorizontal: S.xl, backgroundColor: C.surface, borderRadius: R.lg },
  backBtnText: { color: C.text, fontSize: T.md, fontWeight: W.semi },
  bgGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 300 },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: S.lg, paddingBottom: 40 },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', paddingVertical: S.md, gap: S.md },
  backButton: {
    width: 44, height: 44, borderRadius: R.lg,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    justifyContent: 'center', alignItems: 'center',
  },
  actionBtn: {
    width: 44, height: 44, borderRadius: R.lg,
    backgroundColor: 'rgba(248,113,113,0.1)', borderWidth: 1, borderColor: 'rgba(248,113,113,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },

  // Type badge
  typeBadgeRow: { marginBottom: S.md },
  typeBadge: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    gap: S.sm, paddingVertical: S.sm, paddingHorizontal: S.md,
    borderRadius: R.full, borderWidth: 1,
  },
  typeBadgeText: { fontSize: T.sm, fontWeight: W.bold },

  // Title / Date
  title: { fontSize: T.xxxl, fontWeight: W.black, color: C.text, letterSpacing: -1.5, marginBottom: S.sm },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: S.xs, marginBottom: S.xl },
  dateText: { fontSize: T.sm, color: C.textMuted },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: C.textMuted },

  // Best session badge
  bestBadge: { marginBottom: S.lg },
  bestBadgeGradient: {
    paddingVertical: S.md, paddingHorizontal: S.lg,
    borderRadius: R.xl, borderWidth: 1, borderColor: C.goldBorder,
  },
  bestBadgeText: { fontSize: T.sm, fontWeight: W.semi, color: C.gold, textAlign: 'center' },

  // Stats card
  statsCard: {
    backgroundColor: C.surface, borderRadius: R.xxl, borderWidth: 1, borderColor: C.border,
    padding: S.lg, gap: S.md, marginBottom: S.lg,
  },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: S.md, paddingVertical: S.xs },
  statIcon: {
    width: 36, height: 36, borderRadius: R.md,
    backgroundColor: C.surfaceHigh, justifyContent: 'center', alignItems: 'center',
  },
  statLabel: { flex: 1, fontSize: T.sm, fontWeight: W.med, color: C.textSub },
  statValue: { fontSize: T.md, fontWeight: W.bold, color: C.text },

  // Tag badge
  tagBadge: {
    flexDirection: 'row', alignItems: 'center', gap: S.xs,
    alignSelf: 'flex-start', paddingVertical: S.xs, paddingHorizontal: S.md,
    borderRadius: R.full, borderWidth: 1, marginTop: S.xs,
  },

  regenBtn: {
    padding: S.xs,
    borderRadius: R.full,
    backgroundColor: C.surfaceHigh,
  },
  tagText: { fontSize: T.xs, fontWeight: W.semi },

  // Exercises card
  exercisesCard: {
    backgroundColor: C.surfaceUp, borderRadius: R.lg,
    padding: S.md, gap: S.sm, marginTop: S.sm,
  },
  exercisesLabel: { fontSize: T.xs, fontWeight: W.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  exercisesText: { fontSize: T.sm, color: C.textSub, lineHeight: T.sm * 1.6 },

  // AI Section
  aiSection: {
    backgroundColor: C.surface, borderRadius: R.xxl, borderWidth: 1, borderColor: C.violetBorder,
    padding: S.lg, gap: S.md,
  },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  aiTitle: { fontSize: T.md, fontWeight: W.bold, color: C.violet },
  aiText: { fontSize: T.sm, color: C.textSub, lineHeight: T.sm * 1.7, fontStyle: 'italic' },
  aiLoading: { flexDirection: 'row', alignItems: 'center', gap: S.md, paddingVertical: S.md },
  aiLoadingText: { fontSize: T.sm, color: C.textMuted },
  aiDisabled: { paddingVertical: S.md, gap: S.xs },
  aiDisabledText: { fontSize: T.sm, color: C.textMuted },
  aiDisabledHint: { fontSize: T.xs, color: C.textMuted },

  // Mini-map
  miniMapWrap: {
    height: 220, borderRadius: R.xl, overflow: 'hidden',
    marginBottom: S.lg, borderWidth: 1, borderColor: C.border,
  },
  miniMap: { flex: 1 },

  // GPX share
  gpxShareBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: S.sm,
    paddingVertical: S.md, marginTop: S.md,
    backgroundColor: C.blueSoft, borderRadius: R.lg,
    borderWidth: 1, borderColor: C.blueBorder,
  },
  gpxShareText: { fontSize: T.sm, fontWeight: W.semi, color: C.blue },

  // Delete confirm modal
  modalOverlay: {
    ...StyleSheet.absoluteFillObject, zIndex: 100,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center' as const, alignItems: 'center' as const,
  },
  modalCard: {
    width: SW - 64, padding: S.xl,
    backgroundColor: C.surfaceUp, borderRadius: R.xxl,
    borderWidth: 1, borderColor: C.borderUp,
    alignItems: 'center' as const, gap: S.lg,
  },
  modalTitle: { fontSize: T.lg, fontWeight: W.bold, color: C.text, textAlign: 'center' as const },
  modalMessage: { fontSize: T.sm, color: C.textSub, textAlign: 'center' as const },
  modalBtns: { flexDirection: 'row' as const, gap: S.md, width: '100%' as const },
  modalCancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: R.lg,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center' as const, borderWidth: 1, borderColor: C.border,
  },
  modalCancelText: { fontSize: T.md, fontWeight: W.semi, color: C.textSub },
  modalConfirmBtn: {
    flex: 1, paddingVertical: 14, borderRadius: R.lg,
    backgroundColor: 'rgba(248,113,113,0.15)',
    alignItems: 'center' as const, borderWidth: 1, borderColor: 'rgba(248,113,113,0.3)',
  },
  modalConfirmText: { fontSize: T.md, fontWeight: W.bold, color: C.error },
});
