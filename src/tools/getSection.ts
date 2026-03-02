import { z } from "zod";
import { fetchLawData } from "../lib/api-client.js";
import { resolveLawId } from "../lib/resolve-law-id.js";
import { findSections } from "../lib/section-finder.js";
import { formatSubtree } from "../lib/law-text-formatter.js";
import { wrapLegalText } from "../lib/legal-text-wrapper.js";

export const getSectionSchema = z.object({
  lawId: z
    .string()
    .describe("法令IDまたは法令名（略称可：民法、刑訴法 等）"),
  title: z
    .string()
    .describe("取得したいセクションのタイトル（部分一致。例: 不法行為、公判前整理手続）"),
  maxChars: z
    .number()
    .min(1000)
    .max(100000)
    .default(30000)
    .describe("出力の最大文字数"),
});

export type GetSectionInput = z.infer<typeof getSectionSchema>;

export async function handleGetSection(input: GetSectionInput): Promise<string> {
  const lawId = await resolveLawId(input.lawId);
  const data = await fetchLawData(lawId);
  const lawTitle = data.revision_info.law_title;

  const matches = findSections(data.law_full_text, input.title);

  if (matches.length === 0) {
    return [
      `「${input.title}」に一致するセクションが見つかりませんでした。`,
      "",
      "ヒント: get_toc で目次を確認してから、正確なセクション名を指定してください。",
    ].join("\n");
  }

  // Disambiguation: if multiple matches, check for a single exact match
  if (matches.length > 1) {
    const exactMatches = matches.filter((m) => m.title === input.title);
    if (exactMatches.length === 1) {
      // Single exact match — use it
      matches.splice(0, matches.length, exactMatches[0]);
    } else {
      // Multiple exact matches or no exact match — show disambiguation
      const lines = [
        `「${input.title}」に複数のセクションが一致しました。より具体的なタイトルを指定してください:`,
        "",
      ];
      for (const m of matches) {
        lines.push(`  - "${m.path}"`);
      }
      return lines.join("\n");
    }
  }

  const match = matches[0];
  const legalBody = formatSubtree(match.node);

  const meta = [
    `# ${lawTitle}`,
    `セクション: ${match.path}`,
  ].join("\n");

  const wrapped = meta + "\n\n" + wrapLegalText(legalBody);

  if (wrapped.length > input.maxChars) {
    return (
      wrapped.slice(0, input.maxChars) +
      `\n\n...（${wrapped.length - input.maxChars}文字省略。より小さいセクションを指定するか、maxChars を増やしてください）`
    );
  }

  return wrapped;
}
