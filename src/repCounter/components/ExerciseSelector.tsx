// repCounter/components/ExerciseSelector.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
    Check, ChevronRight, Camera, Activity,
} from 'lucide-react-native';
import { GlassCard } from '@components/ui';
import { BuildConfig } from '@/config/buildConfig';
import { useTranslation } from 'react-i18next';
import * as Linking from 'expo-linking';
import { RC, SP, RAD, FONT, W, SCREEN_WIDTH, EXERCISES } from '../constants';
import type { ExerciseConfig, DetectionMode } from '../types';

interface ExerciseSelectorProps {
    selectedExercise: ExerciseConfig | null;
    detectionMode: DetectionMode;
    onSelect: (e: ExerciseConfig) => void;
    onDetectionModeChange: (m: DetectionMode) => void;
    onNext: () => void;
}

function ExerciseCard({
    exercise,
    selected,
    onSelect,
    index,
}: {
    exercise: ExerciseConfig;
    selected: boolean;
    onSelect: () => void;
    index: number;
}) {
    const { t } = useTranslation();
    const key = exercise.id === 'jumping_jacks' ? 'jumpingJacks' : exercise.id;
    return (
        <Animated.View
            entering={FadeInDown.delay(280 + index * 70).springify()}
            style={s.cardWrap}
        >
            <TouchableOpacity onPress={onSelect} activeOpacity={0.75}>
                <View style={[s.card, selected && { borderColor: exercise.color, borderWidth: 1.5 }]}>
                    <LinearGradient
                        colors={[`${exercise.color}1a`, `${exercise.color}08`]}
                        style={StyleSheet.absoluteFill}
                    />
                    {/* Top-right check */}
                    {selected && (
                        <View style={[s.checkBadge, { backgroundColor: exercise.color }]}>
                            <Check size={11} color="#fff" strokeWidth={3} />
                        </View>
                    )}
                    <Text style={s.icon}>{exercise.icon}</Text>
                    <Text style={[s.name, selected && { color: exercise.color }]}>
                        {t(`repCounter.exercises.${key}`)}
                    </Text>
                    {exercise.isTimeBased && (
                        <View style={[s.timeBadge, { backgroundColor: `${exercise.color}22` }]}>
                            <Text style={[s.timeBadgeText, { color: exercise.color }]}>
                                {t('repCounter.timeBased', 'durée')}
                            </Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
}

function DetectionModeSelector({
    exercise,
    detectionMode,
    onDetectionModeChange,
}: {
    exercise: ExerciseConfig;
    detectionMode: DetectionMode;
    onDetectionModeChange: (m: DetectionMode) => void;
}) {
    const { t } = useTranslation();

    // Plank: camera only
    if (exercise.isTimeBased && exercise.id !== 'elliptical') {
        return (
            <View style={s.modeSection}>
                <View style={[s.cameraOnlyBadge, { backgroundColor: `${exercise.color}18`, borderColor: `${exercise.color}33` }]}>
                    <Camera size={15} color={exercise.color} strokeWidth={2} />
                    <Text style={[s.cameraOnlyText, { color: exercise.color }]}>
                        {t('repCounter.cameraOnly')}
                    </Text>
                </View>
                <Text style={s.modeNote}>📷 {t('repCounter.cameraPosition')}</Text>
            </View>
        );
    }

    // Elliptical: manual or camera
    if (exercise.id === 'elliptical') {
        const options: { mode: DetectionMode; icon: React.ReactNode; label: string }[] = [
            { mode: 'manual', icon: <Activity size={16} color={detectionMode === 'manual' ? '#fff' : RC.textMuted} />, label: t('repCounter.manual') },
            { mode: 'camera', icon: <Camera size={16} color={detectionMode === 'camera' ? '#fff' : RC.textMuted} />, label: t('repCounter.auto') },
        ];
        return (
            <View style={s.modeSection}>
                <Text style={s.modeLabel}>{t('repCounter.detectionMode')}</Text>
                <View style={s.modeRow}>
                    {options.map(opt => (
                        <TouchableOpacity
                            key={opt.mode}
                            onPress={() => onDetectionModeChange(opt.mode)}
                            style={[
                                s.modeBtn,
                                detectionMode === opt.mode && { backgroundColor: exercise.color, borderColor: 'transparent' },
                            ]}
                        >
                            {opt.icon}
                            <Text style={[s.modeBtnText, detectionMode === opt.mode && { color: '#fff' }]}>
                                {opt.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <Text style={s.modeNote}>
                    {detectionMode === 'camera'
                        ? `📷 ${t('repCounter.ellipticalAutoNote')}`
                        : `👆 ${t('repCounter.ellipticalManualNote')}`}
                </Text>
            </View>
        );
    }

    // Normal exercises: sensor or camera
    const options: { mode: DetectionMode; icon: React.ReactNode; label: string }[] = [
        { mode: 'sensor', icon: <Activity size={16} color={detectionMode === 'sensor' ? '#fff' : RC.textMuted} />, label: t('repCounter.sensor') },
    ];
    if (exercise.supportsCameraMode) {
        options.push({ mode: 'camera', icon: <Camera size={16} color={detectionMode === 'camera' ? '#fff' : RC.textMuted} />, label: t('repCounter.camera') });
    }

    return (
        <View style={s.modeSection}>
            <Text style={s.modeLabel}>{t('repCounter.detectionMode')}</Text>
            <View style={s.modeRow}>
                {options.map(opt => (
                    <TouchableOpacity
                        key={opt.mode}
                        onPress={() => onDetectionModeChange(opt.mode)}
                        style={[
                            s.modeBtn,
                            detectionMode === opt.mode && {
                                backgroundColor: opt.mode === 'camera' ? exercise.color : RC.cta1,
                                borderColor: 'transparent',
                            },
                        ]}
                    >
                        {opt.icon}
                        <Text style={[s.modeBtnText, detectionMode === opt.mode && { color: '#fff' }]}>
                            {opt.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
            {detectionMode === 'camera' && (
                <Text style={s.modeNote}>📷 {t('repCounter.cameraNote')}</Text>
            )}
        </View>
    );
}

export function ExerciseSelector({
    selectedExercise,
    detectionMode,
    onSelect,
    onDetectionModeChange,
    onNext,
}: ExerciseSelectorProps) {
    const { t } = useTranslation();

    return (
        <View style={s.container}>
            {/* Title */}
            <Animated.View entering={FadeInDown.delay(80).springify()} style={s.titleBlock}>
                <Text style={s.eyebrow}>{t('repCounter.eyebrow', 'ENTRAÎNEMENT')}</Text>
                <Text style={s.title}>{t('repCounter.selectExercise')}</Text>
                <View style={s.accent} />
            </Animated.View>

            {/* Exercise grid */}
            <Animated.View entering={FadeInDown.delay(160).springify()} style={s.grid}>
                {EXERCISES.map((ex: ExerciseConfig, i: number) => (
                    <ExerciseCard
                        key={ex.id}
                        exercise={ex}
                        selected={selectedExercise?.id === ex.id}
                        onSelect={() => onSelect(ex)}
                        index={i}
                    />
                ))}
            </Animated.View>

            {/* Detection + CTA */}
            {selectedExercise && (
                <Animated.View entering={FadeInDown.delay(480).springify()}>
                    <DetectionModeSelector
                        exercise={selectedExercise}
                        detectionMode={detectionMode}
                        onDetectionModeChange={onDetectionModeChange}
                    />

                    {/* FOSS warning */}
                    {detectionMode === 'camera' && BuildConfig.isFoss && (
                        <Animated.View entering={FadeInDown.delay(100)} style={s.fossCard}>
                            <View style={s.fossHeader}>
                                <View style={s.fossIconBox}>
                                    <Camera size={16} color="#f59e0b" />
                                </View>
                                <Text style={s.fossTitle}>{t('repCounter.fossCameraWarning.title')}</Text>
                            </View>
                            <Text style={s.fossBody}>{t('repCounter.fossCameraWarning.message')}</Text>
                            <TouchableOpacity style={s.fossBtn} onPress={() => {
                                Alert.alert(
                                    t('repCounter.fossCameraWarning.downloadTitle'),
                                    t('repCounter.fossCameraWarning.downloadMessage'),
                                    [
                                        { text: t('common.cancel'), style: 'cancel' },
                                        {
                                            text: t('repCounter.fossCameraWarning.openGitHub'),
                                            onPress: async () => {
                                                const url = 'https://github.com/LuckyTheCookie/FitTrack/releases/latest';
                                                if (await Linking.canOpenURL(url)) await Linking.openURL(url);
                                            },
                                        },
                                    ]
                                );
                            }}>
                                <Text style={s.fossBtnText}>{t('repCounter.fossCameraWarning.downloadStandard')}</Text>
                                <ChevronRight size={14} color="#22d3ee" />
                            </TouchableOpacity>
                        </Animated.View>
                    )}

                    {/* CTA */}
                    <TouchableOpacity onPress={onNext} activeOpacity={0.88} style={s.cta}>
                        <LinearGradient
                            colors={[RC.cta1, RC.cta2]}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            style={s.ctaGrad}
                        >
                            <Text style={s.ctaText}>{t('common.next')}</Text>
                            <ChevronRight size={20} color="#fff" />
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>
            )}
        </View>
    );
}

const CARD_W = (SCREEN_WIDTH - SP.lg * 2 - 12) / 2;

const s = StyleSheet.create({
    container:  { flex: 1, paddingTop: SP.lg },
    titleBlock: { marginBottom: SP.xl },
    eyebrow: {
        fontSize: FONT.nano, fontWeight: W.black, color: RC.textMuted,
        letterSpacing: 3, textTransform: 'uppercase', marginBottom: SP.xs,
    },
    title:  { fontSize: FONT.xxxl, fontWeight: W.black, color: RC.text, letterSpacing: -1.2, lineHeight: 38 },
    accent: { marginTop: SP.md, height: 2, width: 36, borderRadius: RAD.full, backgroundColor: RC.ember },

    // Grid
    grid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: SP.xl },
    cardWrap: { width: CARD_W },
    card: {
        borderRadius: RAD.xxl, overflow: 'hidden', padding: SP.lg,
        alignItems: 'center', gap: SP.xs,
        borderWidth: 1, borderColor: RC.border,
        backgroundColor: RC.surface, minHeight: 110,
    },
    checkBadge: {
        position: 'absolute', top: 10, right: 10,
        width: 20, height: 20, borderRadius: 10,
        justifyContent: 'center', alignItems: 'center',
    },
    icon:       { fontSize: 38, marginBottom: SP.xs },
    name:       { fontSize: FONT.md, fontWeight: W.xbold, color: RC.text, textAlign: 'center' },
    timeBadge:  { borderRadius: RAD.full, paddingHorizontal: SP.sm, paddingVertical: 2, marginTop: SP.xs },
    timeBadgeText: { fontSize: FONT.nano, fontWeight: W.bold, letterSpacing: 0.5, textTransform: 'uppercase' },

    // Mode selector
    modeSection: { marginBottom: SP.xl, alignItems: 'center' },
    modeLabel: {
        fontSize: FONT.nano, fontWeight: W.black, color: RC.textMuted,
        letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: SP.md,
    },
    modeRow:    { flexDirection: 'row', gap: SP.sm },
    modeBtn: {
        flexDirection: 'row', alignItems: 'center', gap: SP.sm,
        paddingVertical: SP.md, paddingHorizontal: SP.xl,
        backgroundColor: RC.surface, borderRadius: RAD.full,
        borderWidth: 1, borderColor: RC.border,
    },
    modeBtnText: { fontSize: FONT.md, fontWeight: W.semi, color: RC.textMuted },
    modeNote:    { marginTop: SP.md, fontSize: FONT.xs, color: RC.textMuted, textAlign: 'center' },
    cameraOnlyBadge: {
        flexDirection: 'row', alignItems: 'center', gap: SP.sm,
        paddingVertical: SP.md, paddingHorizontal: SP.xl,
        borderRadius: RAD.lg, borderWidth: 1, alignSelf: 'center',
    },
    cameraOnlyText: { fontSize: FONT.md, fontWeight: W.semi },

    // FOSS warning
    fossCard: {
        backgroundColor: 'rgba(245,158,11,0.09)', borderRadius: RAD.xl,
        borderWidth: 1, borderColor: 'rgba(245,158,11,0.28)',
        padding: SP.lg, marginBottom: SP.xl,
    },
    fossHeader:  { flexDirection: 'row', alignItems: 'center', gap: SP.sm, marginBottom: SP.sm },
    fossIconBox: {
        width: 28, height: 28, borderRadius: RAD.sm,
        backgroundColor: 'rgba(245,158,11,0.18)',
        alignItems: 'center', justifyContent: 'center',
    },
    fossTitle:   { fontSize: FONT.sm, fontWeight: W.bold, color: '#f59e0b', flex: 1 },
    fossBody:    { fontSize: FONT.xs, color: RC.textMuted, lineHeight: 18, marginBottom: SP.md },
    fossBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingVertical: SP.sm, paddingHorizontal: SP.md,
        backgroundColor: 'rgba(34,211,238,0.09)', borderRadius: RAD.md,
        borderWidth: 1, borderColor: 'rgba(34,211,238,0.25)',
    },
    fossBtnText: { fontSize: FONT.xs, fontWeight: W.semi, color: '#22d3ee' },

    // CTA
    cta:     { alignSelf: 'center', borderRadius: RAD.full, overflow: 'hidden' },
    ctaGrad: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 36, gap: 8 },
    ctaText: { fontSize: FONT.lg, fontWeight: W.bold, color: '#fff' },
});
