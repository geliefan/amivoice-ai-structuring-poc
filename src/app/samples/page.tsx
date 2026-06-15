import Link from "next/link";
import { SampleCard } from "@/components/SampleCard";
import { getSamplesByMode } from "@/lib/samples/sampleData";

export const metadata = {
  title: "Samples | AmiVoice AI Structuring PoC",
};

export default function SamplesPage() {
  const issueSamples = getSamplesByMode("issue");
  const reflectionSamples = getSamplesByMode("reflection");

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link href="/" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
          ← トップへ戻る
        </Link>
      </div>

      <h1 className="text-2xl font-bold sm:text-3xl">サンプル集</h1>
      <p className="mt-2 max-w-3xl text-gray-600 dark:text-gray-400">
        音声メモ（テキスト化済み）の入力例と、それを構造化したMarkdown出力例です。
        各サンプルには、<code>docs/evaluation.md</code>
        と同じ評価観点でのスコア・評価メモを付けています。
        実際の出力は使用するLLM providerによって変わりますが、ここでは
        「期待される出力の質」を示すリファレンスとして掲載しています。
      </p>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Issue Mode サンプル</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          不具合・違和感・調査メモなどを、Issueに貼り付けられるMarkdownへ整理した例です。
        </p>
        <div className="mt-4 space-y-6">
          {issueSamples.map((sample) => (
            <SampleCard key={sample.id} sample={sample} />
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Reflection Mode サンプル</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          ふりかえり音声を、KPTとメンターへの確認事項に分解した例です。
        </p>
        <div className="mt-4 space-y-6">
          {reflectionSamples.map((sample) => (
            <SampleCard key={sample.id} sample={sample} />
          ))}
        </div>
      </section>

      <div className="mt-10">
        <Link
          href="/convert"
          className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
        >
          自分の音声・テキストで試す → /convert
        </Link>
      </div>
    </main>
  );
}
