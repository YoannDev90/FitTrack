// ============================================================================
// POLLINATION CONFIGURATION & CONSTANTS
// ============================================================================

export const POLLINATION_CONFIG = {
  AUTH_URL: "https://enter.pollinations.ai/authorize",
  API_URL: "https://gen.pollinations.ai/v1/chat/completions",
  STORAGE_KEY: "pollinations_api_key",
  CACHE_TTL: {
    ACCOUNT: 60 * 1000, // 1 minute
    MEAL: 2 * 60 * 1000, // 2 minutes
    TEXT: 2 * 60 * 1000, // 2 minutes
  },
  AUTH_PARAMS: {
    permissions: "profile,balance",
    models: "claude-fast,openai,gemini-fast,mistral",
    expiry: "30", // 30 days
    budget: "50", // 50 pollen
  },
  PREFERENCES: {
    TEXT: ["openai", "claude-fast", "gemini-fast", "mistral"],
    VISION: ["openai", "claude-fast", "gemini-fast"],
  },
};
