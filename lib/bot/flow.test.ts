import { describe, it, expect } from "vitest";
import { handleMessage, initialState, MENU_TEXT } from "@/lib/bot/flow";

describe("handleMessage — menu + reset", () => {
  it("shows the menu on greeting from START", () => {
    const r = handleMessage("hello", initialState());
    expect(r.reply).toBe(MENU_TEXT);
    expect(r.state.stage).toBe("START");
  });

  it("resets to menu on 'menu' from any stage", () => {
    const r = handleMessage("menu", { stage: "ASK_PRODUCT" });
    expect(r.reply).toBe(MENU_TEXT);
    expect(r.state.stage).toBe("START");
  });
});

describe("handleMessage — search flow", () => {
  it("choosing 1 asks for industry", () => {
    const r = handleMessage("1", initialState());
    expect(r.state.stage).toBe("SEARCH_INDUSTRY");
    expect(r.reply?.toLowerCase()).toContain("industry");
  });

  it("valid industry advances to region", () => {
    const r = handleMessage("hotel", { stage: "SEARCH_INDUSTRY" });
    expect(r.state.stage).toBe("SEARCH_REGION");
    expect(r.state.industry).toBe("HOSPITALITY");
    expect(r.reply?.toLowerCase()).toContain("region");
  });

  it("invalid industry stays on the same stage", () => {
    const r = handleMessage("qwerty", { stage: "SEARCH_INDUSTRY" });
    expect(r.state.stage).toBe("SEARCH_INDUSTRY");
    expect(r.reply?.toLowerCase()).toContain("couldn't");
  });

  it("valid region returns results and resets to START", () => {
    const r = handleMessage("bali", {
      stage: "SEARCH_REGION",
      industry: "HOSPITALITY",
    });
    expect(r.state.stage).toBe("START");
    expect(r.reply).toContain("Prospect Analysis");
    expect(r.reply).toContain("HOSPITALITY");
    expect(r.reply).toContain("BALI");
  });

  it("invalid region stays on the same stage", () => {
    const r = handleMessage("atlantis", {
      stage: "SEARCH_REGION",
      industry: "HOSPITALITY",
    });
    expect(r.state.stage).toBe("SEARCH_REGION");
    expect(r.reply?.toLowerCase()).toContain("couldn't");
  });
});

describe("handleMessage — ask product flow", () => {
  it("choosing 2 enters ask-product mode", () => {
    const r = handleMessage("2", initialState());
    expect(r.state.stage).toBe("ASK_PRODUCT");
    expect(r.reply?.toLowerCase()).toContain("product");
    expect(r.productQuestion).toBeUndefined();
  });

  it("a question in ASK_PRODUCT is forwarded as productQuestion", () => {
    const r = handleMessage("What is IConnet?", { stage: "ASK_PRODUCT" });
    expect(r.state.stage).toBe("ASK_PRODUCT");
    expect(r.productQuestion).toBe("What is IConnet?");
    expect(r.reply).toBeUndefined();
  });
});
