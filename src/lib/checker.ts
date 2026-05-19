export type OcrFile = {
  name: string;
  type?: string;
  extension?: string;
};

export type OcrExtraction = {
  folderName: string;
  files: OcrFile[];
};

export type CheckItem = {
  id: string;
  label: string;
  requiredFormat: string;
  found: boolean;
};

export type CheckResult = {
  folderName: string;
  missing: string[];
  checks: CheckItem[];
  resultText: string;
  fileCount: number;
};

const REQUIRED_ITEMS = [
  {
    id: "handler-id",
    label: "经办人身份证",
    requiredFormat: "Word 或 PDF",
    matches: (file: NormalizedFile) =>
      containsAll(file.searchText, ["经办人", "身份证"]) && isWordOrPdf(file)
  },
  {
    id: "beneficial-owner-id",
    label: "受益所有人身份证",
    requiredFormat: "Word 或 PDF",
    matches: (file: NormalizedFile) =>
      containsAll(file.searchText, ["受益所有人", "身份证"]) && isWordOrPdf(file)
  },
  {
    id: "director-executive-shareholder-list",
    label: "董事、高管和股东名单",
    requiredFormat: "不限格式",
    matches: (file: NormalizedFile) =>
      containsAll(file.searchText, ["董事", "高管", "股东", "名单"])
  },
  {
    id: "investor-basic-info-form",
    label: "投资者基本信息表",
    requiredFormat: "Word",
    matches: (file: NormalizedFile) =>
      containsAll(file.searchText, ["投资者", "基本信息表"]) && isWord(file)
  }
] as const;

type NormalizedFile = OcrFile & {
  extensionValue: string;
  searchText: string;
  typeText: string;
};

export function analyzeFiles(extraction: OcrExtraction): CheckResult {
  const normalizedFiles = extraction.files
    .filter((file) => file.name && file.name.trim().length > 0)
    .map(normalizeFile);

  const checks = REQUIRED_ITEMS.map((item) => ({
    id: item.id,
    label: item.label,
    requiredFormat: item.requiredFormat,
    found: normalizedFiles.some(item.matches)
  }));

  const missing = checks.filter((item) => !item.found).map((item) => item.label);
  const folderName = sanitizeFolderName(extraction.folderName);

  return {
    folderName,
    missing,
    checks,
    resultText: buildResultText(folderName, missing),
    fileCount: normalizedFiles.length
  };
}

export function buildResultText(folderName: string, missing: string[]): string {
  const displayName = folderName || "未识别文件夹名";

  if (missing.length === 0) {
    return `${displayName}反馈：\n反洗钱：通过`;
  }

  return `${displayName}反馈：\n反洗钱：缺少【${missing.join("、")}】的文件`;
}

function normalizeFile(file: OcrFile): NormalizedFile {
  const name = file.name.trim();
  const extensionValue = normalizeExtension(file.extension || extractExtension(name));
  const typeText = normalizeText(file.type || "");

  return {
    ...file,
    name,
    extensionValue,
    typeText,
    searchText: normalizeText([name, file.type, file.extension].filter(Boolean).join(" "))
  };
}

function sanitizeFolderName(folderName: string): string {
  return folderName.replace(/^【|】$/g, "").trim();
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[()（）【】\[\]{}《》<>_-]/g, "");
}

function extractExtension(name: string): string {
  const match = name.match(/\.([a-z0-9]+)$/i);
  return match?.[1] || "";
}

function normalizeExtension(extension: string): string {
  return extension.replace(/^\./, "").trim().toLowerCase();
}

function containsAll(text: string, keywords: string[]): boolean {
  return keywords.every((keyword) => text.includes(keyword));
}

function isWord(file: NormalizedFile): boolean {
  if (["doc", "docx"].includes(file.extensionValue)) {
    return true;
  }

  if (file.extensionValue) {
    return false;
  }

  return (
    file.typeText.includes("word") ||
    file.typeText.includes("docx") ||
    file.typeText.includes("doc文档") ||
    file.typeText.includes("microsoftword")
  );
}

function isPdf(file: NormalizedFile): boolean {
  if (file.extensionValue === "pdf") {
    return true;
  }

  if (file.extensionValue) {
    return false;
  }

  return file.typeText.includes("pdf") || file.typeText.includes("便携式文档");
}

function isWordOrPdf(file: NormalizedFile): boolean {
  return isWord(file) || isPdf(file);
}
