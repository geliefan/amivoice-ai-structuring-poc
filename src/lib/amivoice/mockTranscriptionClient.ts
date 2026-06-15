import { env } from "@/lib/env";
import type {
  TranscribeAudioInput,
  TranscriptionClient,
  TranscriptionResult,
} from "./types";

/**
 * Fixed transcription text returned by the mock provider, regardless of
 * the actual audio content. This lets the UI be exercised end-to-end
 * without an AmiVoice API key.
 *
 * When AMIVOICE_KEEP_FILLER_TOKEN=1, filler words are kept to demonstrate
 * how the structuring prompts handle hesitation/emotion in raw speech.
 */
const MOCK_TEXT_WITHOUT_FILLERS =
  "昨日のバッチ処理でエラーが出ていて、ログを見るとDB接続のところで失敗しているように見える。" +
  "まだ設定値の問題なのか、ネットワークの問題なのかは分からない。" +
  "先に環境変数とSecretの設定を確認したい。";

const MOCK_TEXT_WITH_FILLERS =
  "えーと、昨日のバッチ処理でエラーが出ていて、あの、ログを見るとDB接続のところで失敗しているように見えます。" +
  "うーん、まだ設定値の問題なのか、ネットワークの問題なのかは、ちょっと分からないんですけど。" +
  "とりあえず先に環境変数とSecretの設定を確認したいなと思っています。";

export class MockTranscriptionClient implements TranscriptionClient {
  async transcribeAudio(
    input: TranscribeAudioInput,
  ): Promise<TranscriptionResult> {
    const text = env.amivoiceKeepFillerToken
      ? MOCK_TEXT_WITH_FILLERS
      : MOCK_TEXT_WITHOUT_FILLERS;

    return {
      text,
      provider: "mock",
      // The mock transcript is a clean (high-confidence) memo, so it keeps a
      // GO-eligible triage. A single warning-level pseudo term is included so
      // the low-confidence UI is exercisable without an AmiVoice key. Real
      // garbled-term examples live in the /samples HOLD entries.
      lowConfidenceTerms: [
        {
          text: "Secret",
          confidence: 0.71,
          rank: "warning",
          reason:
            "mock: 英語の固有名詞のため確認推奨（疑似データ。実AmiVoiceではtoken信頼度に基づきます）",
        },
      ],
      raw: {
        mock: true,
        receivedFile: {
          filename: input.filename,
          contentType: input.contentType,
          size: input.buffer.length,
        },
      },
    };
  }
}
