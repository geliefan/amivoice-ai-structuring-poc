/**
 * Centralized server-side environment variable access.
 *
 * IMPORTANT: Nothing in this file may be imported from client components.
 * API keys must never be exposed via `NEXT_PUBLIC_` variables.
 */

export type TranscriptionProviderName = "mock" | "amivoice";
export type LlmProviderName = "mock" | "gemini";

const truthy = (value: string | undefined): boolean =>
  value === "1" || value?.toLowerCase() === "true";

export const env = {
  /** AmiVoice API key. Server-side only. */
  amivoiceApiKey: process.env.AMIVOICE_API_KEY ?? "",

  /** AmiVoice recognition endpoint (sync HTTP interface). */
  amivoiceEndpoint:
    process.env.AMIVOICE_API_ENDPOINT ??
    "https://acp-api.amivoice.com/v1/nolog/recognize",

  /** Grammar file names passed as part of the `d` parameter. */
  amivoiceGrammarFileNames:
    process.env.AMIVOICE_GRAMMAR_FILE_NAMES ?? "-a-general",

  /** Whether AmiVoice should keep filler tokens (e.g. "えーと", "あの") in the result. */
  amivoiceKeepFillerToken: truthy(process.env.AMIVOICE_KEEP_FILLER_TOKEN),

  /** Gemini API key. Server-side only. */
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",

  /** Gemini model name used for structuring. */
  geminiModel: process.env.GEMINI_MODEL ?? "gemini-3.5-flash",

  /** Which transcription provider to use when no explicit choice is made. */
  transcriptionProvider: (process.env.TRANSCRIPTION_PROVIDER ??
    "mock") as TranscriptionProviderName,

  /** Which LLM provider to use when no explicit choice is made. */
  llmProvider: (process.env.LLM_PROVIDER ?? "mock") as LlmProviderName,
};

/**
 * Resolves the effective transcription provider, falling back to "mock"
 * when "amivoice" is requested but no API key is configured.
 */
export const resolveTranscriptionProvider =
  (): TranscriptionProviderName => {
    if (env.transcriptionProvider === "amivoice" && env.amivoiceApiKey) {
      return "amivoice";
    }
    return "mock";
  };

/**
 * Resolves the effective LLM provider, falling back to "mock" when
 * "gemini" is requested but no API key is configured.
 */
export const resolveLlmProvider = (): LlmProviderName => {
  if (env.llmProvider === "gemini" && env.geminiApiKey) {
    return "gemini";
  }
  return "mock";
};

/**
 * Status info exposed to the client so the UI can explain which providers
 * are active and whether real API keys are configured. Contains no secrets.
 */
export const getProviderStatus = () => ({
  transcription: {
    configured: env.transcriptionProvider,
    effective: resolveTranscriptionProvider(),
    apiKeyPresent: Boolean(env.amivoiceApiKey),
  },
  llm: {
    configured: env.llmProvider,
    effective: resolveLlmProvider(),
    apiKeyPresent: Boolean(env.geminiApiKey),
  },
});
