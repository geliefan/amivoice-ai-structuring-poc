import type { LowConfidenceTerm } from "@/types";

export type TranscriptionProvider = "mock" | "amivoice";

export type TranscriptionResult = {
  text: string;
  raw?: unknown;
  provider: TranscriptionProvider;
  /** Low-confidence terms derived from AmiVoice token-level confidence. */
  lowConfidenceTerms?: LowConfidenceTerm[];
};

export type TranscribeAudioInput = {
  buffer: Buffer;
  filename: string;
  contentType: string;
};

export interface TranscriptionClient {
  transcribeAudio(input: TranscribeAudioInput): Promise<TranscriptionResult>;
}

/**
 * Shape of a successful AmiVoice sync HTTP recognition response.
 * Only the fields used by this adapter are typed; the full response is
 * preserved as `raw` for debugging.
 */
/**
 * A single recognized token in an AmiVoice sync HTTP response.
 *
 * Observed in real responses: each token carries its written form, its
 * reading (`spoken`), a per-token `confidence` (0..1), and timing. Symbol
 * tokens (punctuation etc.) use `spoken: "_"`.
 */
export type AmiVoiceToken = {
  written?: string;
  spoken?: string;
  confidence?: number;
  starttime?: number;
  endtime?: number;
};

export type AmiVoiceRecognizeResponse = {
  results?: Array<{
    text?: string;
    tokens?: AmiVoiceToken[];
    /** Utterance-level confidence (can be high even when some tokens are low). */
    confidence?: number;
    starttime?: number;
    endtime?: number;
    tags?: unknown[];
    rulename?: string;
  }>;
  utteranceid?: string;
  text?: string;
  code?: string;
  message?: string;
};

/**
 * Error thrown when the AmiVoice API itself reports a failure
 * (i.e. `code` is a non-empty string in the JSON response).
 */
export class AmiVoiceApiError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "AmiVoiceApiError";
    this.code = code;
  }
}
