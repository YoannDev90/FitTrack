// ============================================================================
// RUN SUMMARY — End-of-run summary screen with stats and save
// ============================================================================

import React, { useState, useMemo, useEffect } from 'react';
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
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Zap,
  Flame,
  Mountain,
  Trophy,
  Save,
  X,
  Bot,
  Navigation,
} from 'lucide-react-native';
const { width: SW } = Dimensions.get('window');
import { useRunStore } from '../../stores/runStore';
import { useAppStore } from '../../stores';
import {
  calculateElevationGain,
  calculateRunCalories,
  calculateRunXP,
  calculateAvgPace,
} from '../../services/runTracker';
import { generateGPX, saveGPXFile, shareGPXFile } from '../../services/gpxExport';
import { generateTextAnalysis } from '../../services/pollination/textAnalysis';
import { isPollinationConnected } from '../../services/pollination';
import { getTodayDateString, getNowISO } from '../../utils/date';
import i18n from '../../i18n';
import type { RunEntry } from '../../types';

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
  blueBorder:  'rgba(85,153,255,0.22)',
  green:       '#34d370',
  greenSoft:   'rgba(52,211,112,0.10)',
  greenBorder: 'rgba(52,211,112,0.22)',
  gold:        '#e8b84b',
  goldSoft:    'rgba(232,184,75,0.10)',
  red:         '#f87171',
  violet:      '#a78bfa',
  violetSoft:  'rgba(167,139,250,0.12)',
  violetBorder:'rgba(167,139,250,0.22)',
};
const S = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 };
const R = { sm: 6, md: 10, lg: 14, xl: 18, xxl: 22, full: 999 };
const T = { nano: 9, xs: 11, sm: 13, md: 15, lg: 17, xl: 20, xxl: 26, xxxl: 34 };
const W: Record<string, any> = { reg: '400', med: '500', semi: '600', bold: '700', xbold: '800', black: '900' };

function formatPace(secPerKm: number): string {
  if (secPerKm <= 0 || !isFinite(secPerKm)) return '--:--';
  const min = Math.floor(secPerKm / 60);
  const sec = Math.floor(secPerKm % 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h${m.toString().padStart(2, '0')}m`;
  return `${m}m${s.toString().padStart(2, '0')}s`;
}

// ─── Stat Row ──────────────────────────────────────────────────────────────
const StatRow = ({ icon, label, value, color }: {
  icon: React.ReactNode; label: string; value: string; color?: string;
}) => (
  <View style={styles.statRow}>
    <View style={[styles.statIcon, color ? { backgroundColor: `${color}15` } : {}]}>
      {icon}
    </View>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={[styles.statValue, color ? { color } : {}]}>{value}</Text>
  </View>
);

// ─── Delta Badge ──────────────────────────────────────────────────────────
const DeltaBadge = ({ value, unit, inverted }: { value: number; unit: string; inverted?: boolean }) => {
  const isPositive = inverted ? value < 0 : value > 0;
  const color = isPositive ? C.green : Math.abs(value) < 0.01 ? C.textMuted : C.red;
  const sign = value > 0 ? '+' : '';
  return (
    <View style={[styles.deltaBadge, { backgroundColor: `${color}15`, borderColor: `${color}28` }]}>
      {isPositive ? <TrendingUp size={12} color={color} /> : <TrendingDown size={12} color={color} />}
      <Text style={[styles.deltaText, { color }]}>{sign}{value.toFixed(1)} {unit}</Text>
    </View>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function RunSummary() {
  const { t } = useTranslation();
  const store = useRunStore();
  const { entries, settings, addRun } = useAppStore();
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [discardModalVisible, setDiscardModalVisible] = useState(false);

  const summary = useMemo(() => {
    const distanceKm = store.distanceKm;
    const durationMinutes = store.elapsedSeconds / 60;
    const avgPaceSecPerKm = calculateAvgPace(distanceKm, store.elapsedSeconds);
    const elevationGainM = calculateElevationGain(store.coords);
    const weight = settings.bodyWeightKg ?? 70;
    const calories = calculateRunCalories(avgPaceSecPerKm, weight, durationMinutes);
    const xpGained = calculateRunXP(distanceKm, durationMinutes);
    const plan = store.plan;

    // vs objective
    const vsTarget = plan ? {
      distanceDelta: distanceKm - (plan.targetDistanceKm ?? 0),
      timeDelta: durationMinutes - (plan.targetDurationMinutes ?? 0),
      achieved: distanceKm >= (plan.targetDistanceKm ?? 0) * 0.95,
    } : null;

    // vs last run
    const allRuns = entries.filter(e => e.type === 'run') as RunEntry[];
    const lastRun = allRuns[0];
    const vsLastRun = lastRun ? {
      distanceDelta: distanceKm - lastRun.distanceKm,
      paceDelta: avgPaceSecPerKm - (lastRun.avgSpeed ? (3600 / lastRun.avgSpeed) : 0),
      isDistancePR: allRuns.length === 0 || distanceKm > Math.max(...allRuns.map(r => r.distanceKm)),
    } : null;

    return {
      distanceKm,
      durationMinutes,
      avgPaceSecPerKm,
      elevationGainM,
      calories,
      xpGained,
      vsTarget,
      vsLastRun,
      isDistancePR: !lastRun || distanceKm > Math.max(...allRuns.map(r => r.distanceKm), 0),
    };
  }, [store, entries, settings.bodyWeightKg]);

  // Fetch AI summary
  useEffect(() => {
    if (store.mode !== 'ai' || !(settings as any).runSettings?.coachingEnabled) return;
    let cancelled = false;

    (async () => {
      const connected = await isPollinationConnected();
      if (!connected || cancelled) return;
      setAiLoading(true);
      try {
        const lang = ({ fr: 'français', it: 'italiano', de: 'Deutsch' } as Record<string, string>)[i18n.language] ?? 'English';
        const result = await generateTextAnalysis({
          systemPrompt: `Tu es Ploppy, coach de course bienveillant. Fais un bilan court (3-4 phrases) en ${lang}.`,
          userPrompt: `Bilan de course :
- Distance : ${summary.distanceKm.toFixed(2)} km
- Durée : ${summary.durationMinutes.toFixed(1)} min
- Allure moyenne : ${formatPace(summary.avgPaceSecPerKm)}/km
- Dénivelé : +${summary.elevationGainM}m
- Calories : ${summary.calories} kcal
${summary.vsTarget ? `- Objectif : ${summary.vsTarget.achieved ? 'atteint ✅' : 'non atteint ⚠️'}` : ''}
${summary.isDistancePR ? '- 🏆 Nouveau record de distance !' : ''}
Donne un bilan motivant et personnalisé.`,
          model: (settings as any).runSettings?.pollinationsModel ?? settings.aiModel ?? 'openai',
        });
        if (!cancelled) setAiSummary(result);
      } catch { /* silent */ }
      finally { if (!cancelled) setAiLoading(false); }
    })();

    return () => { cancelled = true; };
  }, []);

  // Save run
  const handleSave = async () => {
    let gpxPath: string | undefined;

    // Generate and save GPX
    if (store.coords.length > 0) {
      try {
        const now = new Date();
        const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const gpxContent = generateGPX(store.coords, {
          name: `${t('run.distance')} ${dateStr}`,
          startTime: new Date(store.coords[0].timestamp),
          distanceKm: summary.distanceKm,
          durationSeconds: store.elapsedSeconds,
          avgPaceSecPerKm: summary.avgPaceSecPerKm,
        });
        gpxPath = await saveGPXFile(gpxContent, `run_${dateStr}_${Date.now()}`);
      } catch { /* GPX save is optional */ }
    }

    addRun({
      distanceKm: Math.round(summary.distanceKm * 100) / 100,
      durationMinutes: Math.round(summary.durationMinutes),
      avgPaceSecPerKm: summary.avgPaceSecPerKm,
      elevationGainM: summary.elevationGainM,
      calories: summary.calories,
      xpGained: summary.xpGained,
      route: store.coords,
      gpxFilePath: gpxPath,
      plan: store.plan ?? undefined,
      aiCoachMessages: store.currentAiConversation,
    } as any);

    store.reset();
    router.dismissAll();
    router.replace('/workout');
  };

  const handleDiscard = () => setDiscardModalVisible(true);

  const confirmDiscard = () => {
    setDiscardModalVisible(false);
    store.reset();
    router.dismissAll();
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(85,153,255,0.15)', C.bg, C.bg]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <Animated.View entering={FadeIn.delay(50)} style={styles.header}>
            <Text style={styles.eyebrow}>{t('run.summary.title')}</Text>
            <Text style={styles.title}>
              {summary.distanceKm.toFixed(2)} <Text style={styles.titleUnit}>km</Text>
            </Text>
            {summary.isDistancePR && (
              <Animated.View entering={FadeInDown.delay(200)} style={styles.prBadge}>
                <Trophy size={14} color={C.gold} />
                <Text style={styles.prText}>{t('run.summary.personalBest')}</Text>
              </Animated.View>
            )}
          </Animated.View>

          {/* Main stats */}
          <Animated.View entering={FadeInDown.delay(100)} style={styles.card}>
            <StatRow icon={<Navigation size={16} color={C.blue} />} label={t('run.distance')} value={`${summary.distanceKm.toFixed(2)} km`} color={C.blue} />
            <StatRow icon={<Clock size={16} color={C.textSub} />} label={t('run.duration')} value={formatDuration(store.elapsedSeconds)} />
            <StatRow icon={<Zap size={16} color={C.green} />} label={t('run.avgPace')} value={`${formatPace(summary.avgPaceSecPerKm)}/km`} color={C.green} />
            <StatRow icon={<Mountain size={16} color={C.textSub} />} label={t('run.elevation')} value={`+${summary.elevationGainM} m`} />
            <StatRow icon={<Flame size={16} color={C.gold} />} label={t('run.calories')} value={`${summary.calories} kcal`} color={C.gold} />
            <StatRow icon={<TrendingUp size={16} color={C.violet} />} label="XP" value={`+${summary.xpGained}`} color={C.violet} />
          </Animated.View>

          {/* vs Objective */}
          {summary.vsTarget && (
            <Animated.View entering={FadeInDown.delay(200)} style={styles.card}>
              <Text style={styles.sectionTitle}>{t('run.summary.vsObjective')}</Text>
              <View style={styles.deltaRow}>
                <Text style={styles.deltaLabel}>{t('run.distance')}</Text>
                <DeltaBadge value={summary.vsTarget.distanceDelta} unit="km" />
              </View>
              <View style={styles.vsResult}>
                <Text style={styles.vsResultText}>
                  {summary.vsTarget.achieved
                    ? t('run.objectiveReached')
                    : t('run.objectiveMissed')}
                </Text>
              </View>
            </Animated.View>
          )}

          {/* vs Last Run */}
          {summary.vsLastRun && (
            <Animated.View entering={FadeInDown.delay(300)} style={styles.card}>
              <Text style={styles.sectionTitle}>{t('run.summary.vsLastRun')}</Text>
              <View style={styles.deltaRow}>
                <Text style={styles.deltaLabel}>{t('run.distance')}</Text>
                <DeltaBadge value={summary.vsLastRun.distanceDelta} unit="km" />
              </View>
            </Animated.View>
          )}

          {/* AI Summary */}
          {store.mode === 'ai' && (
            <Animated.View entering={FadeInDown.delay(400)} style={[styles.card, { borderColor: C.violetBorder }]}>
              <View style={styles.aiHeader}>
                <Bot size={16} color={C.violet} />
                <Text style={[styles.sectionTitle, { color: C.violet, marginBottom: 0 }]}>
                  {t('run.summary.aiSummary')}
                </Text>
              </View>
              {aiLoading ? (
                <ActivityIndicator color={C.violet} style={{ marginVertical: S.md }} />
              ) : aiSummary ? (
                <Text style={styles.aiText}>{aiSummary}</Text>
              ) : null}
            </Animated.View>
          )}

          {/* Actions */}
          <Animated.View entering={FadeInDown.delay(500)} style={styles.actions}>
            <TouchableOpacity onPress={handleSave} activeOpacity={0.8}>
              <LinearGradient
                colors={[C.green, '#28b860']}
                style={styles.saveBtn}
              >
                <Save size={20} color="#fff" />
                <Text style={styles.saveBtnText}>{t('run.summary.save')}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleDiscard} style={styles.discardBtn}>
              <X size={16} color={C.red} />
              <Text style={styles.discardBtnText}>{t('run.summary.discard')}</Text>
            </TouchableOpacity>
          </Animated.View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>

      {/* Discard confirm modal */}
      {discardModalVisible && (
        <View style={styles.modalOverlay}>
          <Animated.View entering={FadeIn.duration(200)} style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('run.summary.discard')}</Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity onPress={() => setDiscardModalVisible(false)} style={styles.modalCancelBtn}>
                <Text style={styles.modalCancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmDiscard} style={styles.modalConfirmBtn}>
                <Text style={styles.modalConfirmText}>{t('run.summary.discard')}</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
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
  content: { padding: S.lg },
  header: { alignItems: 'center', marginBottom: S.xl, marginTop: S.lg },
  eyebrow: { fontSize: T.nano, fontWeight: W.black, color: C.textMuted, letterSpacing: 3, textTransform: 'uppercase', marginBottom: S.sm },
  title: { fontSize: 56, fontWeight: W.black, color: C.text, letterSpacing: -2 },
  titleUnit: { fontSize: T.xxl, fontWeight: W.semi, color: C.textSub },
  prBadge: {
    flexDirection: 'row', alignItems: 'center', gap: S.sm,
    marginTop: S.md, paddingHorizontal: S.md, paddingVertical: S.xs,
    backgroundColor: C.goldSoft, borderRadius: R.full,
    borderWidth: 1, borderColor: 'rgba(232,184,75,0.22)',
  },
  prText: { fontSize: T.sm, fontWeight: W.bold, color: C.gold },

  card: {
    backgroundColor: C.surface, borderRadius: R.xl,
    borderWidth: 1, borderColor: C.border,
    padding: S.lg, marginBottom: S.md,
  },
  sectionTitle: { fontSize: T.sm, fontWeight: W.bold, color: C.textSub, marginBottom: S.md },

  statRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: S.sm },
  statIcon: {
    width: 32, height: 32, borderRadius: R.md,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginRight: S.md,
  },
  statLabel: { flex: 1, fontSize: T.sm, color: C.textSub },
  statValue: { fontSize: T.md, fontWeight: W.bold, color: C.text },

  deltaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: S.sm },
  deltaLabel: { fontSize: T.sm, color: C.textSub },
  deltaBadge: {
    flexDirection: 'row', alignItems: 'center', gap: S.xs,
    paddingHorizontal: S.sm, paddingVertical: S.xs,
    borderRadius: R.sm, borderWidth: 1,
  },
  deltaText: { fontSize: T.xs, fontWeight: W.semi },

  vsResult: { marginTop: S.sm },
  vsResultText: { fontSize: T.md, fontWeight: W.bold, color: C.text, textAlign: 'center' },

  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: S.sm, marginBottom: S.md },
  aiText: { fontSize: T.sm, color: C.text, lineHeight: 22 },

  actions: { marginTop: S.lg, gap: S.md },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: S.sm,
    padding: S.lg, borderRadius: R.full,
  },
  saveBtnText: { fontSize: T.lg, fontWeight: W.bold, color: '#fff' },
  discardBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: S.sm,
    padding: S.md,
  },
  discardBtnText: { fontSize: T.sm, fontWeight: W.semi, color: C.red },

  // Confirm modal
  modalOverlay: {
    ...StyleSheet.absoluteFillObject, zIndex: 100,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center', alignItems: 'center',
  },
  modalCard: {
    width: SW - 64, padding: S.xl,
    backgroundColor: '#13151e', borderRadius: R.xxl,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', gap: S.xl,
  },
  modalTitle: { fontSize: T.lg, fontWeight: W.bold, color: C.text, textAlign: 'center' },
  modalBtns: { flexDirection: 'row', gap: S.md, width: '100%' },
  modalCancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: R.lg,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  modalCancelText: { fontSize: T.md, fontWeight: W.semi, color: 'rgba(240,236,228,0.55)' },
  modalConfirmBtn: {
    flex: 1, paddingVertical: 14, borderRadius: R.lg,
    backgroundColor: 'rgba(248,113,113,0.15)',
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(248,113,113,0.3)',
  },
  modalConfirmText: { fontSize: T.md, fontWeight: W.bold, color: C.red },
});
