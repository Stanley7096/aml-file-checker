import { parseOcrExtraction } from "./ocr-json";
import type { OcrExtraction } from "./checker";

const DEFAULT_API_URL = "https://qianfan.baidubce.com/v2/chat/completions";
const REQUEST_TIMEOUT_MS = 60_000;

type QianfanResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

export async function extractFolderScreenshot(imageDataUrl: string): Promise<OcrExtraction> {
  const apiKey = process.env.QIANFAN_API_KEY;
  const model = process.env.QIANFAN_MODEL;
  const apiUrl = process.env.QIANFAN_API_URL || DEFAULT_API_URL;

  if (!apiKey) {
    throw new Error("未配置 QIANFAN_API_KEY。请先在本地或 Vercel 环境变量中填写千帆 API Key。");
  }

  if (!model) {
    throw new Error("未配置 QIANFAN_MODEL。请填写已开通的 Qianfan-OCR 或视觉 OCR 模型 ID。");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        max_tokens: 2048,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: buildPrompt()
              },
              {
                type: "image_url",
                image_url: {
                  url: imageDataUrl
                }
              }
            ]
          }
        ]
      })
    });

    const payload = (await response.json().catch(() => ({}))) as QianfanResponse;

    if (!response.ok) {
      throw new Error(payload.error?.message || `千帆接口请求失败，HTTP ${response.status}。`);
    }

    const content = payload.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("千帆接口没有返回可用的 OCR 文本。");
    }

    return parseOcrExtraction(content);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("千帆接口请求超时，请稍后重试或检查远程 OCR 服务。");
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function buildPrompt(): string {
  return [
    "你是反洗钱材料截图 OCR 助手。请从这张 Windows 文件夹截图中识别信息。",
    "只提取两类数据：1）地址栏最右侧或当前文件夹的文件夹名；2）列表中每一个文件的文件名、类型、扩展名。",
    "不要判断是否缺文件，不要输出解释。",
    "请严格返回 JSON，不要使用 Markdown 代码块，不要添加额外文字。",
    "JSON 结构如下：",
    '{"folderName":"文件夹名","files":[{"name":"文件名.docx","type":"Windows类型列文本","extension":"docx"}]}',
    "如果某个字段看不清，使用空字符串。"
  ].join("\n");
}
