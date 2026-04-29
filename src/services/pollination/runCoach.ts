// ============================================================================
// RUN COACH SERVICE - AI coaching via Pollinationss during runs
// ============================================================================

import { generateTextAnalysis } from "./textAnalysis";
import { generateTextStream } from "@pollinations_ai/sdk";
import { useRunStore, type LatLng } from "../../stores/runStore";
import { calculateElevationGain } from "../runTracker";
import type { UserSettings } from "../../types";

// ============================================================================
// COACHING TRIGGER CHECK
// ============================================================================

export function shouldTriggerCoaching(
  settings: UserSettings,
  distanceKm: number,
  lastCoachingDistanceKm: number,
  lastCoachingTimestamp: number,
): boolean {
  const runSettings = (
    settings as {
      runSettings?: {
        coachingEnabled?: boolean;
        coachingMode?: "distance" | "time";
        coachingIntervalKm?: number;
        coachingIntervalMinutes?: number;
        pollinationssModel?: string;
      };
    }
  ).runSettings;
  if (!runSettings?.coachingEnabled) return false;

  const mode = runSettings.coachingMode ?? "distance";
  const now = Date.now();

  if (mode === "distance") {
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
  if (secPerKm <= 0) return "--:--";
  const min = Math.floor(secPerKm / 60);
  const sec = Math.floor(secPerKm % 60);
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

export async function generateCoachingMessage(
  context: CoachingContext,
  model: string = "openai",
  language: string = "fr",
  onStreamChunk?: (chunk: string) => void,
): Promise<string> {
  const lang =
    (
      { fr: "français", it: "italiano", de: "Deutsch" } as Record<
        string,
        string
      >
    )[language] ?? "English";
  const targetPaceStr = context.targetDistanceKm
    ? formatPace(context.avgPaceSecPerKm)
    : "N/A";

  const systemPrompt = `Act as Ploppy, a friendly and motivating run coach. Respond in ${lang}. Keep messages SHORT (max 1-2 sentences).`;

  const userPrompt = `Current Run Session Stats:
- Distance: ${context.distanceKm.toFixed(2)} km (${context.progressPercent}% of goal)
- Elapsed Time: ${context.elapsedMinutes.toFixed(1)} min
- Current Pace: ${formatPace(context.currentPaceSecPerKm)}/km | Average Pace: ${formatPace(context.avgPaceSecPerKm)}/km
- Target Status: ${context.isPaceOnTarget ? "ON TARGET ✅" : `${context.paceVsTargetPercent}% ABOVE TARGET ⚠️`}
- Elevation Gain: +${context.elevationGainM}m
- Recent Messages: ${context.lastMessages.slice(-2).join(" | ") || "none"}

Generate a quick motivational message based on these stats.
If the pace is slow, encourage a gentle speed up.
If on target, praise the consistency.
Vary your style and avoid repeating recent messages.
Return ONLY the text of the message, no JSON, no quotes.`;

  try {
    if (onStreamChunk) {
      let fullContent = "";
      for await (const chunk of generateTextStream(userPrompt, {
        model,
        systemPrompt,
        seed: -1,
      })) {
        fullContent += chunk;
        onStreamChunk(chunk);
      }
      return fullContent.trim();
    }

    return await generateTextAnalysis({ systemPrompt, userPrompt, model });
  } catch (error) {
    console.error("[RunCoach] Error generating coaching message:", error);
    return language === "fr" ? "Allez, continue comme ça !" : "Keep going!";
  }
}

// ============================================================================
// COACHING EXECUTION
// ============================================================================

export async function executeCoaching(
  settings: UserSettings,
  coords: LatLng[],
  language: string = "fr",
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
      progressPercent:
        targetDistance > 0
          ? Math.round((store.distanceKm / targetDistance) * 100)
          : 0,
      isPaceOnTarget: targetPace > 0 ? currentPace <= targetPace * 1.1 : true,
      paceVsTargetPercent:
        targetPace > 0
          ? Math.round(((currentPace - targetPace) / targetPace) * 100)
          : 0,
      elevationGainM: calculateElevationGain(coords),
      lastMessages: store.currentAiConversation
        .filter((m) => m.role === "assistant")
        .slice(-2)
        .map((m) => m.content),
    };

    const runSettings = (
      settings as {
        runSettings?: {
          pollinationssModel?: string;
        };
      }
    ).runSettings;
    const model =
      runSettings?.pollinationssModel ?? settings.aiModel ?? "openai";
    const message = await generateCoachingMessage(context, model, language);

    store.setLastCoachMessage(message);
    store.appendAiMessage({
      role: "assistant",
      content: message,
      timestamp: Date.now(),
    });
    store.updateCoachingCheckpoint(store.distanceKm, Date.now());
  } catch (error) {
    if (__DEV__) {
      console.warn("[RunCoach] Coaching generation failed", error);
    }
  } finally {
    store.setIsLoadingCoach(false);
  }
}
