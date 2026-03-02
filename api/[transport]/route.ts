import { createMcpHandler } from "mcp-handler";
import { searchLawsSchema, handleSearchLaws } from "../../src/tools/searchLaws.js";
import { getLawContentSchema, handleGetLawContent } from "../../src/tools/getLawContent.js";
import { getArticleSchema, handleGetArticle } from "../../src/tools/getArticle.js";
import { searchByKeywordSchema, handleSearchByKeyword } from "../../src/tools/searchByKeyword.js";
import { getLawRevisionsSchema, handleGetLawRevisions } from "../../src/tools/getLawRevisions.js";
import { getTocSchema, handleGetToc } from "../../src/tools/getToc.js";
import { getSectionSchema, handleGetSection } from "../../src/tools/getSection.js";
import { getArticleAtRevisionSchema, handleGetArticleAtRevision } from "../../src/tools/getArticleAtRevision.js";

const handler = createMcpHandler(
  (server) => {
    server.registerTool("search_laws", {
      title: "法令検索",
      description: `法令名で検索し、法令IDを取得します。略称対応（民法、刑訴法、道交法 等）。
次のステップ: get_toc で構造確認 → get_section でセクション取得、または get_article で条文取得。`,
      inputSchema: searchLawsSchema.shape,
    }, async (input) => ({
      content: [{ type: "text" as const, text: await handleSearchLaws(input) }],
    }));

    server.registerTool("get_toc", {
      title: "目次取得",
      description: `法令の目次（編・章・節の階層構造）を返します。法令名または法令IDを指定。
次のステップ: 目次で見つけたセクション名を get_section の title に渡して条文を一括取得。`,
      inputSchema: getTocSchema.shape,
    }, async (input) => ({
      content: [{ type: "text" as const, text: await handleGetToc(input) }],
    }));

    server.registerTool("get_section", {
      title: "セクション取得",
      description: `法令の特定セクション（編・章・節など）の条文を一括取得します。タイトルの部分一致で検索。
例: get_section("民法", "不法行為") で不法行為の節全体を取得。`,
      inputSchema: getSectionSchema.shape,
    }, async (input) => ({
      content: [{ type: "text" as const, text: await handleGetSection(input) }],
    }));

    server.registerTool("get_article", {
      title: "条文取得",
      description: `特定の条文を1条単位で取得します。法令名と条番号を指定。
複数条文が必要なら get_section の方が効率的。`,
      inputSchema: getArticleSchema.shape,
    }, async (input) => ({
      content: [{ type: "text" as const, text: await handleGetArticle(input) }],
    }));

    server.registerTool("get_law_content", {
      title: "法令全文取得",
      description: `法令の全文を構造化テキストで取得します。小〜中規模の法令向け。
大きな法令には get_toc → get_section の組み合わせを推奨。`,
      inputSchema: getLawContentSchema.shape,
    }, async (input) => ({
      content: [{ type: "text" as const, text: await handleGetLawContent(input) }],
    }));

    server.registerTool("search_by_keyword", {
      title: "キーワード検索",
      description: `法令の条文をキーワードで横断検索します。どの法令のどの条文に該当語句があるかを返します。
次のステップ: 見つかった法令IDと条番号を get_article に渡して全文取得。`,
      inputSchema: searchByKeywordSchema.shape,
    }, async (input) => ({
      content: [{ type: "text" as const, text: await handleSearchByKeyword(input) }],
    }));

    server.registerTool("get_law_revisions", {
      title: "改正履歴",
      description: `法令の改正履歴（改正法名・施行日・リビジョンID）を取得します。
次のステップ: リビジョンIDを get_article_at_revision に渡して過去時点の条文を取得。`,
      inputSchema: getLawRevisionsSchema.shape,
    }, async (input) => ({
      content: [{ type: "text" as const, text: await handleGetLawRevisions(input) }],
    }));

    server.registerTool("get_article_at_revision", {
      title: "過去時点の条文取得",
      description: `特定のリビジョン（改正時点）の条文を取得します。改正前後の条文比較に使います。
get_law_revisions でリビジョンIDを取得してから呼び出し。`,
      inputSchema: getArticleAtRevisionSchema.shape,
    }, async (input) => ({
      content: [{ type: "text" as const, text: await handleGetArticleAtRevision(input) }],
    }));
  },
  {},
  {
    basePath: "/api",
    maxDuration: 60,
  },
);

export { handler as GET, handler as POST };
