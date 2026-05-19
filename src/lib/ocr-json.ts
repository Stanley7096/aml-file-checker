import type { OcrExtraction, OcrFile } from "./checker";

type UnknownRecord = Record<string, unknown>;

export function parseOcrExtraction(content: string): OcrExtraction {
  const parsed = JSON.parse(extractJson(content)) as unknown;

  if (!isRecord(parsed)) {
    throw new Error("OCR 返回的 JSON 不是对象。");
  }

  const folderName = typeof parsed.folderName === "string" ? parsed.folderName : "";
  const files = Array.isArray(parsed.files)
    ? parsed.files.map(toOcrFile).filter((file): file is OcrFile => file !== null)
    : [];

  return {
    folderName: folderName.trim(),
    files
  };
}

function extractJson(content: string): string {
  const trimmed = content.trim();

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return extractJson(fenced[1]);
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  throw new Error("OCR 返回内容中没有可解析的 JSON。");
}

function toOcrFile(value: unknown): OcrFile | null {
  if (typeof value === "string") {
    return { name: value };
  }

  if (!isRecord(value) || typeof value.name !== "string") {
    return null;
  }

  return {
    name: value.name,
    type: typeof value.type === "string" ? value.type : undefined,
    extension: typeof value.extension === "string" ? value.extension : undefined
  };
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
