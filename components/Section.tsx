import type { ReactNode } from "react";

type SectionProps = {
  id: string;
  title: string;
  eyebrow?: string;
  children: ReactNode;
};

export default function Section({
  id,
  title,
  eyebrow,
  children,
}: SectionProps) {
  return (
    <section id={id} className="w-full border-t border-line/70">
      <div className="mx-auto w-full max-w-5xl px-6 py-20 sm:py-24">
        <header className="mb-10 sm:mb-14">
          <h2 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            {title}
          </h2>
          {eyebrow ? (
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
              {eyebrow}
            </p>
          ) : null}
        </header>
        {children}
      </div>
    </section>
  );
}
