"use client";

import { useState } from "react";

type CopyButtonProps = {
  /** Text to copy to the clipboard. */
  text: string;
  /** Optional label shown on the button before/after copying. */
  label?: string;
  className?: string;
};

/**
 * Button that copies `text` to the clipboard and shows brief feedback.
 * Disabled when there is nothing to copy.
 */
export function CopyButton({ text, label = "Markdownをコピー", className = "" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleClick = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!text.trim()}
      className={`inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 ${className}`}
    >
      {copied ? "コピーしました ✓" : label}
    </button>
  );
}
