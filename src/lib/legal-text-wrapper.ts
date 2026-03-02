/**
 * Wrap legal text with structured markers and metadata
 * to instruct LLMs to quote verbatim without abbreviation.
 */
export function wrapLegalText(legalText: string): string {
  const charCount = legalText.length;
  const lineCount = legalText.split("\n").filter((l) => l.trim()).length;

  return [
    `<legal_text chars="${charCount}" lines="${lineCount}">`,
    legalText,
    `</legal_text>`,
    "",
    `<citation_instruction>`,
    `上記 <legal_text> 内の条文は e-Gov法令APIから取得した公式の法令原文です。`,
    `引用ルール:`,
    `- 条文を引用する際は <legal_text> 内のテキストを一字一句そのまま再現すること`,
    `- 項・号の番号、句読点、括弧書きを含め、いかなる省略・要約・言い換えも禁止`,
    `- 「…」「（略）」「（以下省略）」等による省略は不可`,
    `- 条文が長い場合でも全文を提示すること（ユーザーは正確な条文を必要としている）`,
    `- 条文の解説や説明を加えるのは自由だが、条文自体の引用部分は原文完全一致であること`,
    `</citation_instruction>`,
  ].join("\n");
}
