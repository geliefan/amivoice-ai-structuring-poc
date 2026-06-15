import type { getProviderStatus } from "@/lib/env";

type ProviderStatus = ReturnType<typeof getProviderStatus>;

type ProviderStatusProps = {
  status: ProviderStatus;
};

const Badge = ({ effective }: { effective: string }) => {
  const isMock = effective === "mock";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
        isMock
          ? "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300"
          : "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
      }`}
    >
      {isMock ? "mock" : effective}
    </span>
  );
};

/**
 * Shows whether transcription / structuring are currently using mock or
 * real providers, and explains why a fallback to mock happened (missing
 * API key) if applicable.
 */
export function ProviderStatus({ status }: ProviderStatusProps) {
  const transcriptionFellBack =
    status.transcription.configured === "amivoice" &&
    status.transcription.effective === "mock";
  const llmFellBack =
    status.llm.configured === "gemini" && status.llm.effective === "mock";

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-700 dark:bg-gray-900">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
        <div className="flex items-center gap-2">
          <span className="text-gray-600 dark:text-gray-400">文字起こし provider:</span>
          <Badge effective={status.transcription.effective} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-600 dark:text-gray-400">構造化 provider:</span>
          <Badge effective={status.llm.effective} />
        </div>
      </div>

      {(transcriptionFellBack || llmFellBack) && (
        <ul className="mt-2 space-y-1 text-xs text-amber-700 dark:text-amber-400">
          {transcriptionFellBack && (
            <li>
              ⚠ TRANSCRIPTION_PROVIDER=amivoice が指定されていますが AMIVOICE_API_KEY
              が未設定のため、mock providerにフォールバックしています。
            </li>
          )}
          {llmFellBack && (
            <li>
              ⚠ LLM_PROVIDER=gemini が指定されていますが GEMINI_API_KEY
              が未設定のため、mock providerにフォールバックしています。
            </li>
          )}
        </ul>
      )}

      {status.transcription.effective === "mock" && status.llm.effective === "mock" && (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          現在はすべてmock providerで動作しています。APIキーなしで画面の動作確認が可能です。
          実APIを使う場合は <code>.env.local</code> を設定してください（README参照）。
        </p>
      )}
    </div>
  );
}
