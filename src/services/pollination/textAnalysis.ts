// ============================================================================
// POLLINATION TEXT ANALYSIS SERVICE - Analyse IA textuelle via Pollinations
// Utilisé pour le résumé hebdo (Progress) et l'analyse de séance (Workout)
// ============================================================================

import { getPollinationApiKey } from './index';

const POLLINATION_TEXT_URL = 'https://text.pollinations.ai/';

// ============================================================================
// AVAILABLE MODELS
// ============================================================================

export const POLLINATION_MODELS = [
  { id: 'nova-fast', label: 'Nova Fast' },
  { id: 'gemini-fast', label: 'Gemini Fast' },
  { id: 'gemini-search', label: 'Gemini Search' },
  { id: 'qwen-coder', label: 'Qwen Coder' },
  { id: 'mistral', label: 'Mistral' },
  { id: 'openai', label: 'OpenAI' },
  { id: 'openai-fast', label: 'OpenAI Fast' },
  { id: 'minimax', label: 'Minimax' },
  { id: 'deepseek', label: 'DeepSeek' },
  { id: 'claude-fast', label: 'Claude Fast' },
] as const;

export type PollinationModelId = typeof POLLINATION_MODELS[number]['id'];

// ============================================================================
// TEXT GENERATION
// ============================================================================

interface TextGenerationOptions {
  systemPrompt: string;
  userPrompt: string;
  model?: string;
}

/**
 * Generate text using Pollinations text API
 * Uses the /v1/chat/completions endpoint with model selection
 */
export const generateTextAnalysis = async ({
  systemPrompt,
  userPrompt,
  model = 'openai',
}: TextGenerationOptions): Promise<string> => {
  const apiKey = await getPollinationApiKey();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const response = await fetch('https://gen.pollinations.ai/v1/chat/completions', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Pollinations API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('No response from Pollinations API');
  }

  return content.trim();
};
