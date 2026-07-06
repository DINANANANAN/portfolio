"use client";

import { useEffect, useRef, useState } from "react";
import { useDecodeSequence, type Phrase } from "@/lib/useDecodeSequence";

const PHRASES: Phrase[] = [
  // Greetings — 10 languages
  { text: "Hello", dir: "ltr" },
  { text: "こんにちは", dir: "ltr" },
  { text: "안녕하세요", dir: "ltr" },
  { text: "Halo", dir: "ltr" },
  { text: "مرحبا", dir: "rtl" },
  { text: "Привет", dir: "ltr" },
  { text: "Salve", dir: "ltr" },
  { text: "Ciao", dir: "ltr" },
  { text: "Hola", dir: "ltr" },
  { text: "Olá", dir: "ltr" },
  // "my name is" — a couple
  { text: "my name is", dir: "ltr" },
  { text: "nama saya", dir: "ltr" },
  // Name — this final phrase morphs into the hero heading below
  { text: "Ferdinan Nathanael", dir: "ltr" },
];

const LAST_PHRASE = PHRASES[PHRASES.length - 1].text;

export default function Hero() {
  const [mounted, setMounted] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const [morphTransform, setMorphTransform] = useState<string | null>(null);
  const [morphDone, setMorphDone] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const introTextRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    setMounted(true);
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  const animating = mounted && !reducedMotion && !skipped;
  const { display, done } = useDecodeSequence({
    phrases: PHRASES,
    enabled: animating,
  });

  // Phases: decoding (opaque overlay) -> morphing (name flies into the heading)
  // -> resolved (real <h1> takes over). Gate on the decode actually reaching the
  // final phrase — the hook also reports done=true before it's enabled, and that
  // stale value would otherwise trigger the morph on mount and hide the intro.
  const decodeComplete = animating && done && display.text === LAST_PHRASE;
  const overlayInteractive = animating && !decodeComplete;
  const morphing = decodeComplete && !morphDone;
  const contentVisible = !animating || decodeComplete; // reveal hero behind the flying name
  const headingVisible = !animating || morphDone; // real <h1> only after handoff

  // Escape skips the intro while it is decoding.
  useEffect(() => {
    if (!overlayInteractive) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.repeat) setSkipped(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [overlayInteractive]);

  // Once the name locks, measure where it sits vs. the real heading and hand the
  // decode text a transform that slides + scales it onto the heading's box. This
  // runs in useEffect (not useLayoutEffect) on purpose: the "at rest" frame must
  // paint first so the browser has a start state to animate the transform from.
  useEffect(() => {
    if (!morphing || morphTransform) return;
    const textEl = introTextRef.current;
    const headingEl = headingRef.current;
    if (!textEl || !headingEl) return;
    const from = textEl.getBoundingClientRect();
    const to = headingEl.getBoundingClientRect();
    const dx = to.left + to.width / 2 - (from.left + from.width / 2);
    const dy = to.top + to.height / 2 - (from.top + from.height / 2);
    const scale = from.height ? to.height / from.height : 1;
    setMorphTransform(`translate(${dx}px, ${dy}px) scale(${scale})`);
  }, [morphing, morphTransform]);

  // Complete the handoff to the real heading once the slide finishes. A timer
  // backs up the transitionend event so the intro always resolves (e.g. if the
  // move distance is ~0 and no transition fires).
  useEffect(() => {
    if (!morphTransform || morphDone) return;
    const t = setTimeout(() => setMorphDone(true), 780);
    return () => clearTimeout(t);
  }, [morphTransform, morphDone]);

  const onIntroTransitionEnd = (e: React.TransitionEvent<HTMLParagraphElement>) => {
    if (e.propertyName === "transform" && morphing) setMorphDone(true);
  };

  // Move focus to the heading once the intro resolves (only if it played).
  useEffect(() => {
    if (mounted && !reducedMotion && (morphDone || skipped)) {
      headingRef.current?.focus({ preventScroll: true });
    }
  }, [mounted, reducedMotion, morphDone, skipped]);

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
        className={`relative z-10 transition-opacity duration-700 ${
          contentVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <p className="font-mono text-xs uppercase tracking-[0.35em] text-accent/80">
          Full-Stack Developer
        </p>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className={`mt-5 text-4xl font-bold tracking-tight text-ink outline-none transition-opacity duration-500 sm:text-6xl md:text-7xl ${
            headingVisible ? "opacity-100" : "opacity-0"
          }`}
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
          contentVisible ? "opacity-100" : "opacity-0"
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
          inert={!overlayInteractive}
          className="fixed inset-0 z-30"
          style={{ pointerEvents: overlayInteractive ? "auto" : "none" }}
        >
          {/* Opaque backdrop — fades away the moment the name starts moving,
              revealing the hero content that the name flies into. */}
          <div
            aria-hidden
            className={`absolute inset-0 bg-bg transition-opacity duration-500 ${
              overlayInteractive ? "opacity-100" : "opacity-0"
            }`}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <p
              ref={introTextRef}
              aria-hidden
              dir={display.dir}
              onTransitionEnd={onIntroTransitionEnd}
              className={`px-6 font-mono text-3xl text-ink sm:text-5xl md:text-6xl ${
                morphDone ? "opacity-0" : "opacity-100"
              }`}
              style={{
                transform: morphTransform ?? "none",
                transformOrigin: "center center",
                transition:
                  "transform 720ms cubic-bezier(0.5, 0, 0.2, 1), opacity 220ms ease",
                willChange: "transform, opacity",
              }}
            >
              {display.text || " "}
            </p>
          </div>
          {overlayInteractive ? (
            <button
              type="button"
              onClick={() => setSkipped(true)}
              aria-label="Skip intro animation"
              className="absolute bottom-8 right-8 rounded-md border border-line px-4 py-2 font-mono text-xs text-muted transition-colors hover:border-accent hover:text-accent"
            >
              Skip intro (Esc)
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
