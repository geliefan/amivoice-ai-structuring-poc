import Link from "next/link";
import { ConvertForm } from "./ConvertForm";
import { getProviderStatus } from "@/lib/env";

export const metadata = {
  title: "Convert | AmiVoice AI Structuring PoC",
};

export default function ConvertPage() {
  const providerStatus = getProviderStatus();

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link href="/" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
          ← トップへ戻る
        </Link>
      </div>

      <h1 className="text-2xl font-bold sm:text-3xl">変換</h1>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        音声ファイルまたはテキストを入力し、Issue Mode / Reflection
        Modeのいずれかで構造化Markdownを生成します。
      </p>

      <div className="mt-6">
        <ConvertForm providerStatus={providerStatus} />
      </div>
    </main>
  );
}
