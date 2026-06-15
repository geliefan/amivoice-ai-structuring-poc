import { env } from "@/lib/env";
import {
  AmiVoiceApiError,
  type AmiVoiceRecognizeResponse,
  type TranscribeAudioInput,
  type TranscriptionClient,
  type TranscriptionResult,
} from "./types";

/**
 * Builds the `d` (request parameters) value sent to the AmiVoice API.
 *
 * Filler tokens (e.g. "えーと", "あの") are removed by default
 * (`keepFillerToken=0`) since the structuring prompts work best on
 * cleaned-up text. Set AMIVOICE_KEEP_FILLER_TOKEN=1 to keep them when
 * the speaker's hesitation/emotion itself is the thing being analyzed.
 */
const buildRequestParams = (): string => {
  const keepFillerToken = env.amivoiceKeepFillerToken ? 1 : 0;
  return `grammarFileNames=${env.amivoiceGrammarFileNames} keepFillerToken=${keepFillerToken}`;
};

/**
 * Adapter for the AmiVoice "Sync HTTP" recognition interface.
 *
 * POST multipart/form-data to either:
 *  - https://acp-api.amivoice.com/v1/nolog/recognize (no log retention, default)
 *  - https://acp-api.amivoice.com/v1/recognize (log retention)
 *
 * See: https://docs.amivoice.com/
 */
export class AmiVoiceSyncHttpClient implements TranscriptionClient {
  async transcribeAudio(
    input: TranscribeAudioInput,
  ): Promise<TranscriptionResult> {
    if (!env.amivoiceApiKey) {
      throw new Error(
        "AMIVOICE_API_KEY is not set. Configure .env.local or use the mock transcription provider.",
      );
    }

    const formData = new FormData();
    formData.append("u", env.amivoiceApiKey);
    formData.append("d", buildRequestParams());

    const blob = new Blob([new Uint8Array(input.buffer)], {
      type: input.contentType || "application/octet-stream",
    });
    formData.append("a", blob, input.filename || "audio");

    let response: Response;
    try {
      response = await fetch(env.amivoiceEndpoint, {
        method: "POST",
        body: formData,
      });
    } catch {
      // Do not leak network error internals (could include URLs/keys in some environments).
      throw new Error(
        "Failed to reach the AmiVoice API. Check your network connection and AMIVOICE_API_ENDPOINT.",
      );
    }

    // Read and attempt to parse the body before checking `response.ok`:
    // AmiVoice can return its own `code`/`message` error payload alongside
    // a non-2xx HTTP status, and that payload is more useful for diagnosis
    // than the bare status code.
    const bodyText = await response.text();
    let json: AmiVoiceRecognizeResponse | undefined;
    try {
      json = JSON.parse(bodyText) as AmiVoiceRecognizeResponse;
    } catch {
      json = undefined;
    }

    if (json?.code) {
      throw new AmiVoiceApiError(
        json.code,
        json.message || "AmiVoice API returned an error.",
      );
    }

    if (!response.ok) {
      throw new Error(
        `AmiVoice API request failed with HTTP status ${response.status}.`,
      );
    }

    if (!json) {
      throw new Error("AmiVoice API returned a response that is not valid JSON.");
    }

    // The top-level `text` holds the full recognition result. Some
    // responses may leave it empty while still populating per-utterance
    // `results[].text`, so fall back to concatenating those.
    const text = (
      json.text?.trim()
        ? json.text
        : (json.results ?? []).map((result) => result.text ?? "").join("")
    ).trim();

    if (!text) {
      throw new Error(
        "AmiVoice API returned an empty transcription result. The audio may be silent or unsupported.",
      );
    }

    return {
      text,
      raw: json,
      provider: "amivoice",
    };
  }
}
