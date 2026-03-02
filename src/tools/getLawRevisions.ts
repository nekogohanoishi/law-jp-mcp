import { z } from "zod";
import { fetchLawRevisions } from "../lib/api-client.js";
import { resolveLawId } from "../lib/resolve-law-id.js";

export const getLawRevisionsSchema = z.object({
  lawId: z
    .string()
    .describe("法令IDまたは法令名（略称可：民法、刑法 等）"),
  limit: z.number().min(1).max(50).default(20).describe("取得件数"),
});

export type GetLawRevisionsInput = z.infer<typeof getLawRevisionsSchema>;

export async function handleGetLawRevisions(input: GetLawRevisionsInput): Promise<string> {
  const lawId = await resolveLawId(input.lawId);
  const data = await fetchLawRevisions(lawId, { limit: input.limit });

  if (data.revisions.length === 0) {
    return "改正履歴が見つかりませんでした。";
  }

  const lines: string[] = [
    `# ${data.revisions[0].law_title} 改正履歴`,
    `法令番号: ${data.law_info.law_num}`,
    "",
  ];

  for (const rev of data.revisions) {
    const status = rev.current_revision_status === "CurrentEnforced"
      ? "【現行】"
      : rev.current_revision_status === "UnEnforced"
        ? "【未施行】"
        : "";
    lines.push(`${status} 施行日: ${rev.amendment_enforcement_date}`);
    lines.push(`  改正法: ${rev.amendment_law_title}`);
    lines.push(`  改正法令番号: ${rev.amendment_law_num}`);
    lines.push(`  リビジョンID: ${rev.law_revision_id}`);
    lines.push("");
  }

  return lines.join("\n");
}

