// ============================================================================
// RUN COACH SERVICE - AI coaching via Pollinations during runs
// ============================================================================

import { generateTextAnalysis } from '../pollination/textAnalysis';
import { useRunStore, type LatLng } from '../../stores/runStore';
import { calculateElevationGain } from '../runTracker';
import type { UserSettings } from '../../types';

// ============================================================================
// COACHING TRIGGER CHECK
// ============================================================================

export function shouldTriggerCoaching(
  settings: UserSettings,
  distanceKm: number,
  lastCoachingDistanceKm: number,
  lastCoachingTimestamp: number,
): boolean {
  const runSettings = (settings as {
    runSettings?: {
      coachingEnabled?: boolean;
      coachingMode?: 'distance' | 'time';
      coachingIntervalKm?: number;
      coachingIntervalMinutes?: number;
      pollinationsModel?: string;
    };
  }).runSettings;
  if (!runSettings?.coachingEnabled) return false;

  const mode = runSettings.coachingMode ?? 'distance';
  const now = Date.now();

  if (mode === 'distance') {
    const interval = runSettings.coachingIntervalKm ?? 1;
    return distanceKm >= lastCoachingDistanceKm + interval;
  }

  // time mode
  const intervalMs = (runSettings.coachingIntervalMinutes ?? 5) * 60 * 1000;
  return lastCoachingTimestamp === 0
    ? distanceKm > 0.05 // Wait at least 50m before first coaching
    : now - lastCoachingTimestamp >= intervalMs;
}

// ============================================================================
// COACHING MESSAGE GENERATION
// ============================================================================

interface CoachingContext {
  distanceKm: number;
  elapsedMinutes: number;
  currentPaceSecPerKm: number;
  avgPaceSecPerKm: number;
  targetDistanceKm?: number;
  remainingKm: number;
  progressPercent: number;
  isPaceOnTarget: boolean;
  paceVsTargetPercent: number;
  elevationGainM: number;
  lastMessages: string[];
}

function formatPace(secPerKm: number): string {
  if (secPerKm <= 0) return '--:--';
  const min = Math.floor(secPerKm / 60);
  const sec = Math.floor(secPerKm % 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

export async function generateCoachingMessage(
  context: CoachingContext,
  model: string = 'openai',
  language: string = 'fr',
): Promise<string> {
  const lang = ({ fr: 'français', it: 'italiano', de: 'Deutsch' } as Record<string, string>)[language] ?? 'English';
  const targetPaceStr = context.targetDistanceKm
    ? formatPace(context.avgPaceSecPerKm)
    : 'N/A';

  const systemPrompt = `Tu es Ploppy, coach de course bienveillant et motivant. Message COURT (1-2 phrases max). Réponds en ${lang}.`;

  const userPrompt = `Situation actuelle :
- Distance : ${context.distanceKm.toFixed(2)} km (${context.progressPercent}% de l'objectif)
- Temps écoulé : ${context.elapsedMinutes.toFixed(1)} min
- Allure actuelle : ${formatPace(context.currentPaceSecPerKm)}/km | Allure moyenne : ${formatPace(context.avgPaceSecPerKm)}/km
- Allure : ${context.isPaceOnTarget ? 'dans la cible ✅' : `${context.paceVsTargetPercent}% au-dessus de la cible ⚠️`}
- Dénivelé : +${context.elevationGainM}m
- Derniers messages envoyés : ${context.lastMessages.slice(-2).join(' | ') || 'aucun'}

Génère un message d'encouragement adapté à la situation.
Si l'allure est trop lente, suggère gentiment d'accélérer.
Si l'allure est bonne, encourage à tenir.
Varie le style, ne répète pas les derniers messages.
Réponds UNIQUEMENT avec le texte du message, sans JSON, sans guillemets.`;

  return generateTextAnalysis({ systemPrompt, userPrompt, model });
}

// ============================================================================
// COACHING EXECUTION
// ============================================================================

export async function executeCoaching(
  settings: UserSettings,
  coords: LatLng[],
  language: string = 'fr',
): Promise<void> {
  const store = useRunStore.getState();
  if (store.isLoadingCoach) return;

  store.setIsLoadingCoach(true);

  try {
    const plan = store.plan;
    const targetDistance = plan?.targetDistanceKm ?? 0;
    const targetPace = plan?.targetPaceSecPerKm ?? 0;
    const currentPace = store.currentPaceSecPerKm;

    const context: CoachingContext = {
      distanceKm: store.distanceKm,
      elapsedMinutes: store.elapsedSeconds / 60,
      currentPaceSecPerKm: currentPace,
      avgPaceSecPerKm: store.avgPaceSecPerKm,
      targetDistanceKm: targetDistance || undefined,
      remainingKm: Math.max(0, targetDistance - store.distanceKm),
      progressPercent: targetDistance > 0
        ? Math.round((store.distanceKm / targetDistance) * 100)
        : 0,
      isPaceOnTarget: targetPace > 0 ? currentPace <= targetPace * 1.1 : true,
      paceVsTargetPercent: targetPace > 0
        ? Math.round(((currentPace - targetPace) / targetPace) * 100)
        : 0,
      elevationGainM: calculateElevationGain(coords),
      lastMessages: store.currentAiConversation
        .filter(m => m.role === 'assistant')
        .slice(-2)
        .map(m => m.content),
    };

    const runSettings = (settings as {
      runSettings?: {
        pollinationsModel?: string;
      };
    }).runSettings;
    const model = runSettings?.pollinationsModel ?? settings.aiModel ?? 'openai';
    const message = await generateCoachingMessage(context, model, language);

    store.setLastCoachMessage(message);
    store.appendAiMessage({ role: 'assistant', content: message, timestamp: Date.now() });
    store.updateCoachingCheckpoint(store.distanceKm, Date.now());
  } catch (error) {
    if (__DEV__) {
      console.warn('[RunCoach] Coaching generation failed', error);
    }
  } finally {
    store.setIsLoadingCoach(false);
  }
}
