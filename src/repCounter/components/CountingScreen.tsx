// repCounter/components/CountingScreen.tsx
import React from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
    FadeIn, FadeInDown,
    useAnimatedStyle, interpolate,
    SharedValue,
} from 'react-native-reanimated';
import {
    Play, Pause, RotateCcw, Check,
    Timer, Flame, Zap, Camera, Activity,
} from 'lucide-react-native';
import { PoseCameraView } from '@components/ui';
import { useTranslation } from 'react-i18next';
import { RC, SP, RAD, FONT, W, SCREEN_WIDTH } from '../constants';
import { ProgressRing } from './ProgressRing';
import type { ExerciseConfig, DetectionMode } from '../types';
import type { PlankDebugInfo, EllipticalState, RepEventMetadata } from '@utils/poseDetection';

interface CountingScreenProps {
    exercise: ExerciseConfig;
    detectionMode: DetectionMode;
    isTracking: boolean;
    repCount: number;
    elapsedTime: number;
    plankSeconds: number;
    ellipticalSeconds: number;
    isPlankActive: boolean;
    isEllipticalActive: boolean;
    showNewRecord: boolean;
    personalBest: number;
    calories: number;
    progress: number;
    motivationalMessage: { text: string; emoji: string } | null;
    aiFeedback: string | null;
    plankDebugInfo: PlankDebugInfo | null;
    countScale: SharedValue<number>;
    pulseOpacity: SharedValue<number>;
    messageOpacity: SharedValue<number>;
    showCameraPreview: boolean;
    showDebugOverlay: boolean;
    debugPlank?: boolean;
    formatTime: (s: number) => string;
    onToggleTracking: () => void;
    onReset: () => void;
    onFinish: () => void;
    onCameraRepDetected: (count: number, feedback?: string, repEvent?: RepEventMetadata) => void;
    onPlankStateChange: (inPlank: boolean, conf: number, debug?: PlankDebugInfo) => void;
    onEllipticalStateChange: (state: EllipticalState) => void;
}

export function CountingScreen({
    exercise,
    detectionMode,
    isTracking,
    repCount,
    elapsedTime,
    plankSeconds,
    ellipticalSeconds,
    isPlankActive,
    isEllipticalActive,
    showNewRecord,
    personalBest,
    calories,
    progress,
    motivationalMessage,
    aiFeedback,
    plankDebugInfo,
    countScale,
    pulseOpacity,
    messageOpacity,
    showCameraPreview,
    showDebugOverlay,
    debugPlank,
    formatTime,
    onToggleTracking,
    onReset,
    onFinish,
    onCameraRepDetected,
    onPlankStateChange,
    onEllipticalStateChange,
}: CountingScreenProps) {
    const { t } = useTranslation();

    const countStyle = useAnimatedStyle(() => ({
        transform: [{ scale: countScale.value }],
    }));
    const pulseStyle = useAnimatedStyle(() => ({
        opacity: pulseOpacity.value,
        transform: [{ scale: interpolate(pulseOpacity.value, [0, 0.8], [1, 1.5]) }],
    }));
    const msgStyle = useAnimatedStyle(() => ({
        opacity: messageOpacity.value,
        transform: [{ scale: interpolate(messageOpacity.value, [0, 1], [0.88, 1]) }],
    }));

    // Primary displayed value
    const isElliptical = exercise.id === 'elliptical';
    const primaryVal = isElliptical
        ? formatTime(ellipticalSeconds)
        : exercise.isTimeBased
        ? plankSeconds.toString()
        : repCount.toString();
    const primaryLabel = isElliptical
        ? t('repCounter.activeTime')
        : exercise.isTimeBased
        ? t('common.seconds')
        : 'reps';

    const repsPerMin = elapsedTime > 0
        ? (repCount / (elapsedTime / 60)).toFixed(1)
        : '0';
    const isPoseExercise = exercise.id !== 'run' && exercise.id !== 'run_ai';

    return (
        <Animated.View entering={FadeIn} style={s.container}>

            {/* ── Counter ring ── */}
            <View style={s.ringWrap}>
                <Animated.View style={[s.pulse, pulseStyle, { borderColor: exercise.color }]} />
                <ProgressRing progress={progress} size={240} color1={exercise.color} color2={`${exercise.color}88`}>
                    <Animated.View style={[s.counterInner, countStyle]}>
                        <Text style={s.mainNum}>{primaryVal}</Text>
                        <Text style={s.mainLabel}>{primaryLabel}</Text>

                        {/* Status badge */}
                        {isElliptical && isEllipticalActive && (
                            <View style={[s.statusBadge, { backgroundColor: RC.success }]}>
                                <Text style={s.statusText}>{t('repCounter.cycling')}</Text>
                            </View>
                        )}
                        {isElliptical && !isEllipticalActive && ellipticalSeconds > 0 && (
                            <View style={[s.statusBadge, { backgroundColor: RC.warning }]}>
                                <Text style={s.statusText}>{t('repCounter.paused')}</Text>
                            </View>
                        )}
                        {exercise.isTimeBased && !isElliptical && isPlankActive && (
                            <View style={[s.statusBadge, { backgroundColor: RC.success }]}>
                                <Text style={s.statusText}>{t('repCounter.active')}</Text>
                            </View>
                        )}
                    </Animated.View>
                </ProgressRing>
            </View>

            {/* ── New record ── */}
            {showNewRecord && (
                <Animated.View entering={FadeInDown.springify()} style={s.recordBanner}>
                    <Text style={s.recordEmoji}>🏆</Text>
                    <Text style={s.recordText}>{t('repCounter.newRecord')}</Text>
                </Animated.View>
            )}

            {/* ── Live stats ── */}
            <View style={s.stats}>
                <View style={s.stat}>
                    <Timer size={16} color={RC.textMuted} strokeWidth={2} />
                    <Text style={s.statVal}>{formatTime(elapsedTime)}</Text>
                    <Text style={s.statLabel}>{t('repCounter.duration')}</Text>
                </View>

                <View style={[s.stat, { backgroundColor: `${exercise.color}12`, borderColor: `${exercise.color}28` }]}>
                    <Flame size={16} color={exercise.color} strokeWidth={2} />
                    <Text style={[s.statVal, { color: exercise.color }]}>{calories}</Text>
                    <Text style={s.statLabel}>{t('common.kcal')}</Text>
                </View>

                <View style={s.stat}>
                    <Zap size={16} color={RC.textMuted} strokeWidth={2} />
                    {exercise.isTimeBased ? (
                        <>
                            <Text style={s.statVal}>{personalBest > 0 ? `${personalBest}s` : '—'}</Text>
                            <Text style={s.statLabel}>{t('repCounter.record')}</Text>
                        </>
                    ) : (
                        <>
                            <Text style={s.statVal}>{repsPerMin}</Text>
                            <Text style={s.statLabel}>{t('repCounter.repPerMin')}</Text>
                        </>
                    )}
                </View>
            </View>

            {/* ── Mode indicator ── */}
            {isElliptical && detectionMode === 'manual' ? (
                <View style={[s.modeIndicator, { borderColor: `${exercise.color}33` }]}>
                    <Activity size={14} color={exercise.color} />
                    <Text style={[s.modeText, { color: exercise.color }]}>{t('repCounter.manualMode')}</Text>
                </View>
            ) : detectionMode === 'camera' ? (
                <View style={[s.modeIndicator, { borderColor: `${exercise.color}33` }]}>
                    <Camera size={14} color={exercise.color} />
                    <Text style={[s.modeText, { color: exercise.color }]}>
                        {isElliptical ? t('repCounter.autoDetection') : t('repCounter.aiActive')}
                    </Text>
                </View>
            ) : (
                <Text style={s.helpText}>
                    {exercise.isTimeBased
                        ? (isPlankActive ? t('repCounter.holdOn') : t('repCounter.pressPlay'))
                        : t('repCounter.keepGoing')}
                </Text>
            )}

            {/* ── Camera preview ── */}
            {detectionMode === 'camera' && showCameraPreview && isPoseExercise && (
                <View style={s.camPreview}>
                    <PoseCameraView
                        facing="front"
                        showDebugOverlay={showDebugOverlay}
                        exerciseType={exercise.id}
                        currentCount={exercise.isTimeBased ? plankSeconds : repCount}
                        onRepDetected={onCameraRepDetected}
                        onPlankStateChange={onPlankStateChange}
                        onEllipticalStateChange={onEllipticalStateChange}
                        isActive={isTracking}
                        style={{ width: '100%', height: '100%' }}
                        debugPlank={debugPlank}
                    />
                </View>
            )}

            {/* Hidden camera */}
            {detectionMode === 'camera' && !showCameraPreview && isPoseExercise && (
                <View style={s.hiddenCam}>
                    <PoseCameraView
                        facing="front"
                        showDebugOverlay={false}
                        exerciseType={exercise.id}
                        currentCount={exercise.isTimeBased ? plankSeconds : repCount}
                        onRepDetected={onCameraRepDetected}
                        onPlankStateChange={onPlankStateChange}
                        onEllipticalStateChange={onEllipticalStateChange}
                        isActive={isTracking}
                        style={{ width: 320, height: 240 }}
                        debugPlank={debugPlank}
                    />
                </View>
            )}

            {/* ── Debug plank ── */}
            {debugPlank && exercise.isTimeBased && plankDebugInfo && (
                <View style={s.debugBox}>
                    <Text style={s.debugTitle}>
                        🔍 Planche ({(plankDebugInfo.overallConfidence * 100).toFixed(0)}%)
                    </Text>
                    {Object.entries(plankDebugInfo.checks).map(([k, v]) => (
                        <Text key={k} style={s.debugLine}>{v.message}</Text>
                    ))}
                </View>
            )}

            {/* ── Controls ── */}
            <View style={s.controls}>
                <TouchableOpacity onPress={onReset} style={s.sideBtn}>
                    <RotateCcw size={22} color={RC.textMuted} />
                </TouchableOpacity>

                <TouchableOpacity onPress={onToggleTracking} activeOpacity={0.88} style={s.mainBtn}>
                    <LinearGradient
                        colors={isTracking ? [RC.error, RC.errorStrong] : [exercise.color, `${exercise.color}cc`]}
                        style={s.mainBtnGrad}
                    >
                        {isTracking
                            ? <Pause size={32} color={RC.white} fill={RC.white} />
                            : <Play  size={32} color={RC.white} fill={RC.white} />
                        }
                    </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity onPress={onFinish} style={[s.sideBtn, s.finishBtn]}>
                    <Check size={22} color={RC.success} />
                </TouchableOpacity>
            </View>

            {/* ── Motivational overlay ── */}
            {motivationalMessage && (
                <Animated.View style={[s.motivWrap, msgStyle]}>
                    <BlurView intensity={24} tint="dark" style={StyleSheet.absoluteFill} />
                    <View style={s.motivInner}>
                        <View style={s.motivEmojiBox}>
                            <Text style={s.motivEmoji}>{motivationalMessage.emoji}</Text>
                        </View>
                        <Text style={s.motivText}>{motivationalMessage.text}</Text>
                        {aiFeedback && (
                            <Text style={[s.aiFeedback, { color: exercise.color }]}>{aiFeedback}</Text>
                        )}
                    </View>
                </Animated.View>
            )}
        </Animated.View>
    );
}

const s = StyleSheet.create({
    container: {
        flex: 1, justifyContent: 'flex-start', alignItems: 'center', paddingTop: SP.xl,
    },

    // Ring
    ringWrap: { position: 'relative', marginBottom: SP.xl },
    pulse: {
        position: 'absolute', top: -10, left: -10, right: -10, bottom: -10,
        borderRadius: 130, borderWidth: 2,
    },
    counterInner: { alignItems: 'center', gap: SP.xs },
    mainNum: {
        fontSize: FONT.display, fontWeight: W.black, color: RC.text,
        lineHeight: 60, letterSpacing: -3, includeFontPadding: false,
    },
    mainLabel:  { fontSize: FONT.lg, color: RC.textMuted, fontWeight: W.semi, marginTop: -SP.xs },
    statusBadge: {
        marginTop: SP.sm, paddingHorizontal: SP.md, paddingVertical: 3,
        borderRadius: RAD.full,
    },
    statusText: { fontSize: FONT.xs, fontWeight: W.bold, color: RC.white, letterSpacing: 0.8 },

    // Record
    recordBanner: {
        flexDirection: 'row', alignItems: 'center', gap: SP.sm,
        backgroundColor: RC.goldSoftStrong,
        paddingVertical: SP.md, paddingHorizontal: SP.xl,
        borderRadius: RAD.full, marginBottom: SP.lg,
        borderWidth: 1, borderColor: RC.goldBorder,
    },
    recordEmoji: { fontSize: 18 },
    recordText:  { fontSize: FONT.md, fontWeight: W.bold, color: RC.gold },

    // Stats
    stats: { flexDirection: 'row', gap: SP.md, marginBottom: SP.xl },
    stat: {
        alignItems: 'center', gap: SP.xs,
        backgroundColor: RC.surface,
        paddingVertical: SP.md, paddingHorizontal: SP.lg,
        borderRadius: RAD.xl, minWidth: 88,
        borderWidth: 1, borderColor: RC.border,
    },
    statVal:   { fontSize: FONT.xxl, fontWeight: W.black, color: RC.text, letterSpacing: -0.5 },
    statLabel: { fontSize: FONT.nano, color: RC.textMuted, fontWeight: W.semi, letterSpacing: 0.3 },

    // Mode
    modeIndicator: {
        flexDirection: 'row', alignItems: 'center', gap: SP.xs,
        backgroundColor: RC.blackOverlay30,
        paddingVertical: SP.sm, paddingHorizontal: SP.lg,
        borderRadius: RAD.full, borderWidth: 1, marginBottom: SP.lg,
    },
    modeText: { fontSize: FONT.xs, fontWeight: W.semi },
    helpText:  { fontSize: FONT.md, color: RC.textMuted, textAlign: 'center', marginBottom: SP.xl },

    // Camera
    camPreview: {
        width: SCREEN_WIDTH - SP.lg * 2, height: 160,
        borderRadius: RAD.xxl, overflow: 'hidden',
        marginBottom: SP.xl,
        borderWidth: 1, borderColor: RC.border,
        backgroundColor: RC.black,
    },
    hiddenCam: { position: 'absolute', width: 1, height: 1, opacity: 0, overflow: 'hidden' },

    // Debug
    debugBox: {
        backgroundColor: RC.blackOverlay85, borderRadius: RAD.lg,
        padding: SP.md, marginHorizontal: SP.md, marginBottom: SP.sm, width: '100%',
    },
    debugTitle: { fontSize: FONT.sm, fontWeight: W.bold, color: RC.text, marginBottom: SP.xs },
    debugLine:  { fontSize: FONT.xs, color: RC.text, fontFamily: 'monospace' },

    // Controls
    controls: { flexDirection: 'row', alignItems: 'center', gap: SP.xl },
    sideBtn: {
        width: 54, height: 54, borderRadius: 27,
        backgroundColor: RC.surface, borderWidth: 1, borderColor: RC.border,
        justifyContent: 'center', alignItems: 'center',
    },
    finishBtn: { borderColor: `${RC.success}44` },
    mainBtn: { borderRadius: 42, overflow: 'hidden', elevation: 12 },
    mainBtnGrad: { width: 84, height: 84, borderRadius: 42, justifyContent: 'center', alignItems: 'center' },

    // Motivational
    motivWrap: {
        position: 'absolute', bottom: 120, left: SP.xl, right: SP.xl,
        borderRadius: RAD.xxl, overflow: 'hidden',
        borderWidth: 1, borderColor: RC.whiteOverlay12,
        minHeight: 100,
    },
    motivInner: {
        alignItems: 'center', padding: SP.xl, gap: SP.sm,
        backgroundColor: RC.blackOverlay25,
    },
    motivEmojiBox: {
        width: 52, height: 52, borderRadius: 26,
        backgroundColor: RC.whiteOverlay10,
        borderWidth: 1.5, borderColor: RC.whiteOverlay18,
        justifyContent: 'center', alignItems: 'center',
    },
    motivEmoji: { fontSize: 28 },
    motivText: {
        fontSize: FONT.xxl, fontWeight: W.black, color: RC.text,
        textAlign: 'center', letterSpacing: 0.3,
    },
    aiFeedback: { fontSize: FONT.md, fontWeight: W.semi, textAlign: 'center' },
});
