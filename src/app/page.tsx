import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
          PoC
        </p>
        <h1 className="mt-1 text-3xl font-bold sm:text-4xl">
          AmiVoice AI Structuring PoC
        </h1>
        <p className="mt-4 text-lg text-gray-700 dark:text-gray-300">
          AmiVoice APIで音声を文字起こしし、Gemini APIで業務ドキュメント用の
          Markdown（Issue / ふりかえりKPT）に構造化するPoCアプリケーションです。
        </p>
      </header>

      <section className="mt-10 rounded-xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-900 dark:bg-blue-950/40">
        <h2 className="text-lg font-semibold">このPoCの価値は「正確な文字起こし」ではありません</h2>
        <p className="mt-2 leading-relaxed text-gray-700 dark:text-gray-300">
          音声認識そのものの精度向上は、このPoCの主目的ではありません。
          価値があるのは、未整理の音声メモ・違和感・感情・タスク未満のアイデア・
          ふりかえり発話を、<strong>あとから業務で扱えるMarkdownに安全に変換すること</strong>です。
          入力にないことを断定せず、事実と推測を分離し、曖昧な点は確認事項として残す——
          そうした「構造化の設計」をデモ・検証できる状態にすることが目的です。
        </p>
      </section>

      <section className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-200 p-5 dark:border-gray-700">
          <span className="inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
            Issue Mode
          </span>
          <h3 className="mt-2 text-lg font-semibold">調査メモ・違和感をIssueへ</h3>
          <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
            作業中の不具合、調査中の違和感、まだタスク化できていない改善案などの
            音声メモから、背景・起きていること・事実・推測・未確認事項・次にやることを
            分離し、そのままGitHub/Gitea Issueに貼り付けられるMarkdownを生成します。
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 p-5 dark:border-gray-700">
          <span className="inline-block rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-800 dark:bg-purple-900/50 dark:text-purple-300">
            Reflection Mode
          </span>
          <h3 className="mt-2 text-lg font-semibold">ふりかえり音声をKPTへ</h3>
          <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
            新人・学習者のふりかえり音声から、Keep / Problem / Try、分かったこと、
            まだ曖昧なこと、メンターへの確認事項、次回の行動案を抽出します。
            単なる感想の要約にせず、不安や違和感を消しすぎないことを重視しています。
          </p>
        </div>
      </section>

      <section className="mt-10 flex flex-col gap-4 sm:flex-row">
        <Link
          href="/convert"
          className="flex-1 rounded-xl bg-blue-600 px-5 py-4 text-center font-semibold text-white shadow-sm transition hover:bg-blue-500"
        >
          Convert画面へ
          <span className="block text-sm font-normal text-blue-100">
            音声ファイル / テキストから構造化Markdownを生成する
          </span>
        </Link>
        <Link
          href="/samples"
          className="flex-1 rounded-xl border border-gray-300 px-5 py-4 text-center font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-800"
        >
          Samples画面へ
          <span className="block text-sm font-normal text-gray-500 dark:text-gray-400">
            入力例・出力例・評価メモを確認する
          </span>
        </Link>
      </section>

      <footer className="mt-12 text-sm text-gray-500 dark:text-gray-400">
        <p>
          APIキー未設定でもmock providerで一通り動作確認できます。
          詳細は <code>README.md</code> を参照してください。
        </p>
      </footer>
    </main>
  );
}
