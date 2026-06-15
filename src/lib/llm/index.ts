import { resolveLlmProvider } from "@/lib/env";
import { GeminiClient } from "./geminiClient";
import { MockLlmClient } from "./mockLlmClient";
import type { LlmClient } from "./types";

export * from "./types";

/**
 * Returns the LLM client to use, based on LLM_PROVIDER and whether
 * GEMINI_API_KEY is configured. Falls back to the mock provider when
 * Gemini is selected but no API key is set.
 */
export const getLlmClient = (): LlmClient => {
  if (resolveLlmProvider() === "gemini") {
    return new GeminiClient();
  }
  return new MockLlmClient();
};
