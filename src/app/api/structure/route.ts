import { NextRequest, NextResponse } from "next/server";
import { GeminiApiError, getLlmClient } from "@/lib/llm";
import type {
  ApiErrorResponse,
  StructureApiRequest,
  StructureApiResponse,
} from "@/types";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
): Promise<NextResponse<StructureApiResponse | ApiErrorResponse>> {
  let body: Partial<StructureApiRequest>;
  try {
    body = (await request.json()) as Partial<StructureApiRequest>;
  } catch {
    return NextResponse.json(
      { error: "リクエストボディがJSONとして解釈できません。" },
      { status: 400 },
    );
  }

  const { mode, text } = body;

  if (mode !== "issue" && mode !== "reflection") {
    return NextResponse.json(
      { error: "modeは'issue'または'reflection'を指定してください。" },
      { status: 400 },
    );
  }

  if (!text || !text.trim()) {
    return NextResponse.json(
      { error: "構造化するテキストが空です。テキストを入力するか、先に文字起こしを実行してください。" },
      { status: 400 },
    );
  }

  const client = getLlmClient();

  try {
    const result = await client.structure({ mode, text });

    if (!result.markdown.trim()) {
      return NextResponse.json(
        { error: "構造化結果が空でした。入力テキストを見直すか、もう一度試してください。" },
        { status: 502 },
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(toErrorResponse(error), { status: 502 });
  }
}

const toErrorResponse = (error: unknown): ApiErrorResponse => {
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
  return { error: "構造化処理中に予期しないエラーが発生しました。" };
};
