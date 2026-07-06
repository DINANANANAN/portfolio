import { describe, it, expect } from "vitest";
import { scoreLead, searchCompanies, formatResults } from "@/lib/bot/search";

describe("scoreLead", () => {
  it("classifies by revenue thresholds", () => {
    expect(scoreLead(5_000_000_000)).toBe("HOT LEAD (High Priority)");
    expect(scoreLead(9_000_000_000)).toBe("HOT LEAD (High Priority)");
    expect(scoreLead(1_000_000_000)).toBe("WARM LEAD (Mid Prospect)");
    expect(scoreLead(2_000_000_000)).toBe("WARM LEAD (Mid Prospect)");
    expect(scoreLead(999_000_000)).toBe("COLD LEAD (Needs Nurturing)");
  });
});

describe("searchCompanies", () => {
  it("returns matching companies sorted by revenue desc, max 5", () => {
    const results = searchCompanies("HOSPITALITY", "BALI");
    expect(results.length).toBeGreaterThan(0);
    expect(results.length).toBeLessThanOrEqual(5);
    for (const r of results) {
      expect(r.industry).toBe("HOSPITALITY");
      expect(r.region).toBe("BALI");
    }
    // sorted descending
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].monthlyRevenue).toBeGreaterThanOrEqual(
        results[i].monthlyRevenue
      );
    }
  });

  it("returns empty array when no match", () => {
    expect(searchCompanies("BANKING", "YOGYAKARTA")).toEqual([]);
  });
});

describe("formatResults", () => {
  it("renders a header and no-data message when empty", () => {
    const text = formatResults("BANKING", "YOGYAKARTA", []);
    expect(text).toContain("BANKING");
    expect(text).toContain("YOGYAKARTA");
    expect(text.toLowerCase()).toContain("no matching");
  });

  it("lists companies with score and formatted revenue", () => {
    const results = searchCompanies("HOSPITALITY", "BALI");
    const text = formatResults("HOSPITALITY", "BALI", results);
    expect(text).toContain(results[0].company);
    expect(text).toContain("LEAD");
    expect(text).toContain("Rp");
  });
});
