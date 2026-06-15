import { NextRequest, NextResponse } from "next/server";
import { AmiVoiceApiError, getTranscriptionClient } from "@/lib/amivoice";
import type { ApiErrorResponse, TranscribeApiResponse } from "@/types";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
): Promise<NextResponse<TranscribeApiResponse | ApiErrorResponse>> {
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

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const client = getTranscriptionClient();

  try {
    const result = await client.transcribeAudio({
      buffer,
      filename: file.name,
      contentType: file.type || "application/octet-stream",
    });

    return NextResponse.json(result);
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
  if (error instanceof Error) {
    return { error: error.message };
  }
  return { error: "文字起こし中に予期しないエラーが発生しました。" };
};
