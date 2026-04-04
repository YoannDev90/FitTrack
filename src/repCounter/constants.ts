// repCounter/constants.ts
import { Dimensions } from 'react-native';
import type { ThemeCustomColors } from '../types';

export const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Design Tokens ────────────────────────────────────────────────────────────
export const RC = {
    // Core
    white:       '#fff',
    black:       '#000',
    transparent: 'transparent',

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
    emberSoft:   'rgba(255,122,85,0.10)',
    emberSoftStrong: 'rgba(255,122,85,0.18)',
    emberSoftBorder: 'rgba(255,122,85,0.24)',

    // CTA gradient (aligned with primary accent family)
    cta1:        '#ff5533',
    cta2:        '#ff7a55',

    // Status
    success:     '#22d36b',
    successSoft: 'rgba(34,211,107,0.12)',
    successSoftAlt: 'rgba(34,197,94,0.12)',
    warning:     '#f59e0b',
    error:       '#f87171',
    errorStrong: '#ef4444',
    errorSoft:   'rgba(239,68,68,0.15)',
    errorBorder: 'rgba(239,68,68,0.35)',
    errorSoftAlt: 'rgba(248,113,113,0.12)',
    errorBorderAlt: 'rgba(248,113,113,0.3)',

    // Utility overlays
    blackOverlay25: 'rgba(0,0,0,0.25)',
    blackOverlay30: 'rgba(0,0,0,0.3)',
    blackOverlay75: 'rgba(0,0,0,0.75)',
    blackOverlay85: 'rgba(0,0,0,0.85)',
    whiteOverlay06: 'rgba(255,255,255,0.06)',
    whiteOverlay07: 'rgba(255,255,255,0.07)',
    whiteOverlay10: 'rgba(255,255,255,0.10)',
    whiteOverlay12: 'rgba(255,255,255,0.12)',
    whiteOverlay18: 'rgba(255,255,255,0.18)',

    // Misc
    gold:        '#e8b84b',
    goldSoft:    'rgba(232,184,75,0.12)',
    goldSoftStrong: 'rgba(232,184,75,0.14)',
    goldBorder:  'rgba(232,184,75,0.35)',
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
        color: '#ff5533',
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
        color: '#ff7a55',
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
        color: '#ff5533',
        instructionKey: 'repCounter.instructions.squats.default',
        cameraInstructionKey: 'repCounter.instructions.squats.camera',
        threshold: 0.35,
        axis: 'y',
        cooldown: 700,
        supportsCameraMode: true,
        preferredCameraView: 'front',
    },
    {
        id: 'jumpingJacks',
        name: 'Jumping Jacks',
        icon: '⭐',
        color: '#ff7a55',
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
        color: '#ff5533',
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
        color: '#ff7a55',
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
    {
        id: 'run',
        name: 'Course',
        icon: '🏃',
        color: '#ff5533',
        threshold: 0,
        axis: 'y',
        cooldown: 0,
        supportsCameraMode: false,
        preferredCameraView: 'front',
        isNavigational: true,
        experimental: true,
    },
    {
        id: 'run_ai',
        name: 'Course avec IA',
        icon: '🤖',
        color: '#ff7a55',
        threshold: 0,
        axis: 'y',
        cooldown: 0,
        supportsCameraMode: false,
        preferredCameraView: 'front',
        isNavigational: true,
        experimental: true,
    },
    {
        id: 'pullups',
        name: 'Tractions',
        icon: '🧗',
        color: '#ff5533',
        instructionKey: 'repCounter.instructions.pullups.default',
        cameraInstructionKey: 'repCounter.instructions.pullups.camera',
        threshold: 0.4,
        axis: 'z',
        cooldown: 650,
        supportsCameraMode: true,
        preferredCameraView: 'side',
        experimental: true,
    }
];

const DEFAULT_RC_SNAPSHOT: Record<string, string> = {
    ...(RC as Record<string, string>),
};

const DEFAULT_EXERCISE_COLORS = Object.fromEntries(
    EXERCISES.map((exercise) => [exercise.id, exercise.color])
) as Record<string, string>;

const clamp = (value: number, min = 0, max = 1): number => Math.min(max, Math.max(min, value));

const normalizeHex = (value: string): string => {
    const normalized = value.startsWith('#') ? value : `#${value}`;
    if (!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(normalized)) {
        return '#000000';
    }

    if (normalized.length === 4) {
        const [, r, g, b] = normalized;
        return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
    }

    return normalized.toLowerCase();
};

const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    const safeHex = normalizeHex(hex);
    const int = parseInt(safeHex.slice(1), 16);
    return {
        r: (int >> 16) & 255,
        g: (int >> 8) & 255,
        b: int & 255,
    };
};

const rgbToHex = (r: number, g: number, b: number): string => {
    const to = (n: number) => Math.round(clamp(n / 255) * 255).toString(16).padStart(2, '0');
    return `#${to(r)}${to(g)}${to(b)}`;
};

const mixHex = (from: string, to: string, ratio: number): string => {
    const w = clamp(ratio);
    const a = hexToRgb(from);
    const b = hexToRgb(to);
    return rgbToHex(
        a.r + (b.r - a.r) * w,
        a.g + (b.g - a.g) * w,
        a.b + (b.b - a.b) * w
    );
};

const lighten = (color: string, amount: number): string => mixHex(color, '#ffffff', amount);

const alpha = (color: string, opacity: number): string => {
    const { r, g, b } = hexToRgb(color);
    return `rgba(${r},${g},${b},${clamp(opacity)})`;
};

export const applyRepCounterTheme = (theme: ThemeCustomColors): void => {
    RC.bg = mixHex(theme.bg, '#000000', 0.2);
    RC.surface = theme.surface;
    RC.surfaceUp = lighten(theme.surface, 0.08);
    RC.overlay = alpha(theme.text, 0.05);
    RC.overlayUp = alpha(theme.text, 0.09);

    RC.border = alpha(theme.text, 0.07);
    RC.borderUp = alpha(theme.text, 0.13);

    RC.text = theme.text;
    RC.textSub = alpha(theme.text, 0.55);
    RC.textMuted = alpha(theme.text, 0.3);

    RC.ember = theme.primary;
    RC.emberMid = lighten(theme.primary, 0.12);
    RC.emberGlow = alpha(theme.primary, 0.16);
    RC.emberBorder = alpha(theme.primary, 0.28);
    RC.emberSoft = alpha(theme.primary, 0.1);
    RC.emberSoftStrong = alpha(theme.primary, 0.18);
    RC.emberSoftBorder = alpha(theme.primary, 0.24);

    RC.cta1 = theme.primary;
    RC.cta2 = theme.secondary;

    RC.success = theme.success;
    RC.successSoft = alpha(theme.success, 0.12);
    RC.successSoftAlt = alpha(theme.success, 0.12);
    RC.warning = theme.warning;
    RC.error = lighten(theme.error, 0.08);
    RC.errorStrong = theme.error;
    RC.errorSoft = alpha(theme.error, 0.15);
    RC.errorBorder = alpha(theme.error, 0.35);
    RC.errorSoftAlt = alpha(lighten(theme.error, 0.08), 0.12);
    RC.errorBorderAlt = alpha(lighten(theme.error, 0.08), 0.3);

    RC.gold = theme.gold;
    RC.goldSoft = alpha(theme.gold, 0.12);
    RC.goldSoftStrong = alpha(theme.gold, 0.14);
    RC.goldBorder = alpha(theme.gold, 0.35);

    EXERCISES.forEach((exercise) => {
        if (exercise.id === 'situps' || exercise.id === 'jumpingJacks' || exercise.id === 'elliptical' || exercise.id === 'run_ai') {
            exercise.color = RC.emberMid;
        } else {
            exercise.color = RC.ember;
        }
    });
};

export const resetRepCounterTheme = (): void => {
    Object.keys(DEFAULT_RC_SNAPSHOT).forEach((token) => {
        (RC as Record<string, string>)[token] = DEFAULT_RC_SNAPSHOT[token];
    });

    EXERCISES.forEach((exercise) => {
        exercise.color = DEFAULT_EXERCISE_COLORS[exercise.id] ?? exercise.color;
    });
};
