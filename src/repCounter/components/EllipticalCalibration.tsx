// repCounter/components/EllipticalCalibration.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { ChevronRight } from 'lucide-react-native';
import { PoseCameraView } from '@components/ui';
import { useTranslation } from 'react-i18next';
import { RC, SP, RAD, FONT, W } from '../constants';
import type { ExerciseConfig, EllipticalCalibrationPhase } from '../types';

interface EllipticalCalibrationProps {
    exercise: ExerciseConfig;
    phase: EllipticalCalibrationPhase;
    countdown: number;
    funnyPhrase: string;
    waitingForMovement: boolean;
    calibrationFailed: boolean;
    onBegin: () => void;
}

export function EllipticalCalibration({
    exercise,
    phase,
    countdown,
    funnyPhrase,
    waitingForMovement,
    calibrationFailed,
    onBegin,
}: EllipticalCalibrationProps) {
    const { t } = useTranslation();

    return (
        <View style={s.container}>
            {/* Hidden camera for calibration */}
            <View style={s.hiddenCam}>
                <PoseCameraView
                    facing="front"
                    showDebugOverlay={false}
                    exerciseType="elliptical"
                    currentCount={0}
                    onRepDetected={() => {}}
                    isActive={phase !== 'none' && phase !== 'complete'}
                    style={{ width: 320, height: 240 }}
                />
            </View>

            {/* INTRO */}
            {(phase === 'intro' || phase === 'none') && (
                <Animated.View entering={FadeInDown.springify()} style={s.phaseWrap}>
                    <View style={[s.iconBox, { backgroundColor: `${exercise.color}18` }]}>
                        <Text style={s.phaseIcon}>📱</Text>
                    </View>
                    <Text style={s.phaseTitle}>{t('repCounter.elliptical.calibrationStart')}</Text>
                    <Text style={s.phaseSub}>{t('repCounter.elliptical.calibrationIntro')}</Text>
                    {calibrationFailed && (
                        <View style={s.errorBox}>
                            <Text style={s.errorText}>{t('repCounter.elliptical.calibrationFailed')}</Text>
                        </View>
                    )}
                    <TouchableOpacity
                        onPress={onBegin}
                        activeOpacity={0.88}
                        style={s.btn}
                    >
                        <LinearGradient
                            colors={[RC.cta1, RC.cta2]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={s.btnGrad}
                        >
                            <Text style={s.btnText}>{t('repCounter.elliptical.letsGo')}</Text>
                            <ChevronRight size={20} color={RC.white} />
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>
            )}

            {/* GET READY */}
            {phase === 'get_ready' && (
                <Animated.View entering={FadeIn} style={s.phaseWrap}>
                    <View style={[s.iconBox, { backgroundColor: `${exercise.color}18` }]}>
                        <Text style={s.phaseIcon}>⏱️</Text>
                    </View>
                    <Text style={s.phaseTitle}>{t('repCounter.elliptical.calibrationStarting')}</Text>
                    <Text style={s.phaseSub}>{t('repCounter.elliptical.getReady')}</Text>
                    <Animated.View entering={ZoomIn.springify()} key={countdown} style={s.countdownCircle}>
                        <Text style={s.countdownNum}>{countdown}</Text>
                    </Animated.View>
                </Animated.View>
            )}

            {/* STILL */}
            {phase === 'still' && (
                <Animated.View entering={FadeIn} style={s.phaseWrap}>
                    <View style={[s.iconBox, { backgroundColor: RC.emberGlow }]}> 
                        <Text style={s.phaseIcon}>🗿</Text>
                    </View>
                    <Text style={s.phaseTitle}>{t('repCounter.elliptical.dontMove')}</Text>
                    <Text style={s.funnyPhrase}>{funnyPhrase}</Text>
                    <View style={s.stillCountdown}>
                        <Text style={s.stillNum}>{countdown}</Text>
                        <Text style={s.stillSec}>sec</Text>
                    </View>
                </Animated.View>
            )}

            {/* STILL DONE */}
            {phase === 'still_done' && (
                <Animated.View entering={ZoomIn.springify()} style={s.phaseWrap}>
                    <View style={[s.iconBox, { backgroundColor: RC.successSoftAlt }]}> 
                        <Text style={s.phaseIcon}>✅</Text>
                    </View>
                    <Text style={s.funnyPhrase}>{funnyPhrase}</Text>
                </Animated.View>
            )}

            {/* PEDALING */}
            {phase === 'pedaling' && (
                <Animated.View entering={FadeIn} style={s.phaseWrap}>
                    <View style={[s.iconBox, { backgroundColor: `${exercise.color}18` }]}>
                        <Text style={s.phaseIcon}>{waitingForMovement ? '👆' : '🚴'}</Text>
                    </View>
                    <Text style={s.phaseTitle}>{t('repCounter.elliptical.startPedaling')}</Text>
                    <Text style={s.phaseSub}>
                        {waitingForMovement
                            ? t('repCounter.elliptical.waitingForMovement')
                            : t('repCounter.elliptical.analyzingMovement')}
                    </Text>
                    <View style={s.pedalBox}>
                        {waitingForMovement ? (
                            <ActivityIndicator size="large" color={exercise.color} />
                        ) : (
                            <View style={[s.pedalRing, { borderColor: RC.success }]}>
                                <Text style={s.pedalNum}>{countdown}</Text>
                            </View>
                        )}
                    </View>
                </Animated.View>
            )}

            {/* COMPLETE */}
            {phase === 'complete' && (
                <Animated.View entering={ZoomIn.springify()} style={s.phaseWrap}>
                    <View style={[s.iconBox, { backgroundColor: RC.successSoftAlt }]}> 
                        <Text style={s.phaseIcon}>🎉</Text>
                    </View>
                    <Text style={s.phaseTitle}>{t('repCounter.elliptical.calibrationComplete')}</Text>
                    <Text style={s.phaseSub}>{t('repCounter.elliptical.letsRide')}</Text>
                </Animated.View>
            )}
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: SP.xxl },
    hiddenCam: { position: 'absolute', width: 1, height: 1, opacity: 0, overflow: 'hidden' },
    phaseWrap: { alignItems: 'center', justifyContent: 'center', gap: SP.xl },
    iconBox: {
        width: 110, height: 110, borderRadius: 55,
        justifyContent: 'center', alignItems: 'center',
    },
    phaseIcon: { fontSize: 52 },
    phaseTitle: {
        fontSize: FONT.xxl, fontWeight: W.black, color: RC.text,
        textAlign: 'center', letterSpacing: -0.5,
    },
    phaseSub: {
        fontSize: FONT.md, color: RC.textMuted,
        textAlign: 'center', lineHeight: 22,
        paddingHorizontal: SP.xl,
    },
    funnyPhrase: {
        fontSize: FONT.md, color: RC.textMuted,
        textAlign: 'center', lineHeight: 22,
        fontStyle: 'italic',
        paddingHorizontal: SP.xl,
    },
    errorBox: {
        backgroundColor: RC.errorSoftAlt, borderRadius: RAD.lg,
        padding: SP.md, borderWidth: 1, borderColor: RC.errorBorderAlt,
    },
    errorText: { color: RC.error, fontSize: FONT.md, textAlign: 'center' },
    btn:      { borderRadius: RAD.full, overflow: 'hidden' },
    btnGrad:  { flexDirection: 'row', alignItems: 'center', gap: SP.md, paddingVertical: 16, paddingHorizontal: 32 },
    btnText:  { fontSize: FONT.lg, fontWeight: W.bold, color: RC.white },

    countdownCircle: {
        width: 100, height: 100, borderRadius: 50,
        backgroundColor: RC.emberGlow,
        borderWidth: 3, borderColor: RC.ember,
        justifyContent: 'center', alignItems: 'center',
    },
    countdownNum: { fontSize: 48, fontWeight: W.black, color: RC.ember },

    stillCountdown: { flexDirection: 'row', alignItems: 'baseline', gap: SP.xs },
    stillNum: { fontSize: 64, fontWeight: W.black, color: RC.emberMid },
    stillSec: { fontSize: FONT.xl, fontWeight: W.bold, color: RC.emberMid },

    pedalBox: { alignItems: 'center' },
    pedalRing: {
        width: 90, height: 90, borderRadius: 45,
        backgroundColor: RC.successSoft,
        borderWidth: 3,
        justifyContent: 'center', alignItems: 'center',
    },
    pedalNum: { fontSize: 36, fontWeight: W.black, color: RC.success },
});
