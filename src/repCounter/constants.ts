// repCounter/constants.ts
import { Dimensions } from 'react-native';

export const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Design Tokens ────────────────────────────────────────────────────────────
export const RC = {
    // Backgrounds
    bg:          '#06070c',
    surface:     '#0b0d14',
    surfaceUp:   '#101320',
    overlay:     'rgba(255,255,255,0.05)',
    overlayUp:   'rgba(255,255,255,0.09)',

    // Borders
    border:      'rgba(255,255,255,0.07)',
    borderUp:    'rgba(255,255,255,0.13)',

    // Text
    text:        '#eeeae0',
    textSub:     'rgba(238,234,224,0.55)',
    textMuted:   'rgba(238,234,224,0.30)',

    // Primary accent
    ember:       '#ff5533',
    emberMid:    '#ff7a55',
    emberGlow:   'rgba(255,85,51,0.16)',
    emberBorder: 'rgba(255,85,51,0.28)',

    // CTA gradient
    cta1:        '#7c3aed',
    cta2:        '#4f46e5',

    // Status
    success:     '#22d36b',
    warning:     '#f59e0b',
    error:       '#f87171',

    // Misc
    gold:        '#e8b84b',
    goldSoft:    'rgba(232,184,75,0.12)',
};

export const SP = {
    xs:  4, sm:  8, md: 12, lg: 16,
    xl: 20, xxl: 28, xxxl: 44,
};

export const RAD = {
    sm:   6, md:  10, lg: 14, xl: 18,
    xxl: 22, xxxl: 32, full: 999,
};

export const FONT = {
    nano: 9, micro: 10, xs: 11, sm: 13, md: 15,
    lg: 17, xl: 20, xxl: 26, xxxl: 34, display: 56,
};

export const W: Record<string, any> = {
    light: '300', reg: '400', med: '500',
    semi: '600', bold: '700', xbold: '800', black: '900',
};

// ─── Exercise Configs ─────────────────────────────────────────────────────────
import type { ExerciseConfig } from './types';

export const EXERCISES: ExerciseConfig[] = [
    {
        id: 'pushups',
        name: 'Pompes',
        icon: '💪',
        color: '#4ade80',
        instructionKey: 'repCounter.instructions.pushups.default',
        cameraInstructionKey: 'repCounter.instructions.pushups.camera',
        threshold: 0.4,
        axis: 'z',
        cooldown: 600,
        supportsCameraMode: true,
        preferredCameraView: 'side',
    },
    {
        id: 'situps',
        name: 'Abdos',
        icon: '🔥',
        color: '#f97316',
        instructionKey: 'repCounter.instructions.situps.default',
        cameraInstructionKey: 'repCounter.instructions.situps.camera',
        threshold: 0.5,
        axis: 'z',
        cooldown: 800,
        supportsCameraMode: true,
        preferredCameraView: 'side',
    },
    {
        id: 'squats',
        name: 'Squats',
        icon: '🦵',
        color: '#8b5cf6',
        instructionKey: 'repCounter.instructions.squats.default',
        cameraInstructionKey: 'repCounter.instructions.squats.camera',
        threshold: 0.35,
        axis: 'y',
        cooldown: 700,
        supportsCameraMode: true,
        preferredCameraView: 'front',
    },
    {
        id: 'jumping_jacks',
        name: 'Jumping Jacks',
        icon: '⭐',
        color: '#eab308',
        instructionKey: 'repCounter.instructions.jumpingJacks.default',
        cameraInstructionKey: 'repCounter.instructions.jumpingJacks.camera',
        threshold: 0.6,
        axis: 'y',
        cooldown: 400,
        supportsCameraMode: true,
        preferredCameraView: 'front',
    },
    {
        id: 'plank',
        name: 'Planche',
        icon: '🧘',
        color: '#06b6d4',
        instructionKey: 'repCounter.instructions.plank.default',
        cameraInstructionKey: 'repCounter.instructions.plank.camera',
        threshold: 0.3,
        axis: 'z',
        cooldown: 500,
        supportsCameraMode: true,
        preferredCameraView: 'side',
        isTimeBased: true,
    },
    {
        id: 'elliptical',
        name: 'Vélo elliptique',
        icon: '🚴',
        color: '#10b981',
        instructionKey: 'repCounter.instructions.elliptical.default',
        cameraInstructionKey: 'repCounter.instructions.elliptical.camera',
        manualInstructionKey: 'repCounter.instructions.elliptical.manual',
        threshold: 0.3,
        axis: 'y',
        cooldown: 500,
        supportsCameraMode: true,
        supportsManualMode: true,
        requiresCalibration: true,
        preferredCameraView: 'front',
        isTimeBased: true,
        keepGoingIntervalSeconds: 300,
    },
];
