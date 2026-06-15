export type TranscriptionProvider = "mock" | "amivoice";

export type TranscriptionResult = {
  text: string;
  raw?: unknown;
  provider: TranscriptionProvider;
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
export type AmiVoiceRecognizeResponse = {
  results?: Array<{
    text?: string;
    tokens?: unknown[];
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
