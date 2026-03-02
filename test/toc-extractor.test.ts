import { describe, it, expect } from "vitest";
import { extractToc } from "../src/lib/toc-extractor.js";
import { createMockLawTree, createSmallLawTree } from "./fixtures.js";

describe("extractToc", () => {
  it("extracts TOC from a law with TOC node", () => {
    const tree = createMockLawTree();
    const result = extractToc(tree, "テスト法");

    expect(result).toContain("# テスト法 目次");
    expect(result).toContain("第一章　総則");
    expect(result).toContain("第一条―第三条");
    expect(result).toContain("第二章　雑則");
    expect(result).toContain("第四条・第五条");
  });

  it("does not include TOCLabel text", () => {
    const tree = createMockLawTree();
    const result = extractToc(tree, "テスト法");
    // "目次" label should not appear as a separate line
    const lines = result.split("\n").filter((l) => l.trim() === "目次");
    expect(lines).toHaveLength(0);
  });

  it("falls back to structure scan for laws without TOC", () => {
    const tree = createSmallLawTree();
    const result = extractToc(tree, "小法");

    expect(result).toContain("# 小法 目次");
    expect(result).toContain("編・章・節の構造がありません");
  });
});
