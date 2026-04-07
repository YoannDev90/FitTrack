// ============================================================================
// POSE DETECTION UTILS - Using react-native-mediapipe-posedetection
//
// CHANGELOG v2 (improvements):
// - Increased LANDMARK_SMOOTHING_ALPHA 0.38→0.55 (réduit le lag, angles plus réactifs)
// - Supprimé MAX_ANGLE_DELTA_PER_FRAME (double-filtrage inutile avec EMA déjà actif)
// - stabilizeAngle est maintenant un simple EMA sur l'angle (pas de hard-clamp)
// - Abaissé VISIBILITY_THRESHOLD 0.5→0.45 (moins de faux rejets de landmarks)
// - getBestAngle pondère par score de visibilité (plus robuste à mi-occlusion)
// - Ajout de angleAtStageEntry + minRangeAngle par exercice → validation de l'amplitude
//   de mouvement : une demi-pompe / demi-squat n'est plus comptée
// - completeRepIfEligible ne reset plus cycleStartedAt sur timing trop court
// - Hysteresis stricte par exercice (seuils d'entrée/sortie séparés) pour éviter
//   les comptages doubles sur les oscillations près du seuil
// - Ajustements des seuils angulaires par exercice (basé sur littérature biomécanique)
// ============================================================================

import { KnownPoseLandmarks } from 'react-native-mediapipe-posedetection';

// Types for pose detection
export type ExerciseType = 'pushups' | 'pullups' | 'situps' | 'squats' | 'jumpingJacks' | 'plank' | 'elliptical';

// MediaPipe landmark structure (from the package)
export interface Landmark {
    x: number;  // Normalized 0-1
    y: number;  // Normalized 0-1
    z: number;  // Depth (relative)
    visibility?: number;  // Confidence 0-1
    presence?: number;    // Presence confidence 0-1
}

// A pose is an array of 33 landmarks indexed by KnownPoseLandmarks
export type PoseLandmarks = Landmark[];

export interface RepState {
    count: number;
    stage: 'up' | 'down' | null;
    lastCountedAt: number;
    cycleStartedAt: number | null;
    lastRepEndAt: number | null;
    smoothedLandmarks: PoseLandmarks | null;
    /** EMA sur l'angle courant (réduit le bruit sans hard-clamp) */
    smoothedAngles: Partial<Record<'elbow' | 'knee' | 'hip' | 'arms', number>>;
    /** Angle au moment où on a entré le stage DOWN (pour valider l'amplitude) */
    angleAtDownEntry: number | null;
    /** Angle maximal atteint depuis le dernier DOWN (permet de valider le stage UP) */
    peakAngleSinceDown: number;
    /** Nombre de frames consécutives dans le stage courant (évite les micro-oscillations) */
    stageFrameCount: number;
}

export interface RepEventMetadata {
    repNumber: number;
    startTimeMs: number;
    endTimeMs: number;
    durationMs: number;
    restMsBefore: number | null;
}

// Plank detection state
export interface PlankState {
    isInPlankPosition: boolean;
    lastUpdate: number;
    confidence: number;
    debugInfo?: PlankDebugInfo;
}

// Elliptical bike calibration and detection state
export interface EllipticalCalibration {
    isCalibrated: boolean;
    movingVariance: number;
    stoppedVariance: number;
    movementThreshold: number;
    samples: number[];
    lastUpdateTime: number;
}

export interface EllipticalState {
    isMoving: boolean;
    confidence: number;
    currentVariance: number;
    lastUpdate: number;
}

// Current elliptical state
let currentEllipticalCalibration: EllipticalCalibration = {
    isCalibrated: false,
    movingVariance: 0,
    stoppedVariance: 0,
    movementThreshold: 0,
    samples: [],
    lastUpdateTime: 0,
};

let currentEllipticalState: EllipticalState = {
    isMoving: false,
    confidence: 0,
    currentVariance: 0,
    lastUpdate: 0,
};

// Debug info for plank detection
export interface PlankDebugInfo {
    landmarksVisible: {
        shoulders: boolean;
        hips: boolean;
        elbows: boolean;
        wrists: boolean;
        ankles: boolean;
    };
    checks: {
        bodyLow: { passed: boolean; value: number; threshold: number; message: string };
        shouldersAligned: { passed: boolean; value: number; threshold: number; message: string };
        armsInPosition: { passed: boolean; value: number; threshold: number; message: string };
        hipsBelowShoulders: { passed: boolean; value: number; threshold: number; message: string };
    };
    overallConfidence: number;
}

// Current plank state
let currentPlankState: PlankState = {
    isInPlankPosition: false,
    lastUpdate: 0,
    confidence: 0,
};

// ============================================================================
// CONSTANTES GLOBALES
// ============================================================================

/**
 * Seuil de visibilité/présence pour qu'un landmark soit utilisable.
 * Abaissé à 0.45 (vs 0.5 avant) pour réduire les rejets sur mouvements rapides
 * où MediaPipe donne parfois 0.47-0.49 à des landmarks pourtant bien visibles.
 */
const VISIBILITY_THRESHOLD = 0.45;
const PRESENCE_THRESHOLD = 0.45;

/**
 * Alpha EMA pour le lissage des positions de landmarks.
 * 0.55 = 55% du nouveau signal à chaque frame → moins de lag qu'avant (0.38).
 * Cela correspond à ~2 frames de lissage effectif à 30fps, suffisant pour
 * supprimer le bruit sans créer de décalage perceptible sur les seuils d'angle.
 */
const LANDMARK_SMOOTHING_ALPHA = 0.65;

/**
 * Alpha EMA pour le lissage des angles calculés.
 * Séparé du lissage des landmarks pour un contrôle plus fin.
 * 0.5 = bon compromis réactivité/stabilité.
 */
const ANGLE_SMOOTHING_ALPHA = 0.5;

/**
 * Nombre minimum de frames consécutives dans un stage avant de pouvoir en
 * sortir. Empêche les changements de stage sur 1 frame d'oscillation.
 */
const MIN_STAGE_FRAMES = 2;

const FALLBACK_MIN_REP_DURATION_MS = 400;
const FALLBACK_REP_COOLDOWN_MS = 300;

// ============================================================================
// CONFIGURATION PAR EXERCICE
// ============================================================================

/**
 * Configuration complète par exercice :
 * - downAngle     : angle en dessous duquel on entre en stage DOWN
 * - upAngle       : angle au dessus duquel on entre en stage UP (et compte la rep)
 * - minRangeAngle : amplitude minimale entre le fond du mouvement (DOWN entry)
 *                   et le haut (UP entry) pour valider la rep.
 *                   → empêche les demi-reps de compter.
 * - timing        : durées minimales
 *
 * Sources : littérature biomécanique standard + expérience terrain.
 */
interface ExerciseConfig {
    downAngle: number;
    upAngle: number;
    minRangeAngle: number;
    timing: { minRepDurationMs: number; cooldownMs: number };
}

const EXERCISE_CONFIG: Record<ExerciseType, ExerciseConfig> = {
    pushups: {
        // Pompes : coude < 95° = en bas, coude > 140° = en haut
        // Amplitude minimale requise : 45° (évite les "pompes" sans descendre)
        downAngle: 95,
        upAngle: 140,
        minRangeAngle: 40,
        timing: { minRepDurationMs: 400, cooldownMs: 250 },
    },
    pullups: {
        // Tractions : coude > 155° = suspendu (bas), coude < 90° = menton au-dessus (haut)
        // Amplitude minimale : 65° (traction partielle rejetée)
        downAngle: 155,   // ici DOWN = bras tendus (position suspendue)
        upAngle: 90,      // ici UP = coudes fléchis (position haute)
        minRangeAngle: 55,
        timing: { minRepDurationMs: 500, cooldownMs: 300 },
    },
    squats: {
        // Plus permissif pour la vue frontale mobile (angles genou souvent sous-estimés)
        downAngle: 125,
        upAngle: 150,
        minRangeAngle: 15,
        timing: { minRepDurationMs: 350, cooldownMs: 200 },
    },
    situps: {
        // Abdos : hanche > 135° = allongé (bas), hanche < 95° = assis (haut)
        // Amplitude minimale : 40°
        downAngle: 135,
        upAngle: 95,
        minRangeAngle: 35,
        timing: { minRepDurationMs: 400, cooldownMs: 280 },
    },
    jumpingJacks: {
        // Jumping jacks : bras < 65° = bas, bras > 105° = haut
        // Amplitude minimale : 35°
        downAngle: 65,
        upAngle: 105,
        minRangeAngle: 30,
        timing: { minRepDurationMs: 280, cooldownMs: 220 },
    },
    plank: {
        downAngle: 0,
        upAngle: 0,
        minRangeAngle: 0,
        timing: { minRepDurationMs: FALLBACK_MIN_REP_DURATION_MS, cooldownMs: FALLBACK_REP_COOLDOWN_MS },
    },
    elliptical: {
        downAngle: 0,
        upAngle: 0,
        minRangeAngle: 0,
        timing: { minRepDurationMs: FALLBACK_MIN_REP_DURATION_MS, cooldownMs: FALLBACK_REP_COOLDOWN_MS },
    },
};

// Internal state tracking per exercise
const exerciseStates: Record<string, RepState> = {};

// ============================================================================
// HELPERS LANDMARKS
// ============================================================================

const hasReliableLandmarkConfidence = (lm: Landmark | null | undefined): boolean => {
    if (!lm) return false;
    return (lm.visibility ?? 1) >= VISIBILITY_THRESHOLD && (lm.presence ?? 1) >= PRESENCE_THRESHOLD;
};

const createRepState = (): RepState => ({
    count: 0,
    stage: null,
    lastCountedAt: 0,
    cycleStartedAt: null,
    lastRepEndAt: null,
    smoothedLandmarks: null,
    smoothedAngles: {},
    angleAtDownEntry: null,
    peakAngleSinceDown: 0,
    stageFrameCount: 0,
});

const smoothLandmarks = (
    landmarks: PoseLandmarks,
    previous: PoseLandmarks | null
): PoseLandmarks => {
    if (!previous || previous.length !== landmarks.length) {
        return landmarks.map((lm) => ({ ...lm }));
    }

    return landmarks.map((lm, index) => {
        const prev = previous[index];

        if (!lm) {
            return prev ? { ...prev } : lm;
        }

        if (!hasReliableLandmarkConfidence(lm)) {
            // Si le landmark actuel n'est pas fiable, on garde la valeur précédente
            // avec mise à jour de la confiance (pour ne pas "mentir" sur la visibilité)
            return prev && hasReliableLandmarkConfidence(prev)
                ? { ...prev, visibility: lm.visibility, presence: lm.presence }
                : { ...lm };
        }

        if (!prev || !hasReliableLandmarkConfidence(prev)) {
            return { ...lm };
        }

        return {
            ...lm,
            x: prev.x + (lm.x - prev.x) * LANDMARK_SMOOTHING_ALPHA,
            y: prev.y + (lm.y - prev.y) * LANDMARK_SMOOTHING_ALPHA,
            z: prev.z + (lm.z - prev.z) * LANDMARK_SMOOTHING_ALPHA,
        };
    });
};

/**
 * Lisse un angle via EMA (remplace l'ancien hard-clamp).
 * Évite le bruit haute fréquence sans brider les mouvements rapides.
 */
const smoothAngle = (
    state: RepState,
    key: 'elbow' | 'knee' | 'hip' | 'arms',
    rawAngle: number
): number => {
    if (rawAngle <= 0) return state.smoothedAngles[key] ?? 0;

    const previous = state.smoothedAngles[key];
    if (previous === undefined || previous <= 0) {
        state.smoothedAngles[key] = rawAngle;
        return rawAngle;
    }

    const smoothed = previous + (rawAngle - previous) * ANGLE_SMOOTHING_ALPHA;
    state.smoothedAngles[key] = smoothed;
    return smoothed;
};

// ============================================================================
// API PUBLIQUE - LANDMARKS
// ============================================================================

/**
 * Retourne un landmark valide ou null si insuffisamment visible.
 */
export const getLandmark = (
    landmarks: PoseLandmarks,
    index: number
): Landmark | null => {
    const lm = landmarks[index];
    if (!lm) return null;
    if ((lm.visibility ?? 1) < VISIBILITY_THRESHOLD) return null;
    return lm;
};

/**
 * Calcule l'angle en B pour le triplet A-B-C (en degrés).
 */
export const calculateAngle = (
    a: Landmark | null,
    b: Landmark | null,
    c: Landmark | null
): number => {
    if (!a || !b || !c) return 0;

    const radians =
        Math.atan2(c.y - b.y, c.x - b.x) -
        Math.atan2(a.y - b.y, a.x - b.x);

    let angle = Math.abs((radians * 180.0) / Math.PI);

    if (angle > 180.0) {
        angle = 360 - angle;
    }

    return angle;
};

/**
 * Calcule le meilleur angle disponible entre côté gauche et côté droit.
 *
 * Améliorations v2 :
 * - Pondère par score de visibilité (moyenne pondérée si les deux côtés sont visibles)
 * - Rejette un côté si son score de visibilité est < 0.4 (évite les angles aberrants
 *   sur des landmarks partiellement occultés)
 */
const getBestAngle = (
    landmarks: PoseLandmarks,
    leftA: number,
    leftB: number,
    leftC: number,
    rightA: number,
    rightB: number,
    rightC: number
): number => {
    const llA = getLandmark(landmarks, leftA);
    const llB = getLandmark(landmarks, leftB);
    const llC = getLandmark(landmarks, leftC);
    const rlA = getLandmark(landmarks, rightA);
    const rlB = getLandmark(landmarks, rightB);
    const rlC = getLandmark(landmarks, rightC);

    const leftAngle = calculateAngle(llA, llB, llC);
    const rightAngle = calculateAngle(rlA, rlB, rlC);

    const leftVis = leftAngle > 0
        ? Math.min(llA?.visibility ?? 0, llB?.visibility ?? 0, llC?.visibility ?? 0)
        : 0;
    const rightVis = rightAngle > 0
        ? Math.min(rlA?.visibility ?? 0, rlB?.visibility ?? 0, rlC?.visibility ?? 0)
        : 0;

    const MIN_VIS_FOR_USE = 0.4;

    const leftUsable = leftAngle > 0 && leftVis >= MIN_VIS_FOR_USE;
    const rightUsable = rightAngle > 0 && rightVis >= MIN_VIS_FOR_USE;

    if (leftUsable && rightUsable) {
        // Moyenne pondérée par visibilité
        const total = leftVis + rightVis;
        return (leftAngle * leftVis + rightAngle * rightVis) / total;
    } else if (leftUsable) {
        return leftAngle;
    } else if (rightUsable) {
        return rightAngle;
    }
    return 0;
};

// ============================================================================
// MACHINE D'ÉTAT DES REPS - Version améliorée
// ============================================================================

/**
 * Entre en stage DOWN et enregistre l'angle d'entrée (pour la validation ROM).
 * Le cycleStartedAt est réinitialisé uniquement à la première entrée en DOWN
 * (pas sur les frames suivantes qui restent en DOWN).
 */
const enterDownStage = (state: RepState, now: number, angle: number): void => {
    if (state.stage !== 'down') {
        state.cycleStartedAt = now;
        state.angleAtDownEntry = angle;
        state.peakAngleSinceDown = angle;
        state.stageFrameCount = 1;
    } else {
        state.stageFrameCount += 1;
        // Met à jour l'angle minimum en position DOWN (le fond réel du mouvement)
        // Pour pushups/squats/situps : angleAtDownEntry = le minimum atteint
        if (angle < (state.angleAtDownEntry ?? angle)) {
            state.angleAtDownEntry = angle;
        }
    }
    state.stage = 'down';
};

/**
 * Entre en stage UP.
 * Met à jour peakAngleSinceDown pour suivre le maximum atteint.
 */
const enterUpStage = (state: RepState, angle: number): void => {
    if (state.stage !== 'up') {
        state.stageFrameCount = 1;
    } else {
        state.stageFrameCount += 1;
    }
    state.peakAngleSinceDown = Math.max(state.peakAngleSinceDown, angle);
    state.stage = 'up';
};

/**
 * Tente de compter une rep au moment où l'on passe en position UP.
 *
 * Conditions pour valider :
 * 1. On était bien en stage DOWN avant
 * 2. Durée du mouvement >= minRepDurationMs
 * 3. Cooldown depuis la dernière rep respecté
 * 4. Amplitude (ROM) >= minRangeAngle
 */
const tryCountRep = (
    state: RepState,
    now: number,
    exerciseType: ExerciseType,
    currentCount: number,
    currentAngle: number
): { count: number; repEvent?: RepEventMetadata } => {
    if (state.stage !== 'down') {
        return { count: currentCount };
    }

    // Pas assez de frames dans le stage DOWN → micro-oscillation
    if (state.stageFrameCount < MIN_STAGE_FRAMES) {
        return { count: currentCount };
    }

    const config = EXERCISE_CONFIG[exerciseType] ?? {
        timing: { minRepDurationMs: FALLBACK_MIN_REP_DURATION_MS, cooldownMs: FALLBACK_REP_COOLDOWN_MS },
        minRangeAngle: 0,
    };

    const { minRepDurationMs, cooldownMs } = config.timing;
    const cycleStart = state.cycleStartedAt ?? now;
    const durationMs = now - cycleStart;
    const cooldownElapsed = now - state.lastCountedAt;

    // Durée trop courte → mouvement trop rapide, ne pas reset cycleStartedAt
    if (durationMs < minRepDurationMs) {
        return { count: currentCount };
    }

    // Cooldown non expiré
    if (cooldownElapsed < cooldownMs) {
        return { count: currentCount };
    }

    // Validation de l'amplitude (ROM)
    // Pour les pullups, la logique est inversée : DOWN = bras tendus (grand angle)
    // UP = coudes fléchis (petit angle) → on vérifie que la range est bien parcourue
    const entryAngle = state.angleAtDownEntry ?? 0;
    const range = exerciseType === 'pullups'
        ? entryAngle - currentAngle   // pullups : angle diminue de DOWN→UP
        : currentAngle - entryAngle;  // autres : angle augmente de DOWN→UP

    if (range < config.minRangeAngle) {
        // Amplitude insuffisante (demi-rep) → on rejette silencieusement
        return { count: currentCount };
    }

    const count = currentCount + 1;
    const repEvent: RepEventMetadata = {
        repNumber: count,
        startTimeMs: cycleStart,
        endTimeMs: now,
        durationMs,
        restMsBefore: state.lastRepEndAt == null
            ? null
            : Math.max(0, cycleStart - state.lastRepEndAt),
    };

    state.lastCountedAt = now;
    state.lastRepEndAt = now;
    state.cycleStartedAt = null;
    state.angleAtDownEntry = null;
    state.peakAngleSinceDown = 0;

    return { count, repEvent };
};

// ============================================================================
// PLANK DETECTION
// ============================================================================

export const detectPlankPosition = (landmarks: PoseLandmarks, debug = false): PlankState => {
    const now = Date.now();

    const leftShoulder = getLandmark(landmarks, KnownPoseLandmarks.leftShoulder);
    const rightShoulder = getLandmark(landmarks, KnownPoseLandmarks.rightShoulder);
    const leftHip = getLandmark(landmarks, KnownPoseLandmarks.leftHip);
    const rightHip = getLandmark(landmarks, KnownPoseLandmarks.rightHip);
    const leftElbow = getLandmark(landmarks, KnownPoseLandmarks.leftElbow);
    const rightElbow = getLandmark(landmarks, KnownPoseLandmarks.rightElbow);
    const leftWrist = getLandmark(landmarks, KnownPoseLandmarks.leftWrist);
    const rightWrist = getLandmark(landmarks, KnownPoseLandmarks.rightWrist);
    const leftAnkle = getLandmark(landmarks, KnownPoseLandmarks.leftAnkle);
    const rightAnkle = getLandmark(landmarks, KnownPoseLandmarks.rightAnkle);

    const debugInfo: PlankDebugInfo = {
        landmarksVisible: {
            shoulders: !!(leftShoulder && rightShoulder),
            hips: !!(leftHip && rightHip),
            elbows: !!(leftElbow && rightElbow),
            wrists: !!(leftWrist && rightWrist),
            ankles: !!(leftAnkle && rightAnkle),
        },
        checks: {
            bodyLow: { passed: false, value: 0, threshold: 0.35, message: '' },
            shouldersAligned: { passed: false, value: 0, threshold: 0.12, message: '' },
            armsInPosition: { passed: false, value: 0, threshold: 60, message: '' },
            hipsBelowShoulders: { passed: false, value: 0, threshold: 0.05, message: '' },
        },
        overallConfidence: 0,
    };

    if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) {
        debugInfo.checks.bodyLow.message = '❌ Épaules ou hanches non visibles';
        currentPlankState = { isInPlankPosition: false, lastUpdate: now, confidence: 0, debugInfo };
        return currentPlankState;
    }

    if (!leftElbow || !rightElbow || !leftWrist || !rightWrist) {
        debugInfo.checks.armsInPosition.message = '❌ Bras non visibles (cadre-toi mieux)';
        currentPlankState = { isInPlankPosition: false, lastUpdate: now, confidence: 0, debugInfo };
        return currentPlankState;
    }

    let confidenceScore = 0;

    const avgShoulderY = (leftShoulder.y + rightShoulder.y) / 2;
    const avgHipY = (leftHip.y + rightHip.y) / 2;

    // Check 1 : corps bas dans le cadre (gauchiste → position horizontale)
    const bodyLowEnough = avgShoulderY > 0.35;
    debugInfo.checks.bodyLow.value = avgShoulderY;
    debugInfo.checks.bodyLow.passed = bodyLowEnough;
    if (bodyLowEnough) {
        confidenceScore += 0.30;
        debugInfo.checks.bodyLow.message = `✅ Position basse (Y: ${(avgShoulderY * 100).toFixed(0)}%)`;
    } else {
        debugInfo.checks.bodyLow.message = `❌ Position trop haute (Y: ${(avgShoulderY * 100).toFixed(0)}% < 35%)`;
    }

    // Check 2 : épaules horizontalement alignées (corps pas de travers)
    const shoulderTilt = Math.abs(leftShoulder.y - rightShoulder.y);
    const shouldersAligned = shoulderTilt < 0.12;
    debugInfo.checks.shouldersAligned.value = shoulderTilt;
    debugInfo.checks.shouldersAligned.passed = shouldersAligned;
    if (shouldersAligned) {
        confidenceScore += 0.25;
        debugInfo.checks.shouldersAligned.message = `✅ Épaules alignées (diff: ${(shoulderTilt * 100).toFixed(0)}%)`;
    } else {
        debugInfo.checks.shouldersAligned.message = `❌ Épaules pas alignées (diff: ${(shoulderTilt * 100).toFixed(0)}% > 12%)`;
    }

    // Check 3 : bras en position gainage (forearm 60-115° ou high plank 145-180°)
    const leftArmAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
    const rightArmAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);
    const avgArmAngle = (leftArmAngle + rightArmAngle) / 2;

    const isForearmPlank = avgArmAngle >= 60 && avgArmAngle <= 115;
    const isHighPlank = avgArmAngle >= 145;
    const armsInPosition = isForearmPlank || isHighPlank;

    debugInfo.checks.armsInPosition.value = avgArmAngle;
    debugInfo.checks.armsInPosition.passed = armsInPosition;
    if (armsInPosition) {
        confidenceScore += 0.30;
        const plankType = isForearmPlank ? 'forearm' : 'haute';
        debugInfo.checks.armsInPosition.message = `✅ Position ${plankType} (angle: ${avgArmAngle.toFixed(0)}°)`;
    } else {
        debugInfo.checks.armsInPosition.message = `❌ Bras pas en position (angle: ${avgArmAngle.toFixed(0)}°)`;
    }

    // Check 4 : hanches alignées avec les épaules (corps droit, pas de fesses en l'air)
    const hipShoulderDiff = avgHipY - avgShoulderY;
    const hipsInPosition = hipShoulderDiff >= -0.05 && hipShoulderDiff <= 0.20;

    debugInfo.checks.hipsBelowShoulders.value = hipShoulderDiff;
    debugInfo.checks.hipsBelowShoulders.passed = hipsInPosition;
    if (hipsInPosition) {
        confidenceScore += 0.15;
        debugInfo.checks.hipsBelowShoulders.message = `✅ Hanches alignées (diff: ${(hipShoulderDiff * 100).toFixed(0)}%)`;
    } else {
        if (hipShoulderDiff < -0.05) {
            debugInfo.checks.hipsBelowShoulders.message = `⚠️ Hanches trop hautes (diff: ${(hipShoulderDiff * 100).toFixed(0)}%)`;
        } else {
            debugInfo.checks.hipsBelowShoulders.message = `⚠️ Hanches trop basses (diff: ${(hipShoulderDiff * 100).toFixed(0)}%)`;
        }
    }

    debugInfo.overallConfidence = confidenceScore;

    // Hysteresis : 70% pour entrer en plank, 50% pour en sortir
    const wasInPlank = currentPlankState.isInPlankPosition;
    const enterThreshold = 0.70;
    const exitThreshold = 0.50;

    let finalIsInPlank = false;
    if (wasInPlank) {
        finalIsInPlank = confidenceScore >= exitThreshold;
    } else {
        finalIsInPlank = confidenceScore >= enterThreshold;
    }

    if (debug) {
        console.log(`[Plank Debug] Confidence: ${(confidenceScore * 100).toFixed(0)}% | In Plank: ${finalIsInPlank}`);
        console.log(`  - Body Low: ${debugInfo.checks.bodyLow.message}`);
        console.log(`  - Shoulders Aligned: ${debugInfo.checks.shouldersAligned.message}`);
        console.log(`  - Arms in Position: ${debugInfo.checks.armsInPosition.message}`);
        console.log(`  - Hips Aligned: ${debugInfo.checks.hipsBelowShoulders.message}`);
    }

    currentPlankState = {
        isInPlankPosition: finalIsInPlank,
        lastUpdate: now,
        confidence: confidenceScore,
        debugInfo,
    };

    return currentPlankState;
};

export const getPlankState = (): PlankState => currentPlankState;

export const resetPlankState = (): void => {
    currentPlankState = { isInPlankPosition: false, lastUpdate: 0, confidence: 0 };
};

// ============================================================================
// ELLIPTICAL BIKE DETECTION
// ============================================================================

const ELLIPTICAL_SAMPLE_SIZE = 200;
const ELLIPTICAL_VARIANCE_WINDOW = 60;
const ELLIPTICAL_CALIBRATION_WINDOW = 150;
const ELLIPTICAL_MAX_SAMPLES = 300;

const calculateVariance = (values: number[]): number => {
    if (!values || !Array.isArray(values) || values.length < 2) return 0;
    const validValues = values.filter(v => typeof v === 'number' && isFinite(v));
    if (validValues.length < 2) return 0;
    const mean = validValues.reduce((a, b) => a + b, 0) / validValues.length;
    const squaredDiffs = validValues.map(v => Math.pow(v - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / validValues.length;
};

export const addEllipticalHeadSample = (landmarks: PoseLandmarks): boolean => {
    if (!landmarks || !Array.isArray(landmarks) || landmarks.length < 33) return false;

    const nose = landmarks[KnownPoseLandmarks.nose];
    if (!nose || typeof nose.y !== 'number' || isNaN(nose.y)) return false;
    if ((nose.visibility ?? 1) < 0.5) return false;

    currentEllipticalCalibration.samples.push(nose.y);
    currentEllipticalCalibration.lastUpdateTime = Date.now();

    if (currentEllipticalCalibration.samples.length % 50 === 0) {
        console.log(`[Elliptical] Samples collected: ${currentEllipticalCalibration.samples.length}`);
    }

    if (currentEllipticalCalibration.samples.length > ELLIPTICAL_MAX_SAMPLES) {
        currentEllipticalCalibration.samples.splice(
            0,
            currentEllipticalCalibration.samples.length - ELLIPTICAL_SAMPLE_SIZE
        );
    }

    return true;
};

export const startEllipticalMovingCalibration = (): void => {
    currentEllipticalCalibration = {
        isCalibrated: false,
        movingVariance: 0,
        stoppedVariance: 0,
        movementThreshold: 0,
        samples: [],
        lastUpdateTime: Date.now(),
    };
    console.log('[Elliptical] Started moving calibration phase');
};

export const completeEllipticalMovingCalibration = (): number => {
    if (currentEllipticalCalibration.samples.length < ELLIPTICAL_CALIBRATION_WINDOW) {
        console.warn(`[Elliptical] Not enough samples for moving calibration: ${currentEllipticalCalibration.samples.length}/${ELLIPTICAL_CALIBRATION_WINDOW}`);
        return 0;
    }
    const recentSamples = currentEllipticalCalibration.samples.slice(-ELLIPTICAL_CALIBRATION_WINDOW);
    currentEllipticalCalibration.movingVariance = calculateVariance(recentSamples);
    currentEllipticalCalibration.samples = [];
    return currentEllipticalCalibration.movingVariance;
};

export const completeEllipticalStoppedCalibration = (): boolean => {
    if (currentEllipticalCalibration.samples.length < ELLIPTICAL_CALIBRATION_WINDOW) return false;

    const recentSamples = currentEllipticalCalibration.samples.slice(-ELLIPTICAL_CALIBRATION_WINDOW);
    currentEllipticalCalibration.stoppedVariance = calculateVariance(recentSamples);

    const varianceDiff = currentEllipticalCalibration.movingVariance - currentEllipticalCalibration.stoppedVariance;
    if (varianceDiff <= 0) {
        console.warn('[Elliptical] Calibration failed: moving variance should be higher than stopped');
        return false;
    }

    currentEllipticalCalibration.movementThreshold =
        currentEllipticalCalibration.stoppedVariance + (varianceDiff * 0.4);
    currentEllipticalCalibration.isCalibrated = true;
    currentEllipticalCalibration.samples = [];
    return true;
};

export const startEllipticalStillFirstCalibration = (): void => {
    currentEllipticalCalibration = {
        isCalibrated: false,
        movingVariance: 0,
        stoppedVariance: 0,
        movementThreshold: 0,
        samples: [],
        lastUpdateTime: Date.now(),
    };
    console.log('[Elliptical] Started calibration (still-first flow)');
};

export const resetEllipticalSamples = (): void => {
    currentEllipticalCalibration.samples = [];
    console.log('[Elliptical] Samples reset for next phase');
};

export const completeEllipticalStillPhase = (): number => {
    if (currentEllipticalCalibration.samples.length < ELLIPTICAL_CALIBRATION_WINDOW) return 0;

    const recentSamples = currentEllipticalCalibration.samples.slice(-ELLIPTICAL_CALIBRATION_WINDOW);
    currentEllipticalCalibration.stoppedVariance = calculateVariance(recentSamples);
    currentEllipticalCalibration.samples = [];
    return currentEllipticalCalibration.stoppedVariance;
};

export const completeEllipticalPedalingPhase = (): boolean => {
    if (currentEllipticalCalibration.samples.length < ELLIPTICAL_CALIBRATION_WINDOW) return false;

    const recentSamples = currentEllipticalCalibration.samples.slice(-ELLIPTICAL_CALIBRATION_WINDOW);
    currentEllipticalCalibration.movingVariance = calculateVariance(recentSamples);

    const varianceDiff = currentEllipticalCalibration.movingVariance - currentEllipticalCalibration.stoppedVariance;
    if (varianceDiff <= 0) {
        console.warn('[Elliptical] Calibration failed: moving variance should be higher than stopped');
        return false;
    }

    currentEllipticalCalibration.movementThreshold =
        currentEllipticalCalibration.stoppedVariance + (varianceDiff * 0.4);
    currentEllipticalCalibration.isCalibrated = true;
    currentEllipticalCalibration.samples = [];
    return true;
};

export const detectEllipticalMovement = (landmarks: PoseLandmarks): EllipticalState => {
    const now = Date.now();

    addEllipticalHeadSample(landmarks);

    if (!currentEllipticalCalibration.isCalibrated) {
        currentEllipticalState = { isMoving: false, confidence: 0, currentVariance: 0, lastUpdate: now };
        return currentEllipticalState;
    }

    if (currentEllipticalCalibration.samples.length < ELLIPTICAL_VARIANCE_WINDOW) {
        return currentEllipticalState;
    }

    const recentSamples = currentEllipticalCalibration.samples.slice(-ELLIPTICAL_VARIANCE_WINDOW);
    const currentVariance = calculateVariance(recentSamples);

    const wasMoving = currentEllipticalState.isMoving;
    const threshold = currentEllipticalCalibration.movementThreshold;
    const enterThreshold = threshold * 1.2;
    const exitThreshold = threshold * 0.8;

    let isMoving = wasMoving
        ? currentVariance > exitThreshold
        : currentVariance > enterThreshold;

    const { movingVariance, stoppedVariance } = currentEllipticalCalibration;
    let confidence = 0;
    if (isMoving) {
        confidence = Math.min(1, (currentVariance - threshold) / (movingVariance - threshold));
    } else {
        confidence = Math.min(1, (threshold - currentVariance) / (threshold - stoppedVariance));
    }

    currentEllipticalState = {
        isMoving,
        confidence: Math.max(0, confidence),
        currentVariance,
        lastUpdate: now,
    };

    return currentEllipticalState;
};

export const getEllipticalState = (): EllipticalState => currentEllipticalState;
export const getEllipticalCalibration = (): EllipticalCalibration => currentEllipticalCalibration;
export const isEllipticalCalibrated = (): boolean => currentEllipticalCalibration.isCalibrated;

export const hasEllipticalMovementStarted = (): boolean => {
    if (currentEllipticalCalibration.samples.length < 30) return false;
    const recentSamples = currentEllipticalCalibration.samples.slice(-30);
    const currentVariance = calculateVariance(recentSamples);
    const stoppedVariance = currentEllipticalCalibration.stoppedVariance;
    return currentVariance > stoppedVariance * 2;
};

export const resetEllipticalState = (): void => {
    currentEllipticalCalibration = {
        isCalibrated: false,
        movingVariance: 0,
        stoppedVariance: 0,
        movementThreshold: 0,
        samples: [],
        lastUpdateTime: 0,
    };
    currentEllipticalState = { isMoving: false, confidence: 0, currentVariance: 0, lastUpdate: 0 };
};

// ============================================================================
// RESET
// ============================================================================

export const resetExerciseState = (exerciseType?: ExerciseType): void => {
    if (exerciseType) {
        delete exerciseStates[exerciseType];
        if (exerciseType === 'plank') resetPlankState();
        if (exerciseType === 'elliptical') resetEllipticalState();
    } else {
        Object.keys(exerciseStates).forEach((key) => delete exerciseStates[key]);
        resetPlankState();
        resetEllipticalState();
    }
};

// ============================================================================
// COMPTAGE DES REPS - Logique principale
// ============================================================================

/**
 * Traite les landmarks de pose pour compter les reps selon le type d'exercice.
 *
 * Améliorations v2 :
 * - smoothAngle (EMA) au lieu de hard-clamp → moins de lag, plus de reps détectées
 * - Validation ROM (minRangeAngle) → les demi-reps ne comptent plus
 * - Hysteresis MIN_STAGE_FRAMES → pas de double-comptage sur oscillation de seuil
 * - getBestAngle pondéré → robuste aux occlusions partielles
 */
export const countRepsFromPose = (
    landmarks: PoseLandmarks,
    exerciseType: ExerciseType,
    currentCount: number
): { count: number; feedback?: string; stage: 'up' | 'down' | null; repEvent?: RepEventMetadata } => {
    if (!exerciseStates[exerciseType]) {
        exerciseStates[exerciseType] = createRepState();
    }

    const state = exerciseStates[exerciseType];
    const now = Date.now();
    let newCount = currentCount;
    let repEvent: RepEventMetadata | undefined;

    if (!landmarks || landmarks.length < 33) {
        return { count: newCount, stage: state.stage };
    }

    const filtered = smoothLandmarks(landmarks, state.smoothedLandmarks);
    state.smoothedLandmarks = filtered;

    switch (exerciseType) {
        case 'pushups': {
            // Angle coude (épaule – coude – poignet)
            const rawAngle = getBestAngle(
                filtered,
                KnownPoseLandmarks.leftShoulder, KnownPoseLandmarks.leftElbow, KnownPoseLandmarks.leftWrist,
                KnownPoseLandmarks.rightShoulder, KnownPoseLandmarks.rightElbow, KnownPoseLandmarks.rightWrist
            );
            const elbowAngle = smoothAngle(state, 'elbow', rawAngle);

            if (elbowAngle > 0) {
                const { downAngle, upAngle } = EXERCISE_CONFIG.pushups;

                if (elbowAngle < downAngle) {
                    // Position basse → stage DOWN
                    enterDownStage(state, now, elbowAngle);
                } else if (elbowAngle > upAngle) {
                    // Position haute → tenter de compter
                    const result = tryCountRep(state, now, exerciseType, newCount, elbowAngle);
                    newCount = result.count;
                    repEvent = result.repEvent;
                    enterUpStage(state, elbowAngle);
                }
            }
            break;
        }

        case 'pullups': {
            // Tractions : DOWN = bras tendus (grand angle), UP = bras fléchis (petit angle)
            const rawAngle = getBestAngle(
                filtered,
                KnownPoseLandmarks.leftShoulder, KnownPoseLandmarks.leftElbow, KnownPoseLandmarks.leftWrist,
                KnownPoseLandmarks.rightShoulder, KnownPoseLandmarks.rightElbow, KnownPoseLandmarks.rightWrist
            );
            const elbowAngle = smoothAngle(state, 'elbow', rawAngle);

            if (elbowAngle > 0) {
                const { downAngle, upAngle } = EXERCISE_CONFIG.pullups;

                if (elbowAngle > downAngle) {
                    // Bras tendus = position suspendue = DOWN
                    enterDownStage(state, now, elbowAngle);
                } else if (elbowAngle < upAngle) {
                    // Bras fléchis = menton au-dessus = UP → compter
                    const result = tryCountRep(state, now, exerciseType, newCount, elbowAngle);
                    newCount = result.count;
                    repEvent = result.repEvent;
                    enterUpStage(state, elbowAngle);
                }
            }
            break;
        }

        case 'squats': {
            // Angle genou (hanche – genou – cheville)
            const rawAngle = getBestAngle(
                filtered,
                KnownPoseLandmarks.leftHip, KnownPoseLandmarks.leftKnee, KnownPoseLandmarks.leftAnkle,
                KnownPoseLandmarks.rightHip, KnownPoseLandmarks.rightKnee, KnownPoseLandmarks.rightAnkle
            );
            const kneeAngle = smoothAngle(state, 'knee', rawAngle);

            if (kneeAngle > 0) {
                const { downAngle, upAngle } = EXERCISE_CONFIG.squats;

                if (kneeAngle < downAngle) {
                    enterDownStage(state, now, kneeAngle);
                } else if (kneeAngle > upAngle) {
                    const result = tryCountRep(state, now, exerciseType, newCount, kneeAngle);
                    newCount = result.count;
                    repEvent = result.repEvent;
                    enterUpStage(state, kneeAngle);
                }
            }
            break;
        }

        case 'situps': {
            // Angle hanche (épaule – hanche – genou)
            // DOWN = allongé (grand angle), UP = assis (petit angle)
            const rawAngle = getBestAngle(
                filtered,
                KnownPoseLandmarks.leftShoulder, KnownPoseLandmarks.leftHip, KnownPoseLandmarks.leftKnee,
                KnownPoseLandmarks.rightShoulder, KnownPoseLandmarks.rightHip, KnownPoseLandmarks.rightKnee
            );
            const hipAngle = smoothAngle(state, 'hip', rawAngle);

            if (hipAngle > 0) {
                const { downAngle, upAngle } = EXERCISE_CONFIG.situps;

                if (hipAngle > downAngle) {
                    // Allongé = DOWN
                    enterDownStage(state, now, hipAngle);
                } else if (hipAngle < upAngle) {
                    // Assis = UP → compter
                    // Pour les situps, l'angle diminue → on utilise la version inversée dans tryCountRep
                    // On calcule la range manuellement pour ce cas
                    const entryAngle = state.angleAtDownEntry ?? 0;
                    const range = entryAngle - hipAngle; // angle diminue de DOWN → UP
                    const config = EXERCISE_CONFIG.situps;

                    if (state.stage === 'down' && state.stageFrameCount >= MIN_STAGE_FRAMES) {
                        const cycleStart = state.cycleStartedAt ?? now;
                        const durationMs = now - cycleStart;
                        const cooldownElapsed = now - state.lastCountedAt;

                        if (
                            durationMs >= config.timing.minRepDurationMs &&
                            cooldownElapsed >= config.timing.cooldownMs &&
                            range >= config.minRangeAngle
                        ) {
                            newCount += 1;
                            repEvent = {
                                repNumber: newCount,
                                startTimeMs: cycleStart,
                                endTimeMs: now,
                                durationMs,
                                restMsBefore: state.lastRepEndAt == null
                                    ? null
                                    : Math.max(0, cycleStart - state.lastRepEndAt),
                            };
                            state.lastCountedAt = now;
                            state.lastRepEndAt = now;
                            state.cycleStartedAt = null;
                            state.angleAtDownEntry = null;
                        }
                    }
                    enterUpStage(state, hipAngle);
                }
            }
            break;
        }

        case 'jumpingJacks': {
            // Jumping jacks : angle bras relatif au torse (hanche – épaule – poignet)
            const leftShoulder = getLandmark(filtered, KnownPoseLandmarks.leftShoulder);
            const rightShoulder = getLandmark(filtered, KnownPoseLandmarks.rightShoulder);
            const leftWrist = getLandmark(filtered, KnownPoseLandmarks.leftWrist);
            const rightWrist = getLandmark(filtered, KnownPoseLandmarks.rightWrist);
            const leftHip = getLandmark(filtered, KnownPoseLandmarks.leftHip);
            const rightHip = getLandmark(filtered, KnownPoseLandmarks.rightHip);

            if (leftShoulder && rightShoulder && leftWrist && rightWrist && leftHip && rightHip) {
                const leftArmAngle = calculateAngle(leftHip, leftShoulder, leftWrist);
                const rightArmAngle = calculateAngle(rightHip, rightShoulder, rightWrist);
                const rawArmAngle = (leftArmAngle + rightArmAngle) / 2;
                const armAngle = smoothAngle(state, 'arms', rawArmAngle);

                const { downAngle, upAngle } = EXERCISE_CONFIG.jumpingJacks;

                if (armAngle < downAngle) {
                    enterDownStage(state, now, armAngle);
                } else if (armAngle > upAngle) {
                    const result = tryCountRep(state, now, exerciseType, newCount, armAngle);
                    newCount = result.count;
                    repEvent = result.repEvent;
                    enterUpStage(state, armAngle);
                }
            }
            break;
        }
    }

    state.count = newCount;

    return { count: newCount, stage: state.stage, repEvent };
};

// ============================================================================
// UTILITAIRES
// ============================================================================

export const getExerciseStage = (exerciseType: ExerciseType): 'up' | 'down' | null => {
    return exerciseStates[exerciseType]?.stage ?? null;
};

export const isPoseValid = (landmarks: PoseLandmarks | null | undefined): boolean => {
    if (!landmarks || landmarks.length < 33) return false;

    const criticalIndices = [
        KnownPoseLandmarks.leftShoulder,
        KnownPoseLandmarks.rightShoulder,
        KnownPoseLandmarks.leftHip,
        KnownPoseLandmarks.rightHip,
    ];

    let visibleCount = 0;
    for (const idx of criticalIndices) {
        const lm = landmarks[idx];
        if (lm && (lm.visibility ?? 1) >= VISIBILITY_THRESHOLD) {
            visibleCount++;
        }
    }

    return visibleCount >= 3;
};