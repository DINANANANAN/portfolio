export type BotStage =
  | "START"
  | "SEARCH_INDUSTRY"
  | "SEARCH_REGION"
  | "ASK_PRODUCT";

export interface BotState {
  stage: BotStage;
  industry?: string;
  region?: string;
}

export interface Company {
  company: string;
  industry: string;
  region: string;
  monthlyRevenue: number;
  address: string;
}

export type LeadScore =
  | "HOT LEAD (High Priority)"
  | "WARM LEAD (Mid Prospect)"
  | "COLD LEAD (Needs Nurturing)";

export interface FlowResult {
  state: BotState;
  reply?: string;
  productQuestion?: string;
}

export interface ChatMessage {
  role: "user" | "bot";
  text: string;
}

export interface BotApiResponse {
  reply: string;
  state: BotState;
}
