import type { LawNode } from "./types.js";
import { collectText } from "./law-text-formatter.js";

/**
 * Extract a specific article (条) from a law JSON tree.
 * Supports patterns like "709", "325の3", "9_2" etc.
 */
export function extractArticle(
  root: LawNode,
  articleNum: string,
): { article: LawNode; context: string } | null {
  const normalized = normalizeArticleNum(articleNum);
  const articles = findAllArticles(root);

  for (const art of articles) {
    const num = art.attr.Num || "";
    if (num === normalized) {
      return { article: art, context: buildContext(root, art) };
    }
  }

  return null;
}

/**
 * Extract a specific paragraph (項) from an article.
 */
export function extractParagraph(
  article: LawNode,
  paragraphNum: string,
): LawNode | null {
  for (const child of article.children) {
    if (typeof child === "string") continue;
    if (child.tag === "Paragraph" && child.attr.Num === paragraphNum) {
      return child;
    }
  }
  return null;
}

/**
 * Format a single article node as readable text.
 */
export function formatArticleText(article: LawNode): string {
  const lines: string[] = [];

  const caption = findChild(article, "ArticleCaption");
  const title = findChild(article, "ArticleTitle");

  let header = "";
  if (title) header = collectText(title.children);
  if (caption) header += `　${collectText(caption.children)}`;
  if (header) lines.push(header);

  for (const child of article.children) {
    if (typeof child === "string") continue;
    if (child.tag === "ArticleCaption" || child.tag === "ArticleTitle") continue;
    formatNode(child, lines, "");
  }

  return lines.join("\n");
}

function formatNode(node: LawNode, lines: string[], indent: string): void {
  switch (node.tag) {
    case "Paragraph": {
      const num = findChild(node, "ParagraphNum");
      const sentence = findChild(node, "ParagraphSentence");
      const numText = num ? collectText(num.children) : "";

      // Add blank line before paragraphs 2+ for clear separation
      if (numText) {
        lines.push("");
      }

      let text = indent;
      if (numText) text += `${numText}　`;
      if (sentence) text += collectText(sentence.children);
      if (text.trim()) lines.push(text);

      for (const child of node.children) {
        if (typeof child === "string") continue;
        if (child.tag === "ParagraphNum" || child.tag === "ParagraphSentence") continue;
        formatNode(child, lines, indent);
      }
      break;
    }
    case "Item": {
      const title = findChild(node, "ItemTitle");
      const sentence = findChild(node, "ItemSentence");
      let text = indent + "  ";
      if (title) text += collectText(title.children) + "　";
      if (sentence) text += collectText(sentence.children);
      if (text.trim()) lines.push(text);

      for (const child of node.children) {
        if (typeof child === "string") continue;
        if (child.tag === "ItemTitle" || child.tag === "ItemSentence") continue;
        formatNode(child, lines, indent + "  ");
      }
      break;
    }
    case "Subitem1":
    case "Subitem2":
    case "Subitem3": {
      const deeper = indent + "    ";
      const titleTag = node.tag + "Title";
      const sentenceTag = node.tag + "Sentence";
      const t = findChild(node, titleTag);
      const s = findChild(node, sentenceTag);
      let text = deeper;
      if (t) text += collectText(t.children) + "　";
      if (s) text += collectText(s.children);
      if (text.trim()) lines.push(text);

      for (const child of node.children) {
        if (typeof child === "string") continue;
        if (child.tag.endsWith("Title") || child.tag.endsWith("Sentence")) continue;
        formatNode(child, lines, deeper);
      }
      break;
    }
    default: {
      const text = collectText(node.children);
      if (text.trim()) lines.push(indent + text);
    }
  }
}

/**
 * Normalize user-input article numbers to match API Num attribute.
 * Examples:
 *   "709"      → "709"
 *   "325条の3" → "325_3"
 *   "第9条"    → "9"
 *   "3の2"     → "3_2"
 */
function normalizeArticleNum(input: string): string {
  let s = input
    .replace(/第/g, "")
    .replace(/条/g, "")
    .replace(/\s+/g, "")
    .trim();

  // Convert "の" to "_" (e.g. "325の3" → "325_3")
  s = s.replace(/の/g, "_");

  // Convert fullwidth digits to halfwidth
  s = s.replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0));

  // Convert kanji numbers (一, 二, 三...) to arabic if present
  s = kanjiToArabic(s);

  return s;
}

function kanjiToArabic(s: string): string {
  // If it's already all digits and underscores, return as-is
  if (/^[\d_]+$/.test(s)) return s;

  // Try to convert kanji number
  const kanjiMap: Record<string, number> = {
    〇: 0, 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9,
  };
  const posMap: Record<string, number> = {
    十: 10, 百: 100, 千: 1000,
  };

  // Split by "_" and convert each part
  return s.split("_").map(part => {
    if (/^\d+$/.test(part)) return part;

    let result = 0;
    let current = 0;
    let hasKanji = false;

    for (const ch of part) {
      if (ch in kanjiMap) {
        current = kanjiMap[ch];
        hasKanji = true;
      } else if (ch in posMap) {
        if (current === 0) current = 1;
        result += current * posMap[ch];
        current = 0;
        hasKanji = true;
      }
    }
    result += current;

    return hasKanji ? String(result) : part;
  }).join("_");
}

function findAllArticles(node: LawNode | string): LawNode[] {
  if (typeof node === "string") return [];
  const results: LawNode[] = [];
  if (node.tag === "Article") {
    results.push(node);
    return results;
  }
  for (const child of node.children) {
    results.push(...findAllArticles(child));
  }
  return results;
}

function buildContext(root: LawNode, article: LawNode): string {
  const path: string[] = [];
  findPath(root, article, path);
  return path.join(" > ");
}

function findPath(node: LawNode | string, target: LawNode, path: string[]): boolean {
  if (typeof node === "string") return false;
  if (node === target) return true;

  const titleTags = ["PartTitle", "ChapterTitle", "SectionTitle", "SubsectionTitle", "DivisionTitle"];
  for (const child of node.children) {
    if (typeof child === "string") continue;
    if (findPath(child, target, path)) {
      // Add structural title to path
      for (const tt of titleTags) {
        if (node.tag === tt.replace("Title", "")) {
          const titleNode = findChild(node, tt);
          if (titleNode) {
            path.unshift(collectText(titleNode.children).trim());
          }
          break;
        }
      }
      return true;
    }
  }
  return false;
}

function findChild(node: LawNode, tag: string): LawNode | undefined {
  for (const child of node.children) {
    if (typeof child !== "string" && child.tag === tag) return child;
  }
  return undefined;
}
