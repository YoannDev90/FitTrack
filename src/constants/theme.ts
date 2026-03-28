import { storageHelpers } from '../storage';
import type { ThemeCustomColors, ThemePreset, UserSettings } from '../types';
import { applyRepCounterTheme, resetRepCounterTheme } from '../repCounter/constants';
import { STORAGE_KEYS } from './values';

// ============================================================================
// THÈME ET CONSTANTES DE STYLE - Spix App
// Style glassmorphism sombre inspiré de la maquette
// ============================================================================

export const Colors = {
    // Core
    white: '#fff',
    black: '#000',
    transparent: 'transparent',

    // Backgrounds
    bg: '#0b0c0f',
    bgLayer: '#1a1f25',
    card: 'rgba(26, 27, 34, 0.85)',
    cardSolid: '#1a1b22',
    cardElevated: 'rgba(32, 34, 42, 0.9)',

    // Text - Improved contrast
    text: '#f4f5f7',
    textSecondary: 'rgba(255, 255, 255, 0.85)',
    muted: '#c8cad4',       // Improved from #b9bcc8
    muted2: '#a0a5b8',      // Improved from #8a8fa3

    // Accents
    teal: '#1f6a66',
    tealLight: 'rgba(31, 106, 102, 0.35)',
    cta: '#d79686',
    cta2: '#e3a090',
    accent: '#ff6b5a',

    // Premium & Cozy colors
    gold: '#f5c842',
    goldStrong: '#FFD700',
    goldLight: 'rgba(245, 200, 66, 0.25)',
    cozyWarm: '#e8b4a0',
    cozyWarmLight: 'rgba(232, 180, 160, 0.15)',
    cozyWarmDarkText: '#1b0f0c',
    warmDarkText: '#1a0800',
    violetDeep: '#8b5cf6',
    successMid: '#28b860',

    // Strokes & Overlays
    stroke: 'rgba(255, 255, 255, 0.10)',
    strokeLight: 'rgba(255, 255, 255, 0.16)',
    overlay: 'rgba(255, 255, 255, 0.08)',
    overlayMedium: 'rgba(255, 255, 255, 0.12)',

    // States
    success: '#4ade80',
    successStrong: '#22c55e',
    warning: '#fbbf24',
    error: '#f87171',
    errorStrong: '#ef4444',

    // Extra accents used across screens
    violet: '#a78bfa',
    violetStrong: '#8B5CF6',
    blue: '#5599ff',
    info: '#22d3ee',
    rose: '#f43f5e',
    orange: '#f97316',
    emerald: '#10b981',
    warningDeep: '#f5a623',
    silver: '#94a3b8',
    bronze: '#cd7f32',
    gray400: '#9CA3AF',
    gray500: '#6B7280',
    gray700: '#374151',
    gray800: '#1F2937',
    red100: '#fee2e2',
    sportGreen: '#34d370',
    mint: '#34d399',
    sky: '#60a5fa',
    amberStrong: '#eab308',
    lime: '#a3e635',
    pink: '#f472b6',

    // Utility overlays
    overlayBlack25: 'rgba(0,0,0,0.25)',
    overlayBlack30: 'rgba(0,0,0,0.3)',
    overlayBlack50: 'rgba(0,0,0,0.5)',
    overlayBlack60: 'rgba(0,0,0,0.6)',
    overlayBlack70: 'rgba(0, 0, 0, 0.7)',
    overlayBlack80: 'rgba(0,0,0,0.8)',
    overlayBlack10: 'rgba(0,0,0,0.1)',
    overlayBlack75: 'rgba(0,0,0,0.75)',
    overlayBlack85: 'rgba(0,0,0,0.85)',
    overlayWhite03: 'rgba(255,255,255,0.03)',
    overlayWhite05: 'rgba(255,255,255,0.05)',
    overlayWhite06: 'rgba(255,255,255,0.06)',
    overlayWhite07: 'rgba(255,255,255,0.07)',
    overlayWhite08: 'rgba(255,255,255,0.08)',
    overlayWhite10: 'rgba(255,255,255,0.10)',
    overlayWhite15: 'rgba(255,255,255,0.15)',
    overlayWhite20: 'rgba(255,255,255,0.2)',
    overlayWhite30: 'rgba(255,255,255,0.3)',
    overlayWhite50: 'rgba(255,255,255,0.5)',
    textWhite80: 'rgba(255,255,255,0.8)',
    overlayPanel82: 'rgba(14,19,30,0.82)',
    overlayModal95: 'rgba(20,20,30,0.95)',
    overlayWarm10: 'rgba(215, 150, 134, 0.1)',
    overlayWarm30: 'rgba(227, 160, 144, 0.3)',
    overlayWhite12: 'rgba(255,255,255,0.12)',
    overlayWhite18: 'rgba(255,255,255,0.18)',
    overlayGold10: 'rgba(232,184,75,0.10)',
    overlayGold12: 'rgba(232,184,75,0.12)',
    overlayGold14: 'rgba(232,184,75,0.14)',
    overlayGold15: 'rgba(232,184,75,0.15)',
    overlayGold95: 'rgba(232,184,75,0.95)',
    overlayGold20: 'rgba(255, 215, 0, 0.2)',
    overlayCozyWarm15: 'rgba(215, 150, 134, 0.15)',
    overlayCozyWarm40: 'rgba(215, 150, 134, 0.4)',
    overlayCoral055: 'rgba(255,99,64,0.055)',
    overlayCoral07: 'rgba(255,99,64,0.07)',
    overlayEmber06: 'rgba(255,85,51,0.06)',
    overlayWarmDark20: 'rgba(26,8,0,0.20)',
    overlayWarmDark45: 'rgba(26,8,0,0.45)',
    overlaySportGreen12: 'rgba(61,214,140,0.12)',
    overlayConnected08: 'rgba(52,211,112,0.08)',
    overlayViolet14: 'rgba(167,139,250,0.14)',
    overlayViolet12: 'rgba(167,139,250,0.12)',
    overlayViolet18: 'rgba(167,139,250,0.18)',
    overlayViolet15: 'rgba(167, 139, 250, 0.15)',
    overlayViolet20: 'rgba(167,139,250,0.2)',
    overlayViolet24: 'rgba(167,139,250,0.24)',
    overlayViolet25: 'rgba(167, 139, 250, 0.25)',
    overlaySuccess08: 'rgba(74, 222, 128, 0.08)',
    overlaySuccess10: 'rgba(74, 222, 128, 0.10)',
    overlaySuccess15: 'rgba(74, 222, 128, 0.15)',
    overlaySuccess20: 'rgba(74, 222, 128, 0.2)',
    overlayConnected15: 'rgba(34, 197, 94, 0.15)',
    overlayConnected20: 'rgba(34, 197, 94, 0.2)',
    overlayConnected05: 'rgba(34, 197, 94, 0.05)',
    overlayConnected40: 'rgba(74, 222, 128, 0.4)',
    overlayInfo12: 'rgba(34, 211, 238, 0.12)',
    overlayInfo15: 'rgba(34, 211, 238, 0.15)',
    overlayInfo35: 'rgba(34, 211, 238, 0.35)',
    overlayRose08: 'rgba(244, 63, 94, 0.08)',
    overlayTeal10: 'rgba(45, 212, 191, 0.1)',
    overlayTeal15: 'rgba(45, 212, 191, 0.15)',
    overlayTeal20: 'rgba(45, 212, 191, 0.2)',
    overlayGray10: 'rgba(128, 128, 128, 0.1)',
    overlayWarning10: 'rgba(251, 191, 36, 0.1)',
    overlayWarning15: 'rgba(251, 191, 36, 0.15)',
    overlayWarning20: 'rgba(251, 191, 36, 0.2)',
    overlayWarning30: 'rgba(251, 191, 36, 0.3)',
    overlayWarningDeep12: 'rgba(245,166,35,0.12)',
    overlayWarningDeep45: 'rgba(245,166,35,0.45)',
    overlayWarningDeep95: 'rgba(245,166,35,0.95)',
    overlayError10: 'rgba(239, 68, 68, 0.1)',
    overlayError09: 'rgba(248,113,113,0.09)',
    overlayError15: 'rgba(239, 68, 68, 0.15)',
    overlayError20: 'rgba(248,113,113,0.2)',
    overlayError30: 'rgba(239, 68, 68, 0.3)',
    overlayErrorStrong20: 'rgba(239, 68, 68, 0.2)',
    overlayErrorStrong05: 'rgba(239, 68, 68, 0.05)',
    overlayErrorSoft15: 'rgba(248, 113, 113, 0.15)',
    overlayErrorSoft30: 'rgba(248, 113, 113, 0.3)',
    overlaySuccess12: 'rgba(74,222,128,0.12)',
    overlaySuccess24: 'rgba(74,222,128,0.24)',
    overlayMint12: 'rgba(52,211,153,0.12)',
    overlayMint16: 'rgba(52,211,153,0.16)',
    overlayMint28: 'rgba(52,211,153,0.28)',
    overlaySky12: 'rgba(96,165,250,0.12)',
    overlaySky16: 'rgba(96,165,250,0.16)',
    overlaySky30: 'rgba(96,165,250,0.3)',
    overlayOrange14: 'rgba(249,115,22,0.14)',
    overlayOrange16: 'rgba(249,115,22,0.16)',
    overlayOrange24: 'rgba(249,115,22,0.24)',
    overlayViolet35: 'rgba(167, 139, 250, 0.35)',
    overlayVioletStrong10: 'rgba(139, 92, 246, 0.1)',
    overlayVioletStrong15: 'rgba(139, 92, 246, 0.15)',
    overlaySportGreen07: 'rgba(52,211,112,0.07)',
    overlaySportGreen02: 'rgba(52,211,112,0.02)',

    // Specific
    ringBg: 'rgba(255, 255, 255, 0.24)',
    modalBg: 'rgba(20, 20, 26, 0.95)',
} as const;

export const ScreenPalettes = {
    today: {
        bg: '#08080b',
        surface: '#0f1015',
        surfaceUp: '#141620',
        border: 'rgba(255,255,255,0.06)',
        borderMid: 'rgba(255,255,255,0.10)',
        borderGlow: 'rgba(255,100,60,0.30)',
        text: '#f2efe9',
        textSub: 'rgba(242,239,233,0.55)',
        textMuted: 'rgba(242,239,233,0.30)',
        coral: '#ff6340',
        coralMid: '#ff8c5a',
        amber: '#ffb040',
        coralSoft: 'rgba(255,99,64,0.12)',
        coralGlow: 'rgba(255,99,64,0.18)',
        green: '#3dd68c',
        greenSoft: 'rgba(61,214,140,0.10)',
        greenBorder: 'rgba(61,214,140,0.22)',
        gold: '#f0c040',
        goldSoft: 'rgba(240,192,64,0.12)',
        goldBorder: 'rgba(240,192,64,0.28)',
    },

    warm: {
        bg: '#070709',
        surface: '#0e0f14',
        surfaceUp: '#13151e',
        surfaceHigh: '#1a1d28',
        border: 'rgba(255,255,255,0.07)',
        borderUp: 'rgba(255,255,255,0.12)',
        text: '#f0ece4',
        textSub: 'rgba(240,236,228,0.55)',
        textMuted: 'rgba(240,236,228,0.28)',
        ember: '#ff5533',
        emberMid: '#ff7a55',
        emberGlow: 'rgba(255,85,51,0.15)',
        emberBorder: 'rgba(255,85,51,0.25)',
        gold: '#e8b84b',
        goldSoft: 'rgba(232,184,75,0.10)',
        goldBorder: 'rgba(232,184,75,0.22)',
        amber: '#f5a623',
        blue: '#ff7a55',
        blueSoft: 'rgba(255,122,85,0.10)',
        blueBorder: 'rgba(255,122,85,0.22)',
        teal: '#ff8c5a',
        tealSoft: 'rgba(255,140,90,0.10)',
        tealBorder: 'rgba(255,140,90,0.22)',
        green: '#34d370',
        greenSoft: 'rgba(52,211,112,0.10)',
        greenBorder: 'rgba(52,211,112,0.22)',
        violet: '#e8b84b',
        error: '#f87171',
    },

    cool: {
        bg: '#070709',
        surface: '#0e0f14',
        surfaceUp: '#13151e',
        surfaceHigh: '#1a1d28',
        border: 'rgba(255,255,255,0.07)',
        borderUp: 'rgba(255,255,255,0.12)',
        text: '#f0ece4',
        textSub: 'rgba(240,236,228,0.55)',
        textMuted: 'rgba(240,236,228,0.28)',
        ember: '#ff5533',
        emberMid: '#ff7a55',
        emberGlow: 'rgba(255,85,51,0.15)',
        emberBorder: 'rgba(255,85,51,0.25)',
        gold: '#e8b84b',
        goldSoft: 'rgba(232,184,75,0.10)',
        goldBorder: 'rgba(232,184,75,0.22)',
        amber: '#f5a623',
        blue: '#5599ff',
        blueSoft: 'rgba(85,153,255,0.10)',
        blueBorder: 'rgba(85,153,255,0.22)',
        teal: '#2dd4bf',
        tealSoft: 'rgba(45,212,191,0.10)',
        tealBorder: 'rgba(45,212,191,0.22)',
        green: '#34d370',
        greenSoft: 'rgba(52,211,112,0.10)',
        greenBorder: 'rgba(52,211,112,0.22)',
        violet: '#a78bfa',
        violetSoft: 'rgba(167,139,250,0.10)',
        violetBorder: 'rgba(167,139,250,0.22)',
        error: '#f87171',
    },

    runAi: {
        bg: '#070709',
        surface: '#0e0f14',
        surfaceUp: '#13151e',
        surfaceHigh: '#1a1d28',
        border: 'rgba(255,255,255,0.07)',
        borderUp: 'rgba(255,255,255,0.12)',
        text: '#f0ece4',
        textSub: 'rgba(240,236,228,0.55)',
        textMuted: 'rgba(240,236,228,0.28)',
        blue: '#5599ff',
        blueSoft: 'rgba(85,153,255,0.10)',
        blueBorder: 'rgba(85,153,255,0.22)',
        green: '#34d370',
        greenSoft: 'rgba(52,211,112,0.10)',
        greenBorder: 'rgba(52,211,112,0.22)',
        gold: '#e8b84b',
        goldSoft: 'rgba(232,184,75,0.10)',
        violet: '#a78bfa',
        violetSoft: 'rgba(167,139,250,0.12)',
        violetBorder: 'rgba(167,139,250,0.22)',
    },
} as const;

export const Spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 14,
    xl: 16,
    xxl: 20,
    xxxl: 24,
} as const;

export const BorderRadius = {
    sm: 10,
    md: 14,
    lg: 18,
    xl: 22,
    xxl: 24,
    full: 999,
} as const;

export const FontSize = {
    xs: 11,
    sm: 12,
    md: 13,
    lg: 14,
    xl: 16,
    xxl: 18,
    xxxl: 24,
    display: 32,
} as const;

export const FontWeight = {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
} as const;

export const Shadows = {
    card: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.45,
        shadowRadius: 20,
        elevation: 12,
    },
    cta: {
        shadowColor: '#d79686',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.25,
        shadowRadius: 15,
        elevation: 8,
    },
} as const;

// Gradients (pour LinearGradient)
export const Gradients = {
    tealCard: ['rgba(31, 106, 102, 0.75)', 'rgba(31, 106, 102, 0.35)'],
    cta: ['#e3a090', '#d79686'],
    ctaReverse: ['#d79686', '#e3a090'],
    gold: ['#f5c842', '#e5a832'],
    goldSubtle: ['rgba(245, 200, 66, 0.35)', 'rgba(229, 168, 50, 0.15)'],
    cozyWarm: ['rgba(232, 180, 160, 0.25)', 'rgba(215, 150, 134, 0.10)'],
    premium: ['rgba(45, 48, 60, 0.95)', 'rgba(26, 27, 34, 0.90)'],
} as const;

// Labels
export const Labels = {
    focusArea: {
        upper: 'Haut du corps',
        abs: 'Abdos',
        legs: 'Jambes',
        full: 'Full body',
    },
    intensity: {
        easy: 'Facile',
        medium: 'Moyen',
        hard: 'Difficile',
    },
    duration: {
        10: '10 min',
        20: '20 min',
        30: '30 min',
    },
    entryType: {
        home: 'Musculation',
        run: 'Course',
        meal: 'Repas',
        measure: 'Mesures',
    },
} as const;

// Icons (emoji ou noms pour expo vector icons)
export const Icons = {
    home: '💪',
    run: '🏃',
    meal: '🍽️',
    measure: '📏',
    streak: '🔥',
    badge: '🏆',
    check: '✓',
    plus: '+',
    settings: '⚙️',
    export: '📤',
    copy: '📋',
} as const;

type MutableColorMap = Record<string, string>;

const DEFAULT_COLORS_SNAPSHOT: MutableColorMap = {
    ...(Colors as unknown as MutableColorMap),
};

const DEFAULT_GRADIENTS_SNAPSHOT: Record<string, string[]> = JSON.parse(JSON.stringify(Gradients));
const DEFAULT_SCREEN_PALETTES_SNAPSHOT: Record<string, Record<string, string>> = JSON.parse(JSON.stringify(ScreenPalettes));
const DEFAULT_SHADOWS_SNAPSHOT = JSON.parse(JSON.stringify(Shadows));

export const DEFAULT_THEME_CUSTOM_COLORS: ThemeCustomColors = {
    bg: DEFAULT_COLORS_SNAPSHOT.bg,
    surface: DEFAULT_COLORS_SNAPSHOT.cardSolid,
    text: DEFAULT_COLORS_SNAPSHOT.text,
    muted: DEFAULT_COLORS_SNAPSHOT.muted,
    primary: DEFAULT_COLORS_SNAPSHOT.cta,
    secondary: DEFAULT_COLORS_SNAPSHOT.teal,
    success: DEFAULT_COLORS_SNAPSHOT.successStrong,
    warning: DEFAULT_COLORS_SNAPSHOT.warning,
    error: DEFAULT_COLORS_SNAPSHOT.errorStrong,
    info: DEFAULT_COLORS_SNAPSHOT.info,
    violet: DEFAULT_COLORS_SNAPSHOT.violet,
    rose: DEFAULT_COLORS_SNAPSHOT.rose,
    gold: DEFAULT_COLORS_SNAPSHOT.gold,
};

export const THEME_PRESET_COLORS: Record<Exclude<ThemePreset, 'custom'>, ThemeCustomColors> = {
    default: { ...DEFAULT_THEME_CUSTOM_COLORS },
    ocean: {
        bg: '#061019',
        surface: '#0e1e2d',
        text: '#e9f6ff',
        muted: '#9dc4db',
        primary: '#4aa8ff',
        secondary: '#2dd4bf',
        success: '#34d399',
        warning: '#22d3ee',
        error: '#f87171',
        info: '#38bdf8',
        violet: '#8b9dff',
        rose: '#fb7185',
        gold: '#60a5fa',
    },
    sunset: {
        bg: '#130b0a',
        surface: '#241413',
        text: '#fff1ec',
        muted: '#d7b3ab',
        primary: '#ff7a59',
        secondary: '#f59e0b',
        success: '#4ade80',
        warning: '#fb923c',
        error: '#ef4444',
        info: '#fb923c',
        violet: '#c084fc',
        rose: '#fb7185',
        gold: '#ff7a59',
    },
    forest: {
        bg: '#08110c',
        surface: '#13201a',
        text: '#ecfff3',
        muted: '#a5c5b2',
        primary: '#22c55e',
        secondary: '#14b8a6',
        success: '#34d399',
        warning: '#16a34a',
        error: '#f87171',
        info: '#22d3ee',
        violet: '#86efac',
        rose: '#fb7185',
        gold: '#22c55e',
    },
    midnight: {
        bg: '#05070f',
        surface: '#101427',
        text: '#eef2ff',
        muted: '#a8b2d1',
        primary: '#7c83ff',
        secondary: '#22d3ee',
        success: '#4ade80',
        warning: '#8b9dff',
        error: '#f87171',
        info: '#60a5fa',
        violet: '#a78bfa',
        rose: '#fb7185',
        gold: '#c084fc',
    },
};

const clamp = (value: number, min = 0, max = 1): number => Math.min(max, Math.max(min, value));

const normalizeHexInternal = (value: string): string | null => {
    const input = value.trim();
    const normalized = input.startsWith('#') ? input : `#${input}`;

    if (!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(normalized)) {
        return null;
    }

    if (normalized.length === 4) {
        const [, r, g, b] = normalized;
        return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
    }

    return normalized.toLowerCase();
};

export const normalizeThemeHexColor = (value: string): string | null => normalizeHexInternal(value);

const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    const safeHex = normalizeHexInternal(hex) ?? '#000000';
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

const mixHex = (from: string, to: string, weight: number): string => {
    const ratio = clamp(weight);
    const a = hexToRgb(from);
    const b = hexToRgb(to);
    return rgbToHex(
        a.r + (b.r - a.r) * ratio,
        a.g + (b.g - a.g) * ratio,
        a.b + (b.b - a.b) * ratio
    );
};

const lighten = (color: string, amount: number): string => mixHex(color, '#ffffff', amount);
const darken = (color: string, amount: number): string => mixHex(color, '#000000', amount);

const alpha = (color: string, opacity: number): string => {
    const { r, g, b } = hexToRgb(color);
    return `rgba(${r}, ${g}, ${b}, ${clamp(opacity)})`;
};

const alphaFromToken = (token: string): number | null => {
    const match = token.match(/(\d{1,3})$/);
    if (!match) return null;
    const raw = match[1];
    if (raw.length === 3 && raw.startsWith('0')) {
        return clamp(Number(raw) / 1000);
    }
    return clamp(Number(raw) / 100);
};

const sanitizeThemeColors = (input?: Partial<ThemeCustomColors>): ThemeCustomColors => {
    const base = DEFAULT_THEME_CUSTOM_COLORS;
    return {
        bg: normalizeHexInternal(input?.bg ?? '') ?? base.bg,
        surface: normalizeHexInternal(input?.surface ?? '') ?? base.surface,
        text: normalizeHexInternal(input?.text ?? '') ?? base.text,
        muted: normalizeHexInternal(input?.muted ?? '') ?? base.muted,
        primary: normalizeHexInternal(input?.primary ?? '') ?? base.primary,
        secondary: normalizeHexInternal(input?.secondary ?? '') ?? base.secondary,
        success: normalizeHexInternal(input?.success ?? '') ?? base.success,
        warning: normalizeHexInternal(input?.warning ?? '') ?? base.warning,
        error: normalizeHexInternal(input?.error ?? '') ?? base.error,
        info: normalizeHexInternal(input?.info ?? '') ?? base.info,
        violet: normalizeHexInternal(input?.violet ?? '') ?? base.violet,
        rose: normalizeHexInternal(input?.rose ?? '') ?? base.rose,
        gold: normalizeHexInternal(input?.gold ?? '') ?? base.gold,
    };
};

const createDynamicColors = (theme: ThemeCustomColors): MutableColorMap => {
    const generated: MutableColorMap = {};
    const neutral = mixHex(theme.bg, theme.text, 0.45);
    const neutralStrong = mixHex(theme.bg, theme.text, 0.25);
    const neutralSoft = mixHex(theme.bg, theme.text, 0.6);
    const orange = mixHex(theme.warning, theme.error, 0.45);

    const colorForOverlayToken = (token: string): string => {
        const value = alphaFromToken(token) ?? 0.15;

        if (token.includes('Black')) return alpha('#000000', value);
        if (token.includes('White')) return alpha('#ffffff', value);
        if (token.includes('Connected') || token.includes('Success') || token.includes('SportGreen')) return alpha(theme.success, value);
        if (token.includes('Warning')) return alpha(theme.warning, value);
        if (token.includes('Error')) return alpha(theme.error, value);
        if (token.includes('Violet')) return alpha(theme.violet, value);
        if (token.includes('Mint')) return alpha(theme.secondary, value);
        if (token.includes('Sky') || token.includes('Info')) return alpha(theme.info, value);
        if (token.includes('Orange')) return alpha(orange, value);
        if (token.includes('Teal')) return alpha(theme.secondary, value);
        if (token.includes('Gold')) return alpha(theme.gold, value);
        if (token.includes('Rose')) return alpha(theme.rose, value);
        if (token.includes('Gray')) return alpha(neutral, value);
        if (
            token.includes('Warm') ||
            token.includes('CozyWarm') ||
            token.includes('Coral') ||
            token.includes('Ember')
        ) {
            return alpha(theme.primary, value);
        }

        return alpha(theme.text, value);
    };

    Object.keys(DEFAULT_COLORS_SNAPSHOT).forEach((token) => {
        if (token === 'white') {
            generated[token] = '#ffffff';
            return;
        }

        if (token === 'black') {
            generated[token] = '#000000';
            return;
        }

        if (token === 'transparent') {
            generated[token] = 'transparent';
            return;
        }

        if (token.startsWith('overlay') || token.startsWith('textWhite')) {
            generated[token] = colorForOverlayToken(token);
            return;
        }

        switch (token) {
            case 'bg':
                generated[token] = theme.bg;
                break;
            case 'bgLayer':
                generated[token] = mixHex(theme.bg, theme.surface, 0.65);
                break;
            case 'card':
                generated[token] = alpha(theme.surface, 0.85);
                break;
            case 'cardSolid':
                generated[token] = theme.surface;
                break;
            case 'cardElevated':
                generated[token] = alpha(lighten(theme.surface, 0.08), 0.9);
                break;
            case 'text':
                generated[token] = theme.text;
                break;
            case 'textSecondary':
                generated[token] = alpha(theme.text, 0.85);
                break;
            case 'muted':
                generated[token] = theme.muted;
                break;
            case 'muted2':
                generated[token] = mixHex(theme.muted, theme.bg, 0.35);
                break;
            case 'teal':
                generated[token] = theme.secondary;
                break;
            case 'tealLight':
                generated[token] = alpha(theme.secondary, 0.35);
                break;
            case 'cta':
                generated[token] = theme.primary;
                break;
            case 'cta2':
                generated[token] = lighten(theme.primary, 0.08);
                break;
            case 'accent':
                generated[token] = mixHex(theme.primary, theme.error, 0.45);
                break;
            case 'gold':
                generated[token] = theme.gold;
                break;
            case 'goldStrong':
                generated[token] = lighten(theme.gold, 0.1);
                break;
            case 'goldLight':
                generated[token] = alpha(theme.gold, 0.25);
                break;
            case 'cozyWarm':
                generated[token] = lighten(theme.primary, 0.12);
                break;
            case 'cozyWarmLight':
                generated[token] = alpha(theme.primary, 0.15);
                break;
            case 'cozyWarmDarkText':
                generated[token] = darken(theme.bg, 0.35);
                break;
            case 'warmDarkText':
                generated[token] = darken(theme.bg, 0.45);
                break;
            case 'violetDeep':
                generated[token] = darken(theme.violet, 0.1);
                break;
            case 'successMid':
                generated[token] = mixHex(theme.success, '#000000', 0.2);
                break;
            case 'stroke':
                generated[token] = alpha(theme.text, 0.1);
                break;
            case 'strokeLight':
                generated[token] = alpha(theme.text, 0.16);
                break;
            case 'overlay':
                generated[token] = alpha(theme.text, 0.08);
                break;
            case 'overlayMedium':
                generated[token] = alpha(theme.text, 0.12);
                break;
            case 'success':
                generated[token] = lighten(theme.success, 0.1);
                break;
            case 'successStrong':
                generated[token] = theme.success;
                break;
            case 'warning':
                generated[token] = theme.warning;
                break;
            case 'error':
                generated[token] = lighten(theme.error, 0.08);
                break;
            case 'errorStrong':
                generated[token] = theme.error;
                break;
            case 'violet':
                generated[token] = theme.violet;
                break;
            case 'violetStrong':
                generated[token] = darken(theme.violet, 0.08);
                break;
            case 'blue':
                generated[token] = theme.info;
                break;
            case 'info':
                generated[token] = theme.info;
                break;
            case 'rose':
                generated[token] = theme.rose;
                break;
            case 'orange':
                generated[token] = orange;
                break;
            case 'emerald':
                generated[token] = theme.success;
                break;
            case 'warningDeep':
                generated[token] = darken(theme.warning, 0.18);
                break;
            case 'silver':
                generated[token] = neutralSoft;
                break;
            case 'bronze':
                generated[token] = mixHex(theme.warning, theme.primary, 0.4);
                break;
            case 'gray400':
                generated[token] = neutralSoft;
                break;
            case 'gray500':
                generated[token] = neutral;
                break;
            case 'gray700':
                generated[token] = neutralStrong;
                break;
            case 'gray800':
                generated[token] = mixHex(theme.bg, theme.surface, 0.75);
                break;
            case 'red100':
                generated[token] = mixHex(theme.error, '#ffffff', 0.82);
                break;
            case 'sportGreen':
                generated[token] = theme.success;
                break;
            case 'mint':
                generated[token] = theme.secondary;
                break;
            case 'sky':
                generated[token] = theme.info;
                break;
            case 'amberStrong':
                generated[token] = darken(theme.warning, 0.08);
                break;
            case 'lime':
                generated[token] = lighten(theme.success, 0.18);
                break;
            case 'pink':
                generated[token] = lighten(theme.rose, 0.08);
                break;
            case 'ringBg':
                generated[token] = alpha(theme.text, 0.24);
                break;
            case 'modalBg':
                generated[token] = alpha(mixHex(theme.bg, theme.surface, 0.7), 0.95);
                break;
            default:
                generated[token] = mixHex(theme.surface, theme.text, 0.2);
                break;
        }
    });

    return generated;
};

const applyScreenPalettes = (theme: ThemeCustomColors) => {
    const today = ScreenPalettes.today as unknown as Record<string, string>;
    today.bg = darken(theme.bg, 0.15);
    today.surface = theme.surface;
    today.surfaceUp = lighten(theme.surface, 0.08);
    today.border = alpha(theme.text, 0.06);
    today.borderMid = alpha(theme.text, 0.1);
    today.borderGlow = alpha(theme.primary, 0.3);
    today.text = theme.text;
    today.textSub = alpha(theme.text, 0.55);
    today.textMuted = alpha(theme.text, 0.3);
    today.coral = theme.primary;
    today.coralMid = lighten(theme.primary, 0.12);
    today.amber = theme.warning;
    today.coralSoft = alpha(theme.primary, 0.12);
    today.coralGlow = alpha(theme.primary, 0.18);
    today.green = theme.success;
    today.greenSoft = alpha(theme.success, 0.1);
    today.greenBorder = alpha(theme.success, 0.22);
    today.gold = theme.gold;
    today.goldSoft = alpha(theme.gold, 0.12);
    today.goldBorder = alpha(theme.gold, 0.28);

    const warm = ScreenPalettes.warm as unknown as Record<string, string>;
    warm.bg = darken(theme.bg, 0.2);
    warm.surface = theme.surface;
    warm.surfaceUp = lighten(theme.surface, 0.06);
    warm.surfaceHigh = lighten(theme.surface, 0.1);
    warm.border = alpha(theme.text, 0.07);
    warm.borderUp = alpha(theme.text, 0.12);
    warm.text = theme.text;
    warm.textSub = alpha(theme.text, 0.55);
    warm.textMuted = alpha(theme.text, 0.28);
    warm.ember = theme.primary;
    warm.emberMid = lighten(theme.primary, 0.12);
    warm.emberGlow = alpha(theme.primary, 0.15);
    warm.emberBorder = alpha(theme.primary, 0.25);
    warm.gold = theme.gold;
    warm.goldSoft = alpha(theme.gold, 0.1);
    warm.goldBorder = alpha(theme.gold, 0.22);
    warm.amber = theme.warning;
    warm.blue = lighten(theme.primary, 0.05);
    warm.blueSoft = alpha(theme.primary, 0.1);
    warm.blueBorder = alpha(theme.primary, 0.22);
    warm.teal = lighten(theme.secondary, 0.05);
    warm.tealSoft = alpha(theme.secondary, 0.1);
    warm.tealBorder = alpha(theme.secondary, 0.22);
    warm.green = theme.success;
    warm.greenSoft = alpha(theme.success, 0.1);
    warm.greenBorder = alpha(theme.success, 0.22);
    warm.violet = theme.violet;
    warm.error = lighten(theme.error, 0.08);

    const cool = ScreenPalettes.cool as unknown as Record<string, string>;
    Object.assign(cool, warm);
    cool.blue = theme.info;
    cool.blueSoft = alpha(theme.info, 0.1);
    cool.blueBorder = alpha(theme.info, 0.22);
    cool.teal = theme.secondary;
    cool.tealSoft = alpha(theme.secondary, 0.1);
    cool.tealBorder = alpha(theme.secondary, 0.22);
    cool.violet = theme.violet;
    cool.violetSoft = alpha(theme.violet, 0.1);
    cool.violetBorder = alpha(theme.violet, 0.22);

    const runAi = ScreenPalettes.runAi as unknown as Record<string, string>;
    runAi.bg = cool.bg;
    runAi.surface = cool.surface;
    runAi.surfaceUp = cool.surfaceUp;
    runAi.surfaceHigh = cool.surfaceHigh;
    runAi.border = cool.border;
    runAi.borderUp = cool.borderUp;
    runAi.text = cool.text;
    runAi.textSub = cool.textSub;
    runAi.textMuted = cool.textMuted;
    runAi.blue = theme.info;
    runAi.blueSoft = alpha(theme.info, 0.1);
    runAi.blueBorder = alpha(theme.info, 0.22);
    runAi.green = theme.success;
    runAi.greenSoft = alpha(theme.success, 0.1);
    runAi.greenBorder = alpha(theme.success, 0.22);
    runAi.gold = theme.gold;
    runAi.goldSoft = alpha(theme.gold, 0.1);
    runAi.violet = theme.violet;
    runAi.violetSoft = alpha(theme.violet, 0.12);
    runAi.violetBorder = alpha(theme.violet, 0.22);
};

const applyGradients = (theme: ThemeCustomColors) => {
    const gradients = Gradients as unknown as Record<string, string[]>;
    gradients.tealCard = [alpha(theme.secondary, 0.75), alpha(theme.secondary, 0.35)];
    gradients.cta = [lighten(theme.primary, 0.1), theme.primary];
    gradients.ctaReverse = [theme.primary, lighten(theme.primary, 0.1)];
    gradients.gold = [theme.gold, darken(theme.gold, 0.12)];
    gradients.goldSubtle = [alpha(theme.gold, 0.35), alpha(theme.gold, 0.15)];
    gradients.cozyWarm = [alpha(lighten(theme.primary, 0.12), 0.25), alpha(theme.primary, 0.1)];
    gradients.premium = [alpha(theme.surface, 0.95), alpha(mixHex(theme.bg, theme.surface, 0.75), 0.9)];
};

const applyShadows = (theme: ThemeCustomColors) => {
    const shadows = Shadows as unknown as Record<string, Record<string, any>>;
    shadows.card.shadowColor = darken(theme.bg, 0.6);
    shadows.cta.shadowColor = theme.primary;
};

const restoreDefaults = () => {
    const colorsTarget = Colors as unknown as MutableColorMap;
    Object.keys(DEFAULT_COLORS_SNAPSHOT).forEach((token) => {
        colorsTarget[token] = DEFAULT_COLORS_SNAPSHOT[token];
    });

    const gradientsTarget = Gradients as unknown as Record<string, string[]>;
    Object.keys(DEFAULT_GRADIENTS_SNAPSHOT).forEach((token) => {
        gradientsTarget[token] = [...DEFAULT_GRADIENTS_SNAPSHOT[token]];
    });

    const palettesTarget = ScreenPalettes as unknown as Record<string, Record<string, string>>;
    Object.keys(DEFAULT_SCREEN_PALETTES_SNAPSHOT).forEach((groupKey) => {
        const group = palettesTarget[groupKey];
        const source = DEFAULT_SCREEN_PALETTES_SNAPSHOT[groupKey];
        Object.keys(source).forEach((token) => {
            group[token] = source[token];
        });
    });

    const shadowsTarget = Shadows as unknown as Record<string, Record<string, any>>;
    Object.keys(DEFAULT_SHADOWS_SNAPSHOT).forEach((token) => {
        shadowsTarget[token] = { ...DEFAULT_SHADOWS_SNAPSHOT[token] };
    });

    resetRepCounterTheme();
};

const resolveThemeColors = (settings?: Partial<UserSettings> | null): ThemeCustomColors | null => {
    const preset = settings?.themePreset ?? 'default';

    if (preset === 'default') {
        return null;
    }

    if (preset === 'custom') {
        return sanitizeThemeColors(settings?.customThemeColors);
    }

    return THEME_PRESET_COLORS[preset] ? sanitizeThemeColors(THEME_PRESET_COLORS[preset]) : null;
};

export const applyThemeFromUserSettings = (settings?: Partial<UserSettings> | null): void => {
    const resolved = resolveThemeColors(settings);
    if (!resolved) {
        restoreDefaults();
        return;
    }

    const colorsTarget = Colors as unknown as MutableColorMap;
    const generated = createDynamicColors(resolved);
    Object.keys(generated).forEach((token) => {
        colorsTarget[token] = generated[token];
    });

    applyGradients(resolved);
    applyScreenPalettes(resolved);
    applyShadows(resolved);
    applyRepCounterTheme(resolved);
};

const readStoredSettings = (): Partial<UserSettings> | null => {
    try {
        const raw = storageHelpers.getString(STORAGE_KEYS.appStore);
        if (typeof raw !== 'string' || !raw) {
            return null;
        }

        const parsed = JSON.parse(raw);
        const persistedState = parsed?.state;
        const settings = persistedState?.settings ?? parsed?.settings;
        return settings ?? null;
    } catch {
        return null;
    }
};

export const initializeThemeFromStorage = (): void => {
    const settings = readStoredSettings();
    applyThemeFromUserSettings(settings);
};

initializeThemeFromStorage();
