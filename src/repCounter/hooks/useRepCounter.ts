// repCounter/hooks/useRepCounter.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { Vibration } from 'react-native';
import { router } from 'expo-router';
import { Accelerometer, AccelerometerMeasurement } from 'expo-sensors';
import { useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import {
    useSharedValue, withSpring, withTiming,
    withSequence, runOnJS,
} from 'react-native-reanimated';
import { useAppStore } from '../../stores';
import { useTranslation } from 'react-i18next';
import {
    startEllipticalStillFirstCalibration,
    completeEllipticalStillPhase,
    completeEllipticalPedalingPhase,
    isEllipticalCalibrated,
    resetEllipticalState,
    hasEllipticalMovementStarted,
    resetEllipticalSamples,
    resetExerciseState,
} from '../../utils/poseDetection';
import { playSessionEndSound } from '../../services/audio/sessionEndSound';
import {
    startSessionTracking,
    updateSessionData,
    stopSessionTracking,
    getUnfinishedSession,
    getRoundedSessionData,
    type ActiveSession,
} from '../../services/sessionRecovery';
import type { ExerciseType, PlankDebugInfo, EllipticalState, RepEventMetadata } from '../../utils/poseDetection';
import type { HomeWorkoutEntry } from '../../types';
import type { ExerciseConfig, DetectionMode, TutorialStep, EllipticalCalibrationPhase } from '../types';
import { EXERCISES } from '../constants';

export function useRepCounter() {
    const { settings, addHomeWorkout, entries } = useAppStore();
    const { t } = useTranslation();

    // ── State ──────────────────────────────────────────────────────────────────
    const [step, setStep] = useState<TutorialStep>('select');
    const [selectedExercise, setSelectedExercise] = useState<ExerciseConfig | null>(null);
    const [isTracking, setIsTracking] = useState(false);
    const [repCount, setRepCount] = useState(0);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [detectionMode, setDetectionMode] = useState<DetectionMode>(
        settings.preferCameraDetection === false ? 'sensor' : 'camera'
    );
    const [motivationalMessage, setMotivationalMessage] = useState<{ text: string; emoji: string } | null>(null);
    const [aiFeedback, setAiFeedback] = useState<string | null>(null);
    const [isPlankActive, setIsPlankActive] = useState(false);
    const [plankSeconds, setPlankSeconds] = useState(0);
    const [plankDebugInfo, setPlankDebugInfo] = useState<PlankDebugInfo | null>(null);
    const [showNewRecord, setShowNewRecord] = useState(false);
    const [personalBest, setPersonalBest] = useState(0);
    const [hasExistingRecord, setHasExistingRecord] = useState(false);
    const [isEllipticalActive, setIsEllipticalActive] = useState(false);
    const [ellipticalSeconds, setEllipticalSeconds] = useState(0);
    const [ellipticalState, setEllipticalState] = useState<EllipticalState | null>(null);
    const [ellipticalCalibrationPhase, setEllipticalCalibrationPhase] = useState<EllipticalCalibrationPhase>('none');
    const [ellipticalCalibrationFailed, setEllipticalCalibrationFailed] = useState(false);
    const [calibrationCountdown, setCalibrationCountdown] = useState(0);
    const [calibrationFunnyPhrase, setCalibrationFunnyPhrase] = useState('');
    const [waitingForMovement, setWaitingForMovement] = useState(false);
    const [showExitModal, setShowExitModal] = useState(false);
    const [workoutSaved, setWorkoutSaved] = useState(false);
    const [showRecoveryModal, setShowRecoveryModal] = useState(false);
    const [recoverySession, setRecoverySession] = useState<ActiveSession | null>(null);

    // ── Refs ───────────────────────────────────────────────────────────────────
    const lastRepTime = useRef(0);
    const baselineZ = useRef(0);
    const calibrationSamples = useRef<number[]>([]);
    const recentValues = useRef<number[]>([]);
    const peakValue = useRef(0);
    const wasAboveThreshold = useRef(false);
    const subscriptionRef = useRef<any>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const plankTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const ellipticalTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const calibrationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const movementDetectionRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const hasBeatenRecord = useRef(false);
    const lastKeepGoingTime = useRef(0);
    const activeRepStartTime = useRef<number | null>(null);
    const repTimelineRef = useRef<RepEventMetadata[]>([]);
    const sessionStartedAtRef = useRef<number>(Date.now());
    const lastRepEndRef = useRef<number | null>(null);
    const timeoutRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

    // ── Animations ─────────────────────────────────────────────────────────────
    const countScale = useSharedValue(1);
    const pulseOpacity = useSharedValue(0);
    const messageOpacity = useSharedValue(0);

    // ── Sounds ─────────────────────────────────────────────────────────────────
    const repSound        = useAudioPlayer(require('../../../assets/rep.mp3'));
    const keepGoingSound  = useAudioPlayer(require('../../../assets/keepgoing.mp3'));
    const secondsSound    = useAudioPlayer(require('../../../assets/seconds.mp3'));
    const newRecordSound  = useAudioPlayer(require('../../../assets/new-record.mp3'));

    const playSound = useCallback((player: any) => {
        try { player.seekTo(0); player.play(); } catch {}
    }, []);

    const playRepSound       = useCallback(() => playSound(repSound), [repSound, playSound]);
    const playKeepGoing      = useCallback(() => playSound(keepGoingSound), [keepGoingSound, playSound]);
    const playSeconds        = useCallback(() => playSound(secondsSound), [secondsSound, playSound]);
    const playNewRecord      = useCallback(() => playSound(newRecordSound), [newRecordSound, playSound]);

    const scheduleTimeout = useCallback((fn: () => void, delayMs: number) => {
        const timeoutId = setTimeout(() => {
            timeoutRefs.current = timeoutRefs.current.filter((existingId) => existingId !== timeoutId);
            fn();
        }, delayMs);

        timeoutRefs.current.push(timeoutId);
        return timeoutId;
    }, []);

    const clearPendingTimeouts = useCallback(() => {
        timeoutRefs.current.forEach((timeoutId) => clearTimeout(timeoutId));
        timeoutRefs.current = [];
    }, []);

    // ── Session recovery ───────────────────────────────────────────────────────
    useEffect(() => {
        getUnfinishedSession().then((session: ActiveSession | null) => {
            if (session) { setRecoverySession(session); setShowRecoveryModal(true); }
        });
    }, []);

    const handleResumeSession = useCallback(() => {
        if (!recoverySession) return;
        const exercise = EXERCISES.find(e => e.id === recoverySession.exerciseId);
        if (!exercise) { setShowRecoveryModal(false); stopSessionTracking(); return; }
        const { roundedTime, roundedReps, roundedPlankSeconds, roundedEllipticalSeconds } = getRoundedSessionData(recoverySession);
        setSelectedExercise(exercise);
        setDetectionMode(recoverySession.detectionMode);
        setRepCount(roundedReps);
        setElapsedTime(roundedTime);
        setPlankSeconds(roundedPlankSeconds);
        setEllipticalSeconds(roundedEllipticalSeconds);
        sessionStartedAtRef.current = Date.now();
        repTimelineRef.current = [];
        activeRepStartTime.current = null;
        lastRepEndRef.current = null;
        setStep('counting');
        setIsTracking(false);
        setShowRecoveryModal(false);
        setRecoverySession(null);
        stopSessionTracking();
    }, [recoverySession]);

    const handleDiscardSession = useCallback(() => {
        setShowRecoveryModal(false);
        setRecoverySession(null);
        repTimelineRef.current = [];
        activeRepStartTime.current = null;
        lastRepEndRef.current = null;
        stopSessionTracking();
    }, []);

    // ── Session data sync ──────────────────────────────────────────────────────
    useEffect(() => {
        if (isTracking && selectedExercise) {
            updateSessionData({ repCount, plankSeconds, ellipticalSeconds, elapsedTime });
        }
    }, [isTracking, repCount, plankSeconds, ellipticalSeconds, elapsedTime, selectedExercise]);

    // ── Personal best ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (!selectedExercise) return;
        const matchingEntries = entries.filter((entry): entry is HomeWorkoutEntry => {
            if (entry.type !== 'home') return false;

            if (entry.trackedExerciseId) {
                return entry.trackedExerciseId === selectedExercise.id;
            }

            return entry.name?.toLowerCase().includes(selectedExercise.name.toLowerCase()) ?? false;
        });

        let best = 0;
        for (const entry of matchingEntries) {
            const val = selectedExercise.isTimeBased
                ? (entry.durationMinutes ?? 0) * 60
                : (entry.totalReps ?? 0);
            if (val > best) best = val;
        }

        setHasExistingRecord(matchingEntries.length > 0);
        setPersonalBest(best);
        hasBeatenRecord.current = false;
    }, [selectedExercise, entries]);

    // ── New record check ───────────────────────────────────────────────────────
    useEffect(() => {
        if (!selectedExercise || hasBeatenRecord.current) return;
        if (!hasExistingRecord || personalBest <= 0) return;

        const cur = selectedExercise.isTimeBased
            ? (selectedExercise.id === 'elliptical' ? ellipticalSeconds : plankSeconds)
            : repCount;

        if (cur > personalBest && cur > 0) {
            hasBeatenRecord.current = true;
            setShowNewRecord(true);
            playNewRecord();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            scheduleTimeout(() => setShowNewRecord(false), 3000);
        }
    }, [repCount, plankSeconds, ellipticalSeconds, personalBest, hasExistingRecord, selectedExercise, playNewRecord, scheduleTimeout]);

    // ── Motivational messages ──────────────────────────────────────────────────
    const showMotivationalMessage = useCallback((feedback?: string) => {
        if (feedback) setAiFeedback(feedback);
        if (selectedExercise) {
            const msgs = t(`repCounter.motivations.${selectedExercise.id}`, { returnObjects: true }) as Array<{ text: string; emoji: string }>;
            if (msgs?.length > 0) setMotivationalMessage(msgs[Math.floor(Math.random() * msgs.length)]);
        }
        messageOpacity.value = withSequence(
            withTiming(1, { duration: 200 }),
            withTiming(1, { duration: 1500 }),
            withTiming(0, { duration: 300 })
        );
        scheduleTimeout(() => { setMotivationalMessage(null); setAiFeedback(null); }, 2000);
    }, [selectedExercise, t, scheduleTimeout]);

    // ── Rep animation ──────────────────────────────────────────────────────────
    const animateRep = useCallback(() => {
        'worklet';
        countScale.value = withSequence(withSpring(1.35, { damping: 5 }), withSpring(1, { damping: 8 }));
        pulseOpacity.value = withSequence(withTiming(0.8, { duration: 80 }), withTiming(0, { duration: 350 }));
    }, []);

    const recordRepEvent = useCallback((repNumber: number, repEvent?: RepEventMetadata) => {
        const now = Date.now();
        const previousRepEnd = lastRepEndRef.current;

        const normalizedEvent: RepEventMetadata = repEvent
            ? {
                ...repEvent,
                repNumber,
                startTimeMs: Math.max(0, repEvent.startTimeMs),
                endTimeMs: Math.max(repEvent.startTimeMs, repEvent.endTimeMs),
                durationMs: Math.max(0, repEvent.durationMs),
                restMsBefore: repEvent.restMsBefore ?? (previousRepEnd == null ? null : Math.max(0, repEvent.startTimeMs - previousRepEnd)),
            }
            : {
                repNumber,
                startTimeMs: previousRepEnd == null ? Math.max(0, now - 500) : previousRepEnd,
                endTimeMs: now,
                durationMs: previousRepEnd == null ? 500 : Math.max(0, now - previousRepEnd),
                restMsBefore: previousRepEnd == null ? null : 0,
            };

        const existingIndex = repTimelineRef.current.findIndex((item) => item.repNumber === repNumber);
        if (existingIndex >= 0) {
            repTimelineRef.current[existingIndex] = normalizedEvent;
        } else {
            repTimelineRef.current.push(normalizedEvent);
        }

        lastRepEndRef.current = normalizedEvent.endTimeMs;
    }, []);

    // ── Increment rep ──────────────────────────────────────────────────────────
    const incrementRep = useCallback((repEvent?: RepEventMetadata) => {
        setRepCount(prev => {
            const n = prev + 1;
            recordRepEvent(n, repEvent);
            if (n > 0 && n % 10 === 0) playKeepGoing();
            return n;
        });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        playRepSound();
        showMotivationalMessage();
        animateRep();
    }, [animateRep, playRepSound, showMotivationalMessage, playKeepGoing, recordRepEvent]);

    // ── Camera rep detected ────────────────────────────────────────────────────
    const handleCameraRepDetected = useCallback((newCount: number, feedback?: string, repEvent?: RepEventMetadata) => {
        if (!isTracking || newCount <= repCount) return;
        if (newCount > 0 && newCount % 10 === 0) playKeepGoing();
        setRepCount((prev) => {
            if (newCount <= prev) return prev;
            recordRepEvent(newCount, repEvent);
            return newCount;
        });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        playRepSound();
        showMotivationalMessage(feedback);
        animateRep();
    }, [isTracking, repCount, animateRep, playRepSound, showMotivationalMessage, playKeepGoing, recordRepEvent]);

    // ── Plank state change ─────────────────────────────────────────────────────
    const handlePlankStateChange = useCallback((isInPlank: boolean, confidence: number, debugInfo?: PlankDebugInfo) => {
        if (!isTracking || !selectedExercise?.isTimeBased) return;
        if (debugInfo) setPlankDebugInfo(debugInfo);
        if (isInPlank && !isPlankActive) {
            setIsPlankActive(true);
        } else if (!isInPlank && isPlankActive) {
            setIsPlankActive(false);
        }
    }, [isTracking, selectedExercise?.isTimeBased, isPlankActive, plankSeconds, showMotivationalMessage]);

    // ── Main timer ─────────────────────────────────────────────────────────────
    useEffect(() => {
        if (isTracking) {
            timerRef.current = setInterval(() => setElapsedTime(p => p + 1), 1000);
        } else if (timerRef.current) clearInterval(timerRef.current);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [isTracking]);

    // ── Plank timer ────────────────────────────────────────────────────────────
    useEffect(() => {
        if (isTracking && selectedExercise?.isTimeBased && isPlankActive) {
            plankTimerRef.current = setInterval(() => {
                setPlankSeconds(p => {
                    const n = p + 1;
                    playSeconds();
                    if (n > 0 && n % 10 === 0) { playKeepGoing(); showMotivationalMessage(); }
                    return n;
                });
            }, 1000);
        } else if (plankTimerRef.current) clearInterval(plankTimerRef.current);
        return () => { if (plankTimerRef.current) clearInterval(plankTimerRef.current); };
    }, [isTracking, selectedExercise?.isTimeBased, isPlankActive, playSeconds, playKeepGoing, showMotivationalMessage]);

    // ── Elliptical state change ────────────────────────────────────────────────
    const handleEllipticalStateChange = useCallback((state: EllipticalState) => {
        if (!state || typeof state.isMoving !== 'boolean') return;
        setEllipticalState(state);
        if (!isTracking || selectedExercise?.id !== 'elliptical') return;
        if (detectionMode !== 'camera' || !isEllipticalCalibrated()) return;
        if (state.isMoving && !isEllipticalActive) setIsEllipticalActive(true);
        else if (!state.isMoving && isEllipticalActive) setIsEllipticalActive(false);
    }, [isTracking, selectedExercise?.id, detectionMode, isEllipticalActive, ellipticalSeconds, showMotivationalMessage, t]);

    // ── Elliptical timer ───────────────────────────────────────────────────────
    useEffect(() => {
        if (isTracking && selectedExercise?.id === 'elliptical' && isEllipticalActive) {
            ellipticalTimerRef.current = setInterval(() => {
                setEllipticalSeconds(p => {
                    const n = p + 1;
                    const now = Date.now();
                    const interval = (settings.keepGoingIntervalMinutes ?? 5) * 60;
                    if (n > 0 && n % interval === 0 && now - lastKeepGoingTime.current > 60000) {
                        playKeepGoing(); showMotivationalMessage(); lastKeepGoingTime.current = now;
                    }
                    return n;
                });
            }, 1000);
        } else if (ellipticalTimerRef.current) clearInterval(ellipticalTimerRef.current);
        return () => { if (ellipticalTimerRef.current) clearInterval(ellipticalTimerRef.current); };
    }, [isTracking, selectedExercise?.id, isEllipticalActive, playKeepGoing, showMotivationalMessage]);

    // ── Elliptical calibration helpers ─────────────────────────────────────────
    const getRandomPhrase = useCallback((key: 'funnyStillPhrases' | 'funnyStillDone') => {
        const phrases = t(`repCounter.elliptical.${key}`, { returnObjects: true }) as string[];
        return phrases[Math.floor(Math.random() * phrases.length)];
    }, [t]);

    const completePedalingPhase = useCallback(() => {
        const success = completeEllipticalPedalingPhase();
        if (success) {
            setEllipticalCalibrationPhase('complete');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            playNewRecord();
            scheduleTimeout(() => {
                setStep('counting'); setIsTracking(true);
                setEllipticalSeconds(0); setIsEllipticalActive(false);
                lastKeepGoingTime.current = 0;
            }, 2000);
        } else {
            setEllipticalCalibrationPhase('intro'); setEllipticalCalibrationFailed(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
    }, [playNewRecord, scheduleTimeout]);

    const startPedalingCountdown = useCallback(() => {
        resetEllipticalSamples();
        setCalibrationCountdown(7);
        scheduleTimeout(() => {
            countdownIntervalRef.current = setInterval(() => {
                setCalibrationCountdown(p => {
                    if (p <= 1) { clearInterval(countdownIntervalRef.current!); completePedalingPhase(); return 0; }
                    return p - 1;
                });
            }, 1000);
        }, 1000);
    }, [completePedalingPhase, scheduleTimeout]);

    const waitForUserToStartPedaling = useCallback(() => {
        setEllipticalCalibrationPhase('pedaling');
        resetEllipticalSamples();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setWaitingForMovement(true);
        setCalibrationCountdown(7);
        movementDetectionRef.current = setInterval(() => {
            if (hasEllipticalMovementStarted()) {
                clearInterval(movementDetectionRef.current!);
                movementDetectionRef.current = null;
                setWaitingForMovement(false);
                startPedalingCountdown();
            }
        }, 200);
    }, [startPedalingCountdown]);

    const completeStillPhase = useCallback(() => {
        const variance = completeEllipticalStillPhase();
        if (variance >= 0) {
            setCalibrationFunnyPhrase(getRandomPhrase('funnyStillDone'));
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            scheduleTimeout(() => waitForUserToStartPedaling(), 1500);
        } else {
            setEllipticalCalibrationPhase('intro'); setEllipticalCalibrationFailed(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
    }, [getRandomPhrase, waitForUserToStartPedaling, scheduleTimeout]);

    const startStillPhase = useCallback(() => {
        setEllipticalCalibrationPhase('still');
        setCalibrationFunnyPhrase(getRandomPhrase('funnyStillPhrases'));
        startEllipticalStillFirstCalibration();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setCalibrationCountdown(5);
        scheduleTimeout(() => {
            countdownIntervalRef.current = setInterval(() => {
                setCalibrationCountdown(p => {
                    if (p <= 1) { clearInterval(countdownIntervalRef.current!); completeStillPhase(); return 0; }
                    return p - 1;
                });
            }, 1000);
        }, 1000);
    }, [getRandomPhrase, completeStillPhase, scheduleTimeout]);

    const beginCalibrationSequence = useCallback(() => {
        setEllipticalCalibrationPhase('get_ready');
        setCalibrationCountdown(3);
        playSeconds();
        scheduleTimeout(() => {
            countdownIntervalRef.current = setInterval(() => {
                setCalibrationCountdown(p => {
                    if (p <= 1) { clearInterval(countdownIntervalRef.current!); startStillPhase(); return 0; }
                    playSeconds(); return p - 1;
                });
            }, 1000);
        }, 1000);
    }, [playSeconds, startStillPhase, scheduleTimeout]);

    const startEllipticalCalibration = useCallback(() => {
        setEllipticalCalibrationFailed(false);
        resetEllipticalState();
        setEllipticalCalibrationPhase('intro');
    }, []);

    // Cleanup
    useEffect(() => {
        return () => {
            [countdownIntervalRef, movementDetectionRef].forEach(r => { if (r.current) clearInterval(r.current); });
            clearPendingTimeouts();
        };
    }, [clearPendingTimeouts]);

    // ── Start tracking ─────────────────────────────────────────────────────────
    const startTracking = useCallback(async () => {
        if (!selectedExercise) return;
        const isResuming = repCount > 0 || plankSeconds > 0 || ellipticalSeconds > 0 || elapsedTime > 0;

        if (!isResuming) {
            const shouldKeepEllipticalCalibration =
                selectedExercise.id === 'elliptical' && detectionMode === 'camera';

            if (!shouldKeepEllipticalCalibration) {
                resetExerciseState(selectedExercise.id as ExerciseType);
            }

            sessionStartedAtRef.current = Date.now();
            repTimelineRef.current = [];
            activeRepStartTime.current = null;
            lastRepEndRef.current = null;
        }

        setIsTracking(true);
        startSessionTracking({
            exerciseId: selectedExercise.id as any,
            exerciseName: t(`repCounter.exercises.${selectedExercise.id}`),
            exerciseEmoji: selectedExercise.icon,
            detectionMode,
            repCount: isResuming ? repCount : 0,
            plankSeconds: isResuming ? plankSeconds : 0,
            ellipticalSeconds: isResuming ? ellipticalSeconds : 0,
            elapsedTime: isResuming ? elapsedTime : 0,
            isTimeBased: selectedExercise.isTimeBased ?? false,
        });
        if (!isResuming) {
            setRepCount(0); setElapsedTime(0); setPlankSeconds(0); setEllipticalSeconds(0);
            setIsPlankActive(false); setIsEllipticalActive(false);
            hasBeatenRecord.current = false; calibrationSamples.current = [];
            recentValues.current = []; peakValue.current = 0;
            wasAboveThreshold.current = false; lastKeepGoingTime.current = 0;
            setShowNewRecord(false);
        }
        // Camera or elliptical/plank modes don't use accelerometer
        if (selectedExercise.id === 'elliptical' && (detectionMode === 'camera' || detectionMode === 'manual')) {
            if (detectionMode === 'manual') setIsEllipticalActive(true);
            return;
        }
        if (selectedExercise.isTimeBased && detectionMode === 'camera') return;
        if (detectionMode === 'camera') return;

        // Accelerometer mode
        Accelerometer.setUpdateInterval(30);
        let calibrationCount = 0;
        const CALIBRATION_SAMPLES = 15;
        subscriptionRef.current = Accelerometer.addListener((data: AccelerometerMeasurement) => {
            const now = Date.now();
            const value = data[selectedExercise.axis];
            if (calibrationCount < CALIBRATION_SAMPLES) {
                calibrationSamples.current.push(value);
                if (++calibrationCount === CALIBRATION_SAMPLES) {
                    baselineZ.current = calibrationSamples.current.reduce((a, b) => a + b, 0) / CALIBRATION_SAMPLES;
                }
                return;
            }
            recentValues.current.push(value);
            if (recentValues.current.length > 3) recentValues.current.shift();
            const smoothed = recentValues.current.reduce((a, b) => a + b, 0) / recentValues.current.length;
            const delta = Math.abs(smoothed - baselineZ.current);
            const { threshold, cooldown } = selectedExercise;
            if (delta > threshold) {
                if (!wasAboveThreshold.current) {
                    activeRepStartTime.current = now;
                }
                if (delta > peakValue.current) peakValue.current = delta;
                wasAboveThreshold.current = true;
            } else if (wasAboveThreshold.current && delta < threshold * 0.4) {
                if ((now - lastRepTime.current) > cooldown && peakValue.current > threshold * 1.2) {
                    lastRepTime.current = now;
                    const repStart = activeRepStartTime.current ?? now;
                    const normalizedStart = Math.max(lastRepEndRef.current ?? 0, repStart);
                    runOnJS(incrementRep)({
                        repNumber: 0,
                        startTimeMs: normalizedStart,
                        endTimeMs: now,
                        durationMs: Math.max(0, now - normalizedStart),
                        restMsBefore: lastRepEndRef.current == null ? null : Math.max(0, normalizedStart - lastRepEndRef.current),
                    });
                }
                activeRepStartTime.current = null;
                wasAboveThreshold.current = false; peakValue.current = 0;
            }
        });
    }, [selectedExercise, incrementRep, detectionMode, repCount, plankSeconds, ellipticalSeconds, elapsedTime, t]);

    // ── Stop tracking ──────────────────────────────────────────────────────────
    const stopTracking = useCallback(() => {
        setIsTracking(false); setIsPlankActive(false); setIsEllipticalActive(false);
        subscriptionRef.current?.remove(); subscriptionRef.current = null;
        [plankTimerRef, ellipticalTimerRef, calibrationTimerRef].forEach(r => {
            if (r.current) { clearInterval(r.current); r.current = null; }
        });
        clearPendingTimeouts();
    }, [clearPendingTimeouts]);

    // ── Save workout ───────────────────────────────────────────────────────────
    const saveWorkout = useCallback(async () => {
        if (!selectedExercise) return;
        const isElliptical = selectedExercise.id === 'elliptical';
        const seconds = isElliptical ? ellipticalSeconds : plankSeconds;
        const valueToCheck = selectedExercise.isTimeBased ? seconds : repCount;
        if (valueToCheck === 0) return;

        await stopSessionTracking();
        await playSessionEndSound();

        const exerciseId = selectedExercise.id;
        const displayName = t(`repCounter.exercises.${exerciseId}`);
        const formattedTime = selectedExercise.isTimeBased
            ? `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`
            : null;
        const exerciseText = selectedExercise.isTimeBased
            ? `${displayName}: ${formattedTime}`
            : `${displayName}: ${repCount} ${t('common.reps')}`;
        const durationMinutes = selectedExercise.isTimeBased
            ? Math.ceil(seconds / 60)
            : Math.floor(elapsedTime / 60);

        const hasRepTimeline = !selectedExercise.isTimeBased && repTimelineRef.current.length > 0;
        const repTimeline = hasRepTimeline
            ? {
                sessionStartedAt: new Date(sessionStartedAtRef.current).toISOString(),
                sessionEndedAt: new Date().toISOString(),
                reps: [...repTimelineRef.current].sort((a, b) => a.repNumber - b.repNumber),
            }
            : undefined;

        addHomeWorkout({
            name: t('repCounter.trackedSession', { exercise: displayName }),
            exercises: exerciseText,
            trackedExerciseId: exerciseId,
            totalReps: selectedExercise.isTimeBased ? undefined : repCount,
            durationMinutes: durationMinutes > 0 ? durationMinutes : 1,
            repTimeline,
        });
        setWorkoutSaved(true);
    }, [selectedExercise, repCount, plankSeconds, ellipticalSeconds, elapsedTime, addHomeWorkout, t]);

    // ── Reset after save ───────────────────────────────────────────────────────
    useEffect(() => {
        if (!workoutSaved) return;
        scheduleTimeout(() => {
            setRepCount(0); setElapsedTime(0); setPlankSeconds(0); setEllipticalSeconds(0);
            setIsPlankActive(false); setIsEllipticalActive(false);
            setEllipticalCalibrationPhase('none'); resetEllipticalState();
            hasBeatenRecord.current = false; setWorkoutSaved(false);
            setShowNewRecord(false);
            repTimelineRef.current = [];
            activeRepStartTime.current = null;
            lastRepEndRef.current = null;
            setStep('select'); setSelectedExercise(null);
        }, 200);
    }, [workoutSaved, scheduleTimeout]);

    const finishWorkout = useCallback(() => { stopTracking(); setStep('done'); }, [stopTracking]);

    const resetWorkout = useCallback(() => {
        stopTracking();
        setRepCount(0); setElapsedTime(0); setPlankSeconds(0); setEllipticalSeconds(0);
        setIsPlankActive(false); setIsEllipticalActive(false);
        setEllipticalCalibrationPhase('none'); resetEllipticalState();
        hasBeatenRecord.current = false;
        setShowNewRecord(false);
        repTimelineRef.current = [];
        activeRepStartTime.current = null;
        lastRepEndRef.current = null;
        setStep('select'); setSelectedExercise(null);
    }, [stopTracking]);

    // ── Exercise select ────────────────────────────────────────────────────────
    const handleExerciseSelect = useCallback((exercise: ExerciseConfig) => {
        // Navigational exercises: redirect to separate screens
        if (exercise.isNavigational) {
            if (exercise.id === 'run') router.push('/run/simple' as any);
            else if (exercise.id === 'run_ai') router.push('/run/ai' as any);
            return;
        }

        const prefersCamera = settings.preferCameraDetection !== false;
        const shouldSkipSelection = settings.skipSensorSelection !== false;

        setSelectedExercise(exercise);

        if (exercise.id === 'elliptical') {
            setDetectionMode(prefersCamera ? 'camera' : 'manual');
        } else if (exercise.isTimeBased) {
            setDetectionMode('camera');
        } else {
            setDetectionMode(prefersCamera ? 'camera' : 'sensor');
        }

        resetEllipticalState(); setEllipticalCalibrationPhase('none');

        if (shouldSkipSelection) {
            scheduleTimeout(() => setStep('position'), 100);
        }
    }, [settings.skipSensorSelection, settings.preferCameraDetection, scheduleTimeout]);

    const handleNext = useCallback(() => {
        if (step === 'select' && selectedExercise) {
            if (selectedExercise.id === 'elliptical' && detectionMode === 'camera') {
                setStep('position'); startEllipticalCalibration();
            } else setStep('position');
        } else if (step === 'position') {
            setStep('counting'); startTracking();
        }
    }, [step, selectedExercise, detectionMode, startTracking, startEllipticalCalibration]);

    const handleExitConfirm = useCallback(async () => {
        setIsTracking(false);
        subscriptionRef.current?.remove(); subscriptionRef.current = null;
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        clearPendingTimeouts();
        await stopSessionTracking();
        setShowExitModal(false); setStep('select'); setSelectedExercise(null);
        setRepCount(0); setElapsedTime(0);
        setShowNewRecord(false);
        repTimelineRef.current = [];
        activeRepStartTime.current = null;
        lastRepEndRef.current = null;
    }, [clearPendingTimeouts]);

    const toggleEllipticalManual = useCallback(() => {
        if (detectionMode !== 'manual') return;
        setIsEllipticalActive(p => !p);
    }, [detectionMode]);

    // ── Utilities ──────────────────────────────────────────────────────────────
    const formatTime = (seconds: number) =>
        `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;

    const getCalories = () => {
        if (!selectedExercise) return 0;
        if (selectedExercise.id === 'elliptical') return Math.round((ellipticalSeconds / 60) * 8);
        if (selectedExercise.isTimeBased) return Math.round((plankSeconds / 60) * 4);
        return Math.round(repCount * 0.5);
    };

    const getProgress = () => {
        if (!selectedExercise || settings.hideProgressRing) return 0;
        if (selectedExercise.id === 'elliptical') return (ellipticalSeconds % 300) / 300;
        if (selectedExercise.isTimeBased) return (plankSeconds % 60) / 60;
        return (repCount % 100) / 100;
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            subscriptionRef.current?.remove();
            [timerRef, plankTimerRef, ellipticalTimerRef, calibrationTimerRef].forEach(r => {
                if (r.current) clearInterval(r.current);
            });
            clearPendingTimeouts();
        };
    }, [clearPendingTimeouts]);

    return {
        // State
        step, setStep,
        selectedExercise,
        isTracking,
        repCount,
        elapsedTime,
        detectionMode, setDetectionMode,
        motivationalMessage,
        aiFeedback,
        isPlankActive,
        plankSeconds,
        plankDebugInfo,
        showNewRecord,
        personalBest,
        isEllipticalActive,
        ellipticalSeconds,
        ellipticalCalibrationPhase,
        ellipticalCalibrationFailed,
        calibrationCountdown,
        calibrationFunnyPhrase,
        waitingForMovement,
        showExitModal, setShowExitModal,
        showRecoveryModal,
        recoverySession,
        workoutSaved,
        setWorkoutSaved,
        // Animations
        countScale, pulseOpacity, messageOpacity,
        // Handlers
        handleExerciseSelect,
        handleNext,
        handleExitConfirm,
        handleExitCancel: () => setShowExitModal(false),
        handleResumeSession,
        handleDiscardSession,
        handleCameraRepDetected,
        handlePlankStateChange,
        handleEllipticalStateChange,
        toggleEllipticalManual,
        startTracking,
        stopTracking,
        finishWorkout,
        resetWorkout,
        saveWorkout,
        beginCalibrationSequence,
        // Utilities
        formatTime,
        getCalories,
        getProgress,
        // Config
        settings,
    };
}
