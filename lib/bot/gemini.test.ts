import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { askProduct } from "@/lib/bot/gemini";

const OK_BODY = {
  candidates: [{ content: { parts: [{ text: "IConnet is fiber internet." }] } }],
};

describe("askProduct", () => {
  beforeEach(() => {
    process.env.GEMINI_API_KEY = "test-key";
  });
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.GEMINI_API_KEY;
  });

  it("returns the model's text on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => OK_BODY,
      }))
    );
    const answer = await askProduct("What is IConnet?");
    expect(answer).toContain("IConnet is fiber internet.");
  });

  it("returns a fallback when the API errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 500, json: async () => ({}) }))
    );
    const answer = await askProduct("hi");
    expect(answer.toLowerCase()).toContain("having trouble");
  });

  it("returns a fallback when the key is missing", async () => {
    delete process.env.GEMINI_API_KEY;
    const answer = await askProduct("hi");
    expect(answer.toLowerCase()).toContain("having trouble");
  });
});
