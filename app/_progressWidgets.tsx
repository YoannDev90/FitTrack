import React, { useState } from 'react';
import {
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInLeft, FadeInRight } from 'react-native-reanimated';
import Svg, {
    Circle,
    Defs,
    G,
    Line,
    LinearGradient as SvgLinearGradient,
    Path,
    Rect,
    Stop,
    Text as SvgText,
} from 'react-native-svg';
import { Award, Calendar, Lock, Trophy, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import type { Badge, MeasureEntry } from '../src/types';
import { Colors } from '../src/constants';
import { C, PAD, R, S, SW, T, W } from './_progressTokens';

const EyebrowLabel = ({ text, color = C.textMuted }: { text: string; color?: string }) => (
    <Text style={{
        fontSize: T.nano,
        fontWeight: W.black,
        color,
        letterSpacing: 2.8,
        textTransform: 'uppercase',
    }}>
        {text}
    </Text>
);

export function WorkoutBarChart({ data, maxValue }: { data: { label: string; value: number }[]; maxValue: number }) {
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

                <Line
                    x1={0} y1={cH} x2={cW} y2={cH}
                    stroke={Colors.overlayWhite06} strokeWidth={1}
                />

                {data.map((item, i) => {
                    const x = SPACING + i * (BAR_W + SPACING);
                    const bH = item.value > 0
                        ? Math.max((item.value / max) * CHART_H, 8)
                        : 6;
                    const y = cH - bH;
                    const isHighlight = i === data.length - 1;
                    const fill = item.value > 0
                        ? (isHighlight ? 'url(#barActive)' : 'url(#barInactive)')
                        : 'url(#barInactive)';

                    return (
                        <G key={`${item.label}-${i}`}>
                            <Rect
                                x={x} y={y}
                                width={BAR_W} height={bH}
                                rx={BAR_W / 3}
                                fill={fill}
                            />
                            {isHighlight && item.value > 0 && (
                                <Rect
                                    x={x} y={y}
                                    width={BAR_W} height={Math.min(5, bH)}
                                    rx={BAR_W / 3}
                                    fill={C.ember}
                                    opacity={0.9}
                                />
                            )}
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

export function WeightSparkline({ data }: { data: MeasureEntry[] }) {
    const { t } = useTranslation();
    if (data.length < 2) return null;

    const weights = data.map(d => d.weight!);
    const minW = Math.min(...weights) - 2;
    const maxW = Math.max(...weights) + 2;
    const range = maxW - minW || 1;
    const cW = SW - PAD * 2 - S.xl * 2;
    const cH = 90;
    const pad = 16;
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
                <Path
                    d={lineD}
                    stroke="url(#wl)"
                    strokeWidth={2.5}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                {[pts[0], pts[pts.length - 1]].map((p, i) => (
                    <G key={`weight-point-${i}`}>
                        <Circle cx={p.x} cy={p.y} r={6} fill={C.blue} opacity={0.15} />
                        <Circle cx={p.x} cy={p.y} r={3.5} fill={C.blue} />
                        <Circle cx={p.x} cy={p.y} r={1.5} fill={C.bg} />
                        <SvgText x={p.x} y={p.y - 10} fontSize="11" fill={C.text} textAnchor="middle" fontWeight="800">
                            {p.w}
                        </SvgText>
                    </G>
                ))}
            </Svg>

            <View style={wsp.footer}>
                {[
                    { label: t('weight.first', 'Premier'), val: `${weights[0]} kg`, color: C.text },
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

export function TopExCard({ name, count }: { name: string; count: number }) {
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

export function PersonalRecords({ records }: { records: { id: string; name: string; icon: string; value: string }[] }) {
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
                        <TouchableOpacity style={bmo.closeBtn} onPress={onClose}>
                            <X size={16} color={C.textMuted} strokeWidth={2.5} />
                        </TouchableOpacity>

                        <Text style={bmo.emoji}>{badge.icon || '🏅'}</Text>

                        <View style={[
                            bmo.statusPill,
                            {
                                backgroundColor: isUnlocked ? C.goldSoft : Colors.overlayWhite05,
                                borderColor: isUnlocked ? C.goldBorder : C.border,
                            },
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

                        <Text style={bmo.name}>{t(badge.name, { defaultValue: badge.id })}</Text>

                        <Text style={bmo.desc}>
                            {t(badge.description, {
                                defaultValue: t('badge.noDesc', 'Complète des objectifs pour débloquer ce badge.'),
                            })}
                        </Text>

                        {dateStr && (
                            <View style={bmo.dateRow}>
                                <Calendar size={12} color={C.textMuted} strokeWidth={2} />
                                <Text style={bmo.dateText}>
                                    {t('badge.unlockedOn', 'Débloqué le')} {dateStr}
                                </Text>
                            </View>
                        )}

                        <TouchableOpacity
                            style={[
                                bmo.cta,
                                {
                                    backgroundColor: isUnlocked ? C.goldSoft : C.emberGlow,
                                    borderColor: isUnlocked ? C.goldBorder : C.emberBorder,
                                },
                            ]}
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

export function BadgesGrid({ badges, badgeProgress }: {
    badges: Badge[];
    badgeProgress: Record<string, { current: number; target: number; label: string }>;
}) {
    const { t } = useTranslation();
    const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

    const unlocked = badges.filter(b => b.unlockedAt);
    const locked = badges.filter(b => !b.unlockedAt);
    const pct = badges.length > 0 ? Math.round((unlocked.length / badges.length) * 100) : 0;

    return (
        <Animated.View entering={FadeInDown.delay(460).springify()}>
            <View style={bdg.header}>
                <View style={bdg.headerLeft}>
                    <Text style={bdg.title}>{t('progress.badges', 'Badges')}</Text>
                    <Text style={bdg.sub}>
                        {unlocked.length}/{badges.length} {t('badges.unlocked', 'débloqués')}
                    </Text>
                </View>
                <View style={bdg.pctPill}>
                    <View style={bdg.pctTrack}>
                        <LinearGradient
                            colors={[C.gold, C.amber]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[bdg.pctFill, { width: `${pct}%` as `${number}%` }]}
                        />
                    </View>
                    <Text style={bdg.pctText}>{pct}%</Text>
                </View>
            </View>

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
                                <TouchableOpacity activeOpacity={0.75} onPress={() => setSelectedBadge(badge)}>
                                    <LinearGradient colors={[Colors.overlayGold14, C.surface]} style={bdg.tile}>
                                        <Text style={bdg.tileEmoji}>{badge.icon || '🏅'}</Text>
                                        <Text style={bdg.tileName}>{t(badge.name, { defaultValue: badge.id })}</Text>
                                        <Text style={bdg.tileDate}>
                                            {badge.unlockedAt
                                                ? new Date(badge.unlockedAt).toLocaleDateString('fr-FR', {
                                                    day: 'numeric',
                                                    month: 'short',
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
                            const progPct = progress ? Math.min((progress.current / progress.target) * 100, 100) : 0;
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

            <BadgeModal badge={selectedBadge} onClose={() => setSelectedBadge(null)} />
        </Animated.View>
    );
}

const wsp = StyleSheet.create({
    footer: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: S.lg, marginTop: S.lg, paddingTop: S.lg,
        borderTopWidth: 1, borderTopColor: C.border,
    },
    footerItem: { alignItems: 'center', gap: 2 },
    footerLabel: { fontSize: T.micro, color: C.textMuted, fontWeight: W.semi, letterSpacing: 0.3 },
    footerVal: { fontSize: T.md, fontWeight: W.black, color: C.text, letterSpacing: -0.3 },
    footerSep: { width: 1, height: 24, backgroundColor: C.border },
});

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
    right: { alignItems: 'center' },
    count: { fontSize: 44, fontWeight: W.black, color: C.gold, lineHeight: 46, letterSpacing: -2 },
    countLabel: { fontSize: T.xs, color: C.textMuted, fontWeight: W.semi },
    iconAbs: { position: 'absolute', right: S.lg, top: '50%', transform: [{ translateY: -32 }] },
});

const prc = StyleSheet.create({
    wrap: { marginBottom: S.sm },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: S.sm, marginBottom: S.lg },
    title: { fontSize: T.xl, fontWeight: W.black, color: C.text, letterSpacing: -0.4 },
    scroll: { gap: S.sm, paddingBottom: S.xs },
    card: {
        width: 106, borderRadius: R.xxl, borderWidth: 1, borderColor: C.goldBorder,
        padding: S.lg, alignItems: 'center', gap: S.xs,
        shadowColor: C.gold, shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.10, shadowRadius: 8, elevation: 3,
    },
    emoji: { fontSize: 28, marginBottom: S.xs },
    recVal: { fontSize: T.lg, fontWeight: W.black, color: C.gold, letterSpacing: -0.4 },
    recName: { fontSize: T.micro, color: C.textMuted, fontWeight: W.semi, textAlign: 'center', lineHeight: 14 },
});

const bmo = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: Colors.overlayBlack75,
        alignItems: 'center',
        justifyContent: 'center',
        padding: PAD,
    },
    sheet: {
        width: '100%',
        maxWidth: 340,
        borderRadius: R.xxxl,
        borderWidth: 1,
        borderColor: C.borderUp,
        overflow: 'hidden',
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.5,
        shadowRadius: 40,
        elevation: 20,
    },
    grad: { padding: S.xxl, alignItems: 'center', gap: S.md },
    closeBtn: {
        alignSelf: 'flex-end',
        width: 30,
        height: 30,
        borderRadius: R.full,
        backgroundColor: Colors.overlayWhite06,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: S.sm,
    },
    emoji: { fontSize: 56, marginBottom: S.xs },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: S.xs,
        borderWidth: 1,
        borderRadius: R.full,
        paddingHorizontal: S.md,
        paddingVertical: 5,
    },
    statusText: { fontSize: T.xs, fontWeight: W.bold },
    name: {
        fontSize: T.xl,
        fontWeight: W.black,
        color: C.text,
        textAlign: 'center',
        letterSpacing: -0.4,
    },
    desc: {
        fontSize: T.sm,
        color: C.textSub,
        textAlign: 'center',
        lineHeight: 20,
        fontWeight: W.reg,
    },
    dateRow: { flexDirection: 'row', alignItems: 'center', gap: S.xs, marginTop: S.xs },
    dateText: { fontSize: T.xs, color: C.textMuted, fontWeight: W.med },
    cta: {
        marginTop: S.md,
        paddingHorizontal: S.xxl,
        paddingVertical: S.md,
        borderRadius: R.full,
        borderWidth: 1,
    },
    ctaText: { fontSize: T.sm, fontWeight: W.bold },
});

const bdg = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: S.xl,
    },
    headerLeft: { gap: 3 },
    title: { fontSize: T.xl, fontWeight: W.black, color: C.text, letterSpacing: -0.4 },
    sub: { fontSize: T.xs, color: C.textMuted, fontWeight: W.med },
    pctPill: {
        alignItems: 'center',
        gap: S.xs,
        backgroundColor: C.surface,
        borderWidth: 1,
        borderColor: C.goldBorder,
        borderRadius: R.full,
        paddingHorizontal: S.md,
        paddingVertical: S.sm,
        minWidth: 80,
    },
    pctTrack: {
        width: 60,
        height: 2,
        backgroundColor: Colors.overlayWhite08,
        borderRadius: R.full,
        overflow: 'hidden',
    },
    pctFill: { height: '100%', borderRadius: R.full },
    pctText: { fontSize: T.xs, fontWeight: W.black, color: C.gold },
    sectionLabel: { flexDirection: 'row', alignItems: 'center', gap: S.sm, marginBottom: S.md },
    dot: { width: 5, height: 5, borderRadius: 3 },
    sectionText: { fontSize: T.micro, fontWeight: W.black, letterSpacing: 2.4, textTransform: 'uppercase' },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm },
    tileWrap: { width: '47.5%' },
    tile: {
        borderRadius: R.xxl,
        borderWidth: 1,
        borderColor: C.goldBorder,
        padding: S.lg,
        alignItems: 'center',
        gap: S.xs,
    },
    tileEmoji: { fontSize: 30, marginBottom: S.xs },
    tileName: { fontSize: T.sm, fontWeight: W.xbold, color: C.text, textAlign: 'center', letterSpacing: -0.2 },
    tileDate: { fontSize: T.nano, color: C.textMuted, fontWeight: W.semi },
    lockedList: {
        backgroundColor: C.surface,
        borderRadius: R.xxl,
        borderWidth: 1,
        borderColor: C.border,
        overflow: 'hidden',
    },
    lockedItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: S.lg,
        paddingVertical: S.md + 2,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
        gap: S.md,
    },
    lockedLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: S.md },
    lockIcon: {
        width: 26,
        height: 26,
        borderRadius: R.sm,
        backgroundColor: Colors.overlay,
        borderWidth: 1,
        borderColor: C.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    lockedText: { flex: 1, gap: 2 },
    lockedName: { fontSize: T.sm, fontWeight: W.bold, color: C.textSub },
    lockedProgress: { fontSize: T.micro, color: C.textMuted, fontWeight: W.med },
    lockedBar: {
        width: 52,
        height: 3,
        backgroundColor: Colors.overlayWhite06,
        borderRadius: R.full,
        overflow: 'hidden',
    },
    lockedBarFill: {
        height: '100%',
        borderRadius: R.full,
        backgroundColor: C.ember,
        opacity: 0.65,
    },
});
