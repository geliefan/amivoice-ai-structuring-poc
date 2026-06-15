import type { StructureMode } from "@/types";

type ModeSelectorProps = {
  value: StructureMode;
  onChange: (mode: StructureMode) => void;
};

const MODES: Array<{
  value: StructureMode;
  title: string;
  description: string;
}> = [
  {
    value: "issue",
    title: "Issue Mode",
    description:
      "不具合・違和感・調査メモなどを、事実 / 推測 / 未確認事項に分けてIssue用Markdownに整理します。",
  },
  {
    value: "reflection",
    title: "Reflection Mode",
    description:
      "ふりかえり音声を、Keep / Problem / Try とメンターへの確認事項に分解します。",
  },
];

/** Radio-style selector for choosing Issue Mode vs Reflection Mode. */
export function ModeSelector({ value, onChange }: ModeSelectorProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {MODES.map((mode) => {
        const selected = value === mode.value;
        return (
          <label
            key={mode.value}
            className={`cursor-pointer rounded-lg border p-3 text-sm transition ${
              selected
                ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40"
                : "border-gray-300 bg-white hover:border-gray-400 dark:border-gray-700 dark:bg-gray-900"
            }`}
          >
            <input
              type="radio"
              name="structure-mode"
              value={mode.value}
              checked={selected}
              onChange={() => onChange(mode.value)}
              className="sr-only"
            />
            <div className="font-semibold">{mode.title}</div>
            <p className="mt-1 text-gray-600 dark:text-gray-400">{mode.description}</p>
          </label>
        );
      })}
    </div>
  );
}
