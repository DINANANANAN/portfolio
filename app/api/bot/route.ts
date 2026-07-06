import { handleMessage, initialState, MENU_TEXT } from "@/lib/bot/flow";
import { askProduct } from "@/lib/bot/gemini";
import type { BotApiResponse, BotState } from "@/lib/bot/types";

export async function POST(req: Request): Promise<Response> {
  let text = "";
  let state: BotState = initialState();

  try {
    const body = await req.json();
    if (typeof body?.text === "string") text = body.text;
    if (body?.state && typeof body.state.stage === "string") {
      state = body.state as BotState;
    }
  } catch {
    // Malformed body — fall through with defaults (menu).
  }

  const result = handleMessage(text, state);

  let reply: string;
  if (result.productQuestion) {
    const answer = await askProduct(result.productQuestion);
    reply = `*Icon Plus Assistant:*\n${answer}\n\n_(Type menu to go back)_`;
  } else {
    reply = result.reply ?? MENU_TEXT;
  }

  const payload: BotApiResponse = { reply, state: result.state };
  return Response.json(payload);
}
