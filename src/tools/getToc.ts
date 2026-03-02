import { z } from "zod";
import { fetchLawData } from "../lib/api-client.js";
import { resolveLawId } from "../lib/resolve-law-id.js";
import { extractToc } from "../lib/toc-extractor.js";

export const getTocSchema = z.object({
  lawId: z
    .string()
    .describe("法令IDまたは法令名（略称可：民法、刑訴法 等）"),
});

export type GetTocInput = z.infer<typeof getTocSchema>;

export async function handleGetToc(input: GetTocInput): Promise<string> {
  const lawId = await resolveLawId(input.lawId);
  const data = await fetchLawData(lawId);
  const lawTitle = data.revision_info.law_title;
  const toc = extractToc(data.law_full_text, lawTitle);

  return toc + "\n\nヒント: get_section で特定の編・章・節の条文を一括取得できます。";
}
