import type { ActionTriage, RecommendedAction } from "@/types";

/**
 * Pure helpers for the "action pre-processing layer".
 *
 * This module has NO server-only dependencies (no env, no node APIs) so it
 * can be imported from both API routes and client components.
 */

/** Japanese labels shown in the UI for each recommended action. */
export const ACTION_LABELS: Record<RecommendedAction, string> = {
  issue: "Issue化",
  investigation_note: "調査メモ",
  question_template: "質問テンプレ",
  runbook_candidate: "Runbook候補",
  backlog_candidate: "Backlog候補",
  save_only: "保存のみ",
  no_action: "何もしない",
};

/**
 * Non-Issue labels, matched first. Order matters: more specific / less
 * generic labels are matched first so a line like "保存のみ" never
 * accidentally matches something else.
 *
 * NOTE: "Issue化" is intentionally NOT in this table. A naive
 * `includes("Issue化")` would mis-classify negations like "Issue化はしない"
 * as an Issue. Issue (the positive case) is detected separately, only after
 * ruling out negations. See `parseIssueTriage`.
 */
const NON_ISSUE_LABEL_TO_ACTION: Array<[string, RecommendedAction]> = [
  ["調査メモ", "investigation_note"],
  ["質問テンプレ", "question_template"],
  ["Runbook候補", "runbook_candidate"],
  ["Backlog候補", "backlog_candidate"],
  ["保存のみ", "save_only"],
  ["何もしない", "no_action"],
];

/**
 * Phrases that, when they appear on the recommended-action line, mean the
 * transcript should NOT be turned into an Issue, even though the substring
 * "Issue化" is present. These take precedence over any positive match.
 */
const ISSUE_NEGATION_PATTERNS = [
  "Issue化はしない",
  "Issue化しない",
  "Issue化を見送",
  "Issue化を止め",
  "Issue化を保留",
  "Issue化は保留",
  "Issue化は推奨しない",
  "Issue化を推奨しない",
  "Issue化すべきではない",
  "Issue化すべきでない",
  "Issue化は不要",
  "Issueにしない",
];

/** Explicit positive phrasings that mean "turn this into an Issue". */
const ISSUE_POSITIVE_PATTERNS = [
  "Issue化してよい",
  "Issue化推奨",
  "Issue化する",
  "Issue化",
  "Issueとして扱う",
  "Issueにする",
];

/**
 * Normalizes a heading line into its title text, tolerating common Markdown
 * wobble from the model:
 *  - any number of leading `#` (`##`, `###`, ...), with or without a space
 *  - surrounding whitespace
 *  - bold markers (`**推奨アクション**`)
 *
 * Returns undefined if the line is not a heading.
 */
const headingTitle = (line: string): string | undefined => {
  const hashMatch = line.match(/^\s*#{1,6}\s*(.+?)\s*$/);
  if (hashMatch) return hashMatch[1].replace(/\*\*/g, "").trim();
  // Tolerate a model emitting a heading as a stand-alone bold line, e.g.
  // `**推奨アクション**` instead of `## 推奨アクション`.
  const boldMatch = line.match(/^\s*\*\*(.+?)\*\*\s*$/);
  if (boldMatch) return boldMatch[1].trim();
  return undefined;
};

/**
 * Extracts the body text under a heading section, up to the next heading of
 * the same-or-shallower level (or end of document). Tolerates `##`/`###`,
 * missing spaces, and bold markers in the heading. The first matching
 * heading from `headings` wins.
 */
export const extractMarkdownSection = (
  markdown: string,
  headings: string[],
): string | undefined => {
  const lines = markdown.split("\n");
  const body: string[] = [];
  let capturing = false;

  for (const line of lines) {
    const title = headingTitle(line);
    if (title !== undefined) {
      if (capturing) break; // next heading ends the section
      if (headings.some((h) => title.startsWith(h))) {
        capturing = true;
      }
      continue;
    }
    if (capturing) body.push(line);
  }

  if (!capturing) return undefined;
  const text = body.join("\n").trim();
  return text || undefined;
};

/** Shown when the recommended-action label cannot be parsed reliably. */
export const TRIAGE_FALLBACK_REASON =
  "判定セクションを安定して読み取れなかったため、Issue化せず調査メモとして扱います。";

/**
 * Determines the recommended action from the recommended-action line.
 *
 * Negations ("Issue化はしない" 等) are checked before any positive match so
 * the substring "Issue化" never flips a "do NOT create an Issue" decision
 * into a GO. Returns `undefined` when no label can be recognized.
 */
const detectAction = (line: string): RecommendedAction | undefined => {
  // 1. Explicit non-Issue labels win first.
  for (const [label, action] of NON_ISSUE_LABEL_TO_ACTION) {
    if (line.includes(label)) return action;
  }
  // 2. Any negation of "Issue化" means do NOT create an Issue.
  if (ISSUE_NEGATION_PATTERNS.some((p) => line.includes(p))) {
    return "investigation_note";
  }
  // 3. Only an explicit positive phrasing yields "issue".
  if (ISSUE_POSITIVE_PATTERNS.some((p) => line.includes(p))) {
    return "issue";
  }
  return undefined;
};

/**
 * Parses the action triage out of an Issue Mode Markdown document produced
 * by the structuring prompt. The prompt is instructed to emit the
 * recommended action label on its own line under `## 推奨アクション`.
 *
 * When the label cannot be parsed, falls back to a safe non-Issue action
 * ("investigation_note") with an explicit reason, so we never over-eagerly
 * recommend creating an Issue from output we could not understand.
 */
export const parseIssueTriage = (markdown: string): ActionTriage => {
  const actionSection = extractMarkdownSection(markdown, ["推奨アクション"]);
  const firstLine =
    actionSection
      ?.split("\n")
      .map((line) => line.replace(/^[-*\s>]+/, "").trim())
      .find(Boolean) ?? "";

  const detected = detectAction(firstLine);
  const recommendedAction = detected ?? "investigation_note";
  const shouldCreateIssue = recommendedAction === "issue";

  const parsedRationale = extractMarkdownSection(markdown, ["判断理由"]);
  const actionRationale =
    parsedRationale ?? (detected ? "" : TRIAGE_FALLBACK_REASON);

  const blockedReason = shouldCreateIssue
    ? undefined
    : (extractMarkdownSection(markdown, [
        "Issue化を止める理由",
        "Issue化を保留する理由",
      ]) ?? (detected ? undefined : TRIAGE_FALLBACK_REASON));

  return {
    recommendedAction,
    actionLabel: ACTION_LABELS[recommendedAction],
    actionRationale,
    blockedReason,
    shouldCreateIssue,
  };
};

/**
 * Builds the leading "judgement" Markdown block shared by the mock provider
 * (and mirrored by the real prompt's output format). Kept here so the mock
 * output and the parser stay in sync.
 */
export const buildTriageMarkdown = (triage: ActionTriage): string => {
  const reasonHeading = triage.shouldCreateIssue
    ? "Issue化してよい理由"
    : "Issue化を止める理由";
  const reasonBody = triage.shouldCreateIssue
    ? triage.actionRationale
    : (triage.blockedReason ?? triage.actionRationale);

  return `# 判定（アクション前処理レイヤー）

## 推奨アクション

${triage.actionLabel}

## 判断理由

${triage.actionRationale}

## ${reasonHeading}

${reasonBody}`;
};
