import type { ActionTriage, LowConfidenceTerm } from "@/types";

export type LlmProvider = "mock" | "gemini";

export type StructureMode = "issue" | "reflection";

export type StructureInput = {
  mode: StructureMode;
  text: string;
  /**
   * AmiVoice-derived low-confidence terms (Issue Mode). Passed to the prompt
   * so the model treats them as "do not confirm as fact" hints. Optional.
   */
  lowConfidenceTerms?: LowConfidenceTerm[];
};

export type StructureResult = {
  markdown: string;
  provider: LlmProvider;
  mode: StructureMode;
  /** Action triage, populated for Issue Mode only. */
  triage?: ActionTriage;
};

export interface LlmClient {
  structure(input: StructureInput): Promise<StructureResult>;
}

/**
 * Error thrown when the Gemini API returns a non-2xx HTTP response.
 *
 * `apiMessage` / `apiStatus` come from the Gemini error body
 * (`{ error: { message, status } }`), which does not contain the API key
 * (the key is sent via the `x-goog-api-key` header, not in the body or
 * URL), so it is safe to surface to the caller for diagnostics.
 */
export class GeminiApiError extends Error {
  httpStatus: number;
  apiStatus?: string;
  apiMessage?: string;

  constructor(httpStatus: number, apiMessage?: string, apiStatus?: string) {
    super(
      apiMessage
        ? `Gemini API request failed with HTTP status ${httpStatus}${apiStatus ? ` (${apiStatus})` : ""}: ${apiMessage}`
        : `Gemini API request failed with HTTP status ${httpStatus}.`,
    );
    this.name = "GeminiApiError";
    this.httpStatus = httpStatus;
    this.apiStatus = apiStatus;
    this.apiMessage = apiMessage;
  }
}
