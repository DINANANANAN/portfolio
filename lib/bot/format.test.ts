import { describe, it, expect } from "vitest";
import { parseInline } from "@/lib/bot/format";

describe("parseInline", () => {
  it("returns a single plain segment for plain text", () => {
    expect(parseInline("hello world")).toEqual([
      { text: "hello world" },
    ]);
  });

  it("parses a *bold* span", () => {
    expect(parseInline("*bold*")).toEqual([{ text: "bold", bold: true }]);
  });

  it("parses an _italic_ span", () => {
    expect(parseInline("_italic_")).toEqual([{ text: "italic", italic: true }]);
  });

  it("parses mixed bold and plain text in one line", () => {
    expect(parseInline("Hello *world*, how are you?")).toEqual([
      { text: "Hello " },
      { text: "world", bold: true },
      { text: ", how are you?" },
    ]);
  });

  it("leaves an unmatched lone marker as literal text", () => {
    expect(parseInline("this * has no closing marker")).toEqual([
      { text: "this * has no closing marker" },
    ]);
  });
});
