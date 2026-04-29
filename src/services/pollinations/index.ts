// ============================================================================
// POLLINATION API SERVICE - Analyse d'images de repas via LLM
// ============================================================================

import * as Linking from "expo-linking";
import * as SecureStore from "expo-secure-store";
import i18next from "i18next";
import { generateText, getTextModels } from "@pollinations_ai/sdk";
import { fetchWithRetry, getOrSetMemoryCache } from "../network/httpClient";
import { POLLINATION_CONFIG } from "./config";

const STORAGE_KEY = POLLINATION_CONFIG.STORAGE_KEY;
const POLLINATION_ACCOUNT_CACHE_TTL_MS = POLLINATION_CONFIG.CACHE_TTL.ACCOUNT;
const POLLINATION_MEAL_CACHE_TTL_MS = POLLINATION_CONFIG.CACHE_TTL.MEAL;

function hashText(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function buildMealAnalysisCacheKey(
  imageUrl: string,
  additionalContext?: string,
): string {
  const contextHash = hashText((additionalContext || "").trim());
  return `pollinations:meal:${hashText(imageUrl)}:${contextHash}`;
}

// ============================================================================
// TYPES
// ============================================================================

export interface MealAnalysis {
  score: number; // Score de 0 à 100
  title: string; // Titre du repas
  description: string; // Description de ce que l'utilisateur a mangé
  suggestions: string[]; // Suggestions d'amélioration
}

export interface PollinationsResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

// ============================================================================
// STORAGE
// ============================================================================

export const savePollinationsApiKey = async (apiKey: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(STORAGE_KEY, apiKey);
  } catch (error) {
    console.error("[Pollinations] Error saving API key:", error);
    throw error;
  }
};

export const getPollinationsApiKey = async (): Promise<string | null> => {
  try {
    const key = await SecureStore.getItemAsync(STORAGE_KEY);
    return key || null;
  } catch (error) {
    console.error("[Pollinations] Error getting API key:", error);
    return null;
  }
};

export const removePollinationsApiKey = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(STORAGE_KEY);
  } catch (error) {
    console.error("[Pollinations] Error removing API key:", error);
  }
};

export const isPollinationsConnected = async (): Promise<boolean> => {
  const key = await getPollinationsApiKey();
  return key !== null && key.length > 0;
};

// ============================================================================
// MODELS & VISION SUPPORT
// ============================================================================

/**
 * Récupère tous les modèles supportant la vision (entrée image) triés par prix (moins cher d'abord).
 */
export const getAvailableVisionModels = async (): Promise<string[]> => {
  try {
    const models = await getTextModels();
    // On filtre les modèles qui acceptent "image" en entrée ET "text" en sortie
    return models
      .filter(
        (m: any) =>
          m.input_modalities?.includes("image") &&
          m.output_modalities?.includes("text"),
      )
      .sort((a: any, b: any) => {
        const costA = parseFloat(a.pricing?.completionTextTokens || "0");
        const costB = parseFloat(b.pricing?.completionTextTokens || "0");
        return costA - costB;
      })
      .map((m: any) => m.name);
  } catch (error) {
    console.error(
      "[Pollinations] Error fetching vision models from SDK:",
      error,
    );
    return [POLLINATION_CONFIG.PREFERENCES.VISION[0]];
  }
};

/**
 * Récupère le meilleur modèle supportant la vision dynamiquement.
 */
export const getBestVisionModel = async (): Promise<string> => {
  try {
    const available = await getAvailableVisionModels();
    const preferences = POLLINATION_CONFIG.PREFERENCES.VISION;

    if (available.length === 0) return preferences[0];

    // Ordre de préférence dynamique parmis ceux disponibles
    for (const pref of preferences) {
      if (available.includes(pref)) return pref;
    }

    return available[0];
  } catch (error) {
    console.error("[Pollinations] Error fetching vision models:", error);
    return POLLINATION_CONFIG.PREFERENCES.VISION[0];
  }
};

// ============================================================================
// ACCOUNT INFO
// ============================================================================

export interface PollinationsAccountInfo {
  connected: boolean;
  balance?: number;
  error?: string;
}

/**
 * Récupère les informations du compte Pollinations (balance, etc.)
 * Utilise l'endpoint /v1/balance si disponible
 */
export const getPollinationsAccountInfo =
  async (): Promise<PollinationsAccountInfo> => {
    const apiKey = await getPollinationsApiKey();

    if (!apiKey) {
      return { connected: false };
    }

    const cacheKey = `pollinations:account:${apiKey.slice(-12)}`;

    return getOrSetMemoryCache(
      cacheKey,
      POLLINATION_ACCOUNT_CACHE_TTL_MS,
      async () => {
        try {
          const response = await fetchWithRetry(
            "https://gen.pollinations.ai/account/balance",
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
              },
            },
            {
              timeoutMs: 10000,
              retries: 1,
            },
          );

          if (response.ok) {
            const data = await response.json();
            return {
              connected: true,
              balance: data.balance ?? data.pollen ?? data.credits,
            };
          }

          return { connected: true };
        } catch (error) {
          console.error("[Pollinations] Error getting account info:", error);
          return {
            connected: true,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      },
    );
  };

// ============================================================================
// AUTH FLOW
// ============================================================================

/**
 * Génère l'URL d'autorisation Pollinations
 * @param redirectUrl URL de redirection (scheme spix://)
 */
export const getPollinationsAuthUrl = (redirectUrl: string): string => {
  const params = new URLSearchParams({
    redirect_url: redirectUrl,
    ...POLLINATION_CONFIG.AUTH_PARAMS,
  });

  return `${POLLINATION_CONFIG.AUTH_URL}?${params.toString()}`;
};

/**
 * Ouvre la page d'autorisation Pollinations dans le navigateur
 */
export const startPollinationsAuth = async (): Promise<void> => {
  // Utilise le scheme spix:// pour le redirect
  const redirectUrl = Linking.createURL("pollinations-callback");
  const authUrl = getPollinationsAuthUrl(redirectUrl);

  if (__DEV__) {
    console.log("[Pollinations] Starting auth with redirect:", redirectUrl);
    console.log("[Pollinations] Auth URL:", authUrl);
  }

  await Linking.openURL(authUrl);
};

/**
 * Extrait la clé API du fragment de l'URL de callback
 * @param url URL complète avec fragment (#api_key=...)
 */
export const extractApiKeyFromUrl = (url: string): string | null => {
  try {
    // L'URL sera de la forme spix://pollinations-callback#api_key=sk_abc123
    const hashIndex = url.indexOf("#");
    if (hashIndex === -1) return null;

    const fragment = url.substring(hashIndex + 1);
    const params = new URLSearchParams(fragment);
    const apiKey = params.get("api_key");

    return apiKey;
  } catch (error) {
    console.error("[Pollinations] Error extracting API key:", error);
    return null;
  }
};

// ============================================================================
// MEAL ANALYSIS
// ============================================================================

export const getSystemPromptForMealAnalysis = (language: string = "en") => {
  const langName =
    (
      {
        fr: "français",
        it: "italiano",
        de: "Deutsch",
        es: "español",
        en: "English",
      } as Record<string, string>
    )[language] ?? "English";

  return `Act as an expert nutritional assistant named Ploppy. Analyze the provided meal image to help the user maintain a healthy diet.

Your task is to identify the food items in the image, estimate their nutritional value, and provide feedback in ${langName}.

You MUST respond ONLY with a clean, valid JSON object following this EXACT structure:

{
  "score": <number 0-100>,
  "title": "<short 3-5 word title of the meal in ${langName}>",
  "description": "<detailed analysis of the meal components in ${langName}, 2-3 sentences>",
  "suggestions": ["<constructive tip in ${langName}>", "<tip in ${langName}>", ...]
}

Scoring criteria for nutritional balance:
- 0-30: Unbalanced (high sugar/fat, low nutrients)
- 30-50: Average, needs significant improvement
- 50-70: Good, but room for minor adjustments
- 70-85: Very good, well-balanced
- 85-100: Excellent, exemplary

Guidelines for your ${langName} output:
- Be encouraging and helpful.
- Suggest practical changes (e.g., "Add more greens", "Reduce portions of high-starch food").
- Keep language simple and engaging with emojis.

CRITICAL: Return ONLY the JSON object. No conversational filler, no markdown code blocks.`;
};

/**
 * Analyse une image de repas via Pollinations/Claude
 * @param imageUrl URL de l'image uploadée
 * @param additionalContext Informations complémentaires sur le repas (optionnel)
 * @returns Analyse du repas
 */
export const analyzeMealImage = async (
  imageUrl: string,
  additionalContext?: string,
): Promise<MealAnalysis> => {
  const apiKey = await getPollinationsApiKey();

  if (!apiKey) {
    throw new Error(
      "Pollinations API key not found. Please connect to Pollinations first.",
    );
  }

  if (__DEV__) {
    console.log("[Pollinations] Analyzing meal image:", imageUrl);
    if (additionalContext) {
      console.log("[Pollinations] Additional context:", additionalContext);
    }
  }

  // Construire le message utilisateur avec le contexte additionnel en anglais
  let userMessage = "Analyze this meal photo and provide your assessment.";
  if (additionalContext && additionalContext.trim()) {
    userMessage += `\n\nUser provided context: ${additionalContext.trim()}`;
  }

  const cacheKey = buildMealAnalysisCacheKey(imageUrl, additionalContext);

  return getOrSetMemoryCache(
    cacheKey,
    POLLINATION_MEAL_CACHE_TTL_MS,
    async () => {
      // Use the SDK for meal analysis (multi-modal chat)
      const activeModel = await getBestVisionModel();
      const systemPrompt = getSystemPromptForMealAnalysis(i18next.language);

      // Construction du prompt incluant l'URL de l'image pour les modèles vision de Pollinations
      const fullUserPrompt = `${userMessage}\n\nImage : ${imageUrl}`;

      const response = await generateText(fullUserPrompt, {
        model: activeModel,
        systemPrompt: systemPrompt,
        seed: -1,
      });

      const content = response;

      if (!content) {
        throw new Error("No response from Pollinations API");
      }

      if (__DEV__) {
        console.log("[Pollinations] Raw response:", content);
      }

      try {
        let cleanContent = content.trim();

        // 1. Extraction robuste du JSON en cherchant les délimiteurs { et }
        const firstBrace = cleanContent.indexOf("{");
        const lastBrace = cleanContent.lastIndexOf("}");

        if (firstBrace === -1 || lastBrace === -1) {
          throw new Error("No JSON object found in response");
        }

        let jsonContent = cleanContent.substring(firstBrace, lastBrace + 1);

        // 2. Réparation basique des fermetures (si tronqué)
        let braceCount =
          (jsonContent.match(/\{/g) || []).length -
          (jsonContent.match(/\}/g) || []).length;
        for (let i = 0; i < braceCount; i++) {
          jsonContent += "}";
        }

        let bracketCount =
          (jsonContent.match(/\[/g) || []).length -
          (jsonContent.match(/\]/g) || []).length;
        for (let i = 0; i < bracketCount; i++) {
          jsonContent += "]";
        }

        const analysis: MealAnalysis = JSON.parse(jsonContent);

        // 3. Validation et valeur par défaut
        if (
          typeof analysis.score !== "number" ||
          analysis.score < 0 ||
          analysis.score > 100
        ) {
          analysis.score = 50;
        }
        if (!analysis.title) {
          analysis.title = "Repas analysé";
        }
        if (!analysis.description) {
          analysis.description = "Analyse terminée.";
        }
        if (!Array.isArray(analysis.suggestions)) {
          analysis.suggestions = [];
        }

        return analysis;
      } catch (parseError) {
        console.error("[Pollinations] Error parsing response:", parseError);
        return {
          score: 50,
          title: "Repas",
          description: content.substring(0, 200),
          suggestions: [
            "Désolé, je n'ai pas pu structurer l'analyse en détail.",
          ],
        };
      }
    },
  );
};
