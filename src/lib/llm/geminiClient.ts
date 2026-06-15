import { env } from "@/lib/env";
import { buildIssuePrompt } from "@/lib/prompts/issuePrompt";
import { buildReflectionPrompt } from "@/lib/prompts/reflectionPrompt";
import { parseIssueTriage } from "./actionTriage";
import {
  GeminiApiError,
  type LlmClient,
  type StructureInput,
  type StructureResult,
} from "./types";

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";

/** Requests are aborted after this many milliseconds. */
const REQUEST_TIMEOUT_MS = 60_000;

type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
    finishReason?: string;
  }>;
  promptFeedback?: {
    blockReason?: string;
  };
};

/**
 * Adapter for the Gemini API "generateContent" REST endpoint.
 *
 * The API key is sent via the `x-goog-api-key` header so it never appears
 * in the request URL (and therefore not in any URL-based logging).
 */
export class GeminiClient implements LlmClient {
  async structure(input: StructureInput): Promise<StructureResult> {
    if (!env.geminiApiKey) {
      throw new Error(
        "GEMINI_API_KEY is not set. Configure .env.local or use the mock LLM provider.",
      );
    }

    const prompt =
      input.mode === "issue"
        ? buildIssuePrompt(input.text, input.lowConfidenceTerms)
        : buildReflectionPrompt(input.text);

    const url = `${GEMINI_API_BASE}/models/${env.geminiModel}:generateContent`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": env.geminiApiKey,
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        }),
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(
          `Gemini API request timed out after ${REQUEST_TIMEOUT_MS / 1000} seconds.`,
        );
      }
      throw new Error(
        "Failed to reach the Gemini API. Check your network connection.",
      );
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      // Gemini error bodies look like `{ "error": { "message", "status" } }`
      // and do not contain the API key (sent via header, not body/URL), so
      // surfacing them is safe and helps diagnose invalid key/model/quota issues.
      let apiMessage: string | undefined;
      let apiStatus: string | undefined;
      try {
        const errorJson = (await response.json()) as {
          error?: { message?: string; status?: string };
        };
        apiMessage = errorJson.error?.message;
        apiStatus = errorJson.error?.status;
      } catch {
        // Response body was not JSON; fall back to the status code only.
      }
      throw new GeminiApiError(response.status, apiMessage, apiStatus);
    }

    const json = (await response.json()) as GeminiGenerateContentResponse;

    if (json.promptFeedback?.blockReason) {
      throw new Error(
        `Gemini API blocked the request (reason: ${json.promptFeedback.blockReason}).`,
      );
    }

    const markdown = (json.candidates?.[0]?.content?.parts ?? [])
      .map((part) => part.text ?? "")
      .join("")
      .trim();

    if (!markdown) {
      throw new Error(
        "Gemini API returned an empty result. Try again or check the input text.",
      );
    }

    const cleanedMarkdown = stripCodeFence(markdown);

    return {
      markdown: cleanedMarkdown,
      provider: "gemini",
      mode: input.mode,
      // Action triage only applies to Issue Mode. Parsed from the structured
      // Markdown the prompt is instructed to emit.
      triage:
        input.mode === "issue"
          ? parseIssueTriage(cleanedMarkdown)
          : undefined,
    };
  }
}

/**
 * Models sometimes wrap Markdown output in a ```markdown ... ``` code
 * fence even when instructed not to. Strip a single outer fence if present
 * so the UI renders the Markdown directly.
 */
const stripCodeFence = (text: string): string => {
  const fenceMatch = text.match(/^```(?:markdown)?\n([\s\S]*)\n```$/);
  return fenceMatch ? fenceMatch[1].trim() : text;
};
