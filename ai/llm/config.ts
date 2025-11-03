/**
 * AI Configuration
 * Centralized configuration for AI model parameters
 */

/**
 * Get the seed value for deterministic AI responses
 * Can be set via GEMINI_SEED environment variable, defaults to 42
 * Use a consistent seed for reproducible outputs during prompt fine-tuning
 */
export function getAISeed(): number {
  const seedEnv = typeof process !== 'undefined' ? process.env?.GEMINI_SEED : undefined;
  if (seedEnv) {
    const parsed = parseInt(seedEnv, 10);
    if (!isNaN(parsed)) {
      return parsed;
    }
  }
  return 42; // Default seed for consistency
}

/**
 * Default seed value (can be overridden via environment variable)
 */
export const DEFAULT_AI_SEED = 42;

