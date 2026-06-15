"use client";

import { useState } from "react";
import { extractMarkdownSection } from "@/lib/llm/actionTriage";
import type { ActionTriage, RecommendedAction } from "@/types";

type ActionTriagePanelProps = {
  triage: ActionTriage;
  /** Full structured Markdown, used by the copy actions. */
  markdown: string;
};

const ACTION_TONE: Record<RecommendedAction, "go" | "hold" | "stop"> = {
  issue: "go",
  investigation_note: "hold",
  question_template: "hold",
  runbook_candidate: "hold",
  backlog_candidate: "hold",
  save_only: "stop",
  no_action: "stop",
};

const TONE_BADGE: Record<"go" | "hold" | "stop", string> = {
  go: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
  hold: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300",
  stop: "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
};

const TONE_BORDER: Record<"go" | "hold" | "stop", string> = {
  go: "border-green-300 dark:border-green-900",
  hold: "border-amber-300 dark:border-amber-900",
  stop: "border-gray-300 dark:border-gray-700",
};

/** Label for the primary (emphasized) button, per recommended action. */
const PRIMARY_LABEL: Record<RecommendedAction, string> = {
  issue: "このままIssue化",
  investigation_note: "調査メモとして扱う",
  save_only: "メモとして保存",
  question_template: "質問テンプレとして扱う",
  runbook_candidate: "Runbook候補として扱う",
  backlog_candidate: "Backlog候補として扱う",
  no_action: "追加で話す",
};

/**
 * Collects the sections a reviewer needs to confirm before acting, so the
 * "確認事項だけコピー" button can copy just those.
 */
const buildConfirmationDigest = (markdown: string): string => {
  const parts: Array<[string, string | undefined]> = [
    ["未確認事項", extractMarkdownSection(markdown, ["未確認事項"])],
    [
      "追加で確認すべきこと",
      extractMarkdownSection(markdown, ["追加で確認すべきこと"]),
    ],
    [
      "文字起こし確認候補",
      extractMarkdownSection(markdown, ["文字起こし確認候補"]),
    ],
  ];

  const digest = parts
    .filter(([, body]) => body && body.trim())
    .map(([heading, body]) => `## ${heading}\n\n${body!.trim()}`)
    .join("\n\n");

  return digest || "確認事項として抽出できるセクションが見つかりませんでした。";
};

/**
 * Shows the action triage decision ("should this become an Issue yet?") and
 * lets the human take the next step. No external Issue registration happens;
 * the buttons are copy / view-toggle / guidance only.
 */
export function ActionTriagePanel({ triage, markdown }: ActionTriagePanelProps) {
  const tone = ACTION_TONE[triage.recommendedAction];
  const [feedback, setFeedback] = useState<string | null>(null);

  const copy = async (text: string, message: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setFeedback(message);
    } catch {
      setFeedback("クリップボードへのコピーに失敗しました。");
    }
  };

  const talkMoreHint =
    "上の「テキスト直接入力」欄に追記するか、音声ファイルを追加して再度実行すると、情報を足して判定し直せます。";

  const handlePrimary = () => {
    if (triage.recommendedAction === "issue") {
      copy(
        markdown,
        "Issue本文をコピーしました。Issueトラッカーに貼り付けてください。",
      );
    } else if (triage.recommendedAction === "no_action") {
      setFeedback(talkMoreHint);
    } else {
      copy(
        markdown,
        `${PRIMARY_LABEL[triage.recommendedAction]}想定で本文をコピーしました（このPoCでは保存処理は行いません）。確定情報が揃ってからIssue化を再判断してください。`,
      );
    }
  };

  return (
    <section
      className={`rounded-lg border-2 p-4 ${TONE_BORDER[tone]} bg-white dark:bg-gray-900`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          アクション判定
        </span>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${TONE_BADGE[tone]}`}
        >
          推奨: {triage.actionLabel}
        </span>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            triage.shouldCreateIssue
              ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
              : "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300"
          }`}
        >
          {triage.shouldCreateIssue
            ? "✓ Issue化してよい"
            : "⛔ 今はIssue化しない（人間の確認が必要）"}
        </span>
      </div>

      {triage.actionRationale && (
        <div className="mt-3">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400">
            判断理由
          </h3>
          <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
            {triage.actionRationale}
          </p>
        </div>
      )}

      {!triage.shouldCreateIssue && triage.blockedReason && (
        <div className="mt-3 rounded-md bg-red-50 p-3 dark:bg-red-950/30">
          <h3 className="text-xs font-semibold text-red-700 dark:text-red-300">
            Issue化を止める理由
          </h3>
          <p className="mt-1 whitespace-pre-wrap text-sm text-red-800 dark:text-red-200">
            {triage.blockedReason}
          </p>
        </div>
      )}

      <div className="mt-4">
        <h3 className="mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
          次にどうしますか？（このPoCでは外部Issue登録は行いません）
        </h3>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handlePrimary}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500"
          >
            {PRIMARY_LABEL[triage.recommendedAction]}
          </button>
          <button
            type="button"
            onClick={() =>
              copy(
                buildConfirmationDigest(markdown),
                "確認事項（未確認事項・確認候補）をコピーしました。",
              )
            }
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            確認事項だけコピー
          </button>
          {triage.recommendedAction !== "no_action" && (
            <button
              type="button"
              onClick={() => setFeedback(talkMoreHint)}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              追加で話す
            </button>
          )}
          {!triage.shouldCreateIssue && (
            <button
              type="button"
              onClick={() =>
                copy(
                  markdown,
                  "判定では「今はIssue化しない」推奨です。内容を確認のうえ、必要なら手動でIssue化してください（本文をコピーしました）。",
                )
              }
              className="rounded-md border border-amber-400 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-800 shadow-sm transition hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-900/40"
            >
              それでもIssue化する
            </button>
          )}
        </div>
        {feedback && (
          <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">{feedback}</p>
        )}
      </div>
    </section>
  );
}
