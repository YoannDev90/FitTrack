// ============================================================================
// BUILD CONFIG - Configuration des flavors (standard vs FOSS)
// ============================================================================

import Constants from 'expo-constants';
import { useAppStore } from '../stores/appStore';

/**
 * Détecte automatiquement le type de build basé sur:
 * 1. Variable d'environnement EXPO_PUBLIC_BUILD_FLAVOR
 * 2. Présence de la config google-services (Expo extra)
 * 3. ApplicationId contenant "foss"
 */
function detectBuildFlavor(): 'standard' | 'foss' {
    // 1. Check environment variable (highest priority)
    const envFlavor = process.env.EXPO_PUBLIC_BUILD_FLAVOR;
    if (envFlavor === 'foss') return 'foss';
    if (envFlavor === 'standard') return 'standard';

    // 2. Check Expo extra config
    const extra = Constants.expoConfig?.extra;
    if (extra?.buildFlavor === 'foss') return 'foss';

    // 3. Check package name for "foss" suffix
    const packageName = Constants.expoConfig?.android?.package || '';
    if (packageName.includes('.foss')) return 'foss';

    // Default to standard build
    return 'standard';
}

/**
 * Type de build actuel
 */
export const BUILD_FLAVOR = detectBuildFlavor();

function shouldSimulateFossBuild(): boolean {
    try {
        const settings = useAppStore.getState().settings;
        return settings.developerMode === true && settings.simulateFossBuild === true;
    } catch (error) {
        if (__DEV__) {
            console.warn('[BuildConfig] Failed to read developer override settings', error);
        }
        return false;
    }
}

export function getEffectiveBuildFlavor(): 'standard' | 'foss' {
    if (shouldSimulateFossBuild()) {
        return 'foss';
    }
    return BUILD_FLAVOR;
}

/**
 * Configuration basée sur le flavor
 */
export const BuildConfig = {
    /** Type de build réel détecté (sans override développeur) */
    baseFlavor: BUILD_FLAVOR,

    /** Type de build effectif: peut être overridé en mode développeur */
    get flavor(): 'standard' | 'foss' {
        return getEffectiveBuildFlavor();
    },

    /** Est-ce un build FOSS (sans Firebase/FCM) */
    get isFoss(): boolean {
        return getEffectiveBuildFlavor() === 'foss';
    },

    /** Est-ce un build standard (avec toutes les fonctionnalités) */
    get isStandard(): boolean {
        return getEffectiveBuildFlavor() === 'standard';
    },

    /** Notifications push activées (uniquement sur standard) */
    get pushNotificationsEnabled(): boolean {
        return getEffectiveBuildFlavor() === 'standard';
    },

    /** FCM activé (uniquement sur standard) */
    get fcmEnabled(): boolean {
        return getEffectiveBuildFlavor() === 'standard';
    },

    /** Expo Push Tokens (uniquement sur standard) */
    get expoPushEnabled(): boolean {
        return getEffectiveBuildFlavor() === 'standard';
    },

    /** URL GitHub Releases pour télécharger la version complète */
    githubReleasesUrl: 'https://github.com/LuckyTheCookie/FitTrack/releases',

    /** Nom d'affichage du flavor */
    get flavorDisplayName(): 'FOSS Edition' | 'Standard' {
        return getEffectiveBuildFlavor() === 'foss' ? 'FOSS Edition' : 'Standard';
    },
};

/**
 * Vérifie si les notifications push sont disponibles pour ce build
 */
export function isPushAvailable(): boolean {
    return BuildConfig.pushNotificationsEnabled;
}

/**
 * Vérifie si c'est un build FOSS
 */
export function isFossBuild(): boolean {
    return BuildConfig.isFoss;
}

export default BuildConfig;
