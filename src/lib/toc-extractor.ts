import type { LawNode } from "./types.js";
import { collectText } from "./law-text-formatter.js";

/**
 * Extract and format the table of contents from a law JSON tree.
 * Uses the TOC node if present; falls back to scanning structural units.
 */
export function extractToc(root: LawNode, lawTitle: string): string {
  const tocNode = findTocNode(root);
  if (tocNode) {
    return formatTocNode(tocNode, lawTitle);
  }
  // Fallback: build TOC from MainProvision structure
  return formatStructureToc(root, lawTitle);
}

function findTocNode(node: LawNode): LawNode | undefined {
  if (node.tag === "TOC") return node;
  for (const child of node.children) {
    if (typeof child === "string") continue;
    const found = findTocNode(child);
    if (found) return found;
  }
  return undefined;
}

/**
 * Format an actual TOC node from the law tree.
 * TOC children are: TOCLabel, TOCPart, TOCChapter, TOCSection, etc.
 * Each has a *Title child and optionally ArticleRange.
 */
function formatTocNode(toc: LawNode, lawTitle: string): string {
  const lines: string[] = [`# ${lawTitle} 目次`, ""];
  for (const child of toc.children) {
    if (typeof child === "string") continue;
    if (child.tag === "TOCLabel") continue; // skip "目次" label
    formatTocEntry(child, lines, 0);
  }
  return lines.join("\n");
}

function formatTocEntry(node: LawNode, lines: string[], depth: number): void {
  if (typeof node === "string") return;

  const indent = "  ".repeat(depth);

  // Tags like TOCPart, TOCChapter, TOCSection, TOCSubsection, TOCDivision, TOCSupplProvision
  // Each has a *Title child and possibly ArticleRange
  const titleChild = findChildByTagSuffix(node, "Title");
  const rangeChild = findChildByTag(node, "ArticleRange");

  if (titleChild || rangeChild) {
    let text = indent;
    if (titleChild) text += collectText(titleChild.children).trim();
    if (rangeChild) text += `（${collectText(rangeChild.children).trim()}）`;
    if (text.trim()) lines.push(text);
  }

  // Recurse into nested TOC entries
  for (const child of node.children) {
    if (typeof child === "string") continue;
    if (child.tag.startsWith("TOC") && child.tag !== "TOCLabel") {
      formatTocEntry(child, lines, depth + 1);
    }
  }
}

/**
 * Fallback: Build TOC from MainProvision structural units.
 * Used when the law has no TOC node (e.g., small laws).
 */
function formatStructureToc(root: LawNode, lawTitle: string): string {
  const mainProvision = findChildByTag(root, "MainProvision")
    || findDeep(root, "MainProvision");

  if (!mainProvision) {
    return `# ${lawTitle} 目次\n\n（この法令は目次情報を持っていません。get_law_content で全文を取得してください。）`;
  }

  const lines: string[] = [`# ${lawTitle} 目次`, ""];
  const structuralTags = ["Part", "Chapter", "Section", "Subsection", "Division"];

  function walkStructure(node: LawNode, depth: number): void {
    for (const child of node.children) {
      if (typeof child === "string") continue;
      if (structuralTags.includes(child.tag)) {
        const titleTag = child.tag + "Title";
        const titleNode = findChildByTag(child, titleTag);
        if (titleNode) {
          const indent = "  ".repeat(depth);
          lines.push(`${indent}${collectText(titleNode.children).trim()}`);
        }
        walkStructure(child, depth + 1);
      }
    }
  }

  walkStructure(mainProvision, 0);

  if (lines.length <= 2) {
    lines.push("（この法令には編・章・節の構造がありません。get_law_content で全文を取得してください。）");
  }

  return lines.join("\n");
}

function findChildByTag(node: LawNode, tag: string): LawNode | undefined {
  for (const child of node.children) {
    if (typeof child !== "string" && child.tag === tag) return child;
  }
  return undefined;
}

function findChildByTagSuffix(node: LawNode, suffix: string): LawNode | undefined {
  for (const child of node.children) {
    if (typeof child !== "string" && child.tag.endsWith(suffix)) return child;
  }
  return undefined;
}

function findDeep(node: LawNode, tag: string): LawNode | undefined {
  for (const child of node.children) {
    if (typeof child === "string") continue;
    if (child.tag === tag) return child;
    const found = findDeep(child, tag);
    if (found) return found;
  }
  return undefined;
}
