"use client";

type NodeProps = { title: string; subtitle?: string };

function Node({ title, subtitle }: NodeProps) {
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2 text-center">
      <p className="text-xs font-semibold text-ink">{title}</p>
      {subtitle ? <p className="mt-0.5 text-[10px] text-faint">{subtitle}</p> : null}
    </div>
  );
}

function Arrow() {
  return <span aria-hidden className="text-faint">→</span>;
}

export default function WorkflowDiagram() {
  return (
    <section className="border-t border-line bg-elevated px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
        How it works
      </p>
      <p className="mt-1 text-xs text-faint">
        The same architecture as the production WhatsApp bot — only the channel,
        model, and data are swapped for this demo.
      </p>

      {/* Pipeline: horizontal on desktop, stacked on mobile */}
      <div className="mt-3 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
        <Node title="You" subtitle="type a message" />
        <div className="hidden sm:block"><Arrow /></div>
        <Node title="ChatWidget" subtitle="React client" />
        <div className="hidden sm:block"><Arrow /></div>
        <Node title="/api/bot" subtitle="serverless route" />
        <div className="hidden sm:block"><Arrow /></div>

        {/* Branch */}
        <div className="flex flex-col gap-2">
          <Node title="State machine" subtitle="search + sample data" />
          <Node title="Gemini API" subtitle="product Q&amp;A" />
        </div>

        <div className="hidden sm:block"><Arrow /></div>
        <Node title="Bot reply" subtitle="rendered in chat" />
      </div>

      <p className="mt-3 text-[10px] text-faint">
        Production bot: WhatsApp (Botika) · Ollama LLM · PostgreSQL. Demo:
        in-browser chat · Google Gemini · bundled sample data.
      </p>
    </section>
  );
}
