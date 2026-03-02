import { describe, it, expect } from "vitest";
import { formatLawText, formatSubtree, collectText } from "../src/lib/law-text-formatter.js";
import { createMockLawTree } from "./fixtures.js";

describe("formatLawText", () => {
  it("formats a full law tree", () => {
    const tree = createMockLawTree();
    const result = formatLawText(tree);

    expect(result).toContain("# テスト法");
    expect(result).toContain("令和六年法律第一号");
    expect(result).toContain("### 第一章　総則");
    expect(result).toContain("第一条");
    expect(result).toContain("テストの目的で制定する");
  });

  it("skips TOC node", () => {
    const tree = createMockLawTree();
    const result = formatLawText(tree);

    // TOC content should not appear in formatted output
    expect(result).not.toContain("第一条―第三条");
  });
});

describe("formatSubtree", () => {
  it("formats a chapter subtree", () => {
    const tree = createMockLawTree();
    // Get the first chapter from MainProvision
    const lawBody = tree.children[0];
    if (typeof lawBody === "string") throw new Error("unexpected");
    const mainProvision = lawBody.children.find(
      (c) => typeof c !== "string" && c.tag === "MainProvision",
    );
    if (!mainProvision || typeof mainProvision === "string") throw new Error("unexpected");
    const chapter = mainProvision.children[0];
    if (typeof chapter === "string") throw new Error("unexpected");

    const result = formatSubtree(chapter);
    expect(result).toContain("### 第一章　総則");
    expect(result).toContain("第一条");
    expect(result).not.toContain("第四条"); // from chapter 2
  });
});

describe("collectText", () => {
  it("collects text from nested nodes", () => {
    const result = collectText([
      "hello",
      { tag: "Span", attr: {}, children: [" world"] },
    ]);
    expect(result).toBe("hello world");
  });

  it("returns empty string for empty children", () => {
    expect(collectText([])).toBe("");
  });
});
