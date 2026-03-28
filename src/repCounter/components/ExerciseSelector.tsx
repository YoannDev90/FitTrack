import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
    Check,
    ChevronRight,
    Camera,
    Activity,
    Clock3,
} from 'lucide-react-native';
import { BuildConfig } from '@/config/buildConfig';
import { useTranslation } from 'react-i18next';
import * as Linking from 'expo-linking';
import { useAppStore, useSportsConfig } from '../../stores';
import type { CustomSportEntry, SportConfig } from '../../types';
import { RC, SP, RAD, FONT, W, EXERCISES } from '../constants';
import type { ExerciseConfig, DetectionMode } from '../types';

interface ExerciseSelectorProps {
    selectedExercise: ExerciseConfig | null;
    detectionMode: DetectionMode;
    onSelect: (e: ExerciseConfig) => void;
    onDetectionModeChange: (m: DetectionMode) => void;
    onNext: () => void;
}

interface RecentSportCard {
    id: string;
    label: string;
    emoji: string;
    color: string;
    subtitle: string;
}

function ExerciseListItem({
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
        <Animated.View entering={FadeInDown.delay(180 + index * 45).springify()}>
            <TouchableOpacity onPress={onSelect} activeOpacity={0.78}>
                <View style={[s.exerciseRow, selected && { borderColor: exercise.color, backgroundColor: `${exercise.color}12` }]}> 
                    <View style={[s.exerciseEmojiBox, { backgroundColor: `${exercise.color}16` }]}> 
                        <Text style={s.exerciseEmoji}>{exercise.icon}</Text>
                    </View>

                    <View style={s.exerciseInfo}>
                        <Text style={[s.exerciseName, selected && { color: exercise.color }]}>
                            {t(`repCounter.exercises.${key}`)}
                        </Text>
                        <View style={s.exerciseMetaRow}>
                            {exercise.isTimeBased && (
                                <View style={[s.metaBadge, { backgroundColor: `${exercise.color}20` }]}> 
                                    <Text style={[s.metaBadgeText, { color: exercise.color }]}> 
                                        {t('repCounter.timeBased', 'duree')}
                                    </Text>
                                </View>
                            )}
                            {exercise.experimental && (
                                <View style={[s.metaBadge, { backgroundColor: 'rgba(245,166,35,0.15)' }]}> 
                                    <Text style={[s.metaBadgeText, { color: '#f5a623' }]}> 
                                        {t('common.badge.beta', 'BETA')}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>

                    <View style={s.exerciseRowRight}>
                        {selected ? (
                            <View style={[s.checkBadge, { backgroundColor: exercise.color }]}> 
                                <Check size={12} color="#fff" strokeWidth={3} />
                            </View>
                        ) : (
                            <ChevronRight size={18} color={RC.textMuted} strokeWidth={2.3} />
                        )}
                    </View>
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
    const entries = useAppStore(s => s.entries);
    const sportsConfig = useSportsConfig();

    const recentSportCards = useMemo<RecentSportCard[]>(() => {
        const sportEntries = entries.filter((e) => ['home', 'run', 'beatsaber', 'custom'].includes(e.type)).slice(0, 3);

        return sportEntries.map((entry) => {
            if (entry.type === 'run') {
                return {
                    id: entry.id,
                    label: t('entries.run', 'Course'),
                    emoji: '🏃',
                    color: '#5599ff',
                    subtitle: entry.date,
                };
            }

            if (entry.type === 'beatsaber') {
                return {
                    id: entry.id,
                    label: t('entries.beatsaber', 'Beat Saber'),
                    emoji: '🎮',
                    color: '#a78bfa',
                    subtitle: entry.date,
                };
            }

            if (entry.type === 'custom') {
                const sportConfig = sportsConfig.find((s: SportConfig) => s.id === (entry as CustomSportEntry).sportId);
                return {
                    id: entry.id,
                    label: sportConfig?.name || t('entries.custom', 'Sport custom'),
                    emoji: sportConfig?.emoji || '⚡',
                    color: sportConfig?.color || '#ff5533',
                    subtitle: entry.date,
                };
            }

            return {
                id: entry.id,
                label: t('entries.workout', 'Musculation'),
                emoji: '💪',
                color: '#34d370',
                subtitle: entry.date,
            };
        });
    }, [entries, sportsConfig, t]);

    return (
        <View style={s.container}>
            <Animated.View entering={FadeInDown.delay(80).springify()} style={s.titleBlock}>
                <Text style={s.eyebrow}>{t('repCounter.eyebrow', 'ENTRAINEMENT')}</Text>
                <Text style={s.title}>{t('repCounter.selectExercise')}</Text>
                <View style={s.accent} />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(130).springify()} style={s.recentBlock}>
                <View style={s.recentHeader}>
                    <Clock3 size={14} color={RC.textMuted} />
                    <Text style={s.recentTitle}>{t('repCounter.recentSports', '3 derniers sports')}</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.recentRow}>
                    {recentSportCards.length > 0 ? recentSportCards.map((card) => (
                        <View key={card.id} style={[s.recentCard, { borderColor: `${card.color}55` }]}> 
                            <View style={[s.recentCardGlow, { backgroundColor: `${card.color}1c` }]} />
                            <Text style={s.recentEmoji}>{card.emoji}</Text>
                            <Text style={s.recentLabel} numberOfLines={1}>{card.label}</Text>
                            <Text style={s.recentSubtitle}>{card.subtitle}</Text>
                        </View>
                    )) : (
                        <View style={s.recentCardEmpty}>
                            <Text style={s.recentEmptyText}>{t('repCounter.noRecentSports', 'Aucune seance recente')}</Text>
                        </View>
                    )}
                </ScrollView>
            </Animated.View>

            <View style={s.exerciseList}>
                {EXERCISES.map((ex: ExerciseConfig, i: number) => (
                    <ExerciseListItem
                        key={ex.id}
                        exercise={ex}
                        selected={selectedExercise?.id === ex.id}
                        onSelect={() => onSelect(ex)}
                        index={i}
                    />
                ))}
            </View>

            {selectedExercise && (
                <Animated.View entering={FadeInDown.delay(260).springify()}>
                    <DetectionModeSelector
                        exercise={selectedExercise}
                        detectionMode={detectionMode}
                        onDetectionModeChange={onDetectionModeChange}
                    />

                    {detectionMode === 'camera' && BuildConfig.isFoss && (
                        <Animated.View entering={FadeInDown.delay(80)} style={s.fossCard}>
                            <View style={s.fossHeader}>
                                <View style={s.fossIconBox}>
                                    <Camera size={16} color="#f59e0b" />
                                </View>
                                <Text style={s.fossTitle}>{t('repCounter.fossCameraWarning.title')}</Text>
                            </View>
                            <Text style={s.fossBody}>{t('repCounter.fossCameraWarning.message')}</Text>
                            <TouchableOpacity
                                style={s.fossBtn}
                                onPress={() => {
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
                                }}
                            >
                                <Text style={s.fossBtnText}>{t('repCounter.fossCameraWarning.downloadStandard')}</Text>
                                <ChevronRight size={14} color="#22d3ee" />
                            </TouchableOpacity>
                        </Animated.View>
                    )}

                    <TouchableOpacity onPress={onNext} activeOpacity={0.88} style={s.cta}>
                        <LinearGradient
                            colors={[RC.cta1, RC.cta2]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
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

const s = StyleSheet.create({
    container: { flex: 1, paddingTop: SP.lg },
    titleBlock: { marginBottom: SP.lg },
    eyebrow: {
        fontSize: FONT.nano,
        fontWeight: W.black,
        color: RC.textMuted,
        letterSpacing: 3,
        textTransform: 'uppercase',
        marginBottom: SP.xs,
    },
    title: {
        fontSize: FONT.xxxl,
        fontWeight: W.black,
        color: RC.text,
        letterSpacing: -1.2,
        lineHeight: 38,
    },
    accent: {
        marginTop: SP.md,
        height: 2,
        width: 36,
        borderRadius: RAD.full,
        backgroundColor: RC.ember,
    },

    recentBlock: {
        marginBottom: SP.lg,
    },
    recentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SP.xs,
        marginBottom: SP.sm,
    },
    recentTitle: {
        fontSize: FONT.xs,
        fontWeight: W.bold,
        color: RC.textMuted,
        letterSpacing: 1.2,
        textTransform: 'uppercase',
    },
    recentRow: {
        gap: SP.sm,
        paddingRight: SP.md,
    },
    recentCard: {
        width: 140,
        borderRadius: RAD.xl,
        borderWidth: 1,
        borderColor: RC.border,
        backgroundColor: RC.surface,
        padding: SP.md,
        overflow: 'hidden',
        gap: SP.xs,
    },
    recentCardGlow: {
        position: 'absolute',
        top: -20,
        right: -20,
        width: 72,
        height: 72,
        borderRadius: 36,
    },
    recentEmoji: {
        fontSize: 24,
    },
    recentLabel: {
        fontSize: FONT.sm,
        fontWeight: W.bold,
        color: RC.text,
    },
    recentSubtitle: {
        fontSize: FONT.xs,
        color: RC.textMuted,
    },
    recentCardEmpty: {
        width: 220,
        borderRadius: RAD.xl,
        borderWidth: 1,
        borderColor: RC.border,
        backgroundColor: RC.surface,
        padding: SP.md,
        justifyContent: 'center',
    },
    recentEmptyText: {
        fontSize: FONT.xs,
        color: RC.textMuted,
    },

    exerciseList: {
        gap: SP.sm,
        marginBottom: SP.xl,
    },
    exerciseRow: {
        minHeight: 68,
        borderRadius: RAD.xl,
        borderWidth: 1,
        borderColor: RC.border,
        backgroundColor: RC.surface,
        paddingHorizontal: SP.md,
        paddingVertical: SP.sm,
        flexDirection: 'row',
        alignItems: 'center',
        gap: SP.md,
    },
    exerciseEmojiBox: {
        width: 42,
        height: 42,
        borderRadius: RAD.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    exerciseEmoji: {
        fontSize: 24,
    },
    exerciseInfo: {
        flex: 1,
        gap: SP.xs,
    },
    exerciseName: {
        fontSize: FONT.md,
        fontWeight: W.xbold,
        color: RC.text,
    },
    exerciseMetaRow: {
        flexDirection: 'row',
        gap: SP.xs,
        flexWrap: 'wrap',
    },
    metaBadge: {
        borderRadius: RAD.full,
        paddingHorizontal: SP.sm,
        paddingVertical: 2,
    },
    metaBadgeText: {
        fontSize: FONT.nano,
        fontWeight: W.bold,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    exerciseRowRight: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkBadge: {
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },

    modeSection: { marginBottom: SP.xl, alignItems: 'center' },
    modeLabel: {
        fontSize: FONT.nano,
        fontWeight: W.black,
        color: RC.textMuted,
        letterSpacing: 2.5,
        textTransform: 'uppercase',
        marginBottom: SP.md,
    },
    modeRow: { flexDirection: 'row', gap: SP.sm },
    modeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SP.sm,
        paddingVertical: SP.md,
        paddingHorizontal: SP.xl,
        backgroundColor: RC.surface,
        borderRadius: RAD.full,
        borderWidth: 1,
        borderColor: RC.border,
    },
    modeBtnText: { fontSize: FONT.md, fontWeight: W.semi, color: RC.textMuted },
    modeNote: { marginTop: SP.md, fontSize: FONT.xs, color: RC.textMuted, textAlign: 'center' },
    cameraOnlyBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SP.sm,
        paddingVertical: SP.md,
        paddingHorizontal: SP.xl,
        borderRadius: RAD.lg,
        borderWidth: 1,
        alignSelf: 'center',
    },
    cameraOnlyText: { fontSize: FONT.md, fontWeight: W.semi },

    fossCard: {
        backgroundColor: 'rgba(245,158,11,0.09)',
        borderRadius: RAD.xl,
        borderWidth: 1,
        borderColor: 'rgba(245,158,11,0.28)',
        padding: SP.lg,
        marginBottom: SP.xl,
    },
    fossHeader: { flexDirection: 'row', alignItems: 'center', gap: SP.sm, marginBottom: SP.sm },
    fossIconBox: {
        width: 28,
        height: 28,
        borderRadius: RAD.sm,
        backgroundColor: 'rgba(245,158,11,0.18)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    fossTitle: { fontSize: FONT.sm, fontWeight: W.bold, color: '#f59e0b', flex: 1 },
    fossBody: { fontSize: FONT.xs, color: RC.textMuted, lineHeight: 18, marginBottom: SP.md },
    fossBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: SP.sm,
        paddingHorizontal: SP.md,
        backgroundColor: 'rgba(34,211,238,0.09)',
        borderRadius: RAD.md,
        borderWidth: 1,
        borderColor: 'rgba(34,211,238,0.25)',
    },
    fossBtnText: { fontSize: FONT.xs, fontWeight: W.semi, color: '#22d3ee' },

    cta: { alignSelf: 'center', borderRadius: RAD.full, overflow: 'hidden' },
    ctaGrad: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 36, gap: 8 },
    ctaText: { fontSize: FONT.lg, fontWeight: W.bold, color: '#fff' },
});
