import { describe, it, expect, vi, afterEach } from "vitest";

vi.mock("@/lib/bot/gemini", () => ({
  askProduct: vi.fn(async () => "IConnet is pure fiber internet."),
}));

import { POST } from "@/app/api/bot/route";

function makeReq(body: unknown): Request {
  return new Request("http://localhost/api/bot", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

afterEach(() => vi.clearAllMocks());

describe("POST /api/bot", () => {
  it("returns the menu for a greeting", async () => {
    const res = await POST(makeReq({ text: "hi", state: { stage: "START" } }));
    const data = await res.json();
    expect(data.reply).toContain("Sales Assistant");
    expect(data.state.stage).toBe("START");
  });

  it("resolves product questions through Gemini", async () => {
    const res = await POST(
      makeReq({ text: "What is IConnet?", state: { stage: "ASK_PRODUCT" } })
    );
    const data = await res.json();
    expect(data.reply).toContain("IConnet is pure fiber internet.");
    expect(data.state.stage).toBe("ASK_PRODUCT");
  });

  it("handles malformed input gracefully", async () => {
    const res = await POST(
      new Request("http://localhost/api/bot", { method: "POST", body: "not json" })
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.reply).toBeTruthy();
  });
});
