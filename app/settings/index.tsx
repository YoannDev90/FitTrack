// ============================================================================
// SETTINGS MAIN SCREEN - Categories navigation
// ============================================================================

import React, { useState, useMemo, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Constants from 'expo-constants';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
    Settings as SettingsIcon, Database, ChevronRight, Sparkles,
    Bell, Palette, FlaskConical, Shield, HardDrive, Users,
    Code2, Languages, Dumbbell, Heart, Bot, ShieldAlert,
} from 'lucide-react-native';
import { useAppStore, useSocialStore } from '../../src/stores';
import { isSocialAvailable } from '../../src/services/supabase';
import { storageHelpers } from '../../src/storage';
import { LANGUAGES, getCurrentLanguage } from '../../src/i18n';
import { Colors, ScreenPalettes } from '../../src/constants';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = ScreenPalettes.cool;
const S = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, xxxl: 44 };
const R = { sm: 6, md: 10, lg: 14, xl: 18, xxl: 22, xxxl: 32, full: 999 };
const T = { nano: 9, micro: 10, xs: 11, sm: 13, md: 15, lg: 17, xl: 20, xxl: 26, xxxl: 34 };
const W = { light:'300', reg:'400', med:'500', semi:'600', bold:'700', xbold:'800', black:'900' } as const;

// ─── Section Label ────────────────────────────────────────────────────────────
function SectionLabel({ title, delay = 0 }: { title: string; delay?: number }) {
    return (
        <Animated.View entering={FadeIn.delay(delay)} style={s.sectionLabelRow}>
            <Text style={s.sectionLabel}>{title}</Text>
            <View style={s.sectionLabelLine} />
        </Animated.View>
    );
}

// ─── Category Row ─────────────────────────────────────────────────────────────
function CategoryRow({
    icon, iconColor, title, subtitle, onPress, delay = 0, badge, isLast = false,
}: {
    icon: React.ReactNode;
    iconColor: string;
    title: string;
    subtitle?: string;
    onPress: () => void;
    delay?: number;
    badge?: string;
    isLast?: boolean;
}) {
    return (
        <Animated.View entering={FadeInDown.delay(delay)}>
            <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={s.row}>
                <View style={[s.rowIcon, { backgroundColor: `${iconColor}18`, borderColor: `${iconColor}28` }]}>
                    {icon}
                </View>
                <View style={s.rowInfo}>
                    <Text style={s.rowTitle}>{title}</Text>
                    {subtitle && <Text style={s.rowSub} numberOfLines={1}>{subtitle}</Text>}
                </View>
                {badge && (
                    <View style={s.badge}>
                        <Text style={s.badgeText}>{badge}</Text>
                    </View>
                )}
                <ChevronRight size={16} color={C.textMuted} strokeWidth={2} />
            </TouchableOpacity>
            {!isLast && <View style={s.rowDivider} />}
        </Animated.View>
    );
}

// ─── Settings Group (card) ────────────────────────────────────────────────────
function SettingsGroup({
    children, accentColor, delay = 0,
}: {
    children: React.ReactNode;
    accentColor?: string;
    delay?: number;
}) {
    return (
        <Animated.View
            entering={FadeInDown.delay(delay)}
            style={[s.group, accentColor && { borderColor: `${accentColor}28` }]}
        >
            <LinearGradient colors={[C.surfaceUp, C.surface]} style={StyleSheet.absoluteFill} />
            {children}
        </Animated.View>
    );
}

// ─── Stats Hero ───────────────────────────────────────────────────────────────
function StatsHero({ sportCount, mealCount, measureCount, labels }: {
    sportCount: number; mealCount: number; measureCount: number;
    labels: { title: string; sessions: string; meals: string; measures: string };
}) {
    const items = [
        { value: sportCount,  label: labels.sessions },
        { value: mealCount,   label: labels.meals },
        { value: measureCount,label: labels.measures },
    ];

    return (
        <Animated.View entering={FadeInDown.delay(80).springify()} style={s.statsHero}>
            <LinearGradient
                colors={[C.emberGlow, Colors.transparent]}
                style={StyleSheet.absoluteFill}
            />
            {/* Header */}
            <View style={s.statsHeader}>
                <View style={s.statsIconWrap}>
                    <Database size={14} color={C.ember} strokeWidth={2.2} />
                </View>
                <Text style={s.statsTitle}>{labels.title}</Text>
            </View>
            {/* Stats */}
            <View style={s.statsRow}>
                {items.map((item, i) => (
                    <React.Fragment key={`${item.label}-${i}`}>
                        <View style={s.statItem}>
                            <Text style={s.statValue}>{item.value}</Text>
                            <Text style={s.statLabel}>{item.label}</Text>
                        </View>
                        {i < items.length - 1 && <View style={s.statSep} />}
                    </React.Fragment>
                ))}
            </View>
        </Animated.View>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function SettingsMainScreen() {
    const { t } = useTranslation();
    const { entries, settings } = useAppStore();
    const { socialEnabled } = useSocialStore();
    const [tapCount, setTapCount] = useState(0);
    const currentLang = getCurrentLanguage();

    const stats = useMemo(() => ({
        sport:   entries.filter(e => ['home','run','beatsaber'].includes(e.type)).length,
        meal:    entries.filter(e => e.type === 'meal').length,
        measure: entries.filter(e => e.type === 'measure').length,
    }), [entries]);

    const handleAboutTap = useCallback(() => {
        const n = tapCount + 1;
        setTapCount(n);
        if (n >= 10 && !settings.developerMode) {
            useAppStore.getState().updateSettings({ developerMode: true });
            Alert.alert('🔓 Mode développeur', 'Tu as débloqué le mode développeur !');
            setTapCount(0);
        }
        setTimeout(() => setTapCount(0), 3000);
    }, [tapCount, settings.developerMode]);

    return (
        <SafeAreaView style={s.root} edges={['top']}>
            <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

                {/* ── Header ── */}
                <Animated.View entering={FadeIn.delay(40)} style={s.header}>
                    <View>
                        <Text style={s.eyebrow}>{t('settings.eyebrow', 'SPIX')}</Text>
                        <Text style={s.title}>{t('settings.title')}</Text>
                    </View>
                    <View style={s.headerIconWrap}>
                        <SettingsIcon size={20} color={C.ember} strokeWidth={2} />
                    </View>
                </Animated.View>

                {/* ── Stats Hero ── */}
                <StatsHero
                    sportCount={stats.sport}
                    mealCount={stats.meal}
                    measureCount={stats.measure}
                    labels={{
                        title:    t('settings.yourData'),
                        sessions: t('settings.sessions'),
                        meals:    t('settings.meals'),
                        measures: t('settings.measures'),
                    }}
                />

                {/* ── Social ── */}
                {isSocialAvailable() && (
                    <>
                        <SectionLabel title={t('settings.social')} delay={120} />
                        <SettingsGroup delay={130}>
                            <CategoryRow
                                icon={<Users size={19} color={C.teal} strokeWidth={2.2} />}
                                iconColor={C.teal}
                                title={t('settings.socialFeatures')}
                                subtitle={socialEnabled ? t('settings.socialEnabled') : t('settings.socialDisabled')}
                                onPress={() => router.push('/settings/social')}
                                badge={socialEnabled ? '✓' : undefined}
                                delay={140}
                                isLast
                            />
                        </SettingsGroup>
                    </>
                )}

                {/* ── Preferences ── */}
                <SectionLabel title={t('settings.preferences')} delay={150} />
                <SettingsGroup delay={160}>
                    <CategoryRow
                        icon={<Sparkles size={19} color={C.gold} strokeWidth={2.2} />}
                        iconColor={C.gold}
                        title={t('settings.preferences')}
                        subtitle={t('settings.preferencesDesc')}
                        onPress={() => router.push('/settings/preferences')}
                        delay={165}
                    />
                    <CategoryRow
                        icon={<Bell size={19} color={C.blue} strokeWidth={2.2} />}
                        iconColor={C.blue}
                        title={t('settings.notifications')}
                        subtitle={t('settings.notificationsDesc')}
                        onPress={() => router.push('/settings/notifications')}
                        delay={175}
                    />
                    <CategoryRow
                        icon={<Palette size={19} color={C.violet} strokeWidth={2.2} />}
                        iconColor={C.violet}
                        title={t('settings.appearance')}
                        subtitle={t('settings.appearanceDesc')}
                        onPress={() => router.push('/settings/appearance')}
                        delay={185}
                    />
                    <CategoryRow
                        icon={<Languages size={19} color={C.green} strokeWidth={2.2} />}
                        iconColor={C.green}
                        title={t('settings.language')}
                        subtitle={`${LANGUAGES[currentLang].flag} ${LANGUAGES[currentLang].nativeName}`}
                        onPress={() => router.push('/settings/language')}
                        delay={195}
                    />
                    <CategoryRow
                        icon={<Bot size={19} color={C.violet} strokeWidth={2.2} />}
                        iconColor={C.violet}
                        title={t('settings.aiTab')}
                        subtitle={t('settings.aiTabDesc')}
                        onPress={() => router.push('/settings/ai')}
                        badge="BÊTA"
                        delay={205} isLast
                    />
                </SettingsGroup>

                {/* ── Activity & Health ── */}
                <SectionLabel title={t('settings.integration')} delay={210} />
                <SettingsGroup delay={220}>
                    <CategoryRow
                        icon={<Dumbbell size={19} color={C.violet} strokeWidth={2.2} />}
                        iconColor={C.violet}
                        title={t('settings.manageSports')}
                        subtitle={t('settings.manageSportsDesc')}
                        onPress={() => router.push('/settings/sports')}
                        delay={225}
                    />
                    <CategoryRow
                        icon={<Heart size={19} color={C.emberMid} strokeWidth={2.2} />}
                        iconColor={C.emberMid}
                        title={t('settings.healthConnect')}
                        subtitle={t('settings.healthConnectDesc')}
                        onPress={() => router.push('/health-connect')}
                        delay={235}
                    />
                    <CategoryRow
                        icon={<ShieldAlert size={19} color={C.green} strokeWidth={2.2} />}
                        iconColor={C.green}
                        title={t('settings.safety.title')}
                        subtitle={t('settings.safety.contacts')}
                        onPress={() => router.push('/settings/safety')}
                        delay={245} isLast
                    />
                </SettingsGroup>

                {/* ── Data & System ── */}
                <SectionLabel title={t('settings.data')} delay={260} />
                <SettingsGroup delay={270}>
                    <CategoryRow
                        icon={<HardDrive size={19} color={C.ember} strokeWidth={2.2} />}
                        iconColor={C.ember}
                        title={t('settings.data')}
                        subtitle={t('settings.dataDesc')}
                        onPress={() => router.push('/settings/data')}
                        delay={275}
                    />
                    <CategoryRow
                        icon={<FlaskConical size={19} color={C.violet} strokeWidth={2.2} />}
                        iconColor={C.violet}
                        title={t('settings.labs')}
                        subtitle={t('settings.labsDesc')}
                        onPress={() => router.push('/settings/labs')}
                        delay={285}
                    />
                    <CategoryRow
                        icon={<Shield size={19} color={C.green} strokeWidth={2.2} />}
                        iconColor={C.green}
                        title={t('settings.legal')}
                        subtitle={t('settings.legalDesc')}
                        onPress={() => router.push('/settings/legal')}
                        delay={295}
                        isLast={!settings.developerMode}
                    />
                    {settings.developerMode && (
                        <CategoryRow
                            icon={<Code2 size={19} color={Colors.orange} strokeWidth={2.2} />}
                            iconColor={Colors.orange}
                            title={t('settings.developerMode')}
                            subtitle={t('settings.developerModeDesc')}
                            onPress={() => router.push('/settings/developer')}
                            delay={305} isLast
                        />
                    )}
                </SettingsGroup>

                {/* ── About ── */}
                <SectionLabel title={t('settings.about')} delay={370} />
                <Animated.View entering={FadeInDown.delay(380).springify().damping(22)} style={s.aboutCard}>
                    <LinearGradient colors={[C.surfaceUp, C.surface]} style={StyleSheet.absoluteFill} />
                    <TouchableOpacity onPress={handleAboutTap} activeOpacity={0.8} style={s.about}>
                        <View style={s.aboutIconWrap}>
                            <Sparkles size={24} color={C.ember} strokeWidth={2} />
                        </View>
                        <View style={s.aboutInfo}>
                            <Text style={s.appName}>Spix</Text>
                            <Text style={s.appVersion}>
                                {t('settings.version', { version: Constants.default.expoConfig?.version ?? '3.0.0' })}
                            </Text>
                        </View>
                        <View style={s.storageChip}>
                            <Database size={11} color={C.textMuted} />
                            <Text style={s.storageText}>{storageHelpers.getStorageType()}</Text>
                        </View>
                    </TouchableOpacity>
                </Animated.View>

                <View style={{ height: 60 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    root:   { flex: 1, backgroundColor: C.bg },
    scroll: { paddingHorizontal: S.lg, paddingTop: S.lg, paddingBottom: 100 },

    // Header
    header: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: S.xl,
    },
    eyebrow: {
        fontSize: T.micro, fontWeight: W.black,
        color: C.ember, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 2,
    },
    title: {
        fontSize: T.xxxl, fontWeight: W.black,
        color: C.text, letterSpacing: -1.2,
    },
    headerIconWrap: {
        width: 42, height: 42, borderRadius: R.xl,
        backgroundColor: C.emberGlow, borderWidth: 1, borderColor: C.emberBorder,
        justifyContent: 'center', alignItems: 'center',
    },

    // Stats Hero
    statsHero: {
        borderRadius: R.xxl, overflow: 'hidden',
        borderWidth: 1, borderColor: C.emberBorder,
        padding: S.xl, marginBottom: S.xxl,
    },
    statsHeader: { flexDirection: 'row', alignItems: 'center', gap: S.sm, marginBottom: S.lg },
    statsIconWrap: {
        width: 26, height: 26, borderRadius: R.sm,
        backgroundColor: C.emberGlow, borderWidth: 1, borderColor: C.emberBorder,
        justifyContent: 'center', alignItems: 'center',
    },
    statsTitle: { fontSize: T.sm, fontWeight: W.bold, color: C.text },
    statsRow:   { flexDirection: 'row', alignItems: 'center' },
    statItem:   { flex: 1, alignItems: 'center' },
    statValue: {
        fontSize: T.xxl, fontWeight: W.black,
        color: C.text, letterSpacing: -0.5,
    },
    statLabel: {
        fontSize: T.xs, fontWeight: W.semi,
        color: C.textMuted, marginTop: 2,
        textTransform: 'uppercase', letterSpacing: 0.5,
    },
    statSep: { width: 1, height: 36, backgroundColor: C.border },

    // Section label
    sectionLabelRow: {
        flexDirection: 'row', alignItems: 'center',
        gap: S.sm, marginBottom: S.sm, marginTop: S.lg,
    },
    sectionLabel: {
        fontSize: T.nano, fontWeight: W.black,
        color: C.textMuted, letterSpacing: 2.5, textTransform: 'uppercase',
    },
    sectionLabelLine: { flex: 1, height: 1, backgroundColor: C.border },

    // Group (card)
    group: {
        borderRadius: R.xxl, overflow: 'hidden',
        borderWidth: 1, borderColor: C.border,
        marginBottom: S.xs,
    },

    // Row
    row: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: S.md, paddingHorizontal: S.lg, gap: S.md,
    },
    rowIcon: {
        width: 38, height: 38, borderRadius: R.lg,
        borderWidth: 1,
        justifyContent: 'center', alignItems: 'center',
    },
    rowInfo: { flex: 1 },
    rowTitle: { fontSize: T.md, fontWeight: W.xbold, color: C.text },
    rowSub:   { fontSize: T.xs, color: C.textMuted, marginTop: 1 },
    rowDivider: { height: 1, backgroundColor: C.border, marginLeft: S.lg + 38 + S.md },

    // Badge
    badge: {
        backgroundColor: C.violetSoft, borderRadius: R.full,
        paddingHorizontal: S.sm, paddingVertical: 3,
        borderWidth: 1, borderColor: C.violetBorder,
    },
    badgeText: { fontSize: T.nano, fontWeight: W.black, color: C.violet, letterSpacing: 0.5 },

    // About
    aboutCard: {
        borderRadius: R.xxl, overflow: 'hidden',
        borderWidth: 1, borderColor: C.border,
    },
    about: {
        flexDirection: 'row', alignItems: 'center',
        padding: S.lg, gap: S.md,
    },
    aboutIconWrap: {
        width: 48, height: 48, borderRadius: R.xl,
        backgroundColor: C.emberGlow, borderWidth: 1, borderColor: C.emberBorder,
        justifyContent: 'center', alignItems: 'center',
    },
    aboutInfo: { flex: 1 },
    appName: {
        fontSize: T.lg, fontWeight: W.black,
        color: C.text, letterSpacing: -0.3,
    },
    appVersion: { fontSize: T.xs, color: C.textMuted, marginTop: 1 },
    storageChip: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: C.surfaceHigh, borderRadius: R.full,
        paddingHorizontal: S.sm, paddingVertical: S.xs,
        borderWidth: 1, borderColor: C.border,
    },
    storageText: { fontSize: T.nano, color: C.textMuted, fontWeight: W.semi },
});