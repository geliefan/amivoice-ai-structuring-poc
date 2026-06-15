/**
 * Shared API request/response types.
 *
 * These types are used by both the Next.js API routes (src/app/api/**)
 * and the client-side /convert page so the contract stays in sync.
 */

export type TranscriptionProvider = "mock" | "amivoice";

export type LlmProvider = "mock" | "gemini";

export type StructureMode = "issue" | "reflection";

export type TranscribeApiResponse = {
  text: string;
  provider: TranscriptionProvider;
  raw?: unknown;
};

export type StructureApiRequest = {
  mode: StructureMode;
  text: string;
};

export type StructureApiResponse = {
  markdown: string;
  provider: LlmProvider;
  mode: StructureMode;
};

export type TranscribeAndStructureApiResponse = {
  transcription: TranscribeApiResponse;
  structured: StructureApiResponse;
};

export type ApiErrorResponse = {
  error: string;
  details?: string;
};
