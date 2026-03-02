import { z } from "zod";
import { searchLaws } from "../lib/api-client.js";
import { resolveAlias } from "../lib/law-aliases.js";

export const searchLawsSchema = z.object({
  query: z.string().describe("法令名（略称可：民法、刑訴法、道交法 等）"),
  limit: z.number().min(1).max(50).default(10).describe("取得件数（最大50）"),
  offset: z.number().min(0).default(0).describe("オフセット（ページング用）"),
});

export type SearchLawsInput = z.infer<typeof searchLawsSchema>;

export async function handleSearchLaws(input: SearchLawsInput): Promise<string> {
  // Check alias first
  const alias = resolveAlias(input.query);
  if (alias) {
    return [
      `「${input.query}」→「${alias.fullTitle}」`,
      `  法令ID: ${alias.lawId}`,
      "",
      "ヒント: get_law_content で法令本文を取得、get_article で条文をピンポイント取得できます。",
    ].join("\n");
  }

  const result = await searchLaws(input.query, {
    limit: input.limit,
    offset: input.offset,
  });

  if (result.laws.length === 0) {
    return `「${input.query}」に該当する法令が見つかりませんでした。`;
  }

  const lines: string[] = [
    `検索結果: ${result.total_count}件中 ${result.laws.length}件表示`,
    "",
  ];

  for (const law of result.laws) {
    const rev = law.revision_info;
    const info = law.law_info;
    lines.push(`■ ${rev.law_title}`);
    lines.push(`  法令番号: ${info.law_num}`);
    lines.push(`  法令ID: ${info.law_id}`);
    lines.push(`  分類: ${rev.category}`);
    lines.push(`  施行日: ${rev.amendment_enforcement_date}`);
    lines.push(`  状態: ${rev.current_revision_status}`);
    lines.push("");
  }

  if (result.next_offset < result.total_count) {
    lines.push(`次ページ: offset=${result.next_offset} で続きを取得できます`);
  }

  return lines.join("\n");
}
