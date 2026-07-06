import type { BotState, FlowResult } from "@/lib/bot/types";
import { detectIndustry, detectRegion } from "@/lib/bot/extract";
import { searchCompanies, formatResults } from "@/lib/bot/search";

export const MENU_TEXT = [
  "*PLN Icon Plus — Sales Assistant*",
  "",
  "Type a number to choose:",
  "1. Search Prospects",
  "2. Ask About Products (AI)",
  "",
  "_This is an interactive demo with sample data._",
].join("\n");

const RESET_WORDS = ["menu", "0", "9", "back", "cancel", "reset"];

export function initialState(): BotState {
  return { stage: "START" };
}

export function handleMessage(rawText: string, state: BotState): FlowResult {
  const text = rawText.trim();
  const lower = text.toLowerCase();

  if (RESET_WORDS.includes(lower)) {
    return { state: { stage: "START" }, reply: MENU_TEXT };
  }

  switch (state.stage) {
    case "START": {
      if (lower === "1") {
        return {
          state: { stage: "SEARCH_INDUSTRY" },
          reply:
            "*Search Prospects*\n\nStep 1: What *industry* are you looking for? (e.g. Hotel, Factory, Bank, Retail)",
        };
      }
      if (lower === "2") {
        return {
          state: { stage: "ASK_PRODUCT" },
          reply:
            "*Ask About Products*\n\nAsk me anything about PLN Icon Plus products (e.g. \"What is IConnet?\").\n\n_(Type menu to go back)_",
        };
      }
      return { state: { stage: "START" }, reply: MENU_TEXT };
    }

    case "SEARCH_INDUSTRY": {
      const industry = detectIndustry(text);
      if (!industry) {
        return {
          state,
          reply:
            "Sorry, I couldn't recognize that industry. Try one of: Hotel, Factory, Bank, Hospital, University, Retail, Restaurant, Government.",
        };
      }
      return {
        state: { stage: "SEARCH_REGION", industry },
        reply: `Industry *${industry}* saved.\n\nStep 2: Which *region/city*? (e.g. Jakarta, Bandung, Surabaya, Bali, Yogyakarta)`,
      };
    }

    case "SEARCH_REGION": {
      const region = detectRegion(text);
      if (!region) {
        return {
          state,
          reply:
            "Sorry, I couldn't recognize that region. Try one of: Jakarta, Bandung, Surabaya, Bali, Yogyakarta.",
        };
      }
      const industry = state.industry ?? "";
      const results = searchCompanies(industry, region);
      return {
        state: { stage: "START" },
        reply: formatResults(industry, region, results),
      };
    }

    case "ASK_PRODUCT": {
      if (!text) {
        return {
          state,
          reply: "Please type a product question, or type *menu* to go back.",
        };
      }
      return { state, productQuestion: text };
    }

    default:
      return { state: { stage: "START" }, reply: MENU_TEXT };
  }
}
