const INDUSTRY_KEYWORDS: Array<[string, string]> = [
  ["factory", "MANUFACTURE"],
  ["factories", "MANUFACTURE"],
  ["manufactur", "MANUFACTURE"],
  ["production", "MANUFACTURE"],
  ["hotel", "HOSPITALITY"],
  ["resort", "HOSPITALITY"],
  ["villa", "HOSPITALITY"],
  ["hospitality", "HOSPITALITY"],
  ["bank", "BANKING"],
  ["finance", "BANKING"],
  ["hospital", "HEALTHCARE"],
  ["clinic", "HEALTHCARE"],
  ["medical", "HEALTHCARE"],
  ["healthcare", "HEALTHCARE"],
  ["school", "EDUCATION"],
  ["university", "EDUCATION"],
  ["campus", "EDUCATION"],
  ["college", "EDUCATION"],
  ["education", "EDUCATION"],
  ["retail", "RETAIL"],
  ["store", "RETAIL"],
  ["shop", "RETAIL"],
  ["mall", "RETAIL"],
  ["restaurant", "F&B"],
  ["cafe", "F&B"],
  ["food", "F&B"],
  ["government", "GOVERNMENT"],
  ["ministry", "GOVERNMENT"],
  ["municipal", "GOVERNMENT"],
];

const REGION_KEYWORDS: Array<[string, string]> = [
  ["jakarta", "JAKARTA"],
  ["jkt", "JAKARTA"],
  ["bandung", "BANDUNG"],
  ["surabaya", "SURABAYA"],
  ["sby", "SURABAYA"],
  ["bali", "BALI"],
  ["denpasar", "BALI"],
  ["yogyakarta", "YOGYAKARTA"],
  ["jogja", "YOGYAKARTA"],
  ["yogya", "YOGYAKARTA"],
];

function detect(text: string, table: Array<[string, string]>): string | null {
  const lower = text.toLowerCase();
  for (const [keyword, canonical] of table) {
    if (lower.includes(keyword)) return canonical;
  }
  return null;
}

export function detectIndustry(text: string): string | null {
  return detect(text, INDUSTRY_KEYWORDS);
}

export function detectRegion(text: string): string | null {
  return detect(text, REGION_KEYWORDS);
}
