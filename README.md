# law-jp-mcp

LLM向けに最適化された日本法令MCPサーバー。[e-Gov法令API v2](https://laws.e-gov.go.jp/api/2/swagger-ui) を使用。

## 特徴

- **LLM最適化テキスト** — JSON法令データを読みやすい構造化テキストに変換
- **条文ピンポイント取得** — 「民法709条」のように条番号を指定して即座に取得
- **略称対応** — 民法、刑訴法、道交法、独禁法 等の略称を自動解決
- **5つのツール** — 検索、全文取得、条文取得、キーワード検索、改正履歴
- **stdio + リモート対応** — ローカル（npx）でもVercel経由でも利用可能

## ツール一覧

| ツール | 概要 |
|--------|------|
| `search_laws` | 法令名検索（略称対応） |
| `get_law_content` | 法令全文の構造化テキスト取得 |
| `get_article` | 条・項のピンポイント取得 |
| `search_by_keyword` | 条文キーワード全文検索 |
| `get_law_revisions` | 改正履歴取得 |

## セットアップ

### Claude Desktop / Claude Code（stdio）

```json
{
  "mcpServers": {
    "law-jp": {
      "command": "npx",
      "args": ["-y", "law-jp-mcp"]
    }
  }
}
```

### ローカルビルド

```bash
git clone https://github.com/yourname/law-jp-mcp.git
cd law-jp-mcp
npm install
npm run build
```

```json
{
  "mcpServers": {
    "law-jp": {
      "command": "node",
      "args": ["/path/to/law-jp-mcp/dist/index.js"]
    }
  }
}
```

### Vercel（リモート）

```bash
vercel deploy
```

Streamable HTTP endpoint: `https://your-app.vercel.app/api/mcp`

## 使用例

```
民法709条を教えて
→ get_article { lawId: "民法", article: "709" }

刑法の傷害罪について
→ search_by_keyword { keyword: "傷害" }

憲法の改正履歴を見たい
→ get_law_revisions { lawId: "憲法" }
```

## 対応略称

民法、刑法、商法、憲法、民訴法、刑訴法、会社法、行訴法、行手法、国賠法、労基法、独禁法、著作権法、特許法、道交法、消契法、金商法 他

## 技術スタック

- TypeScript + `@modelcontextprotocol/sdk`
- `mcp-handler`（Vercel用）
- e-Gov法令API v2（認証不要）

## ライセンス

MIT
