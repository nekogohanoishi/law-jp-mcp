import type { LawNode } from "../src/lib/types.js";

/** Minimal law tree with TOC + MainProvision for testing */
export function createMockLawTree(): LawNode {
  return {
    tag: "Law",
    attr: {},
    children: [
      {
        tag: "LawBody",
        attr: {},
        children: [
          { tag: "LawTitle", attr: {}, children: ["テスト法"] },
          { tag: "LawNum", attr: {}, children: ["令和六年法律第一号"] },
          createMockToc(),
          createMockMainProvision(),
        ],
      },
    ],
  };
}

function createMockToc(): LawNode {
  return {
    tag: "TOC",
    attr: {},
    children: [
      { tag: "TOCLabel", attr: {}, children: ["目次"] },
      {
        tag: "TOCChapter",
        attr: {},
        children: [
          { tag: "TOCChapterTitle", attr: {}, children: ["第一章　総則"] },
          { tag: "ArticleRange", attr: {}, children: ["第一条―第三条"] },
        ],
      },
      {
        tag: "TOCChapter",
        attr: {},
        children: [
          { tag: "TOCChapterTitle", attr: {}, children: ["第二章　雑則"] },
          { tag: "ArticleRange", attr: {}, children: ["第四条・第五条"] },
        ],
      },
    ],
  };
}

function createMockMainProvision(): LawNode {
  return {
    tag: "MainProvision",
    attr: {},
    children: [
      {
        tag: "Chapter",
        attr: { Num: "1" },
        children: [
          { tag: "ChapterTitle", attr: {}, children: ["第一章　総則"] },
          createMockArticle("1", "第一条", "目的", "この法律は、テストの目的で制定する。"),
          createMockArticle("2", "第二条", "定義", "この法律において「テスト」とは、試験をいう。"),
          createMockArticle("3", "第三条", undefined, "テストは適切に行わなければならない。"),
        ],
      },
      {
        tag: "Chapter",
        attr: { Num: "2" },
        children: [
          { tag: "ChapterTitle", attr: {}, children: ["第二章　雑則"] },
          createMockArticle("4", "第四条", "委任", "この法律に定めるもののほか必要な事項は政令で定める。"),
          createMockArticle("5", "第五条", "罰則", "違反した者は処罰する。"),
        ],
      },
    ],
  };
}

function createMockArticle(
  num: string,
  title: string,
  caption: string | undefined,
  text: string,
): LawNode {
  const children: Array<LawNode | string> = [
    { tag: "ArticleTitle", attr: {}, children: [title] },
  ];
  if (caption) {
    children.push({
      tag: "ArticleCaption",
      attr: {},
      children: [`（${caption}）`],
    });
  }
  children.push({
    tag: "Paragraph",
    attr: { Num: "1" },
    children: [
      { tag: "ParagraphNum", attr: {}, children: [] },
      {
        tag: "ParagraphSentence",
        attr: {},
        children: [{ tag: "Sentence", attr: {}, children: [text] }],
      },
    ],
  });

  return {
    tag: "Article",
    attr: { Num: num },
    children,
  };
}

/** Law tree with NO TOC (small law) */
export function createSmallLawTree(): LawNode {
  return {
    tag: "Law",
    attr: {},
    children: [
      {
        tag: "LawBody",
        attr: {},
        children: [
          { tag: "LawTitle", attr: {}, children: ["小法"] },
          {
            tag: "MainProvision",
            attr: {},
            children: [
              createMockArticle("1", "第一条", undefined, "内容"),
            ],
          },
        ],
      },
    ],
  };
}

/** Deep nested law for section-finder testing */
export function createDeepLawTree(): LawNode {
  return {
    tag: "Law",
    attr: {},
    children: [
      {
        tag: "LawBody",
        attr: {},
        children: [
          { tag: "LawTitle", attr: {}, children: ["深層法"] },
          {
            tag: "MainProvision",
            attr: {},
            children: [
              {
                tag: "Part",
                attr: { Num: "1" },
                children: [
                  { tag: "PartTitle", attr: {}, children: ["第一編　総則"] },
                  {
                    tag: "Chapter",
                    attr: { Num: "1" },
                    children: [
                      { tag: "ChapterTitle", attr: {}, children: ["第一章　通則"] },
                      createMockArticle("1", "第一条", undefined, "通則の内容"),
                    ],
                  },
                ],
              },
              {
                tag: "Part",
                attr: { Num: "2" },
                children: [
                  { tag: "PartTitle", attr: {}, children: ["第二編　各論"] },
                  {
                    tag: "Chapter",
                    attr: { Num: "1" },
                    children: [
                      { tag: "ChapterTitle", attr: {}, children: ["第一章　総則"] },
                      createMockArticle("10", "第十条", undefined, "各論総則の内容"),
                    ],
                  },
                  {
                    tag: "Chapter",
                    attr: { Num: "2" },
                    children: [
                      { tag: "ChapterTitle", attr: {}, children: ["第二章　不法行為"] },
                      {
                        tag: "Section",
                        attr: { Num: "1" },
                        children: [
                          { tag: "SectionTitle", attr: {}, children: ["第一節　一般不法行為"] },
                          createMockArticle("20", "第二十条", undefined, "不法行為の内容"),
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
}
