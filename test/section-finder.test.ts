import { describe, it, expect } from "vitest";
import { findSections } from "../src/lib/section-finder.js";
import { createMockLawTree, createDeepLawTree } from "./fixtures.js";

describe("findSections", () => {
  it("finds a section by exact stripped title", () => {
    const tree = createMockLawTree();
    const matches = findSections(tree, "総則");

    expect(matches.length).toBe(1);
    expect(matches[0].title).toBe("総則");
    expect(matches[0].path).toContain("第一章　総則");
  });

  it("finds a section by partial match", () => {
    const tree = createMockLawTree();
    const matches = findSections(tree, "雑");

    expect(matches.length).toBe(1);
    expect(matches[0].title).toBe("雑則");
  });

  it("returns multiple matches for ambiguous query", () => {
    const tree = createDeepLawTree();
    const matches = findSections(tree, "総則");

    // Should match: 第一編　総則, 第一章　総則 (under 各論)
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });

  it("prioritizes exact match", () => {
    const tree = createDeepLawTree();
    const matches = findSections(tree, "不法行為");

    expect(matches.length).toBeGreaterThanOrEqual(1);
    expect(matches[0].title).toBe("不法行為");
  });

  it("returns empty array for no match", () => {
    const tree = createMockLawTree();
    const matches = findSections(tree, "存在しない節");

    expect(matches).toHaveLength(0);
  });

  it("matches sections that contain the query string", () => {
    const tree = createDeepLawTree();
    const matches = findSections(tree, "一般不法行為");

    expect(matches.length).toBe(1);
    expect(matches[0].path).toContain("第一節　一般不法行為");
  });
});
