import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "反洗钱材料截图核查",
  description: "上传文件夹截图，识别材料清单并生成反洗钱反馈。"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
