import { z } from "zod";
import { fetchLawData } from "../lib/api-client.js";
import { extractArticle, extractParagraph, formatArticleText } from "../lib/article-extractor.js";
import { collectText } from "../lib/law-text-formatter.js";
import { wrapLegalText } from "../lib/legal-text-wrapper.js";

export const getArticleAtRevisionSchema = z.object({
  revisionId: z
    .string()
    .describe("リビジョンID（get_law_revisions で取得）"),
  article: z
    .string()
    .describe("条番号（例: 709, 325の3, 第9条）"),
  paragraph: z
    .string()
    .optional()
    .describe("項番号（例: 2）。省略時は条全体を返します。"),
});

export type GetArticleAtRevisionInput = z.infer<typeof getArticleAtRevisionSchema>;

export async function handleGetArticleAtRevision(input: GetArticleAtRevisionInput): Promise<string> {
  const data = await fetchLawData(input.revisionId);

  const result = extractArticle(data.law_full_text, input.article);
  if (!result) {
    return `第${input.article}条が見つかりませんでした（リビジョン: ${input.revisionId}）。この時点では当該条文が存在しない可能性があります。`;
  }

  const meta: string[] = [
    `# ${data.revision_info.law_title}`,
    `リビジョン: ${input.revisionId}`,
    `施行日: ${data.revision_info.amendment_enforcement_date}`,
    `改正法: ${data.revision_info.amendment_law_title}`,
  ];
  if (result.context) {
    meta.push(`位置: ${result.context}`);
  }

  let legalBody: string;
  if (input.paragraph) {
    const para = extractParagraph(result.article, input.paragraph);
    if (!para) {
      return `第${input.article}条 第${input.paragraph}項が見つかりませんでした（リビジョン: ${input.revisionId}）。`;
    }
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
