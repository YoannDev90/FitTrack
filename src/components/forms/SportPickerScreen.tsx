// ============================================================================
// SPORT PICKER SCREEN — Grille de sports + bouton tracking temps réel
// ============================================================================

import React, { useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ScrollView, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Zap } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { FC, FS, FR, FT, FW } from './formStyles';
import type { SportConfig } from '../../types';

interface SportPickerScreenProps {
    visibleSports: SportConfig[];
    onSelectSport: (sportId: string) => void;
    onRealTimeTracking: () => void;
    onBack: () => void;
}

export function SportPickerScreen({
    visibleSports,
    onSelectSport,
    onRealTimeTracking,
    onBack,
}: SportPickerScreenProps) {
    const { t } = useTranslation();

    const headerAnim = useRef(new Animated.Value(0)).current;
    const ctaAnim    = useRef(new Animated.Value(0)).current;
    const gridAnim   = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.stagger(60, [headerAnim, ctaAnim, gridAnim].map(a =>
            Animated.spring(a, { toValue: 1, useNativeDriver: true, tension: 75, friction: 11 })
        )).start();
    }, []);

    const slide = (a: Animated.Value) => ({
        opacity: a,
        transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
    });

    return (
        <View style={st.container}>
            {/* Header */}
            <Animated.View style={[st.header, slide(headerAnim)]}>
                <TouchableOpacity onPress={onBack} style={st.backBtn} activeOpacity={0.7}>
                    <ChevronLeft size={20} color={FC.textSub} strokeWidth={2.5} />
                </TouchableOpacity>
                <View style={st.headerText}>
                    <Text style={st.title}>
                        {t('addEntry.selectSport', 'Choisis ton sport')}
                    </Text>
                    <Text style={st.subtitle}>
                        {t('addEntry.selectSportDesc', 'Quel sport as-tu pratiqué ?')}
                    </Text>
                </View>
            </Animated.View>

            {/* Bouton tracking temps réel */}
            <Animated.View style={[{ marginBottom: FS.xxl }, slide(ctaAnim)]}>
                <TouchableOpacity onPress={onRealTimeTracking} activeOpacity={0.82}>
                    <LinearGradient
                        colors={[FC.coral, FC.coralMid, FC.amber]}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={st.realtimeBtn}
                    >
                        <View style={st.realtimeIconWrap}>
                            <Zap size={20} color="#1a0800" strokeWidth={2.5} fill="#1a0800" />
                        </View>
                        <View style={st.realtimeBtnText}>
                            <Text style={st.realtimeBtnTitle}>
                                {t('addEntry.tracking', 'Tracking temps réel')}
                            </Text>
                            <Text style={st.realtimeBtnSub}>
                                {t('addEntry.trackingDesc', 'Compte tes reps en direct')}
                            </Text>
                        </View>
                        <Text style={st.realtimeArrow}>›</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </Animated.View>

            {/* Séparateur */}
            <Animated.View style={[st.orRow, slide(ctaAnim)]}>
                <View style={st.orLine} />
                <Text style={st.orText}>{t('addEntry.or', 'ou')}</Text>
                <View style={st.orLine} />
            </Animated.View>

            {/* Grille sports */}
            <Animated.View style={[{ flex: 1 }, slide(gridAnim)]}>
                <ScrollView
                    nestedScrollEnabled
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={st.grid}
                >
                    {visibleSports.map((sport) => (
                        <TouchableOpacity
                            key={sport.id}
                            style={st.sportTouch}
                            onPress={() => onSelectSport(sport.id)}
                            activeOpacity={0.75}
                        >
                            <View style={[st.sportCard, { borderColor: sport.color + '35' }]}>
                                {/* Glow couleur du sport */}
                                <View style={[
                                    st.sportGlow,
                                    { backgroundColor: sport.color + '12' },
                                ]} />
                                <Text style={st.sportEmoji}>{sport.emoji}</Text>
                                <Text style={st.sportLabel}>{sport.name}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </Animated.View>
        </View>
    );
}

const CARD_SIZE = '47%';

const st = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: FS.lg,
        marginBottom: FS.xxl,
    },
    backBtn: {
        width: 40, height: 40,
        borderRadius: FR.pill,
        backgroundColor: FC.overlay,
        borderWidth: 1,
        borderColor: FC.border,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    headerText: {
        flex: 1,
        gap: FS.xs,
    },
    title: {
        fontSize: FT.xl,
        fontWeight: FW.black,
        color: FC.text,
        letterSpacing: -0.4,
    },
    subtitle: {
        fontSize: FT.sm,
        color: FC.textMuted,
        fontWeight: FW.med,
    },

    // Bouton temps réel
    realtimeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: FS.lg,
        borderRadius: FR.xxl,
        paddingVertical: FS.lg,
        paddingHorizontal: FS.xl,
        shadowColor: FC.coral,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 10,
    },
    realtimeIconWrap: {
        width: 40, height: 40,
        borderRadius: FR.pill,
        backgroundColor: 'rgba(26,8,0,0.20)',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    realtimeBtnText: {
        flex: 1,
        gap: 2,
    },
    realtimeBtnTitle: {
        fontSize: FT.md,
        fontWeight: FW.black,
        color: '#1a0800',
    },
    realtimeBtnSub: {
        fontSize: FT.xs,
        color: 'rgba(26,8,0,0.55)',
        fontWeight: FW.semi,
    },
    realtimeArrow: {
        fontSize: 26,
        color: 'rgba(26,8,0,0.35)',
        lineHeight: 30,
    },

    // Séparateur
    orRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: FS.md,
        marginBottom: FS.xl,
    },
    orLine: {
        flex: 1,
        height: 1,
        backgroundColor: FC.border,
    },
    orText: {
        fontSize: FT.xs,
        fontWeight: FW.bold,
        color: FC.textMuted,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },

    // Grille
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: FS.md,
        paddingBottom: FS.xl,
    },
    sportTouch: {
        width: CARD_SIZE,
    },
    sportCard: {
        backgroundColor: FC.surface,
        borderRadius: FR.xxl,
        borderWidth: 1,
        paddingVertical: FS.xl,
        paddingHorizontal: FS.lg,
        alignItems: 'center',
        gap: FS.sm,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },
    sportGlow: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        borderRadius: FR.xxl,
    },
    sportEmoji: {
        fontSize: 38,
    },
    sportLabel: {
        fontSize: FT.sm,
        fontWeight: FW.bold,
        color: FC.text,
        textAlign: 'center',
        letterSpacing: -0.2,
    },
});
