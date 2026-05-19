import { NextResponse } from "next/server";
import { analyzeFiles } from "@/lib/checker";
import { extractFolderScreenshot } from "@/lib/qianfan";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("image");

    if (!(file instanceof File)) {
      return jsonError("请上传一张文件夹截图。", 400);
    }

    if (!file.type.startsWith("image/")) {
      return jsonError("上传文件必须是图片格式。", 400);
    }

    if (file.size > MAX_IMAGE_BYTES) {
      return jsonError("图片超过 10MB，请压缩后再上传。", 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const imageDataUrl = `data:${file.type};base64,${buffer.toString("base64")}`;
    const extraction = await extractFolderScreenshot(imageDataUrl);
    const result = analyzeFiles(extraction);

    return NextResponse.json({
      ...result
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "识别失败，请稍后重试。";
    return jsonError(message, 500);
  }
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}
