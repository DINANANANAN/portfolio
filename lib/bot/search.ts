import type { Company, LeadScore } from "@/lib/bot/types";
import companiesData from "@/data/bot-companies.json";

const COMPANIES = companiesData as Company[];

export function scoreLead(monthlyRevenue: number): LeadScore {
  if (monthlyRevenue >= 5_000_000_000) return "HOT LEAD (High Priority)";
  if (monthlyRevenue >= 1_000_000_000) return "WARM LEAD (Mid Prospect)";
  return "COLD LEAD (Needs Nurturing)";
}

export function searchCompanies(industry: string, region: string): Company[] {
  return COMPANIES.filter(
    (c) => c.industry === industry && c.region === region
  )
    .sort((a, b) => b.monthlyRevenue - a.monthlyRevenue)
    .slice(0, 5);
}

function formatRevenue(value: number): string {
  // Group thousands with dots, matching the production bot's rendering.
  return "Rp " + value.toLocaleString("de-DE");
}

export function formatResults(
  industry: string,
  region: string,
  results: Company[]
): string {
  const lines: string[] = [
    `*Prospect Analysis — ${industry} in ${region}*`,
  ];

  if (results.length === 0) {
    lines.push("");
    lines.push("No matching prospects found for that combination.");
  } else {
    results.forEach((row, i) => {
      lines.push("");
      lines.push(`${i + 1}. *${row.company}*`);
      lines.push(`   Location: ${row.address}`);
      lines.push(`   Revenue: ${formatRevenue(row.monthlyRevenue)}`);
      lines.push(`   Status: *${scoreLead(row.monthlyRevenue)}*`);
    });
  }

  lines.push("");
  lines.push("_(Type menu to start over)_");
  return lines.join("\n");
}
