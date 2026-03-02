import { z } from "zod";
import { searchByKeyword } from "../lib/api-client.js";

export const searchByKeywordSchema = z.object({
  keyword: z.string().describe("検索キーワード（例: 不法行為、善意取得）"),
  limit: z.number().min(1).max(50).default(10).describe("取得件数（最大50）"),
  offset: z.number().min(0).default(0).describe("オフセット（ページング用）"),
});

export type SearchByKeywordInput = z.infer<typeof searchByKeywordSchema>;

export async function handleSearchByKeyword(input: SearchByKeywordInput): Promise<string> {
  const result = await searchByKeyword(input.keyword, {
    limit: input.limit,
    offset: input.offset,
  });

  if (result.items.length === 0) {
    return `「${input.keyword}」に該当する条文が見つかりませんでした。`;
  }

  const lines: string[] = [
    `キーワード「${input.keyword}」: ${result.total_count}件の法令、${result.sentence_count}件の該当箇所`,
    "",
  ];

  for (const item of result.items) {
    const rev = item.revision_info;
    lines.push(`■ ${rev.law_title}（${item.law_info.law_num}）`);
    lines.push(`  法令ID: ${item.law_info.law_id}`);

    for (const sentence of item.sentences) {
      // Remove HTML span tags from highlighted text
      const cleanText = sentence.text.replace(/<\/?span>/g, "");
      lines.push(`  [${sentence.position}] ${cleanText}`);
    }
    lines.push("");
  }

  if (result.next_offset < result.total_count) {
    lines.push(`次ページ: offset=${result.next_offset} で続きを取得できます`);
  }

  return lines.join("\n");
}
