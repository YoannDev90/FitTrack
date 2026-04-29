// ============================================================================
// POLLINATION TEXT ANALYSIS SERVICE - Analyse IA textuelle via Pollinationss
// Utilisé pour le résumé hebdo (Progress) et l'analyse de séance (Workout)
// ============================================================================

import { generateText, getTextModels } from "@pollinations_ai/sdk";
import { getPollinationsApiKey } from "./index";
import { getOrSetMemoryCache } from "../network/httpClient";
import { POLLINATION_CONFIG } from "./config";

const TEXT_ANALYSIS_CACHE_TTL_MS = POLLINATION_CONFIG.CACHE_TTL.TEXT;

function hashText(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

// ============================================================================
// AVAILABLE MODELS & FALLBACK
// ============================================================================

/**
 * Récupère les modèles textuels disponibles et retourne le premier qui match l'un des modèles préférés.
 * Si aucun modèle préféré n'est disponible, bascule sur le meilleur modèle vision disponible.
 * @param preferredModels Liste des modèles préférés (fallback chain)
 * @returns L'identifiant du modèle à utiliser
 */
export const getBestTextModel = async (
  preferredModels: string[] = POLLINATION_CONFIG.PREFERENCES.TEXT,
): Promise<string> => {
  try {
    const models = await getTextModels();
    const modelNames = models.map((m) => m.name);

    // 1. Chercher dans les préférences textuelles
    for (const pref of preferredModels) {
      if (modelNames.includes(pref)) return pref;
    }

    // 2. Si aucune préférence textuelle n'est dispo, tenter de récupérer un modèle vision (plus robuste)
    // On importe dynamiquement pour éviter les dépendances circulaires
    const { getBestVisionModel } = require("./index");
    const visionFallback = await getBestVisionModel();
    if (visionFallback && modelNames.includes(visionFallback)) {
      return visionFallback;
    }

    // 3. Dernier recours : le tout premier modèle de la liste
    return modelNames[0] || preferredModels[0];
  } catch (error) {
    console.error(
      "[Pollinations] Error fetching text models, falling back to vision:",
      error,
    );
    try {
      const { getBestVisionModel } = require("./index");
      return await getBestVisionModel();
    } catch {
      return preferredModels[0];
    }
  }
};

/**
 * Récupère tous les modèles textuels disponibles dynamiquement depuis l'API.
 */
export const getAvailableTextModels = async (): Promise<
  { id: string; label: string }[]
> => {
  try {
    const models = await getTextModels();
    return models.map((m) => ({
      id: m.name,
      label: m.name
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" "),
    }));
  } catch (error) {
    console.error("[Pollinations] Error fetching text models:", error);
    return [];
  }
};

// Type dynamique basé sur la réponse de l'API
export type PollinationsModelId = string;

// ============================================================================
// TEXT GENERATION
// ============================================================================

interface TextGenerationOptions {
  systemPrompt: string;
  userPrompt: string;
  model?: string;
}

/**
 * Generate text using Pollinationss text API
 * Uses the SDK with dynamic model selection and fallback
 */
export const generateTextAnalysis = async ({
  systemPrompt,
  userPrompt,
  model,
}: TextGenerationOptions): Promise<string> => {
  // Si aucun modèle n'est spécifié, on cherche le meilleur modèle disponible
  const activeModel = model || (await getBestTextModel());
  const cacheKey = `pollinations:text:${activeModel}:${hashText(systemPrompt)}:${hashText(userPrompt)}`;

  return getOrSetMemoryCache(cacheKey, TEXT_ANALYSIS_CACHE_TTL_MS, async () => {
    try {
      const response = await generateText(userPrompt, {
        model: activeModel,
        systemPrompt,
        seed: -1,
      });

      if (!response) {
        throw new Error("No response from Pollinations API");
      }

      return response.trim();
    } catch (error) {
      console.error("[Pollinations] SDK Error:", error);
      throw error;
    }
  });
};
