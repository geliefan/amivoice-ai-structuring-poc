import type { Sample } from "@/lib/samples/sampleData";
import { CopyButton } from "./CopyButton";
import { LowConfidenceTerms } from "./LowConfidenceTerms";
import { MarkdownPreview } from "./MarkdownPreview";

const SCORE_LABELS: Record<keyof Sample["scores"], string> = {
  factVsGuess: "事実と推測の分離",
  actionable: "次の行動に移せるか",
  noOverclaim: "余計な断定がないか",
  preservesNuance: "違和感・感情の保持",
  pasteReady: "業務ドキュメントとして貼れるか",
};

const SCORE_DESCRIPTIONS: Record<1 | 2 | 3, string> = {
  3: "そのまま使える",
  2: "軽微な修正で使える",
  1: "そのままでは危険または不足",
};

/** Displays one sample: scenario, input transcript, structured Markdown output, and evaluation. */
export function SampleCard({ sample }: { sample: Sample }) {
  return (
    <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900 sm:p-6">
      <header className="mb-4">
        <span
          className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
            sample.mode === "issue"
              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300"
              : "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300"
          }`}
        >
          {sample.mode === "issue" ? "Issue Mode" : "Reflection Mode"}
        </span>
        <h3 className="mt-2 text-lg font-semibold">{sample.title}</h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{sample.scenario}</p>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section>
          <h4 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
            入力テキスト（音声メモ想定）
          </h4>
          <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-md bg-gray-50 p-3 text-sm leading-relaxed dark:bg-gray-800">
            {sample.input}
          </pre>
          {sample.lowConfidenceTerms && sample.lowConfidenceTerms.length > 0 && (
            <div className="mt-3">
              <LowConfidenceTerms terms={sample.lowConfidenceTerms} />
            </div>
          )}
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              構造化後Markdown
            </h4>
            <CopyButton text={sample.output} />
          </div>
          <div className="max-h-72 overflow-auto rounded-md border border-gray-100 p-3 dark:border-gray-800">
            <MarkdownPreview markdown={sample.output} />
          </div>
        </section>
      </div>

      <section className="mt-4 rounded-md bg-gray-50 p-3 dark:bg-gray-800">
        <h4 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">評価メモ</h4>
        <ul className="grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
          {(Object.keys(sample.scores) as Array<keyof Sample["scores"]>).map((key) => {
            const score = sample.scores[key];
            return (
              <li key={key} className="flex items-center justify-between gap-2">
                <span className="text-gray-600 dark:text-gray-400">{SCORE_LABELS[key]}</span>
                <span className="font-medium">
                  {score} / 3{" "}
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    （{SCORE_DESCRIPTIONS[score]}）
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-sm leading-relaxed text-gray-700 dark:text-gray-300">{sample.notes}</p>
      </section>
    </article>
  );
}
