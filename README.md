# aml-file-checker

一个用于反洗钱材料截图核查的 Next.js 网站。用户上传 Windows 文件夹截图后，服务端调用千帆视觉 OCR 接口提取文件夹名和文件名，再由本地规则判断是否缺少指定材料，并生成可复制反馈。

## 本地运行

```powershell
npm install
copy .env.example .env.local
npm run dev
```

`.env.local` 需要填写：

```text
QIANFAN_API_KEY=你的千帆 API Key
QIANFAN_MODEL=你开通的 Qianfan-OCR 或视觉 OCR 模型 ID
QIANFAN_API_URL=https://qianfan.baidubce.com/v2/chat/completions
```

## Vercel 部署

在 Vercel Project Settings 的 Environment Variables 中填写：

- `QIANFAN_API_KEY`
- `QIANFAN_MODEL`
- `QIANFAN_API_URL`，不填时默认使用 `https://qianfan.baidubce.com/v2/chat/completions`

API Key 只在 `/api/analyze` 服务端读取，不会发送到浏览器。

## 核查规则

- 经办人身份证：文件名包含“经办人”和“身份证”，格式为 Word 或 PDF。
- 受益所有人身份证：文件名包含“受益所有人”和“身份证”，格式为 Word 或 PDF。
- 董事、高管和股东名单：文件名包含“董事”“高管”“股东”“名单”，不限制格式。
- 投资者基本信息表：文件名包含“投资者”和“基本信息表”，格式为 Word。

输出示例：

```text
5-国新资产-三峡战配核查材料V1-0518反馈：
反洗钱：缺少【经办人身份证、受益所有人身份证、董事、高管和股东名单、投资者基本信息表】的文件
```

全部通过时：

```text
文件夹名反馈：
反洗钱：通过
```

## 验证

```powershell
npm run lint
npm run test
npm run build
```
