import type { ReactNode } from "react";

export default function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-line bg-elevated px-3 py-1 font-mono text-xs text-muted transition-colors hover:border-accent/50 hover:text-ink">
      {children}
    </span>
  );
}
