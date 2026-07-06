"use client";

import { useState } from "react";
import ChatWidget from "@/components/ChatWidget";
import WorkflowDiagram from "@/components/WorkflowDiagram";

export default function DemoLauncher({ label = "Try the demo" }: { label?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-md border border-line px-4 py-2 text-sm text-ink transition-colors hover:border-accent hover:text-accent"
      >
        {label} &rarr;
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-bg/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
        >
          <div
            className="my-auto w-full max-w-md overflow-hidden rounded-xl border border-line bg-surface shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <ChatWidget onClose={() => setOpen(false)} />
            <WorkflowDiagram />
          </div>
        </div>
      ) : null}
    </>
  );
}
