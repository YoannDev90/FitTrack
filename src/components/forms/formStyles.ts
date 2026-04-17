// ============================================================================
// FORM DESIGN SYSTEM — Tokens, palette & styles partagés
// Direction : Luxury dark · surfaces stratifiées · accents chauds
// ============================================================================

import { StyleSheet } from 'react-native';

// ─── Palette ─────────────────────────────────────────────────────────────────
export const FC = {
    // Fonds
    bg:            '#08080b',
    surface:       '#0f1015',
    surfaceUp:     '#141620',
    surfaceHigh:   '#1b1e2a',
    overlay:       'rgba(255,255,255,0.04)',

    // Bordures
    border:        'rgba(255,255,255,0.07)',
    borderMid:     'rgba(255,255,255,0.12)',
    borderGlow:    'rgba(255,99,64,0.28)',
    stroke:        'rgba(255,255,255,0.06)',

    // Textes
    text:          '#f2efe9',
    textSub:       'rgba(242,239,233,0.55)',
    textMuted:     'rgba(242,239,233,0.32)',
    error:         '#f87171',

    // Accents — Coral → Amber (cohérent avec TodayScreen)
    coral:         '#ff6340',
    coralMid:      '#ff8c5a',
    amber:         '#ffb040',
    coralSoft:     'rgba(255,99,64,0.12)',
    coralGlow:     'rgba(255,99,64,0.20)',

    // Vert
    green:         '#3dd68c',
    greenSoft:     'rgba(61,214,140,0.10)',
    greenBorder:   'rgba(61,214,140,0.22)',

    // Violet (sport category)
    violet:        '#a78bfa',
    violetSoft:    'rgba(167,139,250,0.14)',
    violetBorder:  'rgba(167,139,250,0.28)',

    // Or
    gold:          '#f0c040',
    goldSoft:      'rgba(240,192,64,0.12)',
};

// ─── Espacements ─────────────────────────────────────────────────────────────
export const FS = {
    xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, xxxl: 40,
};

// ─── Border radius ────────────────────────────────────────────────────────────
export const FR = {
    sm: 10, md: 14, lg: 18, xl: 22, xxl: 26, pill: 999,
};

// ─── Typographie ─────────────────────────────────────────────────────────────
export const FT = {
    micro: 9, xs: 11, sm: 13, md: 15, lg: 17, xl: 20, xxl: 26, display: 32,
};

export const FW = {
    light: '300', reg: '400', med: '500',
    semi: '600', bold: '700', xbold: '800', black: '900',
} as const;

// ─── Styles partagés ─────────────────────────────────────────────────────────
export const sharedStyles = StyleSheet.create({

    // Conteneur principal du formulaire
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },

    // ── Header de navigation
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: FS.xl,
        paddingHorizontal: FS.sm,
    },
    backBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: FS.xs,
        paddingVertical: 8,
        paddingHorizontal: FS.md,
        backgroundColor: FC.overlay,
        borderWidth: 1,
        borderColor: FC.border,
        borderRadius: FR.pill,
    },
    backBtnText: {
        fontSize: FT.sm,
        fontWeight: FW.semi,
        color: FC.textSub,
    },
    headerTitle: {
        fontSize: FT.lg,
        fontWeight: FW.black,
        color: FC.text,
        letterSpacing: -0.4,
    },
    headerSpacer: {
        width: 72,
    },

    // ── Card de base
    card: {
        backgroundColor: FC.surface,
        borderRadius: FR.xxl,
        borderWidth: 1,
        borderColor: FC.border,
        padding: FS.xl,
        marginBottom: FS.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },

    // ── Label section
    sectionLabel: {
        fontSize: FT.xs,
        fontWeight: FW.black,
        color: FC.textMuted,
        letterSpacing: 1.8,
        textTransform: 'uppercase',
        marginBottom: FS.md,
        marginTop: FS.sm,
    },

    // ── Row 2 colonnes
    row: {
        flexDirection: 'row',
        gap: FS.md,
    },
    halfInput: {
        flex: 1,
    },

    // ── Bouton submit principal
    submitButton: {
        marginTop: FS.xxl,
        marginBottom: FS.xxl,
        borderRadius: FR.xxl,
        overflow: 'hidden',
        shadowColor: FC.coral,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    submitGrad: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: FS.md,
        paddingVertical: 18,
    },
    submitText: {
        fontSize: FT.lg,
        fontWeight: FW.black,
        color: '#1a0800',
        letterSpacing: -0.3,
    },

    // ── Input stylisé
    inputWrap: {
        marginBottom: FS.md,
    },
    inputLabel: {
        fontSize: FT.xs,
        fontWeight: FW.bold,
        color: FC.textMuted,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        marginBottom: FS.sm,
    },
    inputField: {
        backgroundColor: FC.surfaceUp,
        borderWidth: 1,
        borderColor: FC.border,
        borderRadius: FR.lg,
        paddingHorizontal: FS.lg,
        paddingVertical: 14,
        fontSize: FT.md,
        fontWeight: FW.med,
        color: FC.text,
    },
    inputFieldFocused: {
        borderColor: FC.coralGlow,
        backgroundColor: FC.surfaceHigh,
    },

    // ── Chip badge
    chip: {
        paddingHorizontal: FS.md,
        paddingVertical: FS.xs,
        borderRadius: FR.pill,
        borderWidth: 1,
        borderColor: FC.border,
    },
    chipText: {
        fontSize: FT.micro,
        fontWeight: FW.black,
        letterSpacing: 1.8,
        textTransform: 'uppercase',
    },
});
