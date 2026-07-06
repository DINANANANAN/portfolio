"use client";

import { useEffect, useRef, useState } from "react";
import type { BotApiResponse, BotState, ChatMessage } from "@/lib/bot/types";

const MAX_USER_MESSAGES = 20;

const GREETING: ChatMessage = {
  role: "bot",
  text:
    "*PLN Icon Plus — Sales Assistant*\n\nType a number to choose:\n1. Search Prospects\n3. Ask About Products (AI)\n\n_This is an interactive demo with sample data._",
};

export default function ChatWidget({ onClose }: { onClose?: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [state, setState] = useState<BotState>({ stage: "START" });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [userCount, setUserCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, loading]);

  const capped = userCount >= MAX_USER_MESSAGES;

  async function send() {
    const text = input.trim();
    if (!text || loading || capped) return;

    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setUserCount((c) => c + 1);
    setLoading(true);

    try {
      const res = await fetch("/api/bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, state }),
      });
      const data: BotApiResponse = await res.json();
      setState(data.state);
      setMessages((m) => [...m, { role: "bot", text: data.reply }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "bot", text: "Connection error. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-[32rem] w-full max-w-md flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-line bg-elevated px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-ink">Icon Plus Sales Bot</p>
          <p className="text-xs text-faint">Interactive demo · sample data</p>
        </div>
        {onClose ? (
          <button
            onClick={onClose}
            aria-label="Close demo"
            className="rounded-md px-2 py-1 text-muted transition-colors hover:text-ink"
          >
            ✕
          </button>
        ) : null}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
          >
            <div
              className={
                "max-w-[80%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-relaxed " +
                (m.role === "user"
                  ? "bg-accent text-bg"
                  : "border border-line bg-elevated text-ink")
              }
            >
              {m.text}
            </div>
          </div>
        ))}
        {loading ? (
          <div className="flex justify-start">
            <div className="rounded-2xl border border-line bg-elevated px-3 py-2 text-sm text-faint">
              typing…
            </div>
          </div>
        ) : null}
      </div>

      {/* Input */}
      <div className="border-t border-line bg-elevated px-3 py-3">
        {capped ? (
          <p className="px-1 text-center text-xs text-faint">
            Demo message limit reached. Refresh to start a new conversation.
          </p>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex items-center gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message…"
              className="flex-1 rounded-full border border-line bg-surface px-4 py-2 text-sm text-ink outline-none placeholder:text-faint focus:border-accent/50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-bg transition-opacity disabled:opacity-40"
            >
              Send
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
