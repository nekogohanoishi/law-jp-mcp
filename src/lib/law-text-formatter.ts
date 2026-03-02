import type { LawNode } from "./types.js";

/**
 * Convert e-Gov API v2 JSON law tree to LLM-friendly structured text.
 * Produces compact, readable output with indented hierarchy.
 */
export function formatLawText(root: LawNode): string {
  const lines: string[] = [];
  walkNode(root, lines, 0);
  return lines.join("\n");
}

/**
 * Format a subtree (e.g. a Chapter or Section node) as structured text.
 * Reuses the same walkNode logic as formatLawText.
 */
export function formatSubtree(node: LawNode): string {
  const lines: string[] = [];
  walkNode(node, lines, 0);
  return lines.join("\n");
}

function walkNode(node: LawNode | string, lines: string[], depth: number): void {
  if (typeof node === "string") {
    return; // text handled inline by parent
  }

  const { tag, attr, children } = node;

  switch (tag) {
    case "Law":
    case "LawBody":
      walkChildren(children, lines, depth);
      break;

    case "LawNum":
      lines.push(collectText(children));
      lines.push("");
      break;

    case "LawTitle":
      lines.push(`# ${collectText(children)}`);
      lines.push("");
      break;

    case "EnactStatement":
      lines.push(collectText(children));
      break;

    case "TOC":
      // Skip TOC — LLM doesn't need the table of contents
      break;

    case "MainProvision":
    case "SupplProvision":
      if (tag === "SupplProvision") {
        const label = attr.AmendLawNum
          ? `## 附則（${attr.AmendLawNum}）`
          : "## 附則";
        lines.push("");
        lines.push(label);
      }
      walkChildren(children, lines, depth);
      break;

    case "Part":
      formatStructuralUnit(node, lines, "##");
      break;
    case "Chapter":
      formatStructuralUnit(node, lines, "###");
      break;
    case "Section":
      formatStructuralUnit(node, lines, "####");
      break;
    case "Subsection":
      formatStructuralUnit(node, lines, "#####");
      break;
    case "Division":
      formatStructuralUnit(node, lines, "######");
      break;

    case "Article":
      formatArticle(node, lines);
      break;

    case "Paragraph":
      formatParagraph(node, lines);
      break;

    case "Item":
      formatItem(node, lines, "  ");
      break;

    case "Subitem1":
      formatItem(node, lines, "    ");
      break;
    case "Subitem2":
      formatItem(node, lines, "      ");
      break;
    case "Subitem3":
      formatItem(node, lines, "        ");
      break;

    case "SupplProvisionLabel":
      // Already handled by SupplProvision
      break;

    case "ArticleCaption":
    case "ArticleTitle":
    case "ParagraphNum":
    case "ParagraphSentence":
    case "ItemTitle":
    case "ItemSentence":
    case "Subitem1Title":
    case "Subitem1Sentence":
    case "Subitem2Title":
    case "Subitem2Sentence":
    case "Subitem3Title":
    case "Subitem3Sentence":
    case "Sentence":
    case "Column":
      // Inline elements — handled by parent formatters
      break;

    case "PartTitle":
    case "ChapterTitle":
    case "SectionTitle":
    case "SubsectionTitle":
    case "DivisionTitle":
      // Handled by formatStructuralUnit
      break;

    case "AppdxTable":
    case "AppdxTableTitle":
    case "AppdxStyle":
    case "AppdxStyleTitle":
    case "AppdxFig":
    case "AppdxFigTitle":
    case "AppdxNote":
    case "AppdxNoteTitle":
    case "Appdx":
      formatAppendix(node, lines);
      break;

    case "TableStruct":
    case "Table":
    case "TableRow":
    case "TableColumn":
    case "TableHeaderRow":
    case "TableHeaderColumn":
      formatTable(node, lines);
      break;

    case "FigStruct":
    case "Fig":
      lines.push("[図省略]");
      break;

    case "StyleStruct":
    case "Style":
      walkChildren(children, lines, depth);
      break;

    case "List":
      formatList(node, lines, "");
      break;

    case "Sublist1":
      formatList(node, lines, "  ");
      break;

    case "Sublist2":
      formatList(node, lines, "    ");
      break;

    case "Sublist3":
      formatList(node, lines, "      ");
      break;

    case "NoteStruct":
    case "Note":
      lines.push(`（注）${collectText(children)}`);
      break;

    case "Remarks":
    case "RemarksLabel":
      walkChildren(children, lines, depth);
      break;

    case "AmendProvision":
    case "AmendProvisionSentence":
      lines.push(collectText(children));
      break;

    default:
      // Fallback: just collect text content
      const text = collectText(children);
      if (text) lines.push(text);
      break;
  }
}

function walkChildren(children: Array<LawNode | string>, lines: string[], depth: number): void {
  for (const child of children) {
    walkNode(child, lines, depth + 1);
  }
}

function formatStructuralUnit(node: LawNode, lines: string[], heading: string): void {
  // Find title child
  const titleTag = node.tag + "Title";
  const title = findChild(node, titleTag);
  if (title) {
    lines.push("");
    lines.push(`${heading} ${collectText(title.children)}`);
    lines.push("");
  }

  for (const child of node.children) {
    if (typeof child !== "string" && child.tag !== titleTag) {
      walkNode(child, lines, 0);
    }
  }
}

function formatArticle(node: LawNode, lines: string[]): void {
  const caption = findChild(node, "ArticleCaption");
  const title = findChild(node, "ArticleTitle");

  lines.push("");

  // "第七百九条（不法行為による損害賠償）" format
  let header = "";
  if (title) header = collectText(title.children);
  if (caption) header += `　${collectText(caption.children)}`;
  if (header) lines.push(header);

  for (const child of node.children) {
    if (typeof child === "string") continue;
    if (child.tag === "ArticleCaption" || child.tag === "ArticleTitle") continue;
    walkNode(child, lines, 0);
  }
}

function formatParagraph(node: LawNode, lines: string[]): void {
  const num = findChild(node, "ParagraphNum");
  const sentence = findChild(node, "ParagraphSentence");

  const numText = num ? collectText(num.children) : "";

  // Add blank line before paragraphs 2+ for clear separation
  if (numText) {
    lines.push("");
  }

  let text = "";
  if (numText) text = `${numText}　`;
  if (sentence) text += collectText(sentence.children);
  if (text) lines.push(text);

  // Sub-elements (Items, Lists, etc.)
  for (const child of node.children) {
    if (typeof child === "string") continue;
    if (child.tag === "ParagraphNum" || child.tag === "ParagraphSentence") continue;
    walkNode(child, lines, 0);
  }
}

function formatItem(node: LawNode, lines: string[], indent: string): void {
  const titleTag = node.tag + "Title";
  const sentenceTag = node.tag + "Sentence";
  // For Item, tags are ItemTitle/ItemSentence. For Subitem1, Subitem1Title/Subitem1Sentence etc.
  const titleNode = findChild(node, titleTag.replace(/^Subitem(\d)/, "Subitem$1"));
  const sentenceNode = findChild(node, sentenceTag.replace(/^Subitem(\d)/, "Subitem$1"));

  // Fallback: try standard "ItemTitle"/"ItemSentence" for Item
  const actualTitle = titleNode || findChild(node, "ItemTitle");
  const actualSentence = sentenceNode || findChild(node, "ItemSentence");

  let text = indent;
  if (actualTitle) text += collectText(actualTitle.children) + "　";
  if (actualSentence) text += collectText(actualSentence.children);
  if (text.trim()) lines.push(text);

  for (const child of node.children) {
    if (typeof child === "string") continue;
    const ct = child.tag;
    if (ct.endsWith("Title") || ct.endsWith("Sentence")) continue;
    walkNode(child, lines, 0);
  }
}

function formatAppendix(node: LawNode, lines: string[]): void {
  const titleTag = node.tag + "Title";
  const title = findChild(node, titleTag);
  if (title) {
    lines.push("");
    lines.push(`## ${collectText(title.children)}`);
    lines.push("");
  }
  for (const child of node.children) {
    if (typeof child === "string") continue;
    if (child.tag === titleTag) continue;
    walkNode(child, lines, 0);
  }
}

function formatTable(node: LawNode, lines: string[]): void {
  if (node.tag === "TableStruct") {
    const title = findChild(node, "TableStructTitle");
    if (title) lines.push(collectText(title.children));
    const table = findChild(node, "Table");
    if (table) formatTable(table, lines);
    return;
  }
  if (node.tag === "Table") {
    for (const child of node.children) {
      if (typeof child !== "string") formatTable(child, lines);
    }
    return;
  }
  if (node.tag === "TableRow" || node.tag === "TableHeaderRow") {
    const cells: string[] = [];
    for (const child of node.children) {
      if (typeof child !== "string") {
        cells.push(collectText(child.children));
      }
    }
    lines.push("| " + cells.join(" | ") + " |");
    return;
  }
}

function formatList(node: LawNode, lines: string[], indent: string): void {
  for (const child of node.children) {
    if (typeof child === "string") continue;
    if (child.tag === "ListSentence") {
      lines.push(`${indent}${collectText(child.children)}`);
    } else {
      walkNode(child, lines, 0);
    }
  }
}

// --- Helpers ---

function findChild(node: LawNode, tag: string): LawNode | undefined {
  for (const child of node.children) {
    if (typeof child !== "string" && child.tag === tag) return child;
  }
  return undefined;
}

/**
 * Recursively collect all text content from a node tree.
 */
export function collectText(children: Array<LawNode | string>): string {
  let result = "";
  for (const child of children) {
    if (typeof child === "string") {
      result += child;
    } else {
      result += collectText(child.children);
    }
  }
  return result;
}
