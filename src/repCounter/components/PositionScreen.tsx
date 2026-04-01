// repCounter/components/PositionScreen.tsx
import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    FadeIn, useSharedValue, useAnimatedStyle,
    withRepeat, withSequence, withTiming, interpolate,
} from 'react-native-reanimated';
import { Play, Smartphone, Camera, Timer, ArrowDown, Volume2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { RC, SP, RAD, FONT, W } from '../constants';
import type { ExerciseConfig, DetectionMode } from '../types';
import { PoseCameraView } from '@components/ui';

interface PositionScreenProps {
    exercise: ExerciseConfig;
    detectionMode: DetectionMode;
    onReady: () => void;
}

export function PositionScreen({ exercise, detectionMode, onReady }: PositionScreenProps) {
    const { t } = useTranslation();
    const float = useSharedValue(0);
    const [isModelReady, setIsModelReady] = React.useState(detectionMode !== 'camera');

    useEffect(() => {
        setIsModelReady(detectionMode !== 'camera');
    }, [detectionMode, exercise.id]);

    useEffect(() => {
        float.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 1400 }),
                withTiming(0, { duration: 1400 })
            ),
            -1, true
        );
    }, []);

    const floatStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: interpolate(float.value, [0, 1], [0, -10]) }],
    }));

    const instruction = detectionMode === 'camera'
        ? t((exercise.cameraInstructionKey || exercise.cameraInstruction) as string)
        : t((exercise.instructionKey || exercise.instruction) as string);

    const Icon = detectionMode === 'camera' ? Camera
        : exercise.isTimeBased ? Timer
        : Smartphone;

    const canStart = detectionMode !== 'camera' || isModelReady;

    return (
        <Animated.View entering={FadeIn} style={s.container}>
            {detectionMode === 'camera' && (
                <View style={s.hiddenCam}>
                    <PoseCameraView
                        facing="front"
                        showDebugOverlay={false}
                        exerciseType={exercise.id as any}
                        currentCount={0}
                        onRepDetected={() => {}}
                        onModelReady={() => setIsModelReady(true)}
                        isActive={true}
                        style={{ width: 320, height: 240 }}
                    />
                </View>
            )}

            {/* Floating icon */}
            <Animated.View style={[s.iconWrap, floatStyle]}>
                <View style={[s.iconCircle, { borderColor: `${exercise.color}55` }]}>
                    <View style={[s.iconInner, { backgroundColor: `${exercise.color}18` }]}>
                        <Icon size={44} color={exercise.color} strokeWidth={1.5} />
                    </View>
                </View>
                {!exercise.isTimeBased && (
                    <ArrowDown size={28} color={`${exercise.color}88`} style={{ marginTop: SP.md }} />
                )}
            </Animated.View>

            {/* Text */}
            <View style={s.textBlock}>
                <Text style={s.instruction}>{instruction}</Text>
                <Text style={s.subtitle}>
                    {exercise.isTimeBased
                        ? t('repCounter.pressPlay')
                        : detectionMode === 'camera'
                        ? t('repCounter.cameraNote')
                        : t('repCounter.whenReady')}
                </Text>

                {detectionMode === 'camera' && !isModelReady && (
                    <View style={s.loadingHint}>
                        <Text style={s.loadingHintText}>{t('repCounter.modelPreparing')}</Text>
                    </View>
                )}
            </View>

            {/* Volume hint for plank */}
            {exercise.isTimeBased && (
                <View style={s.volumeHint}>
                    <Volume2 size={16} color={RC.emberMid} strokeWidth={2} />
                    <Text style={s.volumeText}>{t('repCounter.volumeHint')}</Text>
                </View>
            )}

            {/* CTA */}
            <TouchableOpacity
                onPress={onReady}
                activeOpacity={canStart ? 0.88 : 1}
                disabled={!canStart}
                style={canStart ? s.btn : [s.btn, s.btnDisabled]}
            >
                <LinearGradient
                    colors={canStart ? [exercise.color, `${exercise.color}cc`] : [RC.overlayUp, RC.overlay]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={s.btnGrad}
                >
                    <Play size={22} color={RC.white} fill={RC.white} />
                    <Text style={s.btnText}>{canStart ? t('common.start') : t('repCounter.modelLoading')}</Text>
                </LinearGradient>
            </TouchableOpacity>
        </Animated.View>
    );
}

const s = StyleSheet.create({
    container: {
        flex: 1, alignItems: 'center', justifyContent: 'center',
        paddingBottom: 80, gap: SP.xxl,
    },
    iconWrap:   { alignItems: 'center' },
    iconCircle: {
        width: 130, height: 130, borderRadius: 65,
        borderWidth: 1.5, borderStyle: 'dashed',
        alignItems: 'center', justifyContent: 'center',
    },
    iconInner: {
        width: 100, height: 100, borderRadius: 50,
        alignItems: 'center', justifyContent: 'center',
    },
    textBlock: { alignItems: 'center', gap: SP.sm, paddingHorizontal: SP.xxl },
    instruction: {
        fontSize: FONT.xl, fontWeight: W.xbold, color: RC.text,
        textAlign: 'center', letterSpacing: -0.4, lineHeight: 28,
    },
    subtitle: {
        fontSize: FONT.md, color: RC.textMuted,
        textAlign: 'center', lineHeight: 22,
    },
    volumeHint: {
        flexDirection: 'row', alignItems: 'center', gap: SP.sm,
        backgroundColor: RC.emberGlow, borderRadius: RAD.lg,
        paddingVertical: SP.md, paddingHorizontal: SP.lg,
        borderWidth: 1, borderColor: RC.emberBorder,
    },
    volumeText: { fontSize: FONT.sm, color: RC.emberMid, fontWeight: W.med },
    hiddenCam: { position: 'absolute', width: 1, height: 1, opacity: 0, overflow: 'hidden' },
    loadingHint: {
        backgroundColor: RC.surface,
        borderColor: RC.border,
        borderWidth: 1,
        borderRadius: RAD.lg,
        paddingVertical: SP.sm,
        paddingHorizontal: SP.md,
    },
    loadingHintText: { fontSize: FONT.sm, color: RC.textMuted, fontWeight: W.med },
    btn:      { borderRadius: RAD.full, overflow: 'hidden' },
    btnDisabled: { opacity: 0.55 },
    btnGrad: {
        flexDirection: 'row', alignItems: 'center', gap: SP.md,
        paddingVertical: 18, paddingHorizontal: 44,
    },
    btnText:  { fontSize: FONT.xl, fontWeight: W.bold, color: RC.white, letterSpacing: -0.2 },
});
