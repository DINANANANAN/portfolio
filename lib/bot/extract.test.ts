import { describe, it, expect } from "vitest";
import { detectIndustry, detectRegion } from "@/lib/bot/extract";

describe("detectIndustry", () => {
  it("maps English keywords to canonical industries", () => {
    expect(detectIndustry("I run a hotel")).toBe("HOSPITALITY");
    expect(detectIndustry("looking for factories")).toBe("MANUFACTURE");
    expect(detectIndustry("a bank")).toBe("BANKING");
    expect(detectIndustry("hospital lead")).toBe("HEALTHCARE");
    expect(detectIndustry("university")).toBe("EDUCATION");
    expect(detectIndustry("retail store")).toBe("RETAIL");
    expect(detectIndustry("restaurant")).toBe("F&B");
    expect(detectIndustry("government office")).toBe("GOVERNMENT");
  });

  it("is case-insensitive", () => {
    expect(detectIndustry("HOTEL")).toBe("HOSPITALITY");
  });

  it("returns null when nothing matches", () => {
    expect(detectIndustry("blah blah")).toBeNull();
  });
});

describe("detectRegion", () => {
  it("maps region names and aliases", () => {
    expect(detectRegion("in jakarta")).toBe("JAKARTA");
    expect(detectRegion("jkt please")).toBe("JAKARTA");
    expect(detectRegion("bali")).toBe("BALI");
    expect(detectRegion("surabaya")).toBe("SURABAYA");
    expect(detectRegion("jogja")).toBe("YOGYAKARTA");
  });

  it("returns null when nothing matches", () => {
    expect(detectRegion("nowhere")).toBeNull();
  });
});
