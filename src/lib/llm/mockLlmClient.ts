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

const buildMockIssueMarkdown = (text: string): string => {
  const trimmed = text.trim();
  const titleFragment = firstFragment(trimmed, 30) || "（入力テキストなし）";

  return `# タイトル案

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

## 文字起こし信頼度

高

### 判断理由
- mock出力のため、音声認識特有の誤認識・表記揺れの判定はGemini API利用時に行われます。

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

## 文字起こし確認候補
特になし（mock出力）

## 次にやること
- [ ] ログ・設定・環境変数を確認する
- [ ] 未確認事項を切り分ける
- [ ] 対応方針を決める
`;
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
    const markdown =
      input.mode === "issue"
        ? buildMockIssueMarkdown(input.text)
        : buildMockReflectionMarkdown(input.text);

    return {
      markdown,
      provider: "mock",
      mode: input.mode,
    };
  }
}
