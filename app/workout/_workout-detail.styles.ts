import { StyleSheet, Dimensions } from 'react-native';
import { Colors, ScreenPalettes } from '../../src/constants';

const { width: SW } = Dimensions.get('window');
const C = ScreenPalettes.cool;
const S = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, xxxl: 44 };
const R = { sm: 6, md: 10, lg: 14, xl: 18, xxl: 22, xxxl: 32, full: 999 };
const T = {
  nano: 9, micro: 10, xs: 11, sm: 13, md: 15, lg: 17, xl: 20,
  xxl: 26, xxxl: 34, display: 48,
};
const W = {
  light: '300', reg: '400', med: '500',
  semi: '600', bold: '700', xbold: '800', black: '900',
} as const;

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: S.xl },
  errorText: { fontSize: T.lg, color: C.textSub, marginBottom: S.lg },
  backBtn: { paddingVertical: S.md, paddingHorizontal: S.xl, backgroundColor: C.surface, borderRadius: R.lg },
  backBtnText: { color: C.text, fontSize: T.md, fontWeight: W.semi },
  bgGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 300 },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: S.lg, paddingBottom: 40 },

  header: { flexDirection: 'row', alignItems: 'center', paddingVertical: S.md, gap: S.md },
  backButton: {
    width: 44, height: 44, borderRadius: R.lg,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    justifyContent: 'center', alignItems: 'center',
  },
  actionBtn: {
    width: 44, height: 44, borderRadius: R.lg,
    backgroundColor: Colors.overlayError10, borderWidth: 1, borderColor: Colors.overlayError20,
    justifyContent: 'center', alignItems: 'center',
  },

  typeBadgeRow: { marginBottom: S.md },
  typeBadge: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    gap: S.sm, paddingVertical: S.sm, paddingHorizontal: S.md,
    borderRadius: R.full, borderWidth: 1,
  },
  typeBadgeText: { fontSize: T.sm, fontWeight: W.bold },

  title: { fontSize: T.xxxl, fontWeight: W.black, color: C.text, letterSpacing: -1.5, marginBottom: S.sm },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: S.xs, marginBottom: S.xl },
  dateText: { fontSize: T.sm, color: C.textMuted },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: C.textMuted },

  bestBadge: { marginBottom: S.lg },
  bestBadgeGradient: {
    paddingVertical: S.md, paddingHorizontal: S.lg,
    borderRadius: R.xl, borderWidth: 1, borderColor: C.goldBorder,
  },
  bestBadgeText: { fontSize: T.sm, fontWeight: W.semi, color: C.gold, textAlign: 'center' },

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

  repInsightsCard: {
    backgroundColor: C.surface,
    borderRadius: R.xxl,
    borderWidth: 1,
    borderColor: C.violetBorder,
    padding: S.lg,
    gap: S.md,
    marginBottom: S.lg,
  },
  repInsightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  repInsightsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.sm,
  },
  repInsightsTitle: {
    fontSize: T.md,
    fontWeight: W.bold,
    color: C.violet,
  },
  repMetricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: S.sm,
  },
  repMetricCard: {
    width: '48%',
    backgroundColor: C.surfaceUp,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: R.lg,
    paddingVertical: S.sm,
    paddingHorizontal: S.md,
    gap: S.xs,
  },
  repMetricLabel: {
    fontSize: T.xs,
    fontWeight: W.semi,
    color: C.textMuted,
  },
  repMetricValue: {
    fontSize: T.sm,
    fontWeight: W.bold,
    color: C.text,
  },
  consistencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.surfaceUp,
    borderColor: C.border,
    borderWidth: 1,
    borderRadius: R.lg,
    paddingVertical: S.sm,
    paddingHorizontal: S.md,
  },
  consistencyLabel: {
    fontSize: T.sm,
    color: C.textSub,
    fontWeight: W.semi,
  },
  consistencyValue: {
    fontSize: T.md,
    color: C.teal,
    fontWeight: W.bold,
  },
  repChartWrap: {
    backgroundColor: C.surfaceUp,
    borderColor: C.border,
    borderWidth: 1,
    borderRadius: R.lg,
    padding: S.sm,
    gap: S.sm,
    overflow: 'hidden',
  },
  repChartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  repChartTitle: {
    fontSize: T.sm,
    color: C.text,
    fontWeight: W.semi,
  },
  repAxisControls: {
    gap: S.sm,
  },
  repAxisGroup: {
    gap: S.xs,
  },
  repAxisGroupLabel: {
    fontSize: T.nano,
    color: C.textMuted,
    fontWeight: W.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.9,
  },
  repAxisChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: S.xs,
  },
  repAxisChip: {
    borderRadius: R.full,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
    paddingHorizontal: S.sm,
    paddingVertical: 6,
  },
  repAxisChipActive: {
    borderColor: C.violetBorder,
    backgroundColor: C.violetSoft,
  },
  repAxisChipText: {
    fontSize: T.nano,
    color: C.textSub,
    fontWeight: W.semi,
  },
  repAxisChipTextActive: {
    color: C.violet,
    fontWeight: W.bold,
  },
  repChartHint: {
    fontSize: T.nano,
    color: C.textMuted,
  },
  repChartZoomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.xs,
  },
  repChartZoomBtn: {
    width: 28,
    height: 28,
    borderRadius: R.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  },
  repChartAxisText: {
    color: C.textMuted,
    fontSize: T.nano,
  },
  repTooltip: {
    backgroundColor: C.surfaceUp,
    borderColor: C.borderUp,
    borderWidth: 1,
    borderRadius: R.lg,
    paddingVertical: S.sm,
    paddingHorizontal: S.md,
    gap: S.xs,
  },
  repTooltipTitle: {
    fontSize: T.sm,
    color: C.violet,
    fontWeight: W.bold,
  },
  repTooltipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  repTooltipLabel: {
    fontSize: T.xs,
    color: C.textMuted,
    fontWeight: W.semi,
  },
  repTooltipValue: {
    fontSize: T.sm,
    color: C.text,
    fontWeight: W.bold,
  },
  repInsightsEmpty: {
    backgroundColor: C.surfaceUp,
    borderColor: C.border,
    borderWidth: 1,
    borderRadius: R.lg,
    paddingVertical: S.md,
    paddingHorizontal: S.md,
  },
  repInsightsEmptyText: {
    fontSize: T.sm,
    color: C.textMuted,
    lineHeight: T.sm * 1.5,
  },

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

  exercisesCard: {
    backgroundColor: C.surfaceUp, borderRadius: R.lg,
    padding: S.md, gap: S.sm, marginTop: S.sm,
  },
  exercisesLabel: { fontSize: T.xs, fontWeight: W.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  exercisesText: { fontSize: T.sm, color: C.textSub, lineHeight: T.sm * 1.6 },

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

  miniMapWrap: {
    height: 220, borderRadius: R.xl, overflow: 'hidden',
    marginBottom: S.lg, borderWidth: 1, borderColor: C.border,
  },
  miniMap: { flex: 1 },

  gpxShareBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: S.sm,
    paddingVertical: S.md, marginTop: S.md,
    backgroundColor: C.blueSoft, borderRadius: R.lg,
    borderWidth: 1, borderColor: C.blueBorder,
  },
  gpxShareText: { fontSize: T.sm, fontWeight: W.semi, color: C.blue },

  modalOverlay: {
    ...StyleSheet.absoluteFillObject, zIndex: 100,
    backgroundColor: Colors.overlayBlack60,
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
    backgroundColor: Colors.overlayWhite06,
    alignItems: 'center' as const, borderWidth: 1, borderColor: C.border,
  },
  modalCancelText: { fontSize: T.md, fontWeight: W.semi, color: C.textSub },
  modalConfirmBtn: {
    flex: 1, paddingVertical: 14, borderRadius: R.lg,
    backgroundColor: Colors.overlayError15,
    alignItems: 'center' as const, borderWidth: 1, borderColor: Colors.overlayError30,
  },
  modalConfirmText: { fontSize: T.md, fontWeight: W.bold, color: C.error },
});
