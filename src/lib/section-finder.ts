import type { LawNode } from "./types.js";
import { collectText } from "./law-text-formatter.js";

/** A structural unit found in the law tree. */
export interface SectionMatch {
  node: LawNode;
  title: string;
  path: string; // e.g. "第二編 > 第三章 > 第二節"
}

const STRUCTURAL_TAGS = ["Part", "Chapter", "Section", "Subsection", "Division"];

/**
 * Find structural sections whose title matches the query (partial match).
 * Returns all matches sorted by specificity (exact match first).
 */
export function findSections(root: LawNode, query: string): SectionMatch[] {
  const matches: SectionMatch[] = [];
  const mainProvision = findDeep(root, "MainProvision");
  if (!mainProvision) return matches;

  walkForSections(mainProvision, query, [], matches);

  // Sort: exact match first, then by path depth (more specific first)
  matches.sort((a, b) => {
    const aExact = a.title === query ? 0 : 1;
    const bExact = b.title === query ? 0 : 1;
    if (aExact !== bExact) return aExact - bExact;
    // More specific (deeper) sections first
    const aDepth = a.path.split(" > ").length;
    const bDepth = b.path.split(" > ").length;
    return bDepth - aDepth;
  });

  return matches;
}

function walkForSections(
  node: LawNode,
  query: string,
  pathParts: string[],
  matches: SectionMatch[],
): void {
  for (const child of node.children) {
    if (typeof child === "string") continue;
    if (!STRUCTURAL_TAGS.includes(child.tag)) continue;

    const titleTag = child.tag + "Title";
    const titleNode = findChildByTag(child, titleTag);
    if (!titleNode) continue;

    const rawTitle = collectText(titleNode.children).trim();
    // Strip structural prefix like "第一編　" — keep only the content after the fullwidth space
    const stripped = stripPrefix(rawTitle);
    const currentPath = [...pathParts, rawTitle];

    if (stripped.includes(query) || rawTitle.includes(query)) {
      matches.push({
        node: child,
        title: stripped,
        path: currentPath.join(" > "),
      });
    }

    // Continue searching deeper
    walkForSections(child, query, currentPath, matches);
  }
}

/**
 * Strip structural prefix (e.g. "第一編　" → "総則").
 * Handles both fullwidth space and regular space as separators.
 */
function stripPrefix(title: string): string {
  // Match patterns like "第X編　", "第X章　", "第X節　", "第X款　", "第X目　"
  const match = title.match(/^第[一二三四五六七八九十百千〇\d]+[編章節款目]\s*[　\s]\s*/);
  if (match) return title.slice(match[0].length);
  return title;
}

function findChildByTag(node: LawNode, tag: string): LawNode | undefined {
  for (const child of node.children) {
    if (typeof child !== "string" && child.tag === tag) return child;
  }
  return undefined;
}

function findDeep(node: LawNode, tag: string): LawNode | undefined {
  if (node.tag === tag) return node;
  for (const child of node.children) {
    if (typeof child === "string") continue;
    const found = findDeep(child, tag);
    if (found) return found;
  }
  return undefined;
}
