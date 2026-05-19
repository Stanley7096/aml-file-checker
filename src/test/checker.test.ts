import { describe, expect, it } from "vitest";
import { analyzeFiles, buildResultText } from "../lib/checker";

describe("analyzeFiles", () => {
  it("matches the provided reference screenshot case as missing all required AML files", () => {
    const result = analyzeFiles({
      folderName: "5-国新资产-三峡战配核查材料V1-0518",
      files: [
        { name: "1 营业执照-后续提供盖章版.txt", type: "文本文档", extension: "txt" },
        { name: "2 法人等身份正复印件-后续提供盖章版.txt", type: "文本文档", extension: "txt" },
        { name: "3 25年审计报告-后续提供盖章版.txt", type: "文本文档", extension: "txt" },
        { name: "4-11 国新资产-全套材料修订版.docx", type: "Microsoft Word 文档", extension: "docx" },
        { name: "12 战配客户信息表（含反洗钱字段）.xlsx", type: "Microsoft Excel 工作表", extension: "xlsx" },
        { name: "13. 关于符合专业机构投资者的书面说明.docx", type: "Microsoft Word 文档", extension: "docx" }
      ]
    });

    expect(result.folderName).toBe("5-国新资产-三峡战配核查材料V1-0518");
    expect(result.missing).toEqual([
      "经办人身份证",
      "受益所有人身份证",
      "董事、高管和股东名单",
      "投资者基本信息表"
    ]);
    expect(result.resultText).toBe(
      "5-国新资产-三峡战配核查材料V1-0518反馈：\n反洗钱：缺少【经办人身份证、受益所有人身份证、董事、高管和股东名单、投资者基本信息表】的文件"
    );
  });

  it("requires Word or PDF for ID documents", () => {
    const result = analyzeFiles({
      folderName: "身份证格式测试",
      files: [
        { name: "经办人身份证.png", extension: "png" },
        { name: "经办人身份证.docx", extension: "docx" },
        { name: "受益所有人身份证.xlsx", extension: "xlsx" },
        { name: "受益所有人身份证.pdf", extension: "pdf" },
        { name: "董事高管股东名单.xlsx", extension: "xlsx" },
        { name: "投资者基本信息表.doc", extension: "doc" }
      ]
    });

    expect(result.missing).toEqual([]);
    expect(result.resultText).toBe("身份证格式测试反馈：\n反洗钱：通过");
  });

  it("requires Word format for investor basic information form", () => {
    const result = analyzeFiles({
      folderName: "投资者表格式测试",
      files: [
        { name: "经办人身份证.pdf" },
        { name: "受益所有人身份证.doc" },
        { name: "董事、高管和股东名单.pdf" },
        { name: "投资者基本信息表.pdf" }
      ]
    });

    expect(result.missing).toEqual(["投资者基本信息表"]);
  });

  it("handles numbering, spaces, full-width symbols and suffixes", () => {
    const result = analyzeFiles({
      folderName: "命名变体测试",
      files: [
        { name: "01、经办人 身份证（盖章版）.PDF" },
        { name: "02 受益所有人-身份证【扫描】.docx" },
        { name: "03 董事／高管／股东名单（最新版）.xlsx" },
        { name: "04 投资者 基本信息表 （签字版）.DOCX" }
      ]
    });

    expect(result.missing).toEqual([]);
  });
});

describe("buildResultText", () => {
  it("uses a fallback folder name when OCR cannot read the folder", () => {
    expect(buildResultText("", ["经办人身份证"])).toBe(
      "未识别文件夹名反馈：\n反洗钱：缺少【经办人身份证】的文件"
    );
  });
});
