"use client";

import { useEffect, useRef, useState } from "react";
import { useDecodeSequence, type Phrase } from "@/lib/useDecodeSequence";

const PHRASES: Phrase[] = [
  { text: "Hello", dir: "ltr" },
  { text: "こんにちは", dir: "ltr" },
  { text: "안녕하세요", dir: "ltr" },
  { text: "Halo", dir: "ltr" },
  { text: "مرحبا", dir: "rtl" },
  { text: "my name is", dir: "ltr" },
  { text: "Ferdinan Nathanael", dir: "ltr" },
];

export default function Hero() {
  const [mounted, setMounted] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    setMounted(true);
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  const animating = mounted && !reducedMotion && !skipped;
  const { display, done } = useDecodeSequence({
    phrases: PHRASES,
    enabled: animating,
  });

  const overlayActive = mounted && !reducedMotion && !skipped && !done;
  const heroVisible = !mounted || reducedMotion || skipped || done;

  // Escape skips the intro while it is running.
  useEffect(() => {
    if (!overlayActive) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.repeat) setSkipped(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [overlayActive]);

  // Move focus to the heading once the intro resolves (only if it played).
  useEffect(() => {
    if (mounted && !reducedMotion && (done || skipped)) {
      headingRef.current?.focus();
    }
  }, [mounted, reducedMotion, done, skipped]);

  return (
    <section
      id="top"
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(180,182,190,0.08), transparent 60%)",
        }}
      />

      <div
        className={`relative z-10 transition-opacity duration-1000 ${
          heroVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <p className="font-mono text-xs uppercase tracking-[0.35em] text-accent/80">
          Full-Stack Developer
        </p>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="mt-5 text-4xl font-bold tracking-tight text-ink outline-none sm:text-6xl md:text-7xl"
        >
          Ferdinan Nathanael
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
          I build web, mobile, backend, and automation systems &mdash; focused on
          clean structure, reliable logic, and real-world impact.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <a
            href="#projects"
            className="rounded-md bg-accent px-6 py-3 text-sm font-medium text-bg transition-opacity hover:opacity-90"
          >
            View Work
          </a>
          <a
            href="#contact"
            className="rounded-md border border-line px-6 py-3 text-sm text-ink transition-colors hover:border-accent hover:text-accent"
          >
            Get in Touch
          </a>
        </div>
      </div>

      <a
        href="#about"
        aria-label="Scroll to About section"
        className={`absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-faint transition-opacity duration-1000 ${
          heroVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <span className="block font-mono text-[10px] uppercase tracking-widest">
          scroll
        </span>
        <span aria-hidden className="mt-2 block animate-bounce text-lg">
          &darr;
        </span>
      </a>

      {mounted && !reducedMotion ? (
        <div
          inert={!overlayActive}
          className={`fixed inset-0 z-30 flex items-center justify-center bg-bg transition-opacity duration-700 ${
            overlayActive ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <p
            aria-hidden
            dir={display.dir}
            className="px-6 font-mono text-3xl text-ink sm:text-5xl md:text-6xl"
          >
            {display.text || " "}
          </p>
          <button
            type="button"
            onClick={() => setSkipped(true)}
            aria-label="Skip intro animation"
            className="absolute bottom-8 right-8 rounded-md border border-line px-4 py-2 font-mono text-xs text-muted transition-colors hover:border-accent hover:text-accent"
          >
            Skip intro (Esc)
          </button>
        </div>
      ) : null}
    </section>
  );
}
