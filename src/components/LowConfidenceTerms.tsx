import type { LowConfidenceTerm } from "@/types";

type LowConfidenceTermsProps = {
  terms: LowConfidenceTerm[];
  /** Max items to render (defaults to 8). */
  max?: number;
};

const RANK_BADGE: Record<string, string> = {
  critical:
    "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
  warning:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300",
};

/**
 * Shows the AmiVoice-derived low-confidence terms so a reviewer can see the
 * recognition-engine basis for "this might be misrecognized" — without
 * opening the raw response. Renders nothing when there are no terms.
 */
export function LowConfidenceTerms({ terms, max = 8 }: LowConfidenceTermsProps) {
  if (!terms || terms.length === 0) return null;
  const shown = terms.slice(0, max);

  return (
    <section className="rounded-md border border-amber-300 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/30">
      <h3 className="text-xs font-semibold text-amber-800 dark:text-amber-300">
        AmiVoiceで低信頼だった語句（token-level confidence）
      </h3>
      <p className="mt-0.5 text-[11px] text-amber-700/80 dark:text-amber-400/80">
        確定情報として扱わず、人間が確認すべき候補です（自動補正はしていません）。
      </p>
      <ul className="mt-2 space-y-1 text-sm">
        {shown.map((term, i) => (
          <li key={`${term.text}-${i}`} className="flex flex-wrap items-baseline gap-x-2">
            {term.rank && (
              <span
                className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold ${
                  RANK_BADGE[term.rank] ?? RANK_BADGE.warning
                }`}
              >
                {term.rank}
              </span>
            )}
            <span className="font-mono font-medium text-gray-900 dark:text-gray-100">
              {term.text}
            </span>
            {typeof term.confidence === "number" && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                confidence: {term.confidence}
              </span>
            )}
            <span className="text-xs text-gray-600 dark:text-gray-400">
              — {term.reason}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
