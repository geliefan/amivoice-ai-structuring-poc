"use client";

import { useState } from "react";
import { ActionTriagePanel } from "@/components/ActionTriagePanel";
import { CopyButton } from "@/components/CopyButton";
import { LowConfidenceTerms } from "@/components/LowConfidenceTerms";
import { MarkdownPreview } from "@/components/MarkdownPreview";
import { ModeSelector } from "@/components/ModeSelector";
import { ProviderStatus } from "@/components/ProviderStatus";
import type { getProviderStatus } from "@/lib/env";
import type {
  ApiErrorResponse,
  StructureApiResponse,
  StructureMode,
  TranscribeApiResponse,
  TranscribeAndStructureApiResponse,
} from "@/types";

type ProviderStatusType = ReturnType<typeof getProviderStatus>;

type RunningAction = "transcribe" | "structure" | "both" | null;

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const isApiErrorResponse = (value: unknown): value is ApiErrorResponse =>
  typeof value === "object" && value !== null && "error" in value;

export function ConvertForm({ providerStatus }: { providerStatus: ProviderStatusType }) {
  const [mode, setMode] = useState<StructureMode>("issue");
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [transcription, setTranscription] = useState<TranscribeApiResponse | null>(null);
  const [structured, setStructured] = useState<StructureApiResponse | null>(null);
  const [error, setError] = useState<ApiErrorResponse | null>(null);
  const [running, setRunning] = useState<RunningAction>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);
    setError(null);
  };

  const runTranscribe = async () => {
    if (!file) {
      setError({ error: "音声ファイルが選択されていません。先にファイルを選択してください。" });
      return;
    }

    setRunning("transcribe");
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/transcribe", { method: "POST", body: formData });
      const json: unknown = await res.json();

      if (!res.ok || isApiErrorResponse(json)) {
        setError(
          isApiErrorResponse(json)
            ? json
            : { error: "文字起こしに失敗しました。" },
        );
        return;
      }

      const result = json as TranscribeApiResponse;
      setTranscription(result);
      setText(result.text);
    } catch {
      setError({
        error:
          "ネットワークエラーが発生しました。サーバーが起動しているか、接続状況を確認してください。",
      });
    } finally {
      setRunning(null);
    }
  };

  const runStructure = async () => {
    if (!text.trim()) {
      setError({
        error:
          "構造化するテキストが空です。テキストを直接入力するか、先に「文字起こしのみ実行」を行ってください。",
      });
      return;
    }

    setRunning("structure");
    setError(null);

    try {
      const res = await fetch("/api/structure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, text }),
      });
      const json: unknown = await res.json();

      if (!res.ok || isApiErrorResponse(json)) {
        setError(
          isApiErrorResponse(json) ? json : { error: "構造化に失敗しました。" },
        );
        return;
      }

      setStructured(json as StructureApiResponse);
    } catch {
      setError({
        error:
          "ネットワークエラーが発生しました。サーバーが起動しているか、接続状況を確認してください。",
      });
    } finally {
      setRunning(null);
    }
  };

  const runTranscribeAndStructure = async () => {
    if (!file) {
      setError({ error: "音声ファイルが選択されていません。先にファイルを選択してください。" });
      return;
    }

    setRunning("both");
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("mode", mode);

      const res = await fetch("/api/transcribe-and-structure", { method: "POST", body: formData });
      const json: unknown = await res.json();

      if (!res.ok || isApiErrorResponse(json)) {
        setError(
          isApiErrorResponse(json) ? json : { error: "文字起こし・構造化に失敗しました。" },
        );
        return;
      }

      const result = json as TranscribeAndStructureApiResponse;
      setTranscription(result.transcription);
      setText(result.transcription.text);
      setStructured(result.structured);
    } catch {
      setError({
        error:
          "ネットワークエラーが発生しました。サーバーが起動しているか、接続状況を確認してください。",
      });
    } finally {
      setRunning(null);
    }
  };

  const isTranscribing = running === "transcribe";
  const isStructuring = running === "structure";
  const isTranscribingAndStructuring = running === "both";
  const isBusy = isTranscribing || isStructuring || isTranscribingAndStructuring;

  const hasAudioFile = file !== null;
  const hasText = text.trim().length > 0;

  const canTranscribe = hasAudioFile && !isBusy;
  const canStructure = hasText && !isBusy;
  const canTranscribeAndStructure = hasAudioFile && !isBusy;

  return (
    <div className="space-y-6">
      <ProviderStatus status={providerStatus} />

      <section>
        <h2 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">モード選択</h2>
        <ModeSelector value={mode} onChange={setMode} />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
          入力1: 音声ファイルアップロード
        </h2>
        <input
          type="file"
          accept="audio/*,.m4a,.mp3,.wav,.webm"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100 dark:text-gray-400 dark:file:bg-blue-900/40 dark:file:text-blue-300"
        />
        {file && (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            ファイル名: <span className="font-mono">{file.name}</span> / サイズ:{" "}
            {formatFileSize(file.size)} / 種類: {file.type || "不明"}
          </p>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
          入力2: テキスト直接入力（文字起こし結果もここに反映されます）
        </h2>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          placeholder="未整理の音声メモのテキストをここに入力するか、音声ファイルから文字起こしすると自動的に入ります。"
          className="w-full rounded-md border border-gray-300 bg-white p-3 text-sm shadow-sm focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900"
        />
      </section>

      <section className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={runTranscribe}
          disabled={!canTranscribe}
          className="rounded-md bg-gray-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isTranscribing ? "文字起こし中…" : "文字起こしのみ実行"}
        </button>
        <button
          type="button"
          onClick={runStructure}
          disabled={!canStructure}
          className="rounded-md bg-gray-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isStructuring ? "構造化中…" : "構造化のみ実行"}
        </button>
        <button
          type="button"
          onClick={runTranscribeAndStructure}
          disabled={!canTranscribeAndStructure}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isTranscribingAndStructuring ? "実行中…" : "文字起こし + 構造化"}
        </button>
      </section>

      <details className="rounded-md border border-dashed border-gray-300 p-2 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
        <summary className="cursor-pointer select-none">デバッグ情報（開発用）</summary>
        <ul className="mt-1 space-y-0.5 font-mono">
          <li>audioFile: {hasAudioFile ? `selected (${file?.name})` : "none"}</li>
          <li>text length: {text.length}</li>
          <li>isBusy: {String(isBusy)}</li>
          <li>canTranscribe: {String(canTranscribe)}</li>
          <li>canStructure: {String(canStructure)}</li>
          <li>canTranscribeAndStructure: {String(canTranscribeAndStructure)}</li>
        </ul>
      </details>

      {error && (
        <section className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          <p className="font-semibold">エラー: {error.error}</p>
          {error.details && <p className="mt-1 text-xs opacity-80">詳細: {error.details}</p>}
        </section>
      )}

      {transcription && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
            文字起こし結果（provider: {transcription.provider}）
          </h2>
          <pre className="whitespace-pre-wrap rounded-md bg-gray-50 p-3 text-sm leading-relaxed dark:bg-gray-800">
            {transcription.text}
          </pre>
          {transcription.raw !== undefined && (
            <details className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              <summary className="cursor-pointer select-none">raw response（開発確認用）</summary>
              <pre className="mt-1 max-h-64 overflow-auto rounded-md bg-gray-100 p-2 dark:bg-gray-900">
                {JSON.stringify(transcription.raw, null, 2)}
              </pre>
            </details>
          )}
        </section>
      )}

      {transcription?.lowConfidenceTerms && transcription.lowConfidenceTerms.length > 0 && (
        <LowConfidenceTerms terms={transcription.lowConfidenceTerms} />
      )}

      {structured?.triage && (
        <ActionTriagePanel triage={structured.triage} markdown={structured.markdown} />
      )}

      {structured && (
        <section>
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              構造化Markdown（provider: {structured.provider} / mode: {structured.mode}）
            </h2>
            <CopyButton text={structured.markdown} />
          </div>
          <div className="rounded-md border border-gray-200 p-3 dark:border-gray-700">
            <MarkdownPreview markdown={structured.markdown} />
          </div>
          <details className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            <summary className="cursor-pointer select-none">Markdownソースを表示</summary>
            <pre className="mt-1 max-h-64 overflow-auto whitespace-pre-wrap rounded-md bg-gray-100 p-2 dark:bg-gray-900">
              {structured.markdown}
            </pre>
          </details>
        </section>
      )}
    </div>
  );
}
