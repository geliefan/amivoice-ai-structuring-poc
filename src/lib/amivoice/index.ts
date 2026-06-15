import { resolveTranscriptionProvider } from "@/lib/env";
import { AmiVoiceSyncHttpClient } from "./amivoiceSyncHttpClient";
import { MockTranscriptionClient } from "./mockTranscriptionClient";
import type { TranscriptionClient } from "./types";

export * from "./types";

/**
 * Returns the transcription client to use, based on TRANSCRIPTION_PROVIDER
 * and whether AMIVOICE_API_KEY is configured. Falls back to the mock
 * provider when AmiVoice is selected but no API key is set.
 */
export const getTranscriptionClient = (): TranscriptionClient => {
  if (resolveTranscriptionProvider() === "amivoice") {
    return new AmiVoiceSyncHttpClient();
  }
  return new MockTranscriptionClient();
};
