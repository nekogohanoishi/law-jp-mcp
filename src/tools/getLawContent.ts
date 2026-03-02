import { z } from "zod";
import { fetchLawData } from "../lib/api-client.js";
import { formatLawText } from "../lib/law-text-formatter.js";
import { resolveLawId } from "../lib/resolve-law-id.js";
import { wrapLegalText } from "../lib/legal-text-wrapper.js";

export const getLawContentSchema = z.object({
  lawId: z
    .string()
    .describe("法令ID（例: 129AC0000000089）または法令名（略称可：民法、刑法 等）"),
  maxChars: z
    .number()
    .min(1000)
    .max(100000)
    .default(30000)
    .describe("出力の最大文字数。大きな法令では切り詰められます。"),
});

export type GetLawContentInput = z.infer<typeof getLawContentSchema>;

export async function handleGetLawContent(input: GetLawContentInput): Promise<string> {
  const lawId = await resolveLawId(input.lawId);
  const data = await fetchLawData(lawId);
  const legalBody = formatLawText(data.law_full_text);

  const meta = [
    `# ${data.revision_info.law_title}`,
    `法令番号: ${data.law_info.law_num}`,
    `法令ID: ${data.law_info.law_id}`,
    `分類: ${data.revision_info.category}`,
    `施行日: ${data.revision_info.amendment_enforcement_date}`,
  ].join("\n");

  const wrapped = meta + "\n\n" + wrapLegalText(legalBody);

  if (wrapped.length > input.maxChars) {
    return (
      wrapped.slice(0, input.maxChars) +
      `\n\n...（${wrapped.length - input.maxChars}文字省略。get_article で条文を個別取得してください）`
    );
  }

  return wrapped;
}
