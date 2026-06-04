/** xAI Grok API configuration. Tune models / temperature here. */
export const GROK = {
  baseUrl: 'https://api.x.ai/v1',
  /** Chat model — warm, conversational. */
  chatModel: 'grok-4.3',
  /** Summarization model — can be swapped for a cheaper one if needed. */
  summaryModel: 'grok-4.3',
  /** Higher temperature => less robotic, more human chatter. */
  chatTemperature: 0.95,
  summaryTemperature: 0.7,
  /** Keep only the last N turns of history sent to the API (token budget). */
  maxHistoryMessages: 24,
  /** Request timeout in ms. */
  timeoutMs: 60_000,
} as const;

/** Key used to store the Grok API key in expo-secure-store. */
export const GROK_API_KEY_STORE = 'grok_api_key';
