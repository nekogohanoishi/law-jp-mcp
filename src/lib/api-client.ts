import type {
  LawSearchResult,
  LawDataResult,
  KeywordSearchResult,
  LawRevisionsResult,
} from "./types.js";

const BASE_URL = "https://laws.e-gov.go.jp/api/2";
const USER_AGENT = "law-jp-mcp/0.1.0";

// --- Retry with exponential backoff ---

const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 500;
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);

async function request<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== "") url.searchParams.set(k, v);
    }
  }

  let lastError: Error | undefined;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const delay = INITIAL_DELAY_MS * 2 ** (attempt - 1);
      await new Promise((r) => setTimeout(r, delay));
    }

    try {
      const res = await fetch(url.toString(), {
        headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      });

      if (res.ok) {
        return res.json() as Promise<T>;
      }

      const body = await res.text().catch(() => "");

      if (RETRYABLE_STATUS.has(res.status) && attempt < MAX_RETRIES) {
        lastError = new Error(`e-Gov API error ${res.status}: ${body.slice(0, 200)}`);
        continue;
      }

      // Non-retryable error — throw with actionable message
      throw formatApiError(res.status, body, path);
    } catch (e) {
      if (e instanceof TypeError && attempt < MAX_RETRIES) {
        // Network error (DNS, connection refused, etc.)
        lastError = e;
        continue;
      }
      if (lastError && !(e instanceof Error && e.message.startsWith("e-Gov"))) {
        throw e; // re-throw formatted errors
      }
      throw e;
    }
  }

  throw lastError ?? new Error("e-Gov API: リクエストに失敗しました。");
}

function formatApiError(status: number, body: string, path: string): Error {
  const snippet = body.slice(0, 200);
  switch (status) {
    case 400:
      return new Error(
        `e-Gov API 400 Bad Request: パラメータが不正です。${snippet}\n→ 法令IDやパラメータを確認してください。`,
      );
    case 404:
      return new Error(
        `e-Gov API 404 Not Found: 指定された法令が見つかりません（${path}）。\n→ search_laws で正しい法令IDを検索してください。`,
      );
    case 429:
      return new Error(
        `e-Gov API 429 Too Many Requests: レートリミットに達しました。しばらく待ってから再試行してください。`,
      );
    default:
      return new Error(`e-Gov API error ${status}: ${snippet}`);
  }
}

// --- LRU Cache for law data ---

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const CACHE_MAX_SIZE = 50;
const lawDataCache = new Map<string, CacheEntry<LawDataResult>>();

function getCached<T>(cache: Map<string, CacheEntry<T>>, key: string): T | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiry) {
    cache.delete(key);
    return undefined;
  }
  // Move to end (most recently used)
  cache.delete(key);
  cache.set(key, entry);
  return entry.data;
}

function setCache<T>(cache: Map<string, CacheEntry<T>>, key: string, data: T, maxSize: number): void {
  // Evict oldest if at capacity
  if (cache.size >= maxSize) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, { data, expiry: Date.now() + CACHE_TTL_MS });
}

// --- Public API ---

export async function searchLaws(
  lawTitle: string,
  opts?: { lawType?: string; offset?: number; limit?: number },
): Promise<LawSearchResult> {
  const params: Record<string, string> = { law_title: lawTitle };
  if (opts?.lawType) params.law_type = opts.lawType;
  if (opts?.offset !== undefined) params.offset = String(opts.offset);
  if (opts?.limit !== undefined) params.limit = String(opts.limit);
  return request<LawSearchResult>("/laws", params);
}

export async function fetchLawData(lawIdOrRevisionId: string): Promise<LawDataResult> {
  const cached = getCached(lawDataCache, lawIdOrRevisionId);
  if (cached) return cached;

  const data = await request<LawDataResult>(`/law_data/${encodeURIComponent(lawIdOrRevisionId)}`);
  setCache(lawDataCache, lawIdOrRevisionId, data, CACHE_MAX_SIZE);
  return data;
}

export async function searchByKeyword(
  keyword: string,
  opts?: { lawType?: string; offset?: number; limit?: number },
): Promise<KeywordSearchResult> {
  const params: Record<string, string> = { keyword };
  if (opts?.lawType) params.law_type = opts.lawType;
  if (opts?.offset !== undefined) params.offset = String(opts.offset);
  if (opts?.limit !== undefined) params.limit = String(opts.limit);
  return request<KeywordSearchResult>("/keyword", params);
}

export async function fetchLawRevisions(
  lawId: string,
  opts?: { offset?: number; limit?: number },
): Promise<LawRevisionsResult> {
  const params: Record<string, string> = {};
  if (opts?.offset !== undefined) params.offset = String(opts.offset);
  if (opts?.limit !== undefined) params.limit = String(opts.limit);
  return request<LawRevisionsResult>(`/law_revisions/${encodeURIComponent(lawId)}`, params);
}
