import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { searchLawsSchema, handleSearchLaws } from "./tools/searchLaws.js";
import { getLawContentSchema, handleGetLawContent } from "./tools/getLawContent.js";
import { getArticleSchema, handleGetArticle } from "./tools/getArticle.js";
import { searchByKeywordSchema, handleSearchByKeyword } from "./tools/searchByKeyword.js";
import { getLawRevisionsSchema, handleGetLawRevisions } from "./tools/getLawRevisions.js";
import { getTocSchema, handleGetToc } from "./tools/getToc.js";
import { getSectionSchema, handleGetSection } from "./tools/getSection.js";
import { getArticleAtRevisionSchema, handleGetArticleAtRevision } from "./tools/getArticleAtRevision.js";

export function createServer(): McpServer {
  const server = new McpServer({
    name: "law-jp-mcp",
    version: "0.2.0",
  });

  // search_laws — 法令名検索
  server.tool(
    "search_laws",
    `法令名で検索し、法令IDを取得します。略称対応（民法、刑訴法、道交法 等）。
使い方: 法令IDが不明なときにまず呼ぶ。取得したIDは他の全ツールの lawId に使えます。
次のステップ: get_toc で構造確認 → get_section でセクション取得、または get_article で条文取得。`,
    searchLawsSchema.shape,
    async (input) => ({
      content: [{ type: "text", text: await handleSearchLaws(input) }],
    }),
  );

  // get_toc — 目次取得
  server.tool(
    "get_toc",
    `法令の目次（編・章・節の階層構造）を返します。法令名または法令IDを指定。
使い方: 法令の全体構造を把握したいとき、どのセクションを読むか決めたいときに呼ぶ。
次のステップ: 目次で見つけたセクション名を get_section の title に渡して条文を一括取得。`,
    getTocSchema.shape,
    async (input) => ({
      content: [{ type: "text", text: await handleGetToc(input) }],
    }),
  );

  // get_section — 構造単位一括取得
  server.tool(
    "get_section",
    `法令の特定セクション（編・章・節など）の条文を一括取得します。タイトルの部分一致で検索。
使い方: get_toc で確認したセクション名を title に指定。例: get_section("民法", "不法行為")。
複数ヒット時は候補一覧を返すので、より具体的なタイトルで再呼び出し。
重要: 取得した条文を引用する際は、省略や要約をせず原文のまま全文提示すること。`,
    getSectionSchema.shape,
    async (input) => ({
      content: [{ type: "text", text: await handleGetSection(input) }],
    }),
  );

  // get_article — 条文ピンポイント取得
  server.tool(
    "get_article",
    `特定の条文を1条単位で取得します。法令名と条番号を指定（例: lawId="民法", article="709"）。
使い方: 条番号が分かっているときに直接呼ぶ。項番号も指定可。
複数条文が必要なら get_section の方が効率的。
重要: 取得した条文を引用する際は、省略や要約をせず原文のまま全文提示すること。`,
    getArticleSchema.shape,
    async (input) => ({
      content: [{ type: "text", text: await handleGetArticle(input) }],
    }),
  );

  // get_law_content — 法令全文取得
  server.tool(
    "get_law_content",
    `法令の全文を構造化テキストで取得します。小〜中規模の法令向け。
注意: 大きな法令（民法・刑訴法等）は30000文字で切り詰められます。
大きな法令には get_toc → get_section の組み合わせを推奨。
重要: 取得した条文を引用する際は、省略や要約をせず原文のまま全文提示すること。`,
    getLawContentSchema.shape,
    async (input) => ({
      content: [{ type: "text", text: await handleGetLawContent(input) }],
    }),
  );

  // search_by_keyword — キーワード全文検索
  server.tool(
    "search_by_keyword",
    `法令の条文をキーワードで横断検索します。どの法令のどの条文に該当語句があるかを返します。
使い方: 法令名が不明で、条文中の語句から探したいときに呼ぶ。
次のステップ: 見つかった法令IDと条番号を get_article に渡して全文取得。`,
    searchByKeywordSchema.shape,
    async (input) => ({
      content: [{ type: "text", text: await handleSearchByKeyword(input) }],
    }),
  );

  // get_law_revisions — 改正履歴取得
  server.tool(
    "get_law_revisions",
    `法令の改正履歴（改正法名・施行日・リビジョンID）を取得します。
使い方: 改正経緯を調べたいとき、または過去時点の条文を取得する前にリビジョンIDを確認するときに呼ぶ。
次のステップ: リビジョンIDを get_article_at_revision に渡して過去時点の条文を取得。`,
    getLawRevisionsSchema.shape,
    async (input) => ({
      content: [{ type: "text", text: await handleGetLawRevisions(input) }],
    }),
  );

  // get_article_at_revision — 過去時点の条文取得
  server.tool(
    "get_article_at_revision",
    `特定のリビジョン（改正時点）の条文を取得します。改正前後の条文比較に使います。
使い方: get_law_revisions でリビジョンIDを取得 → そのIDと条番号を指定。
現行の条文は get_article で取得し、過去時点をこのツールで取得して比較。
重要: 取得した条文を引用する際は、省略や要約をせず原文のまま全文提示すること。`,
    getArticleAtRevisionSchema.shape,
    async (input) => ({
      content: [{ type: "text", text: await handleGetArticleAtRevision(input) }],
    }),
  );

  return server;
}
