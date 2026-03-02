import { describe, it, expect, vi } from "vitest";
import { resolveLawId } from "../src/lib/resolve-law-id.js";

// Mock the API client to avoid real network calls
vi.mock("../src/lib/api-client.js", () => ({
  searchLaws: vi.fn().mockResolvedValue({
    total_count: 1,
    count: 1,
    next_offset: 1,
    laws: [
      {
        law_info: { law_id: "MOCK_LAW_ID" },
        revision_info: {},
        current_revision_info: {},
      },
    ],
  }),
}));

describe("resolveLawId", () => {
  it("returns alphanumeric input as-is (looks like a law ID)", async () => {
    const result = await resolveLawId("129AC0000000089");
    expect(result).toBe("129AC0000000089");
  });

  it("resolves known alias to law ID", async () => {
    const result = await resolveLawId("民法");
    expect(result).toBe("129AC0000000089");
  });

  it("resolves abbreviation alias", async () => {
    const result = await resolveLawId("刑訴法");
    expect(result).toBe("323AC0000000131");
  });

  it("falls back to search API for unknown names", async () => {
    const result = await resolveLawId("テスト特別法");
    expect(result).toBe("MOCK_LAW_ID");
  });

  it("treats IDs with underscores as law IDs", async () => {
    const result = await resolveLawId("321CONSTITUTION");
    expect(result).toBe("321CONSTITUTION");
  });
});
