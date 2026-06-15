import fs from "node:fs";
import path from "node:path";
import type { StructureMode } from "@/types";

export type EvaluationScores = {
  /** 事実と推測が分離されているか */
  factVsGuess: 1 | 2 | 3;
  /** 次の行動に移せるか */
  actionable: 1 | 2 | 3;
  /** 余計な断定がないか */
  noOverclaim: 1 | 2 | 3;
  /** 音声メモの違和感や感情が失われていないか */
  preservesNuance: 1 | 2 | 3;
  /** 業務ドキュメントとして貼れるか */
  pasteReady: 1 | 2 | 3;
};

export type Sample = {
  id: string;
  mode: StructureMode;
  title: string;
  /** Short description of the scenario, shown above the input. */
  scenario: string;
  input: string;
  output: string;
  scores: EvaluationScores;
  /** Free-text evaluation notes (what works well / what to watch for). */
  notes: string;
};

const SAMPLES_DIR = path.join(process.cwd(), "samples");

const readSample = (relativePath: string): string =>
  fs.readFileSync(path.join(SAMPLES_DIR, relativePath), "utf-8").trim();

export const samples: Sample[] = [
  {
    id: "issue-01",
    mode: "issue",
    title: "k8s Pod CrashLoopBackOff・環境変数の反映漏れ調査",
    scenario:
      "ステージング環境のPodが落ちているのに気づき、原因をその場で口頭メモした想定。",
    input: readSample("issue/issue-01-input.md"),
    output: readSample("issue/issue-01-output.md"),
    scores: {
      factVsGuess: 3,
      actionable: 3,
      noOverclaim: 3,
      preservesNuance: 2,
      pasteReady: 3,
    },
    notes:
      "ConfigMapの反映漏れか参照設定ミスかを「推測」として明示し、" +
      "本番環境への影響可能性という発話者の不安も「リスク・注意点」に残せている。" +
      "次にやることが具体的なコマンド操作レベルまで落ちており、そのまま着手できる。",
  },
  {
    id: "issue-02",
    mode: "issue",
    title: "ライブラリv3アップデート後のページネーション仕様差分",
    scenario:
      "ライブラリのメジャーバージョンアップ後に挙動が変わった違和感を、原因未特定のまま記録した想定。",
    input: readSample("issue/issue-02-input.md"),
    output: readSample("issue/issue-02-output.md"),
    scores: {
      factVsGuess: 3,
      actionable: 3,
      noOverclaim: 3,
      preservesNuance: 3,
      pasteReady: 3,
    },
    notes:
      "「仕様変更かバグか分からない」という発話者の迷いをそのまま「推測」「未確認事項」に" +
      "落とし込めており、断定を避けられている。応急処置のガードと恒久対応を" +
      "分けて扱えている点も、業務ドキュメントとして使いやすい。",
  },
  {
    id: "issue-03",
    mode: "issue",
    title: "夜間バッチ失敗・誤認識の可能性がある用語を含む調査メモ",
    scenario:
      "「キューシーエス」のような音声認識特有の誤変換を含む、技術的な調査メモの想定。",
    input: readSample("issue/issue-03-input.md"),
    output: readSample("issue/issue-03-output.md"),
    scores: {
      factVsGuess: 3,
      actionable: 3,
      noOverclaim: 3,
      preservesNuance: 2,
      pasteReady: 3,
    },
    notes:
      "「キューシーエス」「シーピーユー使用率」を断定せず「確認候補（誤認識の可能性）」と" +
      "して未確認事項に回せている点が重要。これを断定的に「SQS」と書き換えてしまうと、" +
      "誤った前提で調査が進むリスクがある。",
  },
  {
    id: "issue-04",
    mode: "issue",
    title: "夜間バッチ失敗・動詞の誤認識（「回避されている」）を含む調査メモ",
    scenario:
      "「データベース足」「ポット」「name Space」のような名詞の誤認識・表記揺れに加え、" +
      "「回避されている」のように文の意味を反転させかねない動詞の誤認識を含む想定。",
    input: readSample("issue/issue-04-input.md"),
    output: readSample("issue/issue-04-output.md"),
    scores: {
      factVsGuess: 3,
      actionable: 3,
      noOverclaim: 3,
      preservesNuance: 2,
      pasteReady: 3,
    },
    notes:
      "「バッチのコンテナ自体は回避されている」を断定的な事実として採用せず、" +
      "「文字起こし確認候補」に回せている点が最大のポイント。動詞の誤認識は" +
      "成功/失敗・起動/停止のような正反対の意味になり得るため、確認優先度を" +
      "「高」として明示している。「データベース足」→「データベース接続」、" +
      "「ポット」→「Pod」、「name Space」→「namespace」のような名詞の" +
      "表記揺れも、断定せず補正候補として併記できている。",
  },
  {
    id: "issue-05",
    mode: "issue",
    title: "技術用語が密集する音声メモ・文字起こし信頼度「低」のケース",
    scenario:
      "「オープンスパー」「キッチンのリポジトリ」「ケースリリース」" +
      "「リフィルのイングレス」「キューブコントロールGETぽつ」" +
      "「今ポーズアップの-D」など、固有名詞・コマンド名・バージョン番号の" +
      "誤認識が多数含まれ、発話者自身も「誤変換されそうな単語が多い」と" +
      "述べている想定。",
    input: readSample("issue/issue-05-input.md"),
    output: readSample("issue/issue-05-output.md"),
    scores: {
      factVsGuess: 3,
      actionable: 3,
      noOverclaim: 3,
      preservesNuance: 2,
      pasteReady: 3,
    },
    notes:
      "「文字起こし信頼度」を「低」と判定したうえで、タイトル・事実・" +
      "起きていることで補正候補（OpenSprayer、Kitchenリポジトリ、" +
      "kubectl apply -f、Cloud Development等）を断定的に採用していない点が" +
      "最大のポイント。「ケースリリース」→K3s 1.33.3、「リフィルのイングレス」→" +
      "Traefik Ingressのように文脈上もっともらしい補正候補は提示しつつも、" +
      "あくまで「文字起こし確認候補」として扱っている。「Java事務」" +
      "「きっちり9SSS」のように補正候補が特定できない語句について、" +
      "無理に展開を作らず「不明（要確認）」としている点も、" +
      "入力にない情報を補わないというルールの実践例になっている。",
  },
  {
    id: "reflection-01",
    mode: "reflection",
    title: "オンボーディング3日目・環境構築でのつまずき",
    scenario: "新人エンジニアが、開発環境セットアップ初日のふりかえりを話した想定。",
    input: readSample("reflection/reflection-01-input.md"),
    output: readSample("reflection/reflection-01-output.md"),
    scores: {
      factVsGuess: 3,
      actionable: 3,
      noOverclaim: 3,
      preservesNuance: 2,
      pasteReady: 3,
    },
    notes:
      "「手順書がなければ自分では解決できなかった」という発話者の自己評価を" +
      "Problemに残しつつ、誇張せずTryに繋げている。次回の行動案が" +
      "翌日の予定（API呼び出し部分を読む）と自然につながっている。",
  },
  {
    id: "reflection-02",
    mode: "reflection",
    title: "useEffectの学習・分かったつもりだが自信がない",
    scenario:
      "技術概念を学習したが、応用パターンへの自信がない学習者のふりかえりの想定。",
    input: readSample("reflection/reflection-02-input.md"),
    output: readSample("reflection/reflection-02-output.md"),
    scores: {
      factVsGuess: 3,
      actionable: 3,
      noOverclaim: 3,
      preservesNuance: 3,
      pasteReady: 3,
    },
    notes:
      "「分かった気になっているが説明できる自信はない」という発話を" +
      "「分かったこと」と「まだ曖昧なこと」に正しく振り分けられており、" +
      "実際には未検証の応用パターンを「理解した」と誤って書いていない。",
  },
  {
    id: "reflection-03",
    mode: "reflection",
    title: "レビュー指摘の意図が掴めず相談前のもやもやメモ",
    scenario:
      "レビュー指摘の意図が分からず、メンターに何を聞けばよいかも分からない状態の想定。",
    input: readSample("reflection/reflection-03-input.md"),
    output: readSample("reflection/reflection-03-output.md"),
    scores: {
      factVsGuess: 3,
      actionable: 3,
      noOverclaim: 2,
      preservesNuance: 3,
      pasteReady: 3,
    },
    notes:
      "「何が分からないか分からない」という状態そのものをProblemとして言語化し、" +
      "次回の行動案で「責務を書き出す」という具体的な一歩に変換できている。" +
      "ただし「責務」の定義そのものは入力にないため、Tryの粒度がやや一般論寄りになる点は" +
      "Gemini利用時の出力次第で調整が必要。",
  },
];

export const getSamplesByMode = (mode: StructureMode): Sample[] =>
  samples.filter((sample) => sample.mode === mode);
