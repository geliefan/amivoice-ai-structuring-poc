import { NextRequest, NextResponse } from "next/server";
import { AmiVoiceApiError, getTranscriptionClient } from "@/lib/amivoice";
import { GeminiApiError, getLlmClient } from "@/lib/llm";
import type {
  ApiErrorResponse,
  StructureMode,
  TranscribeAndStructureApiResponse,
} from "@/types";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
): Promise<NextResponse<TranscribeAndStructureApiResponse | ApiErrorResponse>> {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "リクエストの形式が不正です。multipart/form-dataで送信してください。" },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "音声ファイルが指定されていません。'file'フィールドにファイルを指定してください。" },
      { status: 400 },
    );
  }

  if (file.size === 0) {
    return NextResponse.json(
      { error: "アップロードされた音声ファイルが空です。別のファイルを選択してください。" },
      { status: 400 },
    );
  }

  const mode = formData.get("mode");
  if (mode !== "issue" && mode !== "reflection") {
    return NextResponse.json(
      { error: "modeは'issue'または'reflection'を指定してください。" },
      { status: 400 },
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const transcriptionClient = getTranscriptionClient();

  try {
    const transcription = await transcriptionClient.transcribeAudio({
      buffer,
      filename: file.name,
      contentType: file.type || "application/octet-stream",
    });

    const llmClient = getLlmClient();
    const structured = await llmClient.structure({
      mode: mode as StructureMode,
      text: transcription.text,
    });

    if (!structured.markdown.trim()) {
      return NextResponse.json(
        { error: "構造化結果が空でした。文字起こし結果を見直すか、もう一度試してください。" },
        { status: 502 },
      );
    }

    return NextResponse.json({ transcription, structured });
  } catch (error) {
    return NextResponse.json(toErrorResponse(error), { status: 502 });
  }
}

const toErrorResponse = (error: unknown): ApiErrorResponse => {
  if (error instanceof AmiVoiceApiError) {
    return {
      error: "AmiVoice APIがエラーを返しました。音声ファイルの形式・サイズ・APIキーを確認してください。",
      details: `code=${error.code}: ${error.message}`,
    };
  }
  if (error instanceof GeminiApiError) {
    return {
      error: "Gemini APIがエラーを返しました。APIキー・モデル名・利用枠を確認してください。",
      details: error.apiMessage
        ? `HTTP ${error.httpStatus}${error.apiStatus ? ` ${error.apiStatus}` : ""}: ${error.apiMessage}`
        : `HTTP ${error.httpStatus}`,
    };
  }
  if (error instanceof Error) {
    return { error: error.message };
  }
  return { error: "処理中に予期しないエラーが発生しました。" };
};
