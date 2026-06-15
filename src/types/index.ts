/**
 * Shared API request/response types.
 *
 * These types are used by both the Next.js API routes (src/app/api/**)
 * and the client-side /convert page so the contract stays in sync.
 */

export type TranscriptionProvider = "mock" | "amivoice";

export type LlmProvider = "mock" | "gemini";

export type StructureMode = "issue" | "reflection";

/**
 * Action triage decision produced *before* an Issue draft is treated as
 * usable. This is the core of the "do not turn every voice memo into an
 * Issue right away" pre-processing layer: the model first judges what kind
 * of action (if any) the transcript is ready for, and gives the human the
 * reasoning so they can make the final call.
 */
export type RecommendedAction =
  | "issue" // Issue化
  | "investigation_note" // 調査メモ
  | "question_template" // 質問テンプレ
  | "runbook_candidate" // Runbook候補
  | "backlog_candidate" // Backlog候補
  | "save_only" // 保存のみ
  | "no_action"; // 何もしない

export type ActionTriage = {
  /** Machine-readable recommended action. */
  recommendedAction: RecommendedAction;
  /** Human-facing Japanese label for the recommended action. */
  actionLabel: string;
  /** Why this action was recommended. */
  actionRationale: string;
  /**
   * Why the transcript should NOT be turned into an Issue yet. Present when
   * `shouldCreateIssue` is false (the "止める理由").
   */
  blockedReason?: string;
  /** True only when the recommended action is "issue". */
  shouldCreateIssue: boolean;
};

/**
 * A word/phrase that AmiVoice recognized with low token-level confidence.
 *
 * The point of this PoC's pre-processing layer is to NOT trust the
 * transcription blindly: these terms are surfaced to the user and fed to the
 * LLM as "do not treat as confirmed fact" hints, rather than being silently
 * auto-corrected.
 */
export type LowConfidenceRank = "critical" | "warning";

export type LowConfidenceTerm = {
  /** Recognized surface text (phrase, possibly merged from several tokens). */
  text: string;
  /** Lowest token confidence in the phrase (AmiVoice scale: 0..1). */
  confidence?: number;
  /** Severity bucket derived from confidence. */
  rank?: LowConfidenceRank;
  /** Phrase start time in seconds, if available. */
  startTime?: number;
  /** Phrase end time in seconds, if available. */
  endTime?: number;
  /** Why this term is flagged (human-facing). */
  reason: string;
};

export type TranscribeApiResponse = {
  text: string;
  provider: TranscriptionProvider;
  raw?: unknown;
  /**
   * Low-confidence terms extracted from AmiVoice token-level confidence.
   * Optional so existing consumers / mock responses stay compatible.
   */
  lowConfidenceTerms?: LowConfidenceTerm[];
};

export type StructureApiRequest = {
  mode: StructureMode;
  text: string;
};

export type StructureApiResponse = {
  markdown: string;
  provider: LlmProvider;
  mode: StructureMode;
  /**
   * Present for Issue Mode only. Reflection Mode does not produce an action
   * triage. Optional so existing consumers / responses stay compatible.
   */
  triage?: ActionTriage;
};

export type TranscribeAndStructureApiResponse = {
  transcription: TranscribeApiResponse;
  structured: StructureApiResponse;
};

export type ApiErrorResponse = {
  error: string;
  details?: string;
};
