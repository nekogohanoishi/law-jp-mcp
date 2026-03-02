import { z } from "zod";
import { fetchLawData } from "../lib/api-client.js";
import { resolveLawId } from "../lib/resolve-law-id.js";
import { extractArticle, extractParagraph, formatArticleText } from "../lib/article-extractor.js";
import { wrapLegalText } from "../lib/legal-text-wrapper.js";

export const getArticleSchema = z.object({
  lawId: z
    .string()
    .describe("法令IDまたは法令名（略称可：民法、刑法 等）"),
  article: z
    .string()
    .describe("条番号（例: 709, 325の3, 第9条）"),
  paragraph: z
    .string()
    .optional()
    .describe("項番号（例: 2）。省略時は条全体を返します。"),
});

export type GetArticleInput = z.infer<typeof getArticleSchema>;

export async function handleGetArticle(input: GetArticleInput): Promise<string> {
  const lawId = await resolveLawId(input.lawId);
  const data = await fetchLawData(lawId);

  const result = extractArticle(data.law_full_text, input.article);
  if (!result) {
    return `第${input.article}条が見つかりませんでした。条番号を確認してください。`;
  }

  const meta: string[] = [
    `# ${data.revision_info.law_title}`,
  ];
  if (result.context) {
    meta.push(`位置: ${result.context}`);
  }

  let legalBody: string;
  if (input.paragraph) {
    const para = extractParagraph(result.article, input.paragraph);
    if (!para) {
      return `第${input.article}条 第${input.paragraph}項が見つかりませんでした。`;
    }
    const { collectText } = await import("../lib/law-text-formatter.js");
    const pNum = findChild(para, "ParagraphNum");
    const pSentence = findChild(para, "ParagraphSentence");
    let text = "";
    if (pNum) {
      const numText = collectText(pNum.children);
      if (numText) text += `${numText}　`;
    }
    if (pSentence) text += collectText(pSentence.children);
    legalBody = text;
  } else {
    legalBody = formatArticleText(result.article);
  }

  return meta.join("\n") + "\n\n" + wrapLegalText(legalBody);
}

function findChild(node: { children: Array<any> }, tag: string): any {
  for (const child of node.children) {
    if (typeof child !== "string" && child.tag === tag) return child;
  }
  return undefined;
}
