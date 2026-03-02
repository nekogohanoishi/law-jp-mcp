import { searchLaws } from "./api-client.js";
import { resolveAlias } from "./law-aliases.js";

/**
 * Resolve a user-supplied string (law name, alias, or ID) to a law_id.
 */
export async function resolveLawId(input: string): Promise<string> {
  // If it looks like a law ID (alphanumeric + underscore), use directly
  if (/^[A-Z0-9_]+$/i.test(input)) return input;

  // Check alias dictionary
  const alias = resolveAlias(input);
  if (alias) return alias.lawId;

  // Fall back to search API
  const result = await searchLaws(input, { limit: 1 });
  if (result.laws.length === 0) {
    throw new Error(`「${input}」に該当する法令が見つかりませんでした。`);
  }
  return result.laws[0].law_info.law_id;
}
