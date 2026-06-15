import type { ActionTriage } from "@/types";
import { ACTION_LABELS, buildTriageMarkdown } from "./actionTriage";
import type { LlmClient, StructureInput, StructureResult } from "./types";

/**
 * Returns a short title-ish fragment derived from the input text, used to
 * make the mock output feel grounded in what the user actually typed
 * instead of being a fully generic placeholder.
 */
const firstFragment = (text: string, maxLength: number): string => {
  const firstSentence = text.split(/[。\n]/)[0]?.trim() ?? "";
  const base = firstSentence || text.trim();
  return base.length > maxLength ? `${base.slice(0, maxLength)}…` : base;
};

/** Patterns hinting at speech-recognition garbling of technical terms. */
const MISRECOGNITION_PATTERN =
  /誤変換|ご返還|ケースリ|サートリゾルバ|今ポーズアップ|オープンスパー|キッチンのリポジトリ|リフィルのイングレス|キューブコントロール|茶葉|ギッキー/;

/** Patterns hinting at concrete, reproducible-enough problems. */
const CONCRETE_PATTERN =
  /エラー|失敗|落ち|再現|ログ|例外|タイムアウト|スタックトレース|クラッシュ|500|crash/i;

/** Patterns hinting at subjective / uncertain memos. */
const SUBJECTIVE_PATTERN =
  /気がする|気のせい|かもしれない|かも。|かも$|なんか|もやもや|自分だけ/;

/**
 * Heuristic mock triage. The real provider lets Gemini decide; the mock
 * approximates the three article scenarios (GO / STOP / HOLD) from the text
 * so the UI difference is visible without an API key.
 */
const decideMockTriage = (text: string): ActionTriage => {
  const t = text.trim();

  if (MISRECOGNITION_PATTERN.test(t)) {
    return {
      recommendedAction: "investigation_note",
      actionLabel: ACTION_LABELS.investigation_note,
      actionRationale:
        "技術用語の誤認識候補が複数含まれており、文字起こし信頼度が低いと判断しました。確定情報として扱える内容が乏しいため、まず人間が用語を確認する必要があります。",
      blockedReason:
        "k3s / Traefik / certresolver / docker compose 等に相当する語句が誤認識されている可能性があり、確定情報としてIssue本文に書けません。誤った前提のIssueを作らないため、Issue化は保留します。",
      shouldCreateIssue: false,
    };
  }

  if (CONCRETE_PATTERN.test(t) && !SUBJECTIVE_PATTERN.test(t)) {
    return {
      recommendedAction: "issue",
      actionLabel: ACTION_LABELS.issue,
      actionRationale:
        "具体的な事象（エラー・失敗・ログ等）が述べられており、調査の起点となる事実が確認できます。再現条件・影響範囲は未確認事項として残しつつ、Issueとして起票して追跡する価値があります。",
      shouldCreateIssue: true,
    };
  }

  if (SUBJECTIVE_PATTERN.test(t)) {
    return {
      recommendedAction: "save_only",
      actionLabel: ACTION_LABELS.save_only,
      actionRationale:
        "主観的な違和感が中心で、再現条件・対象環境・影響範囲・期待結果が不足しています。現時点ではアクション化の材料が揃っていません。",
      blockedReason:
        "再現条件・対象環境・影響範囲・期待結果のいずれも確認できず、このままIssue化すると曖昧な前提が記録されてしまいます。まずはメモとして保存し、追加情報が集まってから判断します。",
      shouldCreateIssue: false,
    };
  }

  return {
    recommendedAction: "investigation_note",
    actionLabel: ACTION_LABELS.investigation_note,
    actionRationale:
      "現象や気づきはあるものの、再現条件や影響範囲などIssue化に必要な情報が不足しています。",
    blockedReason:
      "Issue化に必要な再現条件・影響範囲が不足しているため、まず調査メモとして扱い、不足情報を確認します。",
    shouldCreateIssue: false,
  };
};

const buildMockIssueBody = (text: string): string => {
  const trimmed = text.trim();
  const titleFragment = firstFragment(trimmed, 30) || "（入力テキストなし）";

  return `# Issueタイトル案

(mock) ${titleFragment} の調査・確認

## 概要

入力された音声メモ（mock構造化）をもとに、調査・確認が必要な事項を整理しました。
以下は mock LLM provider による固定フォーマットの出力です。実際のニュアンスや
専門用語の解釈は、Gemini API（real provider）を使うとより精緻になります。

## 文字起こし信頼度

高

### 判断理由
- mock出力のため、音声認識特有の誤認識・表記揺れの判定はGemini API利用時に行われます。

## 背景

- 発話者は作業中に以下の状況に気づき、メモを残している。
- メモの内容:
  > ${trimmed || "(入力テキストが空です)"}

## 起きていること

- 上記メモで言及されている事象が発生している。
- 詳細な切り分け（原因箇所の特定）はまだ完了していない様子がうかがえる。

## 期待する状態

- 上記の事象が発生せず、対象の処理が正常に完了する状態。
- 原因が特定され、再発防止策の要否を判断できる状態。

## 事実

- 発話者がメモの中で直接述べている内容（上記「背景」の引用部分）。
- それ以外の事項は、現時点では事実として確定していない。

## 推測

- （推測）原因は設定値・環境差分・外部依存のいずれかである可能性がある。
- （推測）発話者自身もまだ原因を一つに絞り込めていない可能性がある。

## 調査済みのこと

- 発話者がメモの中で「確認した」「見た」と明言している範囲のみ。
- 上記メモからは、ログを確認したこと以外に調査済みの事項は読み取れない。

## 未確認事項

- 原因の切り分け（設定値 / ネットワーク / 外部要因のどれか）。
- 発生頻度・再現性（毎回発生するのか、一時的なものか）。
- 影響範囲（他の処理・他の環境にも影響するか）。

## 文字起こし確認候補

特になし（mock出力のため、音声認識特有の誤認識・表記揺れの検出は
Gemini API利用時に行われます）。

## リスク・注意点

- 原因が未特定のまま放置すると、同様の事象が再発する可能性がある。
- 発話者が感じている違和感・不安は、設計や運用上の見落としのサインである
  可能性があるため、軽視せず記録に残す。

## 次にやること

- [ ] 関連するログ・設定・環境変数を確認する。
- [ ] 上記「未確認事項」を一つずつ切り分ける。
- [ ] 切り分け結果をもとに、対応方針を決める。

## Issue本文として使う場合の貼り付け用Markdown

# ${titleFragment} の調査・確認

## 概要
入力メモをもとにした調査・確認用のIssueです（mock出力）。

## 起きていること
> ${trimmed || "(入力テキストが空です)"}

## 事実
- 上記メモで述べられている内容のみが現時点での事実です。

## 推測
- 原因は設定値・環境差分・外部依存のいずれかの可能性があります（未確定）。

## 未確認事項
- 原因の切り分け
- 発生頻度・再現性
- 影響範囲

## 次にやること
- [ ] ログ・設定・環境変数を確認する
- [ ] 未確認事項を切り分ける
- [ ] 対応方針を決める
`;
};

/** Per-action document heading for non-Issue output (avoids "タイトル案"). */
const NON_ISSUE_HEADING: Record<string, string> = {
  investigation_note: "調査メモの見出し案",
  save_only: "保存メモの見出し案",
  question_template: "質問タイトル案",
  runbook_candidate: "Runbook候補の見出し案",
  backlog_candidate: "Backlog候補の見出し案",
  no_action: "メモの見出し案",
};

const buildMockNonIssueBody = (text: string, triage: ActionTriage): string => {
  const trimmed = text.trim();
  const isHold = MISRECOGNITION_PATTERN.test(trimmed);
  const heading =
    NON_ISSUE_HEADING[triage.recommendedAction] ?? "調査メモの見出し案";

  const confidence = isHold ? "低" : "中";
  const confidenceReason = isHold
    ? "- 技術用語らしき誤認識候補が複数含まれている（mock判定）。"
    : "- mock判定のため、詳細な誤認識検出はGemini API利用時に行われます。";

  const checkCandidates = isHold
    ? `| 文字起こし結果 | 補正候補 | 理由 | 確認優先度 |
|---|---|---|---|
| ケースリース | k3s | バージョン文脈からk3sの可能性 | 高 |
| トラフィック | Traefik | Ingress文脈での技術用語の可能性 | 高 |
| サートリゾルバー | certresolver | TLS証明書設定の文脈での可能性 | 高 |
| 今ポーズアップのD | docker compose up -d | コマンドの誤認識の可能性。断定不可 | 高 |`
    : "特になし（mock出力）。";

  return `# ${heading}

## このメモについて

推奨アクションは「${triage.actionLabel}」です。確定的なIssue本文は作成せず、
追加で確認すべきことを中心に整理しています（mock出力）。

## 背景

- メモの内容:
  > ${trimmed || "(入力テキストが空です)"}

## 文字起こし信頼度

${confidence}

### 判断理由
${confidenceReason}

## 追加で確認すべきこと

- 再現条件（いつ・どの環境・どの操作で起きるか）。
- 影響範囲（他の機能・他の利用者にも影響するか）。
- 期待する状態と実際の状態の差分。
${isHold ? "- 誤認識候補の語句が、実際に何を指すか（下記「文字起こし確認候補」を参照）。" : ""}

## 文字起こし確認候補

${checkCandidates}

## メモとして保存する場合のMarkdown

# ${firstFragment(trimmed, 30) || "（入力テキストなし）"}（調査メモ・Issue化前）

## 状況
> ${trimmed || "(入力テキストが空です)"}

## まだ確認できていないこと
- 再現条件 / 対象環境 / 影響範囲 / 期待結果
${isHold ? "- 誤認識候補（ケースリース→k3s 等）の確定" : ""}
`;
};

const buildMockIssueMarkdown = (text: string, triage: ActionTriage): string => {
  const triageMarkdown = buildTriageMarkdown(triage);
  const body = triage.shouldCreateIssue
    ? buildMockIssueBody(text)
    : buildMockNonIssueBody(text, triage);
  return `${triageMarkdown}\n\n---\n\n${body}`;
};

const buildMockReflectionMarkdown = (text: string): string => {
  const trimmed = text.trim();

  return `# ふりかえり整理

## 今日やったこと

> ${trimmed || "(入力テキストが空です)"}

上記の音声メモ（mock構造化）から読み取れる作業内容を、そのまま記載しています。

## Keep

- 作業中に感じた違和感や疑問を、その場でメモとして残せたこと。
- 分かったこと・分からなかったことを区別しようとしている姿勢。

## Problem

- 入力メモの中で「分からない」「不安」と表現されている点が、
  そのまま未解決の課題として残っている。
- 原因の切り分けが完了しておらず、次に何をすべきか整理しきれていない。

## Try

- 次回は、詰まった時点で「何が分かっていて、何が分かっていないか」を
  簡潔にメモする習慣をつけてみる。
- 確認事項をメンターに相談するタイミングを、作業当日のうちに決めておく。

## 分かったこと

- 入力メモの中で発話者が明確に「分かった」「気づいた」と述べている範囲のみ。
- 上記メモからは、明確に「分かった」と言える事項は限定的です
  （mock出力のため、詳細はGemini API利用時に補完されます）。

## まだ曖昧なこと

- メモの中で「分からない」「自信がない」と表現されている内容。
- 原因や次のアクションについて、発話者自身もまだ整理しきれていない部分。

## メンターへの確認事項

- 上記「まだ曖昧なこと」に挙げた内容について、考え方や調べ方のヒントを
  もらえないか相談したい。
- 今回のような状況で、最初に何を確認するのが良いか聞きたい。

## 次回の行動案

- [ ] 「まだ曖昧なこと」を整理し、自分なりの仮説を1つ立ててみる。
- [ ] メンターに相談する内容を、箇条書きで事前にまとめておく。
- [ ] 今回のメモを見返し、進捗があれば追記する。

## ふりかえり本文として使う場合の貼り付け用Markdown

# ふりかえり（mock出力）

## 今日やったこと
> ${trimmed || "(入力テキストが空です)"}

## Keep
- 違和感や疑問をその場でメモできた

## Problem
- 原因の切り分けが完了していない

## Try
- 次回は分かっていること/いないことを整理してからメモする

## メンターへの確認事項
- 「まだ曖昧なこと」について相談したい

## 次回の行動案
- [ ] 仮説を1つ立てる
- [ ] 相談内容を箇条書きでまとめる
`;
};

export class MockLlmClient implements LlmClient {
  async structure(input: StructureInput): Promise<StructureResult> {
    if (input.mode === "reflection") {
      return {
        markdown: buildMockReflectionMarkdown(input.text),
        provider: "mock",
        mode: "reflection",
      };
    }

    const triage = decideMockTriage(input.text);
    return {
      markdown: buildMockIssueMarkdown(input.text, triage),
      provider: "mock",
      mode: "issue",
      triage,
    };
  }
}
