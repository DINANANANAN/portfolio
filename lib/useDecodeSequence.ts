import { useEffect, useState } from "react";

export type Phrase = { text: string; dir: "ltr" | "rtl" };

export type DecodeDisplay = { text: string; dir: "ltr" | "rtl" };

const POOL =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#%&$@/<>*+=-";

function randGlyph(): string {
  return POOL.charAt(Math.floor(Math.random() * POOL.length));
}

type Options = {
  phrases: Phrase[];
  enabled: boolean;
};

/**
 * Drives a "decode in place" intro: each phrase scrambles then locks into place
 * (left-to-right for LTR text, whole-word for connecting RTL scripts like Arabic),
 * then advances to the next phrase. When `enabled` is false (reduced motion or
 * skipped), it resolves immediately by reporting `done`.
 */
export function useDecodeSequence({ phrases, enabled }: Options): {
  display: DecodeDisplay;
  done: boolean;
} {
  const [display, setDisplay] = useState<DecodeDisplay>({ text: "", dir: "ltr" });
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setDone(true);
      return;
    }
    setDone(false);

    let raf = 0;
    let cancelled = false;
    let phraseIndex = 0;
    let phraseStart = 0;
    let lastPaint = 0;

    const HOLD_SHORT = 260;
    const HOLD_LONG = 700;

    const step = (now: number) => {
      if (cancelled) return;
      if (phraseStart === 0) {
        phraseStart = now;
        lastPaint = 0;
      }

      const phrase = phrases[phraseIndex];
      const chars = Array.from(phrase.text);
      const len = Math.max(chars.length, 1);
      const duration = Math.min(950, 340 + len * 55);
      const elapsed = now - phraseStart;
      const progress = Math.min(1, elapsed / duration);
      const isLast = phraseIndex === phrases.length - 1;
      const hold =
        isLast || phraseIndex >= phrases.length - 2 ? HOLD_LONG : HOLD_SHORT;

      // Repaint at ~25fps while scrambling; always paint the final locked frame.
      if (now - lastPaint >= 40 || progress >= 1) {
        lastPaint = now;
        let text: string;
        if (phrase.dir === "rtl") {
          text = progress < 1 ? chars.map(() => randGlyph()).join("") : phrase.text;
        } else {
          const locked = Math.floor(progress * len);
          text = chars
            .map((c, i) => (c === " " ? " " : i < locked ? c : randGlyph()))
            .join("");
        }
        setDisplay({ text, dir: phrase.dir });
      }

      if (progress >= 1 && elapsed >= duration + hold) {
        if (isLast) {
          setDone(true);
          return;
        }
        phraseIndex += 1;
        phraseStart = 0;
      }
      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [enabled, phrases]);

  return { display, done };
}
