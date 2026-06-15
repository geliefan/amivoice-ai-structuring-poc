import type { LowConfidenceRank, LowConfidenceTerm } from "@/types";
import type { AmiVoiceRecognizeResponse, AmiVoiceToken } from "./types";

/**
 * Extracts low-confidence terms from AmiVoice token-level confidence.
 *
 * Why token-level (not utterance-level): in real responses the overall
 * `results[].confidence` can be high while individual technical-term tokens
 * (e.g. "リフィル": 0.21) are very low. Judging trust from the utterance
 * score alone would miss exactly the words we must flag for human review.
 *
 * This module never auto-corrects a term. Its job is to route uncertain
 * words to "needs human confirmation", not to guess the right word.
 */

// --- Thresholds (kept as constants so they can be env-driven later) ---------

/** confidence < this => flagged as low (warning or critical). AmiVoice scale 0..1. */
export const LOW_CONFIDENCE_THRESHOLD = 0.75;
/** confidence < this => critical (likely misrecognition). */
export const CRITICAL_CONFIDENCE_THRESHOLD = 0.6;
/** Max terms surfaced (keeps the UI / prompt focused). */
export const MAX_LOW_CONFIDENCE_TERMS = 8;

const PUNCTUATION_ONLY = /^[\s、。，．・…！？!?「」『』（）()【】[\]"'`:：;；/／\\|~ー―-]+$/;
const SINGLE_HIRAGANA = /^[ぁ-ん]$/;
/** Katakana / latin / digits — kept even when short (likely technical terms). */
const TECHNICAL_CHARS = /[ァ-ヶｦ-ﾟーA-Za-z0-9]/;

const round2 = (n: number): number => Math.round(n * 100) / 100;

/** Tokens that are punctuation, symbols, or bare particles add no signal. */
const isNoiseToken = (token: AmiVoiceToken): boolean => {
  const written = (token.written ?? "").trim();
  if (!written) return true;
  if (token.spoken === "_") return true; // AmiVoice symbol marker
  if (PUNCTUATION_ONLY.test(written)) return true;
  // Single common hiragana (particles like は/が/の) — but keep short
  // katakana/latin/digit tokens which may be real technical terms.
  if (SINGLE_HIRAGANA.test(written)) return true;
  return false;
};

const isLowToken = (token: AmiVoiceToken): boolean =>
  typeof token.confidence === "number" &&
  token.confidence < LOW_CONFIDENCE_THRESHOLD;

const reasonFor = (rank: LowConfidenceRank, text: string): string => {
  const base =
    rank === "critical"
      ? "AmiVoiceのtoken信頼度が低く（critical）、誤認識の可能性が高い"
      : "AmiVoiceのtoken信頼度がやや低く（warning）、確認推奨";
  return TECHNICAL_CHARS.test(text)
    ? `${base}（固有名詞・コマンド・技術用語の可能性。確定情報として扱わない）`
    : base;
};

const hasTechnicalChars = (text: string): boolean => TECHNICAL_CHARS.test(text);

const KATAKANA_ONLY = /^[ァ-ヶｦ-ﾟー]+$/;
const ASCII_TERM_ONLY = /^[A-Za-z0-9._-]+$/;

/**
 * Whether two adjacent tokens read as one compound (katakana+katakana or
 * ascii+ascii), so a non-low neighbor like "ケース" is attached to "リリース"
 * but a kanji content word like "確認" is not pulled into an ascii run.
 */
const sharesClass = (a: string, b: string): boolean =>
  (KATAKANA_ONLY.test(a) && KATAKANA_ONLY.test(b)) ||
  (ASCII_TERM_ONLY.test(a) && ASCII_TERM_ONLY.test(b));

/** Significant low token: low confidence AND not a noise/particle/symbol. */
const isSignificantLow = (token: AmiVoiceToken): boolean =>
  isLowToken(token) && !isNoiseToken(token);

/**
 * Tokens that join two low tokens into one compound phrase (e.g. genitive
 * "の"). Clause particles (を/は/が/に/で …) are intentionally excluded so
 * we don't merge across clause boundaries into one giant phrase.
 */
const COMPOUND_CONNECTOR = /^[の・ー]$/;

/**
 * Builds a readable phrase for a group of (bridged) low tokens spanning
 * [runStart, runEnd]. Interior connector tokens (e.g. "の") are kept so
 * "リフィル の イングレス" reads as "リフィルのイングレス"; a same-class
 * neighbor on each side is attached so "リリース" surfaces as "ケースリリース".
 */
const buildPhrase = (
  tokens: AmiVoiceToken[],
  runStart: number,
  runEnd: number,
  groupIndices: number[],
): LowConfidenceTerm => {
  let fromIdx = runStart;
  let toIdx = runEnd;

  const left = tokens[runStart - 1];
  if (
    left &&
    !isNoiseToken(left) &&
    sharesClass(left.written ?? "", tokens[runStart].written ?? "")
  ) {
    fromIdx = runStart - 1;
  }
  const right = tokens[runEnd + 1];
  if (
    right &&
    !isNoiseToken(right) &&
    sharesClass(right.written ?? "", tokens[runEnd].written ?? "")
  ) {
    toIdx = runEnd + 1;
  }

  const phraseTokens = tokens.slice(fromIdx, toIdx + 1);
  const text = phraseTokens
    .map((t) => t.written ?? "")
    .join("")
    .trim();

  const minConfidence = Math.min(
    ...groupIndices.map((i) =>
      typeof tokens[i].confidence === "number" ? (tokens[i].confidence as number) : 1,
    ),
  );
  const rank: LowConfidenceRank =
    minConfidence < CRITICAL_CONFIDENCE_THRESHOLD ? "critical" : "warning";

  return {
    text,
    confidence: round2(minConfidence),
    rank,
    startTime: phraseTokens[0]?.starttime,
    endTime: phraseTokens[phraseTokens.length - 1]?.endtime,
    reason: reasonFor(rank, text),
  };
};

/** Display priority: critical first, then technical-looking terms, then by confidence. */
const priority = (term: LowConfidenceTerm): number =>
  (term.rank === "critical" ? 1000 : 0) +
  (hasTechnicalChars(term.text) ? 100 : 0) +
  (typeof term.confidence === "number" ? (1 - term.confidence) * 10 : 0);

export const extractLowConfidenceTerms = (
  results: AmiVoiceRecognizeResponse["results"],
): LowConfidenceTerm[] => {
  const terms: LowConfidenceTerm[] = [];

  for (const result of results ?? []) {
    const tokens = result.tokens ?? [];

    // Indices of significant-low tokens, then grouped so that two of them
    // separated by at most one connector token (e.g. "の") merge into one
    // phrase span.
    const lowIndices = tokens
      .map((token, i) => (isSignificantLow(token) ? i : -1))
      .filter((i) => i >= 0);

    let group: number[] = [];
    const flush = () => {
      if (group.length === 0) return;
      const phrase = buildPhrase(tokens, group[0], group[group.length - 1], group);
      if (phrase.text) terms.push(phrase);
      group = [];
    };

    for (const idx of lowIndices) {
      const prev = group[group.length - 1];
      const consecutive = group.length > 0 && idx - prev === 1;
      const bridged =
        group.length > 0 &&
        idx - prev === 2 &&
        COMPOUND_CONNECTOR.test(tokens[prev + 1]?.written ?? "");
      if (group.length === 0 || consecutive || bridged) {
        group.push(idx);
      } else {
        flush();
        group.push(idx);
      }
    }
    flush();
  }

  // Dedupe by surface text (keep the highest-priority instance).
  const byText = new Map<string, LowConfidenceTerm>();
  for (const term of terms) {
    const existing = byText.get(term.text);
    if (!existing || priority(term) > priority(existing)) {
      byText.set(term.text, term);
    }
  }

  return [...byText.values()]
    .sort((a, b) => priority(b) - priority(a))
    .slice(0, MAX_LOW_CONFIDENCE_TERMS);
};
