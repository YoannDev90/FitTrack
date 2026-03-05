// repCounter/components/DoneScreen.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Check, RotateCcw, Timer, Flame, Dumbbell } from 'lucide-react-native';
import { GlassCard } from '@components/ui';
import { useTranslation } from 'react-i18next';
import { RC, SP, RAD, FONT, W, SCREEN_WIDTH } from '../constants';
import type { ExerciseConfig } from '../types';

interface DoneScreenProps {
    exercise: ExerciseConfig;
    repCount: number;
    plankSeconds: number;
    ellipticalSeconds: number;
    elapsedTime: number;
    calories: number;
    showNewRecord: boolean;
    formatTime: (s: number) => string;
    onReset: () => void;
    onSave: () => Promise<void>;
}

export function DoneScreen({
    exercise,
    repCount,
    plankSeconds,
    ellipticalSeconds,
    elapsedTime,
    calories,
    showNewRecord,
    formatTime,
    onReset,
    onSave,
}: DoneScreenProps) {
    const { t } = useTranslation();
    const { router } = require('expo-router');

    const isElliptical = exercise.id === 'elliptical';
    const seconds = isElliptical ? ellipticalSeconds : plankSeconds;
    const mainVal = isElliptical
        ? formatTime(ellipticalSeconds)
        : exercise.isTimeBased
        ? `${plankSeconds}s`
        : repCount.toString();

    return (
        <Animated.View entering={FadeIn} style={s.container}>
            {/* Icon */}
            <Animated.View entering={FadeInDown.delay(80).springify()}>
                <View style={[s.iconWrap, { backgroundColor: `${exercise.color}18` }]}>
                    <Text style={s.icon}>{exercise.icon}</Text>
                </View>
            </Animated.View>

            {/* Title */}
            <Animated.Text entering={FadeInDown.delay(160).springify()} style={s.title}>
                {showNewRecord
                    ? `🏆 ${t('repCounter.newRecord')}`
                    : t('repCounter.congrats')}
            </Animated.Text>

            {/* Summary card */}
            <Animated.View entering={FadeInDown.delay(240).springify()} style={s.cardWrap}>
                <View style={s.summaryCard}>
                    <LinearGradient
                        colors={[`${exercise.color}0d`, RC.surface]}
                        style={StyleSheet.absoluteFill}
                    />
                    <View style={s.summaryRow}>
                        {/* Main stat */}
                        <View style={s.summaryItem}>
                            <View style={[s.statIcon, { backgroundColor: `${exercise.color}18` }]}>
                                <Dumbbell size={18} color={exercise.color} strokeWidth={2} />
                            </View>
                            <Text style={[s.summaryVal, { color: exercise.color }]}>{mainVal}</Text>
                            <Text style={s.summaryLabel}>
                                {t(`repCounter.exercises.${exercise.id}`)}
                            </Text>
                        </View>

                        <View style={s.divider} />

                        {/* Duration */}
                        <View style={s.summaryItem}>
                            <View style={[s.statIcon, { backgroundColor: 'rgba(255,255,255,0.07)' }]}>
                                <Timer size={18} color={RC.textMuted} strokeWidth={2} />
                            </View>
                            <Text style={s.summaryVal}>
                                {isElliptical ? formatTime(ellipticalSeconds) : formatTime(elapsedTime)}
                            </Text>
                            <Text style={s.summaryLabel}>{t('repCounter.duration')}</Text>
                        </View>

                        <View style={s.divider} />

                        {/* Calories */}
                        <View style={s.summaryItem}>
                            <View style={[s.statIcon, { backgroundColor: 'rgba(249,115,22,0.12)' }]}>
                                <Flame size={18} color="#f97316" strokeWidth={2} />
                            </View>
                            <Text style={s.summaryVal}>{calories}</Text>
                            <Text style={s.summaryLabel}>{t('common.kcal')}</Text>
                        </View>
                    </View>
                </View>
            </Animated.View>

            {/* Buttons */}
            <Animated.View entering={FadeInDown.delay(320).springify()} style={s.btnRow}>
                <TouchableOpacity onPress={onReset} style={s.secondaryBtn} activeOpacity={0.8}>
                    <RotateCcw size={18} color={RC.text} />
                    <Text style={s.secondaryBtnText}>{t('repCounter.restart')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    activeOpacity={0.88}
                    onPress={async () => { await onSave(); router.back(); }}
                    style={s.primaryBtn}
                >
                    <LinearGradient
                        colors={[RC.cta1, RC.cta2]}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={s.primaryBtnGrad}
                    >
                        <Check size={18} color="#fff" />
                        <Text style={s.primaryBtnText}>{t('common.finish')}</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </Animated.View>
        </Animated.View>
    );
}

const s = StyleSheet.create({
    container: {
        flex: 1, alignItems: 'center', paddingTop: SP.xxl, gap: SP.xl,
    },
    iconWrap: {
        width: 96, height: 96, borderRadius: 28,
        justifyContent: 'center', alignItems: 'center',
    },
    icon:  { fontSize: 48 },
    title: {
        fontSize: FONT.xxxl, fontWeight: W.black, color: RC.text,
        letterSpacing: -1, textAlign: 'center',
    },
    cardWrap:    { width: SCREEN_WIDTH - SP.lg * 2 },
    summaryCard: {
        borderRadius: RAD.xxxl, borderWidth: 1, borderColor: RC.border,
        overflow: 'hidden', padding: SP.xl,
    },
    summaryRow: {
        flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    },
    summaryItem: { flex: 1, alignItems: 'center', gap: SP.sm },
    statIcon: {
        width: 38, height: 38, borderRadius: RAD.md,
        justifyContent: 'center', alignItems: 'center',
    },
    summaryVal: {
        fontSize: FONT.xxl, fontWeight: W.black, color: RC.text,
        letterSpacing: -0.5,
    },
    summaryLabel: { fontSize: FONT.xs, color: RC.textMuted, fontWeight: W.semi },
    divider:      { width: 1, height: 48, backgroundColor: RC.border },

    btnRow:       { flexDirection: 'row', gap: SP.md },
    secondaryBtn: {
        flexDirection: 'row', alignItems: 'center', gap: SP.sm,
        paddingVertical: 16, paddingHorizontal: SP.xl,
        backgroundColor: RC.surface, borderRadius: RAD.full,
        borderWidth: 1, borderColor: RC.border,
    },
    secondaryBtnText: { fontSize: FONT.md, fontWeight: W.semi, color: RC.text },
    primaryBtn:       { borderRadius: RAD.full, overflow: 'hidden' },
    primaryBtnGrad: {
        flexDirection: 'row', alignItems: 'center', gap: SP.sm,
        paddingVertical: 16, paddingHorizontal: SP.xl,
    },
    primaryBtnText: { fontSize: FONT.md, fontWeight: W.bold, color: '#fff' },
});
