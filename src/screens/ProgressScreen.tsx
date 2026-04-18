// ============================================================================
// PROGRESS SCREEN — Luxury Editorial · v4
// Fixed: arc segmentation, bar chart, badge modal, calendar checkmarks
// i18n fully configured · All dynamic logic preserved
// ============================================================================

import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, Dimensions,
    TouchableOpacity, Modal, Pressable, Animated as RNAnimated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    FadeInDown, FadeIn, FadeInLeft, FadeInRight,
    useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';
import Svg, {
    Rect, Text as SvgText, Path, Circle, Defs,
    LinearGradient as SvgLinearGradient, Stop, Line,
    ClipPath, G,
} from 'react-native-svg';
import {
    Flame, Trophy, Target, TrendingUp, Calendar,
    Dumbbell, Footprints, Scale, Zap, Award,
    Lock, X, CheckCircle, Bot, Activity, RefreshCw,
} from 'lucide-react-native';
import { storageHelpers } from '../storage/mmkv';
import { useAppStore } from '../stores';
import { getBadgesWithState } from '../utils/badges';
import { useTranslation } from 'react-i18next';
import { getMonthName } from '../utils/date';
import { generateTextAnalysis } from '../services/pollination/textAnalysis';
import { isPollinationConnected } from '../services/pollination';
import i18n from '../i18n';
import type { Badge, MeasureEntry, HomeWorkoutEntry, RunEntry, Entry } from '../types';
import { Colors, ScreenPalettes } from '../constants';

const { width: SW } = Dimensions.get('window');
const PAD = 18;

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = ScreenPalettes.warm;

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

// ─── Helpers ──────────────────────────────────────────────────────────────────
const EyebrowLabel = ({ text, color = C.textMuted }: { text: string; color?: string }) => (
    <Text style={{
        fontSize: T.nano, fontWeight: W.black, color,
        letterSpacing: 2.8, textTransform: 'uppercase',
    }}>
        {text}
    </Text>
);

// Thin separator line
const Sep = () => <View style={{ height: 1, backgroundColor: C.border, marginVertical: S.xl }} />;

// ─── STREAK COVER ─────────────────────────────────────────────────────────────
// Fixed: continuous arc instead of segmented (no visible gap artifacts)
function StreakCover({ current, best }: { current: number; best: number }) {
    const { t } = useTranslation();
    const pct = best > 0 ? Math.min(current / best, 1) : 0;

    // Arc geometry — single continuous path, much cleaner
    const SIZE = 160;
    const cx = SIZE / 2, cy = SIZE / 2;
    const R_outer = 70, R_inner = 58;
    const GAP_DEG = 40; // degrees cut at bottom
    const START_ANGLE = (90 + GAP_DEG / 2) * (Math.PI / 180); // start from bottom-left
    const END_ANGLE   = (90 - GAP_DEG / 2 + 360) * (Math.PI / 180); // end at bottom-right
    const FULL_SWEEP  = (360 - GAP_DEG) * (Math.PI / 180);

    const polarToXY = (angle: number, r: number) => ({
        x: cx + r * Math.cos(angle - Math.PI / 2),
        y: cy + r * Math.sin(angle - Math.PI / 2),
    });

    const arcPath = (start: number, end: number, rOut: number, rIn: number) => {
        const s1 = polarToXY(start, rOut);
        const e1 = polarToXY(end, rOut);
        const s2 = polarToXY(end, rIn);
        const e2 = polarToXY(start, rIn);
        const large = end - start > Math.PI ? 1 : 0;
        return [
            `M ${s1.x} ${s1.y}`,
            `A ${rOut} ${rOut} 0 ${large} 1 ${e1.x} ${e1.y}`,
            `L ${s2.x} ${s2.y}`,
            `A ${rIn} ${rIn} 0 ${large} 0 ${e2.x} ${e2.y}`,
            'Z',
        ].join(' ');
    };

    const trackPath = arcPath(
        START_ANGLE * (Math.PI / 180),
        END_ANGLE   * (Math.PI / 180),
        R_outer, R_inner
    );

    // Fill arc — sweep from start to pct
    const fillEnd = START_ANGLE * (Math.PI / 180) + FULL_SWEEP * pct;
    const fillPath = pct > 0.01
        ? arcPath(START_ANGLE * (Math.PI / 180), fillEnd, R_outer, R_inner)
        : null;

    return (
        <Animated.View entering={FadeInDown.delay(60).springify()} style={sc.outer}>
            <LinearGradient
                colors={[Colors.warmDarkText, Colors.bgLayer, C.bg]}
                style={sc.bg}
            >
                {/* Grain texture overlay */}
                <View style={sc.grain} pointerEvents="none" />

                <View style={sc.content}>
                    {/* Arc ring */}
                    <View style={sc.ringWrap}>
                        <Svg width={SIZE} height={SIZE}>
                            <Defs>
                                <SvgLinearGradient id="arcFill" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <Stop offset="0%" stopColor={C.amber} />
                                    <Stop offset="60%" stopColor={C.ember} />
                                    <Stop offset="100%" stopColor={Colors.errorStrong} />
                                </SvgLinearGradient>
                            </Defs>
                            {/* Track */}
                            <Path d={trackPath} fill={Colors.overlayWhite05} />
                            {/* Fill */}
                            {fillPath && <Path d={fillPath} fill="url(#arcFill)" />}
                        </Svg>

                        {/* Center content */}
                        <View style={sc.ringCenter}>
                            <Flame size={18} color={C.amber} fill={C.amber} />
                            <Text style={sc.bigNum}>{current}</Text>
                            <Text style={sc.bigUnit}>
                                {current === 1
                                    ? t('common.day', 'jour')
                                    : t('common.days', 'jours')}
                            </Text>
                        </View>
                    </View>

                    {/* Info col */}
                    <View style={sc.infoCol}>
                        <EyebrowLabel text={t('progress.currentStreak', 'Série actuelle')} color={C.amber} />

                        <Text style={sc.motivText}>
                            {current === 0
                                ? t('streak.start', "C'est\nle moment\nde commencer")
                                : current < 7
                                ? t('streak.keep', 'Continue\ncomme ça !')
                                : current < 30
                                ? t('streak.momentum', 'Tu es\nsur ta\nlancée')
                                : t('streak.exceptional', 'Performance\nexceptionnelle')}
                        </Text>

                        {best > 0 && (
                            <View style={sc.recordBadge}>
                                <Trophy size={10} color={C.gold} strokeWidth={2.5} />
                                <Text style={sc.recordText}>
                                    {t('streak.record', 'Record')} : {best}{' '}
                                    {t('common.daysShort', 'j')}
                                </Text>
                            </View>
                        )}

                        {/* Thin progress bar */}
                        <View style={sc.pctWrap}>
                            <View style={sc.pctTrack}>
                                <LinearGradient
                                    colors={[C.amber, C.ember]}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                    style={[sc.pctFill, { width: `${pct * 100}%` as `${number}%` }]}
                                />
                            </View>
                            <Text style={sc.pctLabel}>
                                {best > 0
                                    ? `${Math.round(pct * 100)}% ${t('streak.ofRecord', 'du record')}`
                                    : t('streak.startToday', "Démarre aujourd'hui !")}
                            </Text>
                        </View>
                    </View>
                </View>
            </LinearGradient>
        </Animated.View>
    );
}

const sc = StyleSheet.create({
    outer: {
        borderRadius: R.xxxl, overflow: 'hidden', marginBottom: S.sm,
        borderWidth: 1, borderColor: Colors.overlayCozyWarm40,
        shadowColor: C.ember, shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.18, shadowRadius: 28, elevation: 10,
    },
    bg:    { padding: S.xl },
    grain: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.04,
        backgroundColor: Colors.white,
    },
    content:    { flexDirection: 'row', alignItems: 'center', gap: S.lg },
    ringWrap:   { width: 160, height: 160, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    ringCenter: { position: 'absolute', alignItems: 'center', gap: 2 },
    bigNum: {
        fontSize: 46, fontWeight: W.black, color: C.text,
        lineHeight: 50, letterSpacing: -2, includeFontPadding: false,
    },
    bigUnit:    { fontSize: T.xs, color: C.textMuted, fontWeight: W.semi, letterSpacing: 0.5 },
    infoCol:    { flex: 1, gap: S.lg },
    motivText: {
        fontSize: T.xl, fontWeight: W.black, color: C.text,
        letterSpacing: -0.6, lineHeight: 27,
    },
    recordBadge: {
        flexDirection: 'row', alignItems: 'center', gap: S.xs,
        backgroundColor: C.goldSoft, borderWidth: 1, borderColor: C.goldBorder,
        borderRadius: R.full, paddingHorizontal: S.md, paddingVertical: 5,
        alignSelf: 'flex-start',
    },
    recordText: { fontSize: T.xs, fontWeight: W.bold, color: C.gold },
    pctWrap:    { gap: S.xs },
    pctTrack:   { height: 2, backgroundColor: Colors.overlayWhite08, borderRadius: R.full, overflow: 'hidden' },
    pctFill:    { height: '100%', borderRadius: R.full },
    pctLabel:   { fontSize: T.micro, color: C.textMuted, fontWeight: W.med },
});

// ─── STATS SECTION ────────────────────────────────────────────────────────────
function StatsSection({ workouts, distance, duration, goal }: {
    workouts: number; distance: number; duration: number; goal: number;
}) {
    const { t } = useTranslation();
    const big = {
        val: workouts.toString(), unit: t('stats.totalSessions', 'séances au total'),
        label: t('stats.activity', 'ACTIVITÉ'), color: C.ember,
        icon: <Dumbbell size={16} color={C.ember} strokeWidth={2} />,
        bg: C.emberGlow, border: C.emberBorder,
    };
    const small = [
        {
            val: `${distance.toFixed(1)}`, unit: t('stats.kmRun', 'km courus'),
            color: C.blue, icon: <Footprints size={14} color={C.blue} strokeWidth={2} />,
            bg: C.blueSoft, border: C.blueBorder,
        },
        {
            val: `${duration}`, unit: t('stats.minCardio', 'min cardio'),
            color: C.teal, icon: <Zap size={14} color={C.teal} strokeWidth={2} />,
            bg: C.tealSoft, border: C.tealBorder,
        },
        {
            val: `${goal}`, unit: t('stats.weeklyGoal', 'obj. /semaine'),
            color: C.gold, icon: <Target size={14} color={C.gold} strokeWidth={2} />,
            bg: C.goldSoft, border: C.goldBorder,
        },
    ];

    return (
        <Animated.View entering={FadeInDown.delay(130).springify()} style={sts.row}>
            {/* Big card */}
            <View style={[sts.bigCard, { borderColor: big.border }]}>
                <LinearGradient colors={[big.bg, Colors.transparent]} style={StyleSheet.absoluteFill} />
                <View style={[sts.bigIcon, { backgroundColor: big.bg }]}>{big.icon}</View>
                <EyebrowLabel text={big.label} color={big.color} />
                <Text style={[sts.bigVal, { color: big.color }]}>{big.val}</Text>
                <Text style={sts.bigUnit}>{big.unit}</Text>
            </View>

            {/* 3 small stacked */}
            <View style={sts.smallCol}>
                {small.map((s, i) => (
                    <Animated.View key={`${s.unit}-${i}`} entering={FadeInRight.delay(160 + i * 50).springify()}
                        style={[sts.smallCard, { borderColor: s.border }]}>
                        <View style={[sts.smallIcon, { backgroundColor: s.bg }]}>{s.icon}</View>
                        <View style={sts.smallText}>
                            <Text style={[sts.smallVal, { color: s.color }]}>{s.val}</Text>
                            <Text style={sts.smallUnit}>{s.unit}</Text>
                        </View>
                    </Animated.View>
                ))}
            </View>
        </Animated.View>
    );
}

const sts = StyleSheet.create({
    row:      { flexDirection: 'row', gap: S.sm, marginBottom: S.sm, alignItems: 'stretch' },
    bigCard: {
        flex: 1.15, backgroundColor: C.surface, borderRadius: R.xxxl,
        borderWidth: 1, padding: S.xl, gap: S.sm, overflow: 'hidden',
        shadowColor: Colors.black, shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25, shadowRadius: 14, elevation: 6,
    },
    bigIcon:  { width: 34, height: 34, borderRadius: R.md, alignItems: 'center', justifyContent: 'center', marginBottom: S.xs },
    bigVal:   { fontSize: 44, fontWeight: W.black, letterSpacing: -2, lineHeight: 46, includeFontPadding: false },
    bigUnit:  { fontSize: T.xs, color: C.textMuted, fontWeight: W.med, lineHeight: 16 },
    smallCol: { flex: 1, gap: S.sm },
    smallCard: {
        flex: 1, backgroundColor: C.surface, borderRadius: R.xl,
        borderWidth: 1, paddingHorizontal: S.md, paddingVertical: S.md,
        flexDirection: 'row', alignItems: 'center', gap: S.sm, overflow: 'hidden',
        shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.18, shadowRadius: 6, elevation: 3,
    },
    smallIcon: { width: 28, height: 28, borderRadius: R.sm, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    smallText: { flex: 1 },
    smallVal:  { fontSize: T.lg, fontWeight: W.black, letterSpacing: -0.5 },
    smallUnit: { fontSize: T.micro, color: C.textMuted, fontWeight: W.med, marginTop: 1 },
});

// ─── CALENDAR ─────────────────────────────────────────────────────────────────
// Fixed: shows checkmark ✓ on active days instead of dot
function MonthCalendar({ daysInMonth, startDayOfWeek, activeDays, monthName }: {
    daysInMonth: number; startDayOfWeek: number;
    activeDays: Set<number>; monthName: string;
}) {
    const { t } = useTranslation();
    const today = new Date().getDate();
    const days = [
        t('calendar.mon', 'L'), t('calendar.tue', 'M'), t('calendar.wed', 'M'),
        t('calendar.thu', 'J'), t('calendar.fri', 'V'), t('calendar.sat', 'S'),
        t('calendar.sun', 'D'),
    ];

    return (
        <Animated.View entering={FadeInDown.delay(200).springify()} style={cal.card}>
            <View style={cal.header}>
                <View style={cal.headerLeft}>
                    <View style={cal.calIcon}>
                        <Calendar size={13} color={C.ember} strokeWidth={2} />
                    </View>
                    <Text style={cal.month}>{monthName}</Text>
                </View>
                <View style={cal.activePill}>
                    <CheckCircle size={11} color={C.ember} strokeWidth={2.5} />
                    <Text style={cal.activeText}>
                        {activeDays.size} {t('calendar.activeDays', 'jours actifs')}
                    </Text>
                </View>
            </View>

            {/* Day headers */}
            <View style={cal.weekRow}>
                {days.map((d, i) => (
                    <Text key={`${d}-${i}`} style={cal.dayLabel}>{d}</Text>
                ))}
            </View>

            {/* Grid */}
            <View style={cal.grid}>
                {Array.from({ length: 42 }).map((_, idx) => {
                    const di = idx - startDayOfWeek;
                    if (di < 0 || di >= daysInMonth) {
                        return <View key={`e${idx}`} style={cal.empty} />;
                    }
                    const day = di + 1;
                    const active  = activeDays.has(day);
                    const isToday = day === today;
                    const future  = day > today;

                    return (
                        <View key={day} style={[
                            cal.cell,
                            active  && cal.cellActive,
                            isToday && !active && cal.cellToday,
                            future  && cal.cellFuture,
                        ]}>
                            {active ? (
                                // Checkmark for completed days
                                <View style={cal.checkWrap}>
                                    <CheckCircle
                                        size={18}
                                        color={C.ember}
                                        fill={C.emberGlow}
                                        strokeWidth={2.5}
                                    />
                                </View>
                            ) : (
                                <Text style={[
                                    cal.cellNum,
                                    isToday && cal.cellNumToday,
                                    future  && cal.cellNumFuture,
                                ]}>
                                    {day}
                                </Text>
                            )}
                        </View>
                    );
                })}
            </View>
        </Animated.View>
    );
}

const cal = StyleSheet.create({
    card: {
        backgroundColor: C.surface, borderRadius: R.xxxl,
        borderWidth: 1, borderColor: C.border,
        padding: S.xl, marginBottom: S.sm,
        shadowColor: Colors.black, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2, shadowRadius: 12, elevation: 5,
    },
    header: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: S.lg,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
    calIcon: {
        width: 26, height: 26, borderRadius: R.sm,
        backgroundColor: C.emberGlow, alignItems: 'center', justifyContent: 'center',
    },
    month: {
        fontSize: T.md, fontWeight: W.xbold, color: C.text,
        textTransform: 'capitalize', letterSpacing: -0.2,
    },
    activePill: {
        flexDirection: 'row', alignItems: 'center', gap: S.xs,
        backgroundColor: C.emberGlow, borderWidth: 1, borderColor: C.emberBorder,
        borderRadius: R.full, paddingHorizontal: S.md, paddingVertical: 5,
    },
    activeText: { fontSize: T.xs, fontWeight: W.bold, color: C.ember },
    weekRow: { flexDirection: 'row', marginBottom: S.sm },
    dayLabel: {
        flex: 1, textAlign: 'center', fontSize: T.micro,
        color: C.textMuted, fontWeight: W.bold, letterSpacing: 0.8,
    },
    grid:      { flexDirection: 'row', flexWrap: 'wrap' },
    empty:     { width: '14.28%', aspectRatio: 1 },
    cell: {
        width: '14.28%', aspectRatio: 1,
        alignItems: 'center', justifyContent: 'center',
    },
    cellActive: {},
    cellToday: {
        borderWidth: 1.5, borderColor: C.ember, borderRadius: 8,
    },
    cellFuture: { opacity: 0.25 },
    checkWrap:  { alignItems: 'center', justifyContent: 'center' },
    cellNum: {
        fontSize: T.sm - 1, color: C.text, fontWeight: W.med,
    },
    cellNumToday: { color: C.text, fontWeight: W.black },
    cellNumFuture: { opacity: 0.4 },
});

// ─── BAR CHART — Fixed layout & proportions ───────────────────────────────────
function WorkoutBarChart({ data, maxValue }: { data: { label: string; value: number }[]; maxValue: number }) {
    const { t } = useTranslation();
    if (!data.length) {
        return (
            <View style={{ alignItems: 'center', paddingVertical: S.xxl, gap: S.sm }}>
                <Text style={{ fontSize: 28 }}>📊</Text>
                <Text style={{ color: C.textMuted, fontSize: T.sm }}>
                    {t('chart.noData', 'Pas encore de données')}
                </Text>
            </View>
        );
    }

    // Fixed dimensions — compute precisely
    const cW = SW - PAD * 2 - S.xl * 2;
    const cH = 120;
    const BOTTOM_LABEL_H = 24;
    const TOP_VAL_H = 18;
    const CHART_H = cH - TOP_VAL_H;
    const n = data.length;
    const BAR_W = Math.min(32, Math.floor((cW * 0.7) / n));
    const SPACING = (cW - n * BAR_W) / (n + 1);
    const max = Math.max(maxValue, 1);

    return (
        <View style={{ alignItems: 'flex-start' }}>
            <Svg
                width={cW}
                height={cH + BOTTOM_LABEL_H}
                viewBox={`0 0 ${cW} ${cH + BOTTOM_LABEL_H}`}
            >
                <Defs>
                    <SvgLinearGradient id="barActive" x1="0%" y1="0%" x2="0%" y2="100%">
                        <Stop offset="0%" stopColor={C.ember} stopOpacity="1" />
                        <Stop offset="100%" stopColor={C.amber} stopOpacity="0.6" />
                    </SvgLinearGradient>
                    <SvgLinearGradient id="barInactive" x1="0%" y1="0%" x2="0%" y2="100%">
                        <Stop offset="0%" stopColor={Colors.overlayWhite12} />
                        <Stop offset="100%" stopColor={Colors.overlayWhite03} />
                    </SvgLinearGradient>
                </Defs>

                {/* Baseline */}
                <Line
                    x1={0} y1={cH} x2={cW} y2={cH}
                    stroke={Colors.overlayWhite06} strokeWidth={1}
                />

                {data.map((item, i) => {
                    const x   = SPACING + i * (BAR_W + SPACING);
                    const bH  = item.value > 0
                        ? Math.max((item.value / max) * CHART_H, 8)
                        : 6;
                    const y   = cH - bH;
                    const isHighlight = i === data.length - 1;
                    const fill = item.value > 0
                        ? (isHighlight ? 'url(#barActive)' : 'url(#barInactive)')
                        : 'url(#barInactive)';

                    return (
                        <G key={`${item.label}-${i}`}>
                            {/* Bar body */}
                            <Rect
                                x={x} y={y}
                                width={BAR_W} height={bH}
                                rx={BAR_W / 3}
                                fill={fill}
                            />
                            {/* Top cap glow for highlight */}
                            {isHighlight && item.value > 0 && (
                                <Rect
                                    x={x} y={y}
                                    width={BAR_W} height={Math.min(5, bH)}
                                    rx={BAR_W / 3}
                                    fill={C.ember}
                                    opacity={0.9}
                                />
                            )}
                            {/* Value label */}
                            {item.value > 0 && (
                                <SvgText
                                    x={x + BAR_W / 2}
                                    y={y - 5}
                                    fontSize={10}
                                    fill={isHighlight ? C.ember : C.textMuted}
                                    textAnchor="middle"
                                    fontWeight="800"
                                >
                                    {item.value}
                                </SvgText>
                            )}
                            {/* Month label */}
                            <SvgText
                                x={x + BAR_W / 2}
                                y={cH + 16}
                                fontSize={10}
                                fill={isHighlight ? C.textSub : C.textMuted}
                                textAnchor="middle"
                                fontWeight={isHighlight ? '700' : '400'}
                            >
                                {item.label}
                            </SvgText>
                        </G>
                    );
                })}
            </Svg>
        </View>
    );
}

// ─── WEIGHT SPARKLINE ─────────────────────────────────────────────────────────
function WeightSparkline({ data }: { data: MeasureEntry[] }) {
    const { t } = useTranslation();
    if (data.length < 2) return null;

    const weights = data.map(d => d.weight!);
    const minW = Math.min(...weights) - 2;
    const maxW = Math.max(...weights) + 2;
    const range = maxW - minW || 1;
    const cW = SW - PAD * 2 - S.xl * 2;
    const cH = 90, pad = 16;
    const delta = weights[weights.length - 1] - weights[0];

    const pts = data.map((d, i) => ({
        x: pad + (i / (data.length - 1)) * (cW - 2 * pad),
        y: cH - pad - ((d.weight! - minW) / range) * (cH - 2 * pad),
        w: d.weight,
    }));

    const lineD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaD = `${lineD} L ${pts[pts.length - 1].x} ${cH - pad} L ${pts[0].x} ${cH - pad} Z`;

    return (
        <View>
            <Svg width="100%" height={cH + 6} viewBox={`0 0 ${cW} ${cH + 6}`}>
                <Defs>
                    <SvgLinearGradient id="wl" x1="0%" y1="0%" x2="100%" y2="0%">
                        <Stop offset="0%" stopColor={C.blue} />
                        <Stop offset="100%" stopColor={C.violet} />
                    </SvgLinearGradient>
                    <SvgLinearGradient id="wa" x1="0%" y1="0%" x2="0%" y2="100%">
                        <Stop offset="0%" stopColor={C.blue} stopOpacity="0.20" />
                        <Stop offset="100%" stopColor={C.blue} stopOpacity="0" />
                    </SvgLinearGradient>
                </Defs>
                <Path d={areaD} fill="url(#wa)" />
                <Path d={lineD} stroke="url(#wl)" strokeWidth={2.5}
                    fill="none" strokeLinecap="round" strokeLinejoin="round" />
                {[pts[0], pts[pts.length - 1]].map((p, i) => (
                    <G key={`weight-point-${i}`}>
                        <Circle cx={p.x} cy={p.y} r={6} fill={C.blue} opacity={0.15} />
                        <Circle cx={p.x} cy={p.y} r={3.5} fill={C.blue} />
                        <Circle cx={p.x} cy={p.y} r={1.5} fill={C.bg} />
                        <SvgText x={p.x} y={p.y - 10} fontSize="11"
                            fill={C.text} textAnchor="middle" fontWeight="800">
                            {p.w}
                        </SvgText>
                    </G>
                ))}
            </Svg>

            <View style={wsp.footer}>
                {[
                    { label: t('weight.first', 'Premier'),  val: `${weights[0]} kg`,          color: C.text },
                    { label: t('weight.current', 'Actuel'), val: `${weights[weights.length - 1]} kg`, color: C.text },
                    {
                        label: t('weight.change', 'Évolution'),
                        val: `${delta > 0 ? '+' : ''}${delta.toFixed(1)} kg`,
                        color: delta <= 0 ? C.green : C.error,
                    },
                    { label: t('weight.measures', 'Mesures'), val: `${data.length}`, color: C.text },
                ].map((item, i) => (
                    <React.Fragment key={item.label}>
                        {i > 0 && <View style={wsp.footerSep} />}
                        <View style={wsp.footerItem}>
                            <Text style={wsp.footerLabel}>{item.label}</Text>
                            <Text style={[wsp.footerVal, { color: item.color }]}>{item.val}</Text>
                        </View>
                    </React.Fragment>
                ))}
            </View>
        </View>
    );
}

const wsp = StyleSheet.create({
    footer: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: S.lg, marginTop: S.lg, paddingTop: S.lg,
        borderTopWidth: 1, borderTopColor: C.border,
    },
    footerItem:  { alignItems: 'center', gap: 2 },
    footerLabel: { fontSize: T.micro, color: C.textMuted, fontWeight: W.semi, letterSpacing: 0.3 },
    footerVal:   { fontSize: T.md, fontWeight: W.black, color: C.text, letterSpacing: -0.3 },
    footerSep:   { width: 1, height: 24, backgroundColor: C.border },
});

// ─── TOP EXERCISE CARD ────────────────────────────────────────────────────────
function TopExCard({ name, count }: { name: string; count: number }) {
    const { t } = useTranslation();
    return (
        <Animated.View entering={FadeInLeft.delay(360).springify()} style={txc.card}>
            <LinearGradient
                colors={[Colors.overlayGold10, Colors.transparent]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
            />
            <View style={txc.left}>
                <EyebrowLabel text={t('progress.exerciseOfMonth', 'Exercice du mois')} color={C.gold} />
                <Text style={txc.name}>{name}</Text>
            </View>
            <View style={txc.right}>
                <Text style={txc.count}>{count}</Text>
                <Text style={txc.countLabel}>{t('common.times', 'fois')}</Text>
            </View>
            <View style={txc.iconAbs} pointerEvents="none">
                <Award size={64} color={C.gold} strokeWidth={1} opacity={0.07} />
            </View>
        </Animated.View>
    );
}

const txc = StyleSheet.create({
    card: {
        backgroundColor: C.surface, borderRadius: R.xxxl,
        borderWidth: 1, borderColor: C.goldBorder,
        padding: S.xl, flexDirection: 'row', alignItems: 'center',
        marginBottom: S.sm, overflow: 'hidden',
        shadowColor: C.gold, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12, shadowRadius: 14, elevation: 5,
    },
    left: { flex: 1, gap: S.sm },
    name: {
        fontSize: T.xxl, fontWeight: W.black, color: C.text,
        textTransform: 'capitalize', letterSpacing: -0.6,
    },
    right:      { alignItems: 'center' },
    count:      { fontSize: 44, fontWeight: W.black, color: C.gold, lineHeight: 46, letterSpacing: -2 },
    countLabel: { fontSize: T.xs, color: C.textMuted, fontWeight: W.semi },
    iconAbs:    { position: 'absolute', right: S.lg, top: '50%', transform: [{ translateY: -32 }] },
});

// ─── PERSONAL RECORDS ─────────────────────────────────────────────────────────
function PersonalRecords({ records }: { records: { id: string; name: string; icon: string; value: string }[] }) {
    const { t } = useTranslation();
    if (!records.length) return null;

    return (
        <Animated.View entering={FadeInDown.delay(400).springify()} style={prc.wrap}>
            <View style={prc.titleRow}>
                <Trophy size={15} color={C.gold} strokeWidth={2} />
                <Text style={prc.title}>{t('progress.personalRecords', 'Records personnels')}</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={prc.scroll}>
                {records.map((rec, i) => (
                    <Animated.View key={rec.id} entering={FadeInRight.delay(420 + i * 60).springify()}>
                        <LinearGradient
                            colors={[Colors.overlayGold10, C.surface]}
                            start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                            style={prc.card}
                        >
                            <Text style={prc.emoji}>{rec.icon}</Text>
                            <Text style={prc.recVal}>{rec.value}</Text>
                            <Text style={prc.recName}>{rec.name}</Text>
                        </LinearGradient>
                    </Animated.View>
                ))}
            </ScrollView>
        </Animated.View>
    );
}

const prc = StyleSheet.create({
    wrap:     { marginBottom: S.sm },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: S.sm, marginBottom: S.lg },
    title:    { fontSize: T.xl, fontWeight: W.black, color: C.text, letterSpacing: -0.4 },
    scroll:   { gap: S.sm, paddingBottom: S.xs },
    card: {
        width: 106, borderRadius: R.xxl, borderWidth: 1, borderColor: C.goldBorder,
        padding: S.lg, alignItems: 'center', gap: S.xs,
        shadowColor: C.gold, shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.10, shadowRadius: 8, elevation: 3,
    },
    emoji:   { fontSize: 28, marginBottom: S.xs },
    recVal:  { fontSize: T.lg, fontWeight: W.black, color: C.gold, letterSpacing: -0.4 },
    recName: { fontSize: T.micro, color: C.textMuted, fontWeight: W.semi, textAlign: 'center', lineHeight: 14 },
});

// ─── BADGE DETAIL MODAL ───────────────────────────────────────────────────────
function BadgeModal({ badge, onClose }: { badge: Badge | null; onClose: () => void }) {
    const { t } = useTranslation();
    if (!badge) return null;

    const isUnlocked = !!badge.unlockedAt;
    const dateStr = badge.unlockedAt
        ? new Date(badge.unlockedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
        : null;

    return (
        <Modal transparent animationType="fade" visible={!!badge} onRequestClose={onClose}>
            <Pressable style={bmo.backdrop} onPress={onClose}>
                <Pressable style={bmo.sheet} onPress={e => e.stopPropagation()}>
                    <LinearGradient
                        colors={isUnlocked
                            ? [Colors.overlayGold12, C.surface, C.surface]
                            : [C.surface, C.surface]}
                        style={bmo.grad}
                    >
                        {/* Close button */}
                        <TouchableOpacity style={bmo.closeBtn} onPress={onClose}>
                            <X size={16} color={C.textMuted} strokeWidth={2.5} />
                        </TouchableOpacity>

                        {/* Emoji */}
                        <Text style={bmo.emoji}>{badge.icon || '🏅'}</Text>

                        {/* Status pill */}
                        <View style={[
                            bmo.statusPill,
                            { backgroundColor: isUnlocked ? C.goldSoft : Colors.overlayWhite05,
                              borderColor: isUnlocked ? C.goldBorder : C.border }
                        ]}>
                            {isUnlocked
                                ? <Trophy size={11} color={C.gold} strokeWidth={2.5} />
                                : <Lock size={11} color={C.textMuted} strokeWidth={2.5} />
                            }
                            <Text style={[bmo.statusText, { color: isUnlocked ? C.gold : C.textMuted }]}>
                                {isUnlocked
                                    ? t('badge.unlocked', 'Débloqué')
                                    : t('badge.locked', 'Verrouillé')}
                            </Text>
                        </View>

                        {/* Name */}
                        <Text style={bmo.name}>{t(badge.name, { defaultValue: badge.id })}</Text>

                        {/* Description */}
                        <Text style={bmo.desc}>
                            {t(badge.description, {
                                defaultValue: t('badge.noDesc', 'Complète des objectifs pour débloquer ce badge.'),
                            })}
                        </Text>

                        {/* Unlock date */}
                        {dateStr && (
                            <View style={bmo.dateRow}>
                                <Calendar size={12} color={C.textMuted} strokeWidth={2} />
                                <Text style={bmo.dateText}>
                                    {t('badge.unlockedOn', 'Débloqué le')} {dateStr}
                                </Text>
                            </View>
                        )}

                        {/* CTA */}
                        <TouchableOpacity
                            style={[bmo.cta, { backgroundColor: isUnlocked ? C.goldSoft : C.emberGlow,
                                               borderColor: isUnlocked ? C.goldBorder : C.emberBorder }]}
                            onPress={onClose}
                        >
                            <Text style={[bmo.ctaText, { color: isUnlocked ? C.gold : C.ember }]}>
                                {t('badge.close', 'Fermer')}
                            </Text>
                        </TouchableOpacity>
                    </LinearGradient>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const bmo = StyleSheet.create({
    backdrop: {
        flex: 1, backgroundColor: Colors.overlayBlack75,
        alignItems: 'center', justifyContent: 'center', padding: PAD,
    },
    sheet: {
        width: '100%', maxWidth: 340, borderRadius: R.xxxl,
        borderWidth: 1, borderColor: C.borderUp, overflow: 'hidden',
        shadowColor: Colors.black, shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.5, shadowRadius: 40, elevation: 20,
    },
    grad: { padding: S.xxl, alignItems: 'center', gap: S.md },
    closeBtn: {
        alignSelf: 'flex-end',
        width: 30, height: 30, borderRadius: R.full,
        backgroundColor: Colors.overlayWhite06,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: S.sm,
    },
    emoji:       { fontSize: 56, marginBottom: S.xs },
    statusPill: {
        flexDirection: 'row', alignItems: 'center', gap: S.xs,
        borderWidth: 1, borderRadius: R.full,
        paddingHorizontal: S.md, paddingVertical: 5,
    },
    statusText: { fontSize: T.xs, fontWeight: W.bold },
    name: {
        fontSize: T.xl, fontWeight: W.black, color: C.text,
        textAlign: 'center', letterSpacing: -0.4,
    },
    desc: {
        fontSize: T.sm, color: C.textSub, textAlign: 'center',
        lineHeight: 20, fontWeight: W.reg,
    },
    dateRow: { flexDirection: 'row', alignItems: 'center', gap: S.xs, marginTop: S.xs },
    dateText: { fontSize: T.xs, color: C.textMuted, fontWeight: W.med },
    cta: {
        marginTop: S.md, paddingHorizontal: S.xxl, paddingVertical: S.md,
        borderRadius: R.full, borderWidth: 1,
    },
    ctaText: { fontSize: T.sm, fontWeight: W.bold },
});

// ─── BADGES GRID ──────────────────────────────────────────────────────────────
function BadgesGrid({ badges, badgeProgress }: {
    badges: Badge[];
    badgeProgress: Record<string, { current: number; target: number; label: string }>;
}) {
    const { t } = useTranslation();
    const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

    const unlocked = badges.filter(b => b.unlockedAt);
    const locked   = badges.filter(b => !b.unlockedAt);
    const pct = badges.length > 0 ? Math.round((unlocked.length / badges.length) * 100) : 0;

    return (
        <Animated.View entering={FadeInDown.delay(460).springify()}>
            {/* Header */}
            <View style={bdg.header}>
                <View style={bdg.headerLeft}>
                    <Text style={bdg.title}>{t('progress.badges', 'Badges')}</Text>
                    <Text style={bdg.sub}>
                        {unlocked.length}/{badges.length} {t('badges.unlocked', 'débloqués')}
                    </Text>
                </View>
                <View style={bdg.pctPill}>
                    <View style={bdg.pctTrack}>
                        <LinearGradient colors={[C.gold, C.amber]}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            style={[bdg.pctFill, { width: `${pct}%` as `${number}%` }]} />
                    </View>
                    <Text style={bdg.pctText}>{pct}%</Text>
                </View>
            </View>

            {/* Unlocked grid */}
            {unlocked.length > 0 && (
                <View>
                    <View style={bdg.sectionLabel}>
                        <View style={[bdg.dot, { backgroundColor: C.gold }]} />
                        <Text style={[bdg.sectionText, { color: C.gold }]}>
                            {t('badges.sectionUnlocked', 'Débloqués')}
                        </Text>
                    </View>
                    <View style={bdg.grid}>
                        {unlocked.map((badge, i) => (
                            <Animated.View
                                key={badge.id}
                                entering={FadeInDown.delay(480 + i * 40).springify()}
                                style={bdg.tileWrap}
                            >
                                <TouchableOpacity
                                    activeOpacity={0.75}
                                    onPress={() => setSelectedBadge(badge)}
                                >
                                    <LinearGradient
                                        colors={[Colors.overlayGold14, C.surface]}
                                        style={bdg.tile}
                                    >
                                        <Text style={bdg.tileEmoji}>{badge.icon || '🏅'}</Text>
                                        <Text style={bdg.tileName}>{t(badge.name, { defaultValue: badge.id })}</Text>
                                        <Text style={bdg.tileDate}>
                                            {badge.unlockedAt
                                                ? new Date(badge.unlockedAt).toLocaleDateString('fr-FR', {
                                                    day: 'numeric', month: 'short',
                                                })
                                                : ''}
                                        </Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </Animated.View>
                        ))}
                    </View>
                </View>
            )}

            {/* Locked list */}
            {locked.length > 0 && (
                <View style={{ marginTop: S.lg }}>
                    <View style={bdg.sectionLabel}>
                        <View style={[bdg.dot, { backgroundColor: C.textMuted }]} />
                        <Text style={[bdg.sectionText, { color: C.textMuted }]}>
                            {t('badges.sectionInProgress', 'En cours')}
                        </Text>
                    </View>
                    <View style={bdg.lockedList}>
                        {locked.map((badge) => {
                            const progress = badgeProgress[badge.id];
                            const progPct  = progress ? Math.min((progress.current / progress.target) * 100, 100) : 0;
                            return (
                                <TouchableOpacity
                                    key={badge.id}
                                    activeOpacity={0.7}
                                    onPress={() => setSelectedBadge(badge)}
                                    style={bdg.lockedItem}
                                >
                                    <View style={bdg.lockedLeft}>
                                        <View style={bdg.lockIcon}>
                                            <Lock size={11} color={C.textMuted} strokeWidth={2} />
                                        </View>
                                        <View style={bdg.lockedText}>
                                            <Text style={bdg.lockedName}>{t(badge.name, { defaultValue: badge.id })}</Text>
                                            {progress && (
                                                <Text style={bdg.lockedProgress}>{progress.label}</Text>
                                            )}
                                        </View>
                                    </View>
                                    {progress && (
                                        <View style={bdg.lockedBar}>
                                            <View style={[bdg.lockedBarFill, { width: `${progPct}%` as `${number}%` }]} />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            )}

            {/* Badge detail modal */}
            <BadgeModal badge={selectedBadge} onClose={() => setSelectedBadge(null)} />
        </Animated.View>
    );
}

const bdg = StyleSheet.create({
    header: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: S.xl,
    },
    headerLeft: { gap: 3 },
    title:  { fontSize: T.xl, fontWeight: W.black, color: C.text, letterSpacing: -0.4 },
    sub:    { fontSize: T.xs, color: C.textMuted, fontWeight: W.med },
    pctPill: {
        alignItems: 'center', gap: S.xs,
        backgroundColor: C.surface, borderWidth: 1, borderColor: C.goldBorder,
        borderRadius: R.full, paddingHorizontal: S.md, paddingVertical: S.sm,
        minWidth: 80,
    },
    pctTrack: {
        width: 60, height: 2, backgroundColor: Colors.overlayWhite08,
        borderRadius: R.full, overflow: 'hidden',
    },
    pctFill: { height: '100%', borderRadius: R.full },
    pctText: { fontSize: T.xs, fontWeight: W.black, color: C.gold },

    sectionLabel: { flexDirection: 'row', alignItems: 'center', gap: S.sm, marginBottom: S.md },
    dot:          { width: 5, height: 5, borderRadius: 3 },
    sectionText:  { fontSize: T.micro, fontWeight: W.black, letterSpacing: 2.4, textTransform: 'uppercase' },

    grid:     { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm },
    tileWrap: { width: '47.5%' },
    tile: {
        borderRadius: R.xxl, borderWidth: 1, borderColor: C.goldBorder,
        padding: S.lg, alignItems: 'center', gap: S.xs,
    },
    tileEmoji: { fontSize: 30, marginBottom: S.xs },
    tileName:  { fontSize: T.sm, fontWeight: W.xbold, color: C.text, textAlign: 'center', letterSpacing: -0.2 },
    tileDate:  { fontSize: T.nano, color: C.textMuted, fontWeight: W.semi },

    lockedList: {
        backgroundColor: C.surface, borderRadius: R.xxl,
        borderWidth: 1, borderColor: C.border, overflow: 'hidden',
    },
    lockedItem: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: S.lg, paddingVertical: S.md + 2,
        borderBottomWidth: 1, borderBottomColor: C.border, gap: S.md,
    },
    lockedLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: S.md },
    lockIcon: {
        width: 26, height: 26, borderRadius: R.sm,
        backgroundColor: Colors.overlay,
        borderWidth: 1, borderColor: C.border,
        alignItems: 'center', justifyContent: 'center',
    },
    lockedText:     { flex: 1, gap: 2 },
    lockedName:     { fontSize: T.sm, fontWeight: W.bold, color: C.textSub },
    lockedProgress: { fontSize: T.micro, color: C.textMuted, fontWeight: W.med },
    lockedBar: {
        width: 52, height: 3, backgroundColor: Colors.overlayWhite06,
        borderRadius: R.full, overflow: 'hidden',
    },
    lockedBarFill: {
        height: '100%', borderRadius: R.full,
        backgroundColor: C.ember, opacity: 0.65,
    },
});

// ─── CARD WRAPPER ─────────────────────────────────────────────────────────────
// ─── Ploppy AI Weekly Summary ────────────────────────────────────────────────

function getWeekStats(entries: Entry[]) {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
    startOfWeek.setHours(0, 0, 0, 0);

    const weekEntries = entries.filter(e => {
        const d = new Date(e.date);
        return d >= startOfWeek && d <= now;
    });

    const sportEntries = weekEntries.filter(e => ['home', 'run', 'beatsaber', 'custom'].includes(e.type));
    const runEntries = weekEntries.filter((e): e is RunEntry => e.type === 'run');

    const totalWorkouts = sportEntries.length;
    const totalDistance = runEntries.reduce((s, e) => s + (e.distanceKm || 0), 0);
    const totalDuration = sportEntries.reduce((s, e) => {
        if ('durationMinutes' in e && typeof e.durationMinutes === 'number') return s + e.durationMinutes;
        return s;
    }, 0);
    const totalReps = weekEntries
        .filter((e): e is HomeWorkoutEntry => e.type === 'home')
        .reduce((s, e) => s + (e.totalReps || 0), 0);

    const activeDays = new Set(sportEntries.map(e => e.date)).size;
    const typeBreakdown: Record<string, number> = {};
    sportEntries.forEach(e => { typeBreakdown[e.type] = (typeBreakdown[e.type] || 0) + 1; });

    return { totalWorkouts, totalDistance, totalDuration, totalReps, activeDays, typeBreakdown };
}

function PloppyWeeklySummary({ entries, settings }: {
    entries: Entry[];
    settings: { aiFeaturesEnabled?: boolean; aiProgressEnabled?: boolean; aiModel?: string; aiTone?: string };
}) {
    const { t } = useTranslation();
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [connected, setConnected] = useState(false);

    const weekStats = useMemo(() => getWeekStats(entries), [entries]);

    const fetchSummary = useCallback(async (force: boolean = false) => {
        if (!settings.aiFeaturesEnabled) return;
        if (!settings.aiProgressEnabled || !connected) return;
        if (weekStats.totalWorkouts === 0) return;

        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay() + (weekStart.getDay() === 0 ? -6 : 1));
        const weekKey = weekStart.toISOString().slice(0,10);
        const cacheKey = `aiSummary:${weekKey}:${settings.aiModel || 'openai'}:${i18n.language}:${settings.aiTone || 'neutral'}`;
        if (!force) {
            const cached = await storageHelpers.getString(cacheKey) as string | null;
            if (cached) {
                setAnalysis(cached);
                return;
            }
        }

        setLoading(true);
        setError(false);
        try {
            const lang = ({ fr: 'français', it: 'italiano', de: 'Deutsch' } as Record<string, string>)[i18n.language] ?? 'English';
            const toneDesc = settings.aiTone === 'technical'
                ? 'Use a precise, technical tone.'
                : settings.aiTone === 'warm'
                ? 'Use a very warm and encouraging tone.'
                : 'Use a neutral balanced tone.';
            const statsLines: string[] = [];
            statsLines.push(`Active days this week: ${weekStats.activeDays}/7`);
            statsLines.push(`Total workouts: ${weekStats.totalWorkouts}`);
            if (weekStats.totalDuration > 0) statsLines.push(`Total duration: ${weekStats.totalDuration} min`);
            if (weekStats.totalDistance > 0) statsLines.push(`Total distance: ${weekStats.totalDistance.toFixed(1)} km`);
            if (weekStats.totalReps > 0) statsLines.push(`Total reps: ${weekStats.totalReps}`);
            const breakdown = Object.entries(weekStats.typeBreakdown)
                .map(([type, count]) => `${type}: ${count}`)
                .join(', ');
            if (breakdown) statsLines.push(`Activity breakdown: ${breakdown}`);

            const systemPrompt = `You are Ploppy, a motivating and friendly fitness coach. ${toneDesc} You write weekly workout summaries. Respond in ${lang}. Keep it concise (3-5 sentences). Use 1-2 emojis.`;
            const userPrompt = `Here are my pre-calculated weekly stats:\n\n${statsLines.join('\n')}\n\nWrite a brief, motivating weekly summary. Mention specific numbers. End with one tip for next week.`;

            const result = await generateTextAnalysis({
                systemPrompt,
                userPrompt,
                model: settings.aiModel || 'openai',
            });
            setAnalysis(result);
            await storageHelpers.setString(cacheKey, result);
        } catch (error) {
            if (__DEV__) {
                console.warn('[Progress] Weekly AI summary failed', error);
            }
            setError(true);
        } finally {
            setLoading(false);
        }
    }, [settings.aiFeaturesEnabled, settings.aiProgressEnabled, connected, weekStats, settings.aiModel, settings.aiTone]);

    useEffect(() => {
        if (!settings.aiFeaturesEnabled) {
            setConnected(false);
            return;
        }
        void isPollinationConnected()
            .then(setConnected)
            .catch((error) => {
                if (__DEV__) {
                    console.warn('[Progress] Pollination connectivity check failed', error);
                }
                setConnected(false);
            });
    }, [settings.aiFeaturesEnabled]);

    useEffect(() => {
        fetchSummary();
    }, [fetchSummary]);


    if (!settings.aiFeaturesEnabled || !settings.aiProgressEnabled) return null;

    if (!connected) {
        return (
            <CardWrap delay={180} accent={C.violet + '35'}>
                <CardTitle
                    icon={<Bot size={14} color={C.violet} strokeWidth={2} />}
                    label={t('progress.ai.title')}
                    color={C.violet}
                />
                <Text style={ploppyStyles.disabledText}>{t('progress.ai.connectRequired')}</Text>
            </CardWrap>
        );
    }

    if (weekStats.totalWorkouts === 0) {
        return (
            <CardWrap delay={180} accent={C.violet + '35'}>
                <CardTitle
                    icon={<Bot size={14} color={C.violet} strokeWidth={2} />}
                    label={t('progress.ai.title')}
                    color={C.violet}
                />
                <Text style={ploppyStyles.disabledText}>{t('progress.ai.noData')}</Text>
            </CardWrap>
        );
    }

    return (
        <CardWrap delay={180} accent={C.violet + '35'}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <CardTitle
                icon={<Bot size={14} color={C.violet} strokeWidth={2} />}
                label={t('progress.ai.title')}
                color={C.violet}
              />
              {analysis && !loading && !error && (
                <TouchableOpacity
                  onPress={() => fetchSummary(true)}
                  style={ploppyStyles.regenBtn}
                  accessibilityLabel={t('progress.ai.regenerate')}
                >
                  <RefreshCw size={16} color={C.violet} />
                </TouchableOpacity>
              )}
            </View>
            {loading ? (
                <View style={ploppyStyles.loadingRow}>
                    <Activity size={16} color={C.violet} />
                    <Text style={ploppyStyles.loadingText}>{t('progress.ai.loading')}</Text>
                </View>
            ) : error ? (
                <Text style={ploppyStyles.errorText}>{t('progress.ai.error')}</Text>
            ) : analysis ? (
                <Text style={ploppyStyles.analysisText}>{analysis}</Text>
            ) : null}
        </CardWrap>
    );
}

const ploppyStyles = StyleSheet.create({
    disabledText: { fontSize: T.sm, color: C.textMuted, lineHeight: T.sm * 1.5 },
    hintText: { fontSize: T.xs, color: C.textMuted, marginTop: S.xs },
    regenBtn: { padding: S.xs, borderRadius: R.full, backgroundColor: C.surfaceHigh },
    loadingRow: { flexDirection: 'row', alignItems: 'center', gap: S.sm, paddingVertical: S.sm },
    loadingText: { fontSize: T.sm, color: C.textMuted },
    errorText: { fontSize: T.sm, color: C.error },
    analysisText: { fontSize: T.sm, color: C.textSub, lineHeight: T.sm * 1.7, fontStyle: 'italic' },
});

// ─── Shared Card Wrappers ─────────────────────────────────────────────────────

function CardWrap({ children, delay = 0, accent }: {
    children: React.ReactNode; delay?: number; accent?: string;
}) {
    return (
        <Animated.View entering={FadeInDown.delay(delay).springify()}
            style={[crd.card, accent && { borderColor: accent }]}>
            {children}
        </Animated.View>
    );
}

function CardTitle({ icon, label, color = C.ember }: {
    icon: React.ReactNode; label: string; color?: string;
}) {
    return (
        <View style={crd.titleRow}>
            <View style={[crd.iconBox, { backgroundColor: color + '18' }]}>{icon}</View>
            <Text style={crd.titleText}>{label}</Text>
        </View>
    );
}

const crd = StyleSheet.create({
    card: {
        backgroundColor: C.surface, borderRadius: R.xxxl,
        borderWidth: 1, borderColor: C.border,
        padding: S.xl, marginBottom: S.sm, overflow: 'hidden',
        shadowColor: Colors.black, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.22, shadowRadius: 12, elevation: 6,
    },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: S.sm, marginBottom: S.lg },
    iconBox:  { width: 28, height: 28, borderRadius: R.md, alignItems: 'center', justifyContent: 'center' },
    titleText: { fontSize: T.md, fontWeight: W.xbold, color: C.text, letterSpacing: -0.2 },
});

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
export default function ProgressScreen() {
    const { entries, settings, unlockedBadges, getStreak, getMonthlyStats, getSportEntries } = useAppStore();
    const { t } = useTranslation();

    const streak       = getStreak();
    const monthlyStats = getMonthlyStats();
    const sportEntries = getSportEntries();

    const totalWorkouts = sportEntries.length;
    const totalDistance = sportEntries
        .filter(e => e.type === 'run')
        .reduce((s, e) => s + (e.type === 'run' ? e.distanceKm : 0), 0);
    const totalDuration = sportEntries.reduce((s, e) => {
        if (e.type === 'run' || e.type === 'beatsaber') return s + e.durationMinutes;
        return s;
    }, 0);

    const relevantMonths = useMemo(
        () => monthlyStats.filter(s => s.count > 0).slice(-6),
        [monthlyStats]
    );
    const chartData  = useMemo(
        () => relevantMonths.map(s => ({ label: s.month.slice(5), value: s.count })),
        [relevantMonths]
    );
    const maxValue   = Math.max(...chartData.map(d => d.value), 1);
    const badges     = useMemo(() => getBadgesWithState(unlockedBadges), [unlockedBadges]);

    const badgeProgress = useMemo(() => {
        const map: Record<string, { current: number; target: number; label: string }> = {};
        const add = (id: string, cur: number, tgt: number, lbl: string) => {
            if (!badges.find(b => b.id === id)?.unlockedAt) {
                map[id] = { current: cur, target: tgt, label: lbl };
            }
        };
        add('first_workout', totalWorkouts, 1,   `${totalWorkouts}/1`);
        add('streak_7',      streak.current, 7,   `${streak.current}/7 ${t('common.daysShort','j')}`);
        add('streak_30',     streak.current, 30,  `${streak.current}/30 ${t('common.daysShort','j')}`);
        add('workouts_10',   totalWorkouts, 10,   `${totalWorkouts}/10`);
        add('workouts_50',   totalWorkouts, 50,   `${totalWorkouts}/50`);
        add('workouts_100',  totalWorkouts, 100,  `${totalWorkouts}/100`);
        add('runner_10km',   totalDistance, 10,   `${totalDistance.toFixed(1)}/10 km`);
        add('runner_50km',   totalDistance, 50,   `${totalDistance.toFixed(1)}/50 km`);
        return map;
    }, [badges, totalWorkouts, totalDistance, streak, t]);

    const weightHistory = useMemo(
        () => entries
            .filter((e): e is MeasureEntry => e.type === 'measure' && e.weight !== undefined)
            .slice(0, 10).reverse(),
        [entries]
    );

    const personalRecords = useMemo(() => {
        const tracked = [
            { id: 'pushups',       name: t('repCounter.exercises.pushups', 'Pompes'),       icon: '💪', type: 'reps' as const },
            { id: 'situps',        name: t('repCounter.exercises.situps', 'Abdos'),          icon: '🔥', type: 'reps' as const },
            { id: 'squats',        name: t('repCounter.exercises.squats', 'Squats'),         icon: '🦵', type: 'reps' as const },
            { id: 'jumpingJacks', name: t('repCounter.exercises.jumpingJacks', 'J. Jacks'), icon: '⭐', type: 'reps' as const },
            { id: 'plank',         name: t('repCounter.exercises.plank', 'Gainage'),         icon: '🧘', type: 'time' as const },
        ];
        return tracked.reduce<{ id: string; name: string; icon: string; value: string }[]>((acc, ex) => {
            const relevant = entries.filter((e): e is HomeWorkoutEntry =>
                e.type === 'home' && (
                    e.exercises.toLowerCase().includes(`${ex.id.toLowerCase()}:`) ||
                    (e.name?.toLowerCase().includes(ex.name.toLowerCase()) ?? false)
                )
            );
            let best = 0;
            for (const w of relevant) {
                const v = ex.type === 'time' ? (w.durationMinutes ?? 0) * 60 : (w.totalReps ?? 0);
                if (v > best) best = v;
            }
            if (best > 0) {
                acc.push({
                    id: ex.id, name: ex.name, icon: ex.icon,
                    value: ex.type === 'time' ? `${best}s` : `${best} reps`,
                });
            }
            return acc;
        }, []);
    }, [entries, t]);

    const topExercise = useMemo(() => {
        const m = new Date().toISOString().slice(0, 7);
        const counts: Record<string, number> = {};
        entries
            .filter((e): e is HomeWorkoutEntry => e.type === 'home' && e.date.startsWith(m))
            .forEach(w => w.exercises.split('\n').forEach(line => {
                const match = line.match(/^([^:]+):/);
                if (match) {
                    const n = match[1].trim().toLowerCase();
                    counts[n] = (counts[n] || 0) + 1;
                }
            }));
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        return sorted.length > 0 ? { name: sorted[0][0], count: sorted[0][1] } : null;
    }, [entries]);

    const calendarData = useMemo(() => {
        const now = new Date();
        const y = now.getFullYear(), mo = now.getMonth();
        const daysInMonth    = new Date(y, mo + 1, 0).getDate();
        const startDayOfWeek = (new Date(y, mo, 1).getDay() + 6) % 7;
        const monthStr       = now.toISOString().slice(0, 7);
        const activeDays     = new Set(
            sportEntries
                .filter(e => e.date.startsWith(monthStr))
                .map(e => parseInt(e.date.slice(8, 10), 10))
        );
        return { daysInMonth, startDayOfWeek, activeDays, monthName: getMonthName(monthStr) };
    }, [sportEntries]);

    return (
        <SafeAreaView style={main.container} edges={['top']}>
            <ScrollView
                style={main.scroll}
                contentContainerStyle={main.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <Animated.View entering={FadeIn.delay(20)} style={main.titleBlock}>
                    <EyebrowLabel text={t('progress.eyebrow', 'TABLEAU DE BORD')} />
                    <Text style={main.titleMain}>{t('progress.title', 'Progression')}</Text>
                    <View style={main.titleAccent} />
                </Animated.View>

                {/* Streak */}
                <StreakCover current={streak.current} best={streak.best} />

                {/* AI Weekly Summary */}
                <PloppyWeeklySummary entries={entries} settings={settings} />

                {/* Stats */}
                <StatsSection
                    workouts={totalWorkouts}
                    distance={totalDistance}
                    duration={totalDuration}
                    goal={settings.weeklyGoal}
                />

                {/* Calendar */}
                <MonthCalendar {...calendarData} />

                {/* Bar chart */}
                <CardWrap delay={280}>
                    <CardTitle
                        icon={<TrendingUp size={14} color={C.ember} strokeWidth={2} />}
                        label={t('progress.workoutsPerMonth', 'Séances par mois')}
                    />
                    <WorkoutBarChart data={chartData} maxValue={maxValue} />
                </CardWrap>

                {/* Top exercise */}
                {topExercise && <TopExCard name={topExercise.name} count={topExercise.count} />}

                {/* Personal records */}
                <PersonalRecords records={personalRecords} />

                {/* Weight sparkline */}
                {weightHistory.length >= 2 && (
                    <CardWrap delay={440} accent={C.blueBorder}>
                        <CardTitle
                            icon={<Scale size={14} color={C.blue} strokeWidth={2} />}
                            label={t('progress.weightEvolution', 'Évolution du poids')}
                            color={C.blue}
                        />
                        <WeightSparkline data={weightHistory} />
                    </CardWrap>
                )}

                {/* Badges */}
                <BadgesGrid badges={badges} badgeProgress={badgeProgress} />

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const main = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    scroll:    { flex: 1 },
    content:   { paddingHorizontal: PAD, paddingTop: S.sm, paddingBottom: 120 },
    titleBlock: { marginTop: S.sm, marginBottom: S.xxl },
    titleMain: {
        fontSize: T.display, fontWeight: W.black, color: C.text,
        letterSpacing: -2, lineHeight: 52, marginTop: S.xs,
    },
    titleAccent: {
        marginTop: S.lg, height: 2, width: 40, borderRadius: R.full,
        backgroundColor: C.ember,
        shadowColor: C.ember, shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1, shadowRadius: 10, elevation: 4,
    },
});