"use client";

import {
  AlertTriangle,
  Check,
  Clipboard,
  FileSearch,
  Loader2,
  RotateCcw,
  ShieldCheck,
  UploadCloud
} from "lucide-react";
import { ChangeEvent, DragEvent, useMemo, useRef, useState } from "react";

type CheckItem = {
  id: string;
  label: string;
  requiredFormat: string;
  found: boolean;
};

type AnalyzeResult = {
  folderName: string;
  missing: string[];
  checks: CheckItem[];
  resultText: string;
  fileCount: number;
};

type Status = "idle" | "ready" | "loading" | "success" | "error";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export function AmlChecker() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [error, setError] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const fileMeta = useMemo(() => {
    if (!imageFile) {
      return "等待上传截图";
    }

    return `${imageFile.name} · ${(imageFile.size / 1024 / 1024).toFixed(2)}MB`;
  }, [imageFile]);

  function selectFile(file: File) {
    setCopied(false);
    setResult(null);
    setError("");

    if (!file.type.startsWith("image/")) {
      setStatus("error");
      setError("请上传 PNG、JPG、JPEG 或 WebP 图片。");
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setStatus("error");
      setError("图片超过 10MB，请压缩后再上传。");
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setStatus("ready");
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      selectFile(file);
    }
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      selectFile(file);
    }
  }

  async function analyze() {
    if (!imageFile || status === "loading") {
      return;
    }

    setStatus("loading");
    setError("");
    setCopied(false);

    const formData = new FormData();
    formData.append("image", imageFile);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData
      });

      const payload = (await response.json()) as AnalyzeResult & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "识别失败，请稍后重试。");
      }

      setResult(payload);
      setStatus("success");
    } catch (caught) {
      setStatus("error");
      setError(caught instanceof Error ? caught.message : "识别失败，请稍后重试。");
    }
  }

  async function copyResult() {
    if (!result?.resultText) {
      return;
    }

    await navigator.clipboard.writeText(result.resultText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function reset() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setStatus("idle");
    setImageFile(null);
    setPreviewUrl("");
    setResult(null);
    setError("");
    setCopied(false);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  return (
    <main className="shell">
      <section className="masthead">
        <div className="brand-mark" aria-hidden="true">
          <ShieldCheck size={30} />
        </div>
        <div>
          <p className="eyebrow">AML Screenshot Review</p>
          <h1>反洗钱材料截图核查</h1>
        </div>
        <div className="status-strip" data-status={status}>
          <span>{statusLabel(status)}</span>
        </div>
      </section>

      <section className="workspace">
        <div className="panel upload-panel">
          <div className="panel-head">
            <div>
              <p className="section-kicker">截图输入</p>
              <h2>上传文件夹截图</h2>
            </div>
            <button className="icon-button" type="button" onClick={reset} title="重置">
              <RotateCcw size={18} />
            </button>
          </div>

          <label
            className="dropzone"
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={handleInputChange}
            />
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- Local object URLs cannot be optimized by next/image.
              <img src={previewUrl} alt="上传截图预览" />
            ) : (
              <span className="drop-empty">
                <UploadCloud size={34} />
                <strong>拖入截图或点击选择</strong>
                <small>PNG / JPG / WebP，最大 10MB</small>
              </span>
            )}
          </label>

          <div className="file-row">
            <FileSearch size={18} />
            <span>{fileMeta}</span>
          </div>

          <button
            className="primary-action"
            type="button"
            onClick={analyze}
            disabled={!imageFile || status === "loading"}
          >
            {status === "loading" ? <Loader2 className="spin" size={18} /> : <FileSearch size={18} />}
            开始识别
          </button>
        </div>

        <div className="panel result-panel">
          <div className="panel-head">
            <div>
              <p className="section-kicker">反馈输出</p>
              <h2>可复制结果</h2>
            </div>
            <button
              className="copy-button"
              type="button"
              onClick={copyResult}
              disabled={!result}
              title="复制反馈"
            >
              {copied ? <Check size={18} /> : <Clipboard size={18} />}
              {copied ? "已复制" : "复制"}
            </button>
          </div>

          <pre className="result-box">
            {result?.resultText || "文件夹名反馈：\n反洗钱：等待识别"}
          </pre>

          {error ? (
            <div className="error-box" role="alert">
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
          ) : null}

          {result ? (
            <details className="debug-panel">
              <summary>识别命中状态</summary>
              <div className="debug-grid">
                <span>文件夹</span>
                <strong>{result.folderName || "未识别"}</strong>
                <span>文件数</span>
                <strong>{result.fileCount}</strong>
              </div>
              <ul className="check-list">
                {result.checks.map((item) => (
                  <li key={item.id} data-found={item.found}>
                    <span>{item.found ? <Check size={16} /> : <AlertTriangle size={16} />}</span>
                    <b>{item.label}</b>
                    <small>{item.requiredFormat}</small>
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function statusLabel(status: Status): string {
  switch (status) {
    case "ready":
      return "待识别";
    case "loading":
      return "识别中";
    case "success":
      return "已完成";
    case "error":
      return "需处理";
    default:
      return "空闲";
  }
}
