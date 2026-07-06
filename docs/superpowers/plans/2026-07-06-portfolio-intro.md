# Portfolio Intro Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Next.js portfolio whose landing is a cinematic decode-in-place intro (multilingual "hello" flurry → "my name is Ferdinan Nathanael" → resolves into a hero) over a single-page Work/About/Contact shell, deployable free to Vercel.

**Architecture:** A server-rendered page (hero + section shells) is always present; a client `IntroOverlay` layers a canvas glyph field + a DOM decode word on top and fades to reveal the hero at the end. All timing/logic lives in **pure, unit-tested modules** (`rng`, `segment`, `timing`, `decode`, `introMachine`); React hooks/components wire them to rAF, matchMedia, and localStorage. Approach B: canvas for the ambient field, DOM text (aria-hidden) for the decode word.

**Tech Stack:** Next.js 15 (App Router) + React 19 + TypeScript 5. Vitest 2 + React Testing Library 16 + jsdom. No animation library (CSS/WAAPI only). Deploy: Vercel.

## Global Constraints

Every task's requirements implicitly include these (copied from the spec):

- **Stack:** Next.js App Router + React + TypeScript. No animation library — CSS transitions/`@keyframes`/WAAPI only (no framer-motion).
- **Palette (minimal mono):** background `#0a0a0a`; noise glyphs dim grey; resolved word/hero bright white; no color/glow/scanlines.
- **Name never translated:** "Ferdinan Nathanael" stays in Latin script inside every sentence.
- **`languages[0]` is English** and is the language the hero resolves to.
- **Time-driven, not frame-driven:** all pacing uses accumulated *active* elapsed ms (paused when tab hidden / reduced-motion), never frame counts.
- **Decode nodes are `aria-hidden="true"`** for their entire lifetime; never `aria-live`. The accessible/indexable text is the server-rendered hero + sections.
- **Skip = Escape key OR the Skip button (Enter/Space)** only. Never Tab/arrows/modifier keys/key-repeat. Click-to-skip only on the decorative canvas layer, never controls/text, and not during a text selection.
- **Reduced motion is mandatory:** on `prefers-reduced-motion: reduce`, never create the rAF loop or scramble; render the static English hero; only an ≤200ms opacity crossfade allowed; subscribe live.
- **Contrast:** center word ≥4.5:1 against its real local background (suppressed cells / backing plate); all functional controls ≥4.5:1 text (≥3:1 large) and ≥3:1 controls/focus rings; only the decorative field is exempt.
- **Canvas budgets:** pre-rendered glyph atlas + `drawImage` (never per-cell `fillText`) is the target; cell cap ~2000–2500 desktop / ~800–1200 mobile; ~24–30fps desktop / ~20–24fps mobile via a time accumulator; DPR `min(dpr,2)`, cap ~1.5 on touch; dirty-rect updates (never full `clearRect`); teardown on HERO.
- **Curated subsets:** hello = `['ru','ar','hi','ja','en']`; name = `['id','ja','en']`. Full 9-language set lives in `lib/languages.ts`.
- **Connecting scripts (Arabic):** decode as a whole word (crossfade), never per-letter.

---

### Task 1: Project scaffold + test harness

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.mjs`, `next-env.d.ts`, `vitest.config.ts`, `vitest.setup.ts`
- Create: `app/layout.tsx`, `app/globals.css`, `app/page.tsx`
- Create: `src/lib/smoke.ts`
- Test: `src/lib/smoke.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: a working Next.js + Vitest project. `npm test` runs jsdom tests; `npm run build` compiles; `npm run dev` serves. Import alias `@/*` → repo root.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "portfolio",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "next": "^15.1.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.0",
    "@testing-library/react": "^16.1.0",
    "@testing-library/user-event": "^14.5.0",
    "@types/node": "^22.10.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "jsdom": "^25.0.0",
    "typescript": "^5.7.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "ES2020"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create `next.config.mjs` and `next-env.d.ts`**

`next.config.mjs`:
```js
/** @type {import('next').NextConfig} */
const nextConfig = {};
export default nextConfig;
```

`next-env.d.ts`:
```ts
/// <reference types="next" />
/// <reference types="next/image-types/global" />
```

- [ ] **Step 4: Create `vitest.config.ts` and `vitest.setup.ts`**

`vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
});
```

`vitest.setup.ts` (jest-dom matchers + a default matchMedia mock so components don't throw):
```ts
import '@testing-library/jest-dom/vitest';

// jsdom has no matchMedia; default to "no reduced motion". Tests override as needed.
if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}
```

- [ ] **Step 5: Create minimal app files**

`app/globals.css`:
```css
:root { color-scheme: dark; }
html, body { margin: 0; padding: 0; background: #0a0a0a; color: #fff; }
body { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
```

`app/layout.tsx`:
```tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Ferdinan Nathanael — Full-Stack Developer',
  description: 'Portfolio of Ferdinan Nathanael, Full-Stack Developer.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

`app/page.tsx`:
```tsx
export default function Page() {
  return <main>Ferdinan Nathanael</main>;
}
```

- [ ] **Step 6: Write the smoke module + failing test**

`src/lib/smoke.ts`:
```ts
export function greeting(): string {
  return 'ok';
}
```

`src/lib/smoke.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { greeting } from './smoke';

describe('smoke', () => {
  it('runs the test harness', () => {
    expect(greeting()).toBe('ok');
  });
});
```

- [ ] **Step 7: Install deps and run the test**

Run: `npm install`
Then: `npm test`
Expected: 1 passing test (`smoke > runs the test harness`).

- [ ] **Step 8: Verify the build compiles**

Run: `npm run build`
Expected: build succeeds (a minimal page compiled). If it fails, fix config before proceeding.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: scaffold next.js + vitest project"
```

---

### Task 2: Seedable RNG (`lib/rng.ts`)

**Files:**
- Create: `src/lib/rng.ts`
- Test: `src/lib/rng.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `type Rng = () => number` (returns float in `[0,1)`); `makeRng(seed: number): Rng`. Deterministic for a given seed.

- [ ] **Step 1: Write the failing test**

`src/lib/rng.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { makeRng } from './rng';

describe('makeRng', () => {
  it('is deterministic for a given seed', () => {
    const a = makeRng(42);
    const b = makeRng(42);
    const seqA = [a(), a(), a()];
    const seqB = [b(), b(), b()];
    expect(seqA).toEqual(seqB);
  });

  it('returns floats in [0, 1)', () => {
    const r = makeRng(7);
    for (let i = 0; i < 100; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('differs across seeds', () => {
    expect(makeRng(1)()).not.toBe(makeRng(2)());
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- rng`
Expected: FAIL (`makeRng` not exported).

- [ ] **Step 3: Implement `src/lib/rng.ts` (mulberry32)**

```ts
export type Rng = () => number;

/** mulberry32 — small, fast, deterministic PRNG. */
export function makeRng(seed: number): Rng {
  let a = seed >>> 0;
  return function next(): number {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- rng`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/rng.ts src/lib/rng.test.ts
git commit -m "feat: seedable mulberry32 rng"
```

---

### Task 3: Grapheme segmentation (`lib/segment.ts`)

**Files:**
- Create: `src/lib/segment.ts`
- Test: `src/lib/segment.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `segment(str: string): string[]` — splits into grapheme clusters via `Intl.Segmenter` (grapheme granularity), falling back to `Array.from` when unavailable.

- [ ] **Step 1: Write the failing test**

`src/lib/segment.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { segment } from './segment';

describe('segment', () => {
  it('splits plain ASCII into characters', () => {
    expect(segment('Hello')).toEqual(['H', 'e', 'l', 'l', 'o']);
  });

  it('keeps a Devanagari cluster round-tripping with no empty parts', () => {
    const parts = segment('नमस्ते');
    expect(parts.length).toBeGreaterThan(0);
    expect(parts.join('')).toBe('नमस्ते');
    expect(parts.every((p) => p.length > 0)).toBe(true);
  });

  it('round-trips CJK', () => {
    expect(segment('你好').join('')).toBe('你好');
    expect(segment('你好')).toHaveLength(2);
  });

  it('round-trips an RTL string', () => {
    expect(segment('مرحبا').join('')).toBe('مرحبا');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- segment`
Expected: FAIL (`segment` not exported).

- [ ] **Step 3: Implement `src/lib/segment.ts`**

```ts
/**
 * Split a string into grapheme clusters. Uses Intl.Segmenter (grapheme
 * granularity) when available; otherwise falls back to code-point split
 * (Array.from), which is a degraded path for Indic/RTL but never throws.
 */
export function segment(str: string): string[] {
  const Seg = (Intl as unknown as { Segmenter?: typeof Intl.Segmenter }).Segmenter;
  if (typeof Seg === 'function') {
    const seg = new Seg(undefined, { granularity: 'grapheme' });
    return Array.from(seg.segment(str), (s) => s.segment);
  }
  return Array.from(str);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- segment`
Expected: PASS (4 tests). (Node ships `Intl.Segmenter`, so the primary path runs.)

- [ ] **Step 5: Commit**

```bash
git add src/lib/segment.ts src/lib/segment.test.ts
git commit -m "feat: grapheme segmentation helper"
```

---

### Task 4: Language data + curated subsets (`lib/languages.ts`)

**Files:**
- Create: `src/lib/languages.ts`
- Test: `src/lib/languages.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `type LangEntry = { code: string; label: string; hello: string; intro: string; dir?: 'ltr' | 'rtl'; connecting?: boolean }`
  - `const LANGUAGES: LangEntry[]` (9 entries, English first)
  - `const HELLO_CODES: string[]` = `['ru','ar','hi','ja','en']`
  - `const NAME_CODES: string[]` = `['id','ja','en']`
  - `byCode(code: string): LangEntry` (throws on unknown code)

- [ ] **Step 1: Write the failing test**

`src/lib/languages.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { LANGUAGES, HELLO_CODES, NAME_CODES, byCode } from './languages';

describe('languages', () => {
  it('has English first (the resolved language)', () => {
    expect(LANGUAGES[0].code).toBe('en');
    expect(LANGUAGES[0].intro).toBe('My name is Ferdinan Nathanael');
  });

  it('keeps the name in Latin script in every intro', () => {
    for (const l of LANGUAGES) {
      expect(l.intro).toContain('Ferdinan Nathanael');
    }
  });

  it('marks Arabic as rtl + connecting', () => {
    const ar = byCode('ar');
    expect(ar.dir).toBe('rtl');
    expect(ar.connecting).toBe(true);
  });

  it('uses the corrected Korean copula (no space before 입니다)', () => {
    expect(byCode('ko').intro).toBe('제 이름은 Ferdinan Nathanael입니다');
  });

  it('subset codes all resolve to real entries', () => {
    for (const code of [...HELLO_CODES, ...NAME_CODES]) {
      expect(byCode(code).code).toBe(code);
    }
  });

  it('byCode throws on an unknown code', () => {
    expect(() => byCode('xx')).toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- languages`
Expected: FAIL (module not found / exports missing).

- [ ] **Step 3: Implement `src/lib/languages.ts`**

```ts
export type LangEntry = {
  code: string;
  label: string;
  hello: string;
  intro: string;
  dir?: 'ltr' | 'rtl';
  connecting?: boolean;
};

export const LANGUAGES: LangEntry[] = [
  { code: 'en', label: 'English', hello: 'Hello', intro: 'My name is Ferdinan Nathanael' },
  { code: 'id', label: 'Indonesian', hello: 'Halo', intro: 'Nama saya Ferdinan Nathanael' },
  { code: 'ja', label: 'Japanese', hello: 'こんにちは', intro: '私の名前は Ferdinan Nathanael です' },
  { code: 'ko', label: 'Korean', hello: '안녕하세요', intro: '제 이름은 Ferdinan Nathanael입니다' },
  { code: 'zh', label: 'Chinese', hello: '你好', intro: '我叫 Ferdinan Nathanael' },
  { code: 'hi', label: 'Hindi', hello: 'नमस्ते', intro: 'मेरा नाम Ferdinan Nathanael है' },
  { code: 'ar', label: 'Arabic', hello: 'مرحبا', intro: 'اسمي Ferdinan Nathanael', dir: 'rtl', connecting: true },
  { code: 'ru', label: 'Russian', hello: 'Привет', intro: 'Меня зовут Ferdinan Nathanael' },
  { code: 'fr', label: 'French', hello: 'Bonjour', intro: "Je m'appelle Ferdinan Nathanael" },
];

/** Hello flurry order (max script contrast, ends English). */
export const HELLO_CODES: string[] = ['ru', 'ar', 'hi', 'ja', 'en'];

/** Name cycle order (ends English, slow resolve). */
export const NAME_CODES: string[] = ['id', 'ja', 'en'];

export function byCode(code: string): LangEntry {
  const entry = LANGUAGES.find((l) => l.code === code);
  if (!entry) throw new Error(`Unknown language code: ${code}`);
  return entry;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- languages`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/languages.ts src/lib/languages.test.ts
git commit -m "feat: language data + curated subsets"
```

---

### Task 5: Timing constants + lock schedule (`lib/timing.ts`)

**Files:**
- Create: `src/lib/timing.ts`
- Test: `src/lib/timing.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `type Cadence = { stepStartMs: number; stepEndMs: number }`
  - `const TIMING` (object of phase durations; see code)
  - `const HELLO_CADENCE: Cadence`, `const NAME_CADENCE: Cadence`
  - `lockTimes(n: number, c: Cadence): number[]` — cumulative per-slot lock times (monotonic increasing, length `n`)
  - `wordDurationMs(n: number, c: Cadence): number` — total time to fully lock an `n`-grapheme word (`= last lockTime`, `0` when `n<=0`)

- [ ] **Step 1: Write the failing test**

`src/lib/timing.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { lockTimes, wordDurationMs, HELLO_CADENCE, NAME_CADENCE, TIMING } from './timing';

describe('timing', () => {
  it('lockTimes are strictly increasing (left-to-right wave)', () => {
    const lt = lockTimes(6, NAME_CADENCE);
    expect(lt).toHaveLength(6);
    for (let i = 1; i < lt.length; i++) {
      expect(lt[i]).toBeGreaterThan(lt[i - 1]);
    }
  });

  it('handles n=1 and n=0', () => {
    expect(lockTimes(1, HELLO_CADENCE)).toHaveLength(1);
    expect(lockTimes(0, HELLO_CADENCE)).toEqual([]);
    expect(wordDurationMs(0, HELLO_CADENCE)).toBe(0);
  });

  it('a long word (name) locks within the ~1.4-1.8s budget', () => {
    // "My name is Ferdinan Nathanael" ~= 29 graphemes
    const d = wordDurationMs(29, NAME_CADENCE);
    expect(d).toBeGreaterThan(600);
    expect(d).toBeLessThan(2200);
  });

  it('exposes phase durations', () => {
    expect(TIMING.noiseInMs).toBeGreaterThan(0);
    expect(TIMING.settleMs).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- timing`
Expected: FAIL (exports missing).

- [ ] **Step 3: Implement `src/lib/timing.ts`**

```ts
export type Cadence = { stepStartMs: number; stepEndMs: number };

export const TIMING = {
  noiseInMs: 800,
  firstHelloDelayMs: 500,
  helloHoldMs: 220,
  nameHoldMs: 400,
  transitionMs: 120,
  settleMs: 900,
  reducedCrossfadeMs: 200,
  returningFadeMs: 400,
  fieldFpsDesktop: 28,
  fieldFpsMobile: 22,
} as const;

// Short words land fast; the name uses a slightly slower start.
export const HELLO_CADENCE: Cadence = { stepStartMs: 44, stepEndMs: 22 };
export const NAME_CADENCE: Cadence = { stepStartMs: 55, stepEndMs: 20 };

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Cumulative lock time (ms) for each of `n` slots. Step duration accelerates
 * from stepStartMs to stepEndMs across the word so the reveal reads as a wave
 * that speeds up. Returns a strictly-increasing array of length n.
 */
export function lockTimes(n: number, c: Cadence): number[] {
  const out: number[] = [];
  let acc = 0;
  for (let i = 0; i < n; i++) {
    const t = n <= 1 ? 0 : i / (n - 1);
    const step = lerp(c.stepStartMs, c.stepEndMs, t);
    acc += step;
    out.push(acc);
  }
  return out;
}

export function wordDurationMs(n: number, c: Cadence): number {
  if (n <= 0) return 0;
  const lt = lockTimes(n, c);
  return lt[lt.length - 1];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- timing`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/timing.ts src/lib/timing.test.ts
git commit -m "feat: timing constants + accelerating lock schedule"
```

---

### Task 6: Pure decode frame (`lib/decode.ts`)

**Files:**
- Create: `src/lib/decode.ts`
- Test: `src/lib/decode.test.ts`

**Interfaces:**
- Consumes: `Rng` (Task 2); `Cadence`, `lockTimes`, `wordDurationMs` (Task 5).
- Produces:
  - `type DecodeParams = { graphemes: string[]; elapsedMs: number; pool: string[]; rng: Rng; cadence: Cadence; connecting?: boolean }`
  - `type DecodeResult = { slots: string[]; done: boolean }`
  - `decodeFrame(p: DecodeParams): DecodeResult`
  - Behaviour: **LTR** — slot `i` shows `graphemes[i]` once `elapsedMs >= lockTimes[i]`, else a random glyph from `pool`; `done` when all locked. **connecting** — while running, all slots show random glyphs (whole-word scramble, no partial reveal); once `elapsedMs >= wordDurationMs`, `slots === graphemes` and `done` true.

- [ ] **Step 1: Write the failing test**

`src/lib/decode.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { decodeFrame } from './decode';
import { HELLO_CADENCE, lockTimes, wordDurationMs } from './timing';
import { makeRng } from './rng';
import { segment } from './segment';

const POOL = ['x', '#', '7', '@', 'q', 'z'];

describe('decodeFrame (LTR)', () => {
  const graphemes = segment('Hello');

  it('renders the exact target once fully elapsed', () => {
    const r = decodeFrame({ graphemes, elapsedMs: 1e6, pool: POOL, rng: makeRng(1), cadence: HELLO_CADENCE });
    expect(r.done).toBe(true);
    expect(r.slots.join('')).toBe('Hello');
  });

  it('locks left-to-right (a locked prefix matches the target)', () => {
    const lt = lockTimes(graphemes.length, HELLO_CADENCE);
    const r = decodeFrame({ graphemes, elapsedMs: lt[2] + 1, pool: POOL, rng: makeRng(1), cadence: HELLO_CADENCE });
    expect(r.slots.slice(0, 3)).toEqual(graphemes.slice(0, 3));
    expect(r.done).toBe(false);
  });

  it('has no locked slots at elapsed 0 (all from pool)', () => {
    const r = decodeFrame({ graphemes, elapsedMs: 0, pool: POOL, rng: makeRng(1), cadence: HELLO_CADENCE });
    expect(r.slots.every((s) => POOL.includes(s))).toBe(true);
    expect(r.done).toBe(false);
  });
});

describe('decodeFrame (connecting / Arabic)', () => {
  const graphemes = segment('مرحبا');
  const cadence = HELLO_CADENCE;

  it('shows a whole-word scramble (no partial target) while running', () => {
    const r = decodeFrame({ graphemes, elapsedMs: 0, pool: POOL, rng: makeRng(3), cadence, connecting: true });
    expect(r.done).toBe(false);
    // none of the scramble slots are real target letters mid-run
    expect(r.slots.every((s) => POOL.includes(s))).toBe(true);
  });

  it('resolves to the exact joined word once elapsed', () => {
    const r = decodeFrame({ graphemes, elapsedMs: wordDurationMs(graphemes.length, cadence) + 1, pool: POOL, rng: makeRng(3), cadence, connecting: true });
    expect(r.done).toBe(true);
    expect(r.slots.join('')).toBe('مرحبا');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- decode`
Expected: FAIL (`decodeFrame` not exported).

- [ ] **Step 3: Implement `src/lib/decode.ts`**

```ts
import type { Rng } from './rng';
import { type Cadence, lockTimes, wordDurationMs } from './timing';

export type DecodeParams = {
  graphemes: string[];
  elapsedMs: number;
  pool: string[];
  rng: Rng;
  cadence: Cadence;
  connecting?: boolean;
};

export type DecodeResult = {
  slots: string[];
  done: boolean;
};

function randomGlyph(pool: string[], rng: Rng): string {
  return pool[Math.floor(rng() * pool.length)] ?? pool[0] ?? '';
}

export function decodeFrame(p: DecodeParams): DecodeResult {
  const { graphemes, elapsedMs, pool, rng, cadence, connecting } = p;
  const n = graphemes.length;

  if (connecting) {
    const dur = wordDurationMs(n, cadence);
    if (elapsedMs >= dur) return { slots: graphemes.slice(), done: true };
    const slots = Array.from({ length: n }, () => randomGlyph(pool, rng));
    return { slots, done: false };
  }

  const lt = lockTimes(n, cadence);
  const slots = graphemes.map((g, i) => (elapsedMs >= lt[i] ? g : randomGlyph(pool, rng)));
  const done = n === 0 || elapsedMs >= lt[n - 1];
  return { slots, done };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- decode`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/decode.ts src/lib/decode.test.ts
git commit -m "feat: pure decode frame (ltr + connecting whole-word)"
```

---

### Task 7: Intro state machine (`lib/introMachine.ts`)

**Files:**
- Create: `src/lib/introMachine.ts`
- Test: `src/lib/introMachine.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `type Phase = 'IDLE' | 'NOISE_IN' | 'HELLO_CYCLE' | 'NAME_CYCLE' | 'SETTLE' | 'HERO'`
  - `type IntroState = { phase: Phase; wordIndex: number }`
  - `type IntroEvent = { type: 'START' } | { type: 'FIELD_READY' } | { type: 'WORD_DONE' } | { type: 'SETTLE_DONE' } | { type: 'SKIP' } | { type: 'REDUCE_MOTION' }`
  - `type MachineConfig = { helloCount: number; nameCount: number }`
  - `const initialState: IntroState`
  - `reducer(state: IntroState, event: IntroEvent, cfg: MachineConfig): IntroState`
  - Transitions: `IDLE --START--> NOISE_IN`; `NOISE_IN --FIELD_READY--> HELLO_CYCLE(0)`; within HELLO/NAME, `WORD_DONE` advances `wordIndex` or moves to the next phase; `NAME_CYCLE` end → `SETTLE`; `SETTLE --SETTLE_DONE--> HERO`; `SKIP`/`REDUCE_MOTION` from any non-terminal → `HERO`.

- [ ] **Step 1: Write the failing test**

`src/lib/introMachine.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { reducer, initialState, type IntroState, type IntroEvent } from './introMachine';

const CFG = { helloCount: 5, nameCount: 3 };
const step = (s: IntroState, ...events: IntroEvent[]) =>
  events.reduce((acc, e) => reducer(acc, e, CFG), s);

describe('introMachine', () => {
  it('starts IDLE then ignites the field', () => {
    expect(initialState.phase).toBe('IDLE');
    expect(step(initialState, { type: 'START' }).phase).toBe('NOISE_IN');
    expect(step(initialState, { type: 'START' }, { type: 'FIELD_READY' })).toEqual({ phase: 'HELLO_CYCLE', wordIndex: 0 });
  });

  it('advances through the hello subset then into the name subset', () => {
    let s = step(initialState, { type: 'START' }, { type: 'FIELD_READY' });
    for (let i = 0; i < CFG.helloCount - 1; i++) s = reducer(s, { type: 'WORD_DONE' }, CFG);
    expect(s).toEqual({ phase: 'HELLO_CYCLE', wordIndex: CFG.helloCount - 1 });
    s = reducer(s, { type: 'WORD_DONE' }, CFG);
    expect(s).toEqual({ phase: 'NAME_CYCLE', wordIndex: 0 });
  });

  it('ends the name subset in SETTLE, then HERO', () => {
    let s: IntroState = { phase: 'NAME_CYCLE', wordIndex: CFG.nameCount - 1 };
    s = reducer(s, { type: 'WORD_DONE' }, CFG);
    expect(s.phase).toBe('SETTLE');
    s = reducer(s, { type: 'SETTLE_DONE' }, CFG);
    expect(s.phase).toBe('HERO');
  });

  it('SKIP and REDUCE_MOTION jump straight to HERO from any phase', () => {
    expect(reducer({ phase: 'NOISE_IN', wordIndex: 0 }, { type: 'SKIP' }, CFG).phase).toBe('HERO');
    expect(reducer({ phase: 'HELLO_CYCLE', wordIndex: 2 }, { type: 'REDUCE_MOTION' }, CFG).phase).toBe('HERO');
    expect(reducer({ phase: 'NAME_CYCLE', wordIndex: 1 }, { type: 'SKIP' }, CFG).phase).toBe('HERO');
  });

  it('is a no-op once in HERO', () => {
    const hero: IntroState = { phase: 'HERO', wordIndex: 0 };
    expect(reducer(hero, { type: 'WORD_DONE' }, CFG)).toBe(hero);
    expect(reducer(hero, { type: 'SKIP' }, CFG)).toBe(hero);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- introMachine`
Expected: FAIL (exports missing).

- [ ] **Step 3: Implement `src/lib/introMachine.ts`**

```ts
export type Phase = 'IDLE' | 'NOISE_IN' | 'HELLO_CYCLE' | 'NAME_CYCLE' | 'SETTLE' | 'HERO';

export type IntroState = { phase: Phase; wordIndex: number };

export type IntroEvent =
  | { type: 'START' }
  | { type: 'FIELD_READY' }
  | { type: 'WORD_DONE' }
  | { type: 'SETTLE_DONE' }
  | { type: 'SKIP' }
  | { type: 'REDUCE_MOTION' };

export type MachineConfig = { helloCount: number; nameCount: number };

export const initialState: IntroState = { phase: 'IDLE', wordIndex: 0 };

export function reducer(state: IntroState, event: IntroEvent, cfg: MachineConfig): IntroState {
  if (state.phase === 'HERO') return state;

  if (event.type === 'SKIP' || event.type === 'REDUCE_MOTION') {
    return { phase: 'HERO', wordIndex: 0 };
  }

  switch (state.phase) {
    case 'IDLE':
      return event.type === 'START' ? { phase: 'NOISE_IN', wordIndex: 0 } : state;

    case 'NOISE_IN':
      return event.type === 'FIELD_READY' ? { phase: 'HELLO_CYCLE', wordIndex: 0 } : state;

    case 'HELLO_CYCLE':
      if (event.type !== 'WORD_DONE') return state;
      return state.wordIndex + 1 < cfg.helloCount
        ? { phase: 'HELLO_CYCLE', wordIndex: state.wordIndex + 1 }
        : { phase: 'NAME_CYCLE', wordIndex: 0 };

    case 'NAME_CYCLE':
      if (event.type !== 'WORD_DONE') return state;
      return state.wordIndex + 1 < cfg.nameCount
        ? { phase: 'NAME_CYCLE', wordIndex: state.wordIndex + 1 }
        : { phase: 'SETTLE', wordIndex: 0 };

    case 'SETTLE':
      return event.type === 'SETTLE_DONE' ? { phase: 'HERO', wordIndex: 0 } : state;

    default:
      return state;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- introMachine`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/introMachine.ts src/lib/introMachine.test.ts
git commit -m "feat: intro state machine reducer"
```

---

### Task 8: `usePrefersReducedMotion` hook

**Files:**
- Create: `src/hooks/usePrefersReducedMotion.ts`
- Test: `src/hooks/usePrefersReducedMotion.test.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: `usePrefersReducedMotion(): boolean` — SSR-safe (initial `false`), reads `matchMedia('(prefers-reduced-motion: reduce)')` after mount and subscribes to changes live.

- [ ] **Step 1: Write the failing test**

`src/hooks/usePrefersReducedMotion.test.tsx`:
```tsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

function mockMatchMedia(matches: boolean) {
  window.matchMedia = ((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

describe('usePrefersReducedMotion', () => {
  beforeEach(() => mockMatchMedia(false));

  it('returns false when the user has no reduced-motion preference', () => {
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);
  });

  it('returns true when reduce is set', () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- usePrefersReducedMotion`
Expected: FAIL (hook not exported).

- [ ] **Step 3: Implement `src/hooks/usePrefersReducedMotion.ts`**

```ts
'use client';
import { useEffect, useState } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia(QUERY);
    setReduced(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return reduced;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- usePrefersReducedMotion`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/hooks/usePrefersReducedMotion.ts src/hooks/usePrefersReducedMotion.test.tsx
git commit -m "feat: usePrefersReducedMotion hook"
```

---

### Task 9: `useHasSeenIntro` hook

**Files:**
- Create: `src/hooks/useHasSeenIntro.ts`
- Test: `src/hooks/useHasSeenIntro.test.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: `useHasSeenIntro(): { hasSeen: boolean; ready: boolean; markSeen: () => void }`. `ready` is `false` until the post-mount localStorage read completes (so the machine waits before choosing full vs short path). Never throws if `localStorage` is unavailable (treats as not seen). Key: `'hasSeenIntro'`.

- [ ] **Step 1: Write the failing test**

`src/hooks/useHasSeenIntro.test.tsx`:
```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHasSeenIntro } from './useHasSeenIntro';

describe('useHasSeenIntro', () => {
  beforeEach(() => localStorage.clear());

  it('reports not seen on first visit and becomes ready', () => {
    const { result } = renderHook(() => useHasSeenIntro());
    expect(result.current.ready).toBe(true);
    expect(result.current.hasSeen).toBe(false);
  });

  it('markSeen persists and reads back as seen', () => {
    const { result } = renderHook(() => useHasSeenIntro());
    act(() => result.current.markSeen());
    expect(result.current.hasSeen).toBe(true);
    const second = renderHook(() => useHasSeenIntro());
    expect(second.result.current.hasSeen).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- useHasSeenIntro`
Expected: FAIL (hook not exported).

- [ ] **Step 3: Implement `src/hooks/useHasSeenIntro.ts`**

```ts
'use client';
import { useCallback, useEffect, useState } from 'react';

const KEY = 'hasSeenIntro';

function safeGet(): boolean {
  try {
    return typeof window !== 'undefined' && window.localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

export function useHasSeenIntro(): { hasSeen: boolean; ready: boolean; markSeen: () => void } {
  const [hasSeen, setHasSeen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setHasSeen(safeGet());
    setReady(true);
  }, []);

  const markSeen = useCallback(() => {
    setHasSeen(true);
    try {
      window.localStorage.setItem(KEY, '1');
    } catch {
      /* private mode: keep in-memory only */
    }
  }, []);

  return { hasSeen, ready, markSeen };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- useHasSeenIntro`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useHasSeenIntro.ts src/hooks/useHasSeenIntro.test.tsx
git commit -m "feat: useHasSeenIntro hook (ssr-safe, private-mode-safe)"
```

---

### Task 10: `useRaf` active-time loop hook

**Files:**
- Create: `src/hooks/useRaf.ts`
- Test: `src/hooks/useRaf.test.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: `useRaf(callback: (activeElapsedMs: number) => void, running: boolean): void`. Drives an rAF loop that calls `callback` with **accumulated active elapsed ms** since it started running. Accumulation **pauses** when `running` is false or `document.hidden` is true, and resumes without jumping. Uses `performance.now()`; cleans up on unmount / when `running` goes false.

- [ ] **Step 1: Write the failing test**

`src/hooks/useRaf.test.tsx`:
```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { useRaf } from './useRaf';

function Harness({ running, onTick }: { running: boolean; onTick: (ms: number) => void }) {
  useRaf(onTick, running);
  return null;
}

describe('useRaf', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    let now = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => now);
    // Drive rAF off fake timers at ~16ms; advance the mocked clock in lockstep.
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) =>
      setTimeout(() => {
        now += 16;
        cb(now);
      }, 16) as unknown as number,
    );
    vi.stubGlobal('cancelAnimationFrame', (id: number) => clearTimeout(id as unknown as NodeJS.Timeout));
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('calls back with a growing elapsed time while running', () => {
    const ticks: number[] = [];
    render(<Harness running={true} onTick={(ms) => ticks.push(ms)} />);
    vi.advanceTimersByTime(100);
    expect(ticks.length).toBeGreaterThan(0);
    expect(ticks[ticks.length - 1]).toBeGreaterThan(0);
  });

  it('does not tick when not running', () => {
    const ticks: number[] = [];
    render(<Harness running={false} onTick={(ms) => ticks.push(ms)} />);
    vi.advanceTimersByTime(100);
    expect(ticks).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- useRaf`
Expected: FAIL (hook not exported).

- [ ] **Step 3: Implement `src/hooks/useRaf.ts`**

```ts
'use client';
import { useEffect, useRef } from 'react';

/**
 * rAF loop that reports accumulated ACTIVE elapsed ms. Pauses accumulation
 * when `running` is false or the tab is hidden, and resumes without jumping.
 */
export function useRaf(callback: (activeElapsedMs: number) => void, running: boolean): void {
  const cbRef = useRef(callback);
  cbRef.current = callback;

  useEffect(() => {
    if (!running || typeof window === 'undefined') return;

    let raf = 0;
    let acc = 0; // active elapsed
    let last = performance.now();
    let paused = document.hidden;

    const onVisibility = () => {
      paused = document.hidden;
      last = performance.now(); // reset baseline so hidden time isn't counted
    };
    document.addEventListener('visibilitychange', onVisibility);

    const loop = () => {
      const now = performance.now();
      if (!paused) {
        acc += now - last;
      }
      last = now;
      cbRef.current(acc);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [running]);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- useRaf`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useRaf.ts src/hooks/useRaf.test.tsx
git commit -m "feat: useRaf active-time loop (pauses on hidden/idle)"
```

---

### Task 11: Server-rendered Hero + section shells

**Files:**
- Create: `src/components/Hero.tsx`, `src/components/Hero.module.css`
- Create: `src/components/sections/Work.tsx`, `src/components/sections/About.tsx`, `src/components/sections/Contact.tsx`
- Create: `src/components/PageContent.tsx`
- Test: `src/components/PageContent.test.tsx`

**Interfaces:**
- Consumes: nothing (Server Components, static).
- Produces:
  - `Hero` renders an `<h1>` "Ferdinan Nathanael" with `tabIndex={-1}` and `id="hero-heading"`, a tagline "Full-Stack Developer", a top nav (name = scroll-to-top `href="#top"`; links to `#work`/`#about`/`#contact`), a scroll cue, and a **Replay intro** button (`data-replay` attribute; wired in Task 15 — static here).
  - Section shells render `<section id="work|about|contact">` with placeholder content; About includes a monospace skills line.
  - `PageContent` composes `<Hero/>` + the three sections; this is the always-present accessible page.

- [ ] **Step 1: Write the failing test**

`src/components/PageContent.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageContent } from './PageContent';

describe('PageContent (accessible, always-present page)', () => {
  it('renders the name as the h1 focus target', () => {
    render(<PageContent />);
    const h1 = screen.getByRole('heading', { level: 1, name: 'Ferdinan Nathanael' });
    expect(h1).toHaveAttribute('tabindex', '-1');
    expect(h1).toHaveAttribute('id', 'hero-heading');
  });

  it('renders the tagline', () => {
    render(<PageContent />);
    expect(screen.getByText('Full-Stack Developer')).toBeInTheDocument();
  });

  it('has Work/About/Contact nav links to the right anchors', () => {
    render(<PageContent />);
    expect(screen.getByRole('link', { name: 'Work' })).toHaveAttribute('href', '#work');
    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('href', '#about');
    expect(screen.getByRole('link', { name: 'Contact' })).toHaveAttribute('href', '#contact');
  });

  it('renders the section anchors', () => {
    const { container } = render(<PageContent />);
    expect(container.querySelector('#work')).toBeTruthy();
    expect(container.querySelector('#about')).toBeTruthy();
    expect(container.querySelector('#contact')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- PageContent`
Expected: FAIL (components not found).

- [ ] **Step 3: Implement the components**

`src/components/Hero.module.css`:
```css
.hero { min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 2rem; }
.nav { position: fixed; top: 0; left: 0; right: 0; display: flex; gap: 1.5rem; align-items: center; padding: 1rem 1.5rem; }
.brand { font-weight: 700; color: #fff; text-decoration: none; margin-right: auto; }
.nav a { color: #cfcfcf; text-decoration: none; }
.nav a:hover, .nav a:focus-visible { color: #fff; }
.name { font-size: clamp(2rem, 8vw, 5rem); margin: 0; color: #fff; outline: none; }
.tagline { color: #cfcfcf; margin-top: 0.5rem; letter-spacing: 0.05em; }
.cue { margin-top: 3rem; color: #9a9a9a; }
.replay { margin-top: 1.5rem; background: transparent; color: #cfcfcf; border: 1px solid #444; padding: 0.5rem 0.9rem; border-radius: 4px; cursor: pointer; min-height: 44px; }
.replay:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
```

`src/components/Hero.tsx`:
```tsx
import styles from './Hero.module.css';

export function Hero() {
  return (
    <>
      <nav className={styles.nav} aria-label="Primary">
        <a className={styles.brand} href="#top">Ferdinan Nathanael</a>
        <a href="#work">Work</a>
        <a href="#about">About</a>
        <a href="#contact">Contact</a>
      </nav>
      <header className={styles.hero} id="top">
        <h1 className={styles.name} id="hero-heading" tabIndex={-1}>Ferdinan Nathanael</h1>
        <p className={styles.tagline}>Full-Stack Developer</p>
        <p className={styles.cue} aria-hidden="true">↓ scroll</p>
        <button type="button" className={styles.replay} data-replay>Replay intro</button>
      </header>
    </>
  );
}
```

`src/components/sections/Work.tsx`:
```tsx
export function Work() {
  return (
    <section id="work" style={{ padding: '4rem 1.5rem', maxWidth: 900, margin: '0 auto' }}>
      <h2>Work</h2>
      <p style={{ color: '#9a9a9a' }}>Selected projects coming soon.</p>
    </section>
  );
}
```

`src/components/sections/About.tsx`:
```tsx
export function About() {
  return (
    <section id="about" style={{ padding: '4rem 1.5rem', maxWidth: 900, margin: '0 auto' }}>
      <h2>About</h2>
      <p>Full-stack developer building web and mobile products.</p>
      <p style={{ fontFamily: 'ui-monospace, monospace', color: '#9a9a9a' }}>
        TypeScript · React · Next.js · Flutter · Supabase · Node.js
      </p>
    </section>
  );
}
```

`src/components/sections/Contact.tsx`:
```tsx
export function Contact() {
  return (
    <section id="contact" style={{ padding: '4rem 1.5rem', maxWidth: 900, margin: '0 auto' }}>
      <h2>Contact</h2>
      <ul style={{ listStyle: 'none', padding: 0, color: '#cfcfcf' }}>
        <li><a href="mailto:dinan@ptera.id">dinan@ptera.id</a></li>
        <li><a href="https://github.com/FerdinanNathanael">GitHub</a></li>
        <li><a href="#">LinkedIn</a></li>
      </ul>
    </section>
  );
}
```

`src/components/PageContent.tsx`:
```tsx
import { Hero } from './Hero';
import { Work } from './sections/Work';
import { About } from './sections/About';
import { Contact } from './sections/Contact';

export function PageContent() {
  return (
    <main>
      <Hero />
      <Work />
      <About />
      <Contact />
    </main>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- PageContent`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/Hero.tsx src/components/Hero.module.css src/components/sections src/components/PageContent.tsx src/components/PageContent.test.tsx
git commit -m "feat: server-rendered hero + section shells"
```

---

### Task 12: `GlyphFieldCanvas` (presentational ambient field)

**Files:**
- Create: `src/lib/glyphs.ts`
- Create: `src/components/GlyphFieldCanvas.tsx`
- Test: `src/lib/glyphs.test.ts`, `src/components/GlyphFieldCanvas.test.tsx`

**Interfaces:**
- Consumes: `Rng` (Task 2); `segment` (Task 3).
- Produces:
  - `lib/glyphs.ts`: `const BASE_POOL: string[]` (Latin + digits + sparse symbols, no katakana rain); `poolFor(sample: string): string[]` (base pool + a few sample glyphs from the target word). Used by the field and by `DecodingWord`.
  - `GlyphFieldCanvas` props `{ running: boolean }`. Renders an `aria-hidden` `<canvas>` fixed full-viewport. Internally: DPR-capped backing store, dirty-rect updates of K cells throttled by a time accumulator (~22–28fps). **Must not throw when `getContext` returns null** (renders an empty canvas). Cleans up rAF on unmount / when `running` is false.

- [ ] **Step 1: Write the failing tests**

`src/lib/glyphs.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { BASE_POOL, poolFor } from './glyphs';

describe('glyphs', () => {
  it('base pool is non-empty and excludes half-width katakana', () => {
    expect(BASE_POOL.length).toBeGreaterThan(10);
    // no half-width katakana range U+FF66–U+FF9D
    expect(BASE_POOL.every((g) => !/[ｦ-ﾝ]/.test(g))).toBe(true);
  });

  it('poolFor includes base glyphs plus target sample glyphs', () => {
    const pool = poolFor('你好');
    expect(pool).toContain('你');
    expect(pool.length).toBeGreaterThan(BASE_POOL.length);
  });
});
```

`src/components/GlyphFieldCanvas.test.tsx`:
```tsx
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { GlyphFieldCanvas } from './GlyphFieldCanvas';

afterEach(() => vi.restoreAllMocks());

describe('GlyphFieldCanvas', () => {
  it('renders an aria-hidden canvas', () => {
    const { container } = render(<GlyphFieldCanvas running={false} />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeTruthy();
    expect(canvas).toHaveAttribute('aria-hidden', 'true');
  });

  it('does not throw when getContext returns null', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    expect(() => render(<GlyphFieldCanvas running={true} />)).not.toThrow();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- glyphs GlyphFieldCanvas`
Expected: FAIL (modules missing).

- [ ] **Step 3: Implement `src/lib/glyphs.ts`**

```ts
import { segment } from './segment';

/** Latin letters, digits, and a few sparse symbols. No katakana "Matrix rain". */
export const BASE_POOL: string[] = [
  ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  ...'abcdefghijklmnopqrstuvwxyz',
  ...'0123456789',
  ...'#@%&*+=/<>?',
];

/** Base pool biased with a handful of glyphs sampled from the target word. */
export function poolFor(sample: string): string[] {
  const extra = segment(sample).filter((g) => g.trim().length > 0);
  return [...BASE_POOL, ...extra, ...extra]; // duplicate so target glyphs appear a bit more
}
```

- [ ] **Step 4: Implement `src/components/GlyphFieldCanvas.tsx`**

```tsx
'use client';
import { useEffect, useRef } from 'react';
import { BASE_POOL } from '@/src/lib/glyphs';
import { makeRng } from '@/src/lib/rng';

const CELL = 18; // css px per cell
const MAX_CELLS_DESKTOP = 2200;
const MAX_CELLS_MOBILE = 1000;

export function GlyphFieldCanvas({ running }: { running: boolean }) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || typeof window === 'undefined') return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return; // getContext null → leave an empty canvas, never throw

    const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
    const dpr = Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2);
    const maxCells = coarse ? MAX_CELLS_MOBILE : MAX_CELLS_DESKTOP;
    const targetFps = coarse ? 22 : 28;
    const frameMs = 1000 / targetFps;

    let cols = 0, rows = 0, cw = 0, ch = 0, stepW = CELL, stepH = CELL;
    const rng = makeRng(1337);

    function resize() {
      cw = window.innerWidth;
      ch = window.innerHeight;
      let c = Math.ceil(cw / CELL);
      let r = Math.ceil(ch / CELL);
      while (c * r > maxCells) { c = Math.max(1, c - 1); r = Math.max(1, r - 1); }
      cols = c; rows = r;
      stepW = cw / Math.max(cols, 1);
      stepH = ch / Math.max(rows, 1);
      canvas.width = Math.floor(cw * dpr);
      canvas.height = Math.floor(ch * dpr);
      canvas.style.width = cw + 'px';
      canvas.style.height = ch + 'px';
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx!.fillStyle = '#0a0a0a';
      ctx!.fillRect(0, 0, cw, ch);
      ctx!.font = `${CELL - 4}px ui-monospace, monospace`;
      ctx!.textBaseline = 'top';
    }
    resize();

    let raf = 0;
    let last = performance.now();
    let carry = 0;
    let paused = document.hidden;
    const onVis = () => { paused = document.hidden; last = performance.now(); };
    document.addEventListener('visibilitychange', onVis);
    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    const onResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 200);
    };
    window.addEventListener('resize', onResize);

    function draw() {
      const now = performance.now();
      if (!paused) carry += now - last;
      last = now;
      if (carry >= frameMs) {
        carry = 0;
        // mutate ~4% of cells this tick (dirty-rect, never clear whole canvas)
        const k = Math.max(8, Math.floor(cols * rows * 0.04));
        for (let i = 0; i < k; i++) {
          const cx = Math.floor(rng() * cols);
          const cy = Math.floor(rng() * rows);
          const x = cx * stepW;
          const y = cy * stepH;
          ctx!.fillStyle = '#0a0a0a';
          ctx!.fillRect(x, y, stepW, stepH);
          const g = BASE_POOL[Math.floor(rng() * BASE_POOL.length)];
          const alpha = 0.12 + rng() * 0.18; // dim, varied
          ctx!.fillStyle = `rgba(160,160,160,${alpha.toFixed(3)})`;
          ctx!.fillText(g, x + 2, y + 2);
        }
      }
      raf = requestAnimationFrame(draw);
    }
    if (running) raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      if (resizeTimer) clearTimeout(resizeTimer);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('resize', onResize);
    };
  }, [running]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}
    />
  );
}
```

> **Note:** the atlas/`drawImage` optimization from the spec is a later polish (see Task 17 QA). This first cut uses guarded `fillText` on a small dirty-rect subset (~4% of cells/tick, throttled), which is within budget; swap to an atlas if profiling shows jank.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- glyphs GlyphFieldCanvas`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add src/lib/glyphs.ts src/lib/glyphs.test.ts src/components/GlyphFieldCanvas.tsx src/components/GlyphFieldCanvas.test.tsx
git commit -m "feat: presentational glyph field canvas"
```

---

### Task 13: `DecodingWord` (per-word decode animation)

**Files:**
- Create: `src/components/DecodingWord.tsx`, `src/components/DecodingWord.module.css`
- Test: `src/components/DecodingWord.test.tsx`

**Interfaces:**
- Consumes: `LangEntry` (Task 4); `segment` (Task 3); `decodeFrame` (Task 6); `HELLO_CADENCE`/`NAME_CADENCE`/`wordDurationMs`/`TIMING` (Task 5); `makeRng` (Task 2); `poolFor` (Task 12); `useRaf` (Task 10).
- Produces: `DecodingWord` props `{ entry: LangEntry; kind: 'hello' | 'intro'; reducedMotion: boolean; onDone: () => void }`. Renders `aria-hidden` centered text with `lang={entry.code}` and `dir={entry.dir ?? 'ltr'}`. Runs the decode via `useRaf`; on full resolve holds (`TIMING.helloHoldMs`/`nameHoldMs`) then calls `onDone` once. Under `reducedMotion`, renders the final target immediately and calls `onDone` after a microtask (no scramble, no rAF). Re-runs cleanly when `entry`/`kind` change.

- [ ] **Step 1: Write the failing test**

`src/components/DecodingWord.test.tsx`:
```tsx
import { describe, it, expect, vi, act as _act } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { DecodingWord } from './DecodingWord';
import { byCode } from '@/src/lib/languages';

describe('DecodingWord', () => {
  it('renders the exact target and calls onDone under reduced motion (no rAF)', async () => {
    const onDone = vi.fn();
    render(<DecodingWord entry={byCode('en')} kind="hello" reducedMotion onDone={onDone} />);
    const node = screen.getByText('Hello');
    expect(node).toHaveAttribute('aria-hidden', 'true');
    await act(async () => { await Promise.resolve(); });
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('sets dir=rtl and lang for the Arabic entry (reduced motion path)', () => {
    render(<DecodingWord entry={byCode('ar')} kind="hello" reducedMotion onDone={() => {}} />);
    const node = screen.getByText('مرحبا');
    expect(node).toHaveAttribute('dir', 'rtl');
    expect(node).toHaveAttribute('lang', 'ar');
  });

  it('with animation, eventually resolves the exact target and fires onDone once', () => {
    vi.useFakeTimers();
    let now = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => now);
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) =>
      setTimeout(() => { now += 16; cb(now); }, 16) as unknown as number);
    vi.stubGlobal('cancelAnimationFrame', (id: number) => clearTimeout(id as unknown as NodeJS.Timeout));
    const onDone = vi.fn();
    try {
      render(<DecodingWord entry={byCode('en')} kind="hello" reducedMotion={false} onDone={onDone} />);
      act(() => { vi.advanceTimersByTime(3000); });
      expect(screen.getByText('Hello')).toBeInTheDocument();
      expect(onDone).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- DecodingWord`
Expected: FAIL (component missing).

- [ ] **Step 3: Implement `src/components/DecodingWord.module.css`**

```css
.word { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; z-index: 1; pointer-events: none; }
.text { font-size: clamp(1.5rem, 6vw, 4rem); color: #fff; padding: 0.3em 0.6em; background: radial-gradient(ellipse at center, #0a0a0a 55%, rgba(10,10,10,0) 100%); white-space: pre; }
```

- [ ] **Step 4: Implement `src/components/DecodingWord.tsx`**

```tsx
'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './DecodingWord.module.css';
import type { LangEntry } from '@/src/lib/languages';
import { segment } from '@/src/lib/segment';
import { decodeFrame } from '@/src/lib/decode';
import { HELLO_CADENCE, NAME_CADENCE, TIMING, wordDurationMs } from '@/src/lib/timing';
import { makeRng } from '@/src/lib/rng';
import { poolFor } from '@/src/lib/glyphs';
import { useRaf } from '@/src/hooks/useRaf';

type Props = { entry: LangEntry; kind: 'hello' | 'intro'; reducedMotion: boolean; onDone: () => void };

export function DecodingWord({ entry, kind, reducedMotion, onDone }: Props) {
  const target = kind === 'hello' ? entry.hello : entry.intro;
  const dir = entry.dir ?? 'ltr';
  const graphemes = useMemo(() => segment(target), [target]);
  const cadence = kind === 'hello' ? HELLO_CADENCE : NAME_CADENCE;
  const holdMs = kind === 'hello' ? TIMING.helloHoldMs : TIMING.nameHoldMs;
  const pool = useMemo(() => poolFor(target), [target]);

  const [display, setDisplay] = useState<string>(reducedMotion ? target : '');
  const rngRef = useRef(makeRng(target.length * 7 + kind.length));
  const doneFiredRef = useRef(false);
  const doneAtRef = useRef<number | null>(null);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  // Reset per word.
  useEffect(() => {
    doneFiredRef.current = false;
    doneAtRef.current = null;
    rngRef.current = makeRng(target.length * 7 + kind.length);
    setDisplay(reducedMotion ? target : '');
  }, [target, kind, reducedMotion]);

  // Reduced motion: no rAF; show target, fire onDone next microtask.
  useEffect(() => {
    if (!reducedMotion) return;
    setDisplay(target);
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled && !doneFiredRef.current) {
        doneFiredRef.current = true;
        onDoneRef.current();
      }
    });
    return () => { cancelled = true; };
  }, [target, reducedMotion]);

  useRaf((elapsed) => {
    if (reducedMotion) return;
    const frame = decodeFrame({
      graphemes,
      elapsedMs: elapsed,
      pool,
      rng: rngRef.current,
      cadence,
      connecting: entry.connecting,
    });
    setDisplay(frame.slots.join(''));
    if (frame.done && doneAtRef.current === null) doneAtRef.current = elapsed;
    if (doneAtRef.current !== null && elapsed - doneAtRef.current >= holdMs && !doneFiredRef.current) {
      doneFiredRef.current = true;
      onDoneRef.current();
    }
  }, !reducedMotion);

  return (
    <div className={styles.word}>
      <span className={styles.text} aria-hidden="true" dir={dir} lang={entry.code}>
        {display}
      </span>
    </div>
  );
}
```

> **Note:** the reset effect and the reduced-motion effect both key on `[target, ...]`; the reset runs first (declared earlier) so `display` is `target` under reduced motion. `onDoneRef` prevents stale-closure double-fires when the parent re-renders.

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- DecodingWord`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add src/components/DecodingWord.tsx src/components/DecodingWord.module.css src/components/DecodingWord.test.tsx
git commit -m "feat: DecodingWord per-word decode animation"
```

---

### Task 14: `useIntroMachine` (wire reducer + reduced-motion + seen)

**Files:**
- Create: `src/hooks/useIntroMachine.ts`
- Test: `src/hooks/useIntroMachine.test.tsx`

**Interfaces:**
- Consumes: `reducer`/`initialState`/`Phase`/`IntroState`/`IntroEvent` (Task 7); `byCode`/`LangEntry` (Task 4).
- Produces: `useIntroMachine(opts: { helloCodes: string[]; nameCodes: string[] }): IntroApi` where
  - `type Current = { entry: LangEntry; kind: 'hello' | 'intro' } | null`
  - `type IntroApi = { phase: Phase; current: Current; fieldRunning: boolean; start(): void; fieldReady(): void; wordDone(): void; settleDone(): void; skip(): void; forceHero(): void }`
  - `current` derives from phase+wordIndex; `fieldRunning` is true for NOISE_IN/HELLO_CYCLE/NAME_CYCLE/SETTLE, false at IDLE/HERO. `forceHero()` dispatches `REDUCE_MOTION` (used by the reduced-motion / returning-visitor paths).

- [ ] **Step 1: Write the failing test**

`src/hooks/useIntroMachine.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIntroMachine } from './useIntroMachine';
import { HELLO_CODES, NAME_CODES } from '@/src/lib/languages';

const opts = { helloCodes: HELLO_CODES, nameCodes: NAME_CODES };

describe('useIntroMachine', () => {
  it('starts IDLE with no current word', () => {
    const { result } = renderHook(() => useIntroMachine(opts));
    expect(result.current.phase).toBe('IDLE');
    expect(result.current.current).toBeNull();
  });

  it('exposes the first hello entry after start + fieldReady', () => {
    const { result } = renderHook(() => useIntroMachine(opts));
    act(() => result.current.start());
    act(() => result.current.fieldReady());
    expect(result.current.phase).toBe('HELLO_CYCLE');
    expect(result.current.current).toEqual({ entry: expect.objectContaining({ code: HELLO_CODES[0] }), kind: 'hello' });
  });

  it('skip goes straight to HERO with field stopped', () => {
    const { result } = renderHook(() => useIntroMachine(opts));
    act(() => result.current.start());
    act(() => result.current.skip());
    expect(result.current.phase).toBe('HERO');
    expect(result.current.fieldRunning).toBe(false);
    expect(result.current.current).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- useIntroMachine`
Expected: FAIL (hook missing).

- [ ] **Step 3: Implement `src/hooks/useIntroMachine.ts`**

```ts
'use client';
import { useCallback, useMemo, useReducer } from 'react';
import { reducer, initialState, type Phase, type IntroState, type IntroEvent } from '@/src/lib/introMachine';
import { byCode, type LangEntry } from '@/src/lib/languages';

export type Current = { entry: LangEntry; kind: 'hello' | 'intro' } | null;
export type IntroApi = {
  phase: Phase;
  current: Current;
  fieldRunning: boolean;
  start(): void;
  fieldReady(): void;
  wordDone(): void;
  settleDone(): void;
  skip(): void;
  forceHero(): void;
};

export function useIntroMachine(opts: { helloCodes: string[]; nameCodes: string[] }): IntroApi {
  const cfg = useMemo(
    () => ({ helloCount: opts.helloCodes.length, nameCount: opts.nameCodes.length }),
    [opts.helloCodes.length, opts.nameCodes.length],
  );
  const [state, rawDispatch] = useReducer(
    (s: IntroState, e: IntroEvent) => reducer(s, e, cfg),
    initialState,
  );

  const current: Current = useMemo(() => {
    if (state.phase === 'HELLO_CYCLE') return { entry: byCode(opts.helloCodes[state.wordIndex]), kind: 'hello' };
    if (state.phase === 'NAME_CYCLE') return { entry: byCode(opts.nameCodes[state.wordIndex]), kind: 'intro' };
    return null;
  }, [state.phase, state.wordIndex, opts.helloCodes, opts.nameCodes]);

  const fieldRunning =
    state.phase === 'NOISE_IN' ||
    state.phase === 'HELLO_CYCLE' ||
    state.phase === 'NAME_CYCLE' ||
    state.phase === 'SETTLE';

  return {
    phase: state.phase,
    current,
    fieldRunning,
    start: useCallback(() => rawDispatch({ type: 'START' }), []),
    fieldReady: useCallback(() => rawDispatch({ type: 'FIELD_READY' }), []),
    wordDone: useCallback(() => rawDispatch({ type: 'WORD_DONE' }), []),
    settleDone: useCallback(() => rawDispatch({ type: 'SETTLE_DONE' }), []),
    skip: useCallback(() => rawDispatch({ type: 'SKIP' }), []),
    forceHero: useCallback(() => rawDispatch({ type: 'REDUCE_MOTION' }), []),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- useIntroMachine`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useIntroMachine.ts src/hooks/useIntroMachine.test.tsx
git commit -m "feat: useIntroMachine wiring hook"
```

---

### Task 15: `IntroOverlay` (assemble the intro; skip/focus/reduced-motion)

**Files:**
- Create: `src/components/IntroOverlay.tsx`, `src/components/IntroOverlay.module.css`
- Test: `src/components/IntroOverlay.test.tsx`

**Interfaces:**
- Consumes: `useIntroMachine` (Task 14); `usePrefersReducedMotion` (Task 8); `useHasSeenIntro` (Task 9); `GlyphFieldCanvas` (Task 12); `DecodingWord` (Task 13); `HELLO_CODES`/`NAME_CODES` (Task 4); `TIMING` (Task 5).
- Produces: `IntroOverlay` (no props). Client component that:
  - is **hidden until mount** (renders `null` on the server / first paint, so SSR/no-JS shows the page beneath).
  - On mount: waits for `useHasSeenIntro().ready`; if `reducedMotion || hasSeen` → `forceHero()` immediately (no field). Else `start()`, then after `TIMING.noiseInMs` calls `fieldReady()`.
  - Renders `GlyphFieldCanvas` (running when `fieldRunning`) + `DecodingWord` for `current` (keyed by phase+code+kind; `onDone` → `wordDone()`), and a **Skip button** as the first focusable element with `data-intro-overlay` on the root.
  - On entering `SETTLE`, schedules `settleDone()` after `TIMING.settleMs`.
  - On entering `HERO`: `markSeen()`, fade out overlay, and move focus to `#hero-heading`.
  - **Skip semantics:** Escape key (not repeat) OR Skip button (click/Enter/Space). A click on the field layer also skips. Tab / arrows / modifier keys do NOT skip.

- [ ] **Step 1: Write the failing test**

`src/components/IntroOverlay.test.tsx`:
```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { IntroOverlay } from './IntroOverlay';

// A stand-in hero heading so the focus target exists.
function Fixture() {
  return (
    <>
      <h1 id="hero-heading" tabIndex={-1}>Ferdinan Nathanael</h1>
      <IntroOverlay />
    </>
  );
}

describe('IntroOverlay', () => {
  beforeEach(() => localStorage.clear());

  it('renders a Skip button as an accessible control', () => {
    render(<Fixture />);
    expect(screen.getByRole('button', { name: /skip intro/i })).toBeInTheDocument();
  });

  it('Escape skips to hero and moves focus to the hero heading', () => {
    render(<Fixture />);
    act(() => { fireEvent.keyDown(window, { key: 'Escape' }); });
    expect(document.activeElement?.id).toBe('hero-heading');
  });

  it('Tab does NOT skip', () => {
    render(<Fixture />);
    act(() => { fireEvent.keyDown(window, { key: 'Tab' }); });
    expect(screen.getByRole('button', { name: /skip intro/i })).toBeInTheDocument();
    expect(document.activeElement?.id).not.toBe('hero-heading');
  });

  it('clicking the Skip button skips to hero', () => {
    render(<Fixture />);
    act(() => { fireEvent.click(screen.getByRole('button', { name: /skip intro/i })); });
    expect(document.activeElement?.id).toBe('hero-heading');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- IntroOverlay`
Expected: FAIL (component missing).

- [ ] **Step 3: Implement `src/components/IntroOverlay.module.css`**

```css
.overlay { position: fixed; inset: 0; z-index: 10; background: #0a0a0a; transition: opacity 200ms ease-out; }
.overlay[data-hero='true'] { opacity: 0; pointer-events: none; }
.skip { position: fixed; top: 1rem; right: 1rem; z-index: 20; background: #111; color: #fff; border: 1px solid #555; border-radius: 4px; padding: 0.5rem 0.9rem; min-height: 44px; min-width: 44px; cursor: pointer; }
.skip:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
.clickLayer { position: fixed; inset: 0; z-index: 5; }
@media (prefers-reduced-motion: reduce) {
  .overlay { transition: none; }
}
```

- [ ] **Step 4: Implement `src/components/IntroOverlay.tsx`**

```tsx
'use client';
import { useEffect, useRef, useState } from 'react';
import styles from './IntroOverlay.module.css';
import { GlyphFieldCanvas } from './GlyphFieldCanvas';
import { DecodingWord } from './DecodingWord';
import { useIntroMachine } from '@/src/hooks/useIntroMachine';
import { usePrefersReducedMotion } from '@/src/hooks/usePrefersReducedMotion';
import { useHasSeenIntro } from '@/src/hooks/useHasSeenIntro';
import { HELLO_CODES, NAME_CODES } from '@/src/lib/languages';
import { TIMING } from '@/src/lib/timing';

function focusHero() {
  const h = document.getElementById('hero-heading') as HTMLElement | null;
  h?.focus();
}

export function IntroOverlay() {
  const reducedMotion = usePrefersReducedMotion();
  const { hasSeen, ready, markSeen } = useHasSeenIntro();
  const m = useIntroMachine({ helloCodes: HELLO_CODES, nameCodes: NAME_CODES });
  const [mounted, setMounted] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => setMounted(true), []);

  // Decide the path once we know seen/reduced state.
  useEffect(() => {
    if (!mounted || !ready || startedRef.current) return;
    startedRef.current = true;
    if (reducedMotion || hasSeen) {
      m.forceHero();
      return;
    }
    m.start();
    const t = setTimeout(() => m.fieldReady(), TIMING.noiseInMs);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, ready, reducedMotion, hasSeen]);

  // SETTLE → settleDone after settleMs.
  useEffect(() => {
    if (m.phase !== 'SETTLE') return;
    const t = setTimeout(() => m.settleDone(), TIMING.settleMs);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [m.phase]);

  // HERO → mark seen + focus hero.
  useEffect(() => {
    if (m.phase !== 'HERO') return;
    markSeen();
    focusHero();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [m.phase]);

  // Skip on Escape only (never Tab/arrows/modifiers/repeat).
  useEffect(() => {
    if (m.phase === 'HERO') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !e.repeat) { e.preventDefault(); m.skip(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [m.phase]);

  const isHero = m.phase === 'HERO';

  // Before mount, render nothing (SSR shows the page beneath).
  if (!mounted) return null;

  return (
    <div className={styles.overlay} data-intro-overlay data-hero={isHero} aria-hidden={isHero}>
      <button
        type="button"
        className={styles.skip}
        aria-label="Skip intro animation"
        onClick={() => m.skip()}
        hidden={isHero}
      >
        Skip intro
      </button>
      {!isHero && (
        <>
          <div className={styles.clickLayer} onClick={() => m.skip()} aria-hidden="true" />
          <GlyphFieldCanvas running={m.fieldRunning} />
          {m.current && (
            <DecodingWord
              key={`${m.phase}-${m.current.entry.code}-${m.current.kind}`}
              entry={m.current.entry}
              kind={m.current.kind}
              reducedMotion={reducedMotion}
              onDone={m.wordDone}
            />
          )}
        </>
      )}
    </div>
  );
}
```

> **Note:** in the test, jsdom has no reduced-motion by default (setup mock returns `matches:false`) and localStorage is cleared, so the intro `start()`s. Skip via Escape/button dispatches `SKIP` → HERO → `focusHero()`. The `data-intro-overlay` attribute pairs with the `<noscript>` guard added in Task 16.

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- IntroOverlay`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add src/components/IntroOverlay.tsx src/components/IntroOverlay.module.css src/components/IntroOverlay.test.tsx
git commit -m "feat: IntroOverlay (skip/focus/reduced-motion wiring)"
```

---

### Task 16: Page assembly + no-JS guard

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/layout.tsx`
- Test: `src/app/page.test.tsx`

**Interfaces:**
- Consumes: `PageContent` (Task 11); `IntroOverlay` (Task 15).
- Produces: the real page — Server-Component `PageContent` (accessible, indexable) with the client `IntroOverlay` on top; a `<noscript>` CSS guard forcing the overlay hidden without JS. SSR output contains the hero heading + tagline and **no scramble output**.

- [ ] **Step 1: Write the failing test**

`src/app/page.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { PageContent } from '@/src/components/PageContent';

describe('server-rendered page baseline', () => {
  it('SSR markup contains the hero name and tagline (deterministic, no scramble)', () => {
    const html = renderToStaticMarkup(<PageContent />);
    expect(html).toContain('Ferdinan Nathanael');
    expect(html).toContain('Full-Stack Developer');
  });
});
```

- [ ] **Step 2: Run test to verify it passes (guard test)**

Run: `npm test -- app/page`
Expected: PASS immediately — `PageContent` already exists (Task 11). This test guards the SSR baseline; if it fails, `PageContent` regressed. Proceed to wire the page.

- [ ] **Step 3: Wire `app/page.tsx`**

```tsx
import { PageContent } from '@/src/components/PageContent';
import { IntroOverlay } from '@/src/components/IntroOverlay';

export default function Page() {
  return (
    <>
      <PageContent />
      <IntroOverlay />
    </>
  );
}
```

- [ ] **Step 4: Add the no-JS overlay guard to `app/layout.tsx`**

Replace the `<body>` in `app/layout.tsx` with:
```tsx
<body>
  <noscript>
    <style>{`[data-intro-overlay]{display:none !important}`}</style>
  </noscript>
  {children}
</body>
```

(The overlay renders `null` before mount so it never blocks SSR/no-JS; this `<noscript>` rule is a defensive belt-and-braces against any hydration edge case.)

- [ ] **Step 5: Run all tests + build**

Run: `npm test`
Expected: ALL tests pass (every task's suite).
Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 6: Commit**

```bash
git add app/page.tsx app/layout.tsx src/app/page.test.tsx
git commit -m "feat: assemble page (server hero + client overlay + no-js guard)"
```

---

### Task 17: Manual/visual QA + Vercel deploy

**Files:**
- Create: `README.md`
- Modify: (any tuning to `src/lib/timing.ts`, `GlyphFieldCanvas.tsx` found during QA)

**Interfaces:**
- Consumes: everything.
- Produces: a verified, deployed site.

- [ ] **Step 1: Run the app and drive the intro**

Run: `npm run dev`, open `http://localhost:3000`.
Verify by observation (use the `run`/`verify` skills or a browser):
- Field ignites, hello flurry runs (Russian → Arabic → Hindi → Japanese → English), then the name cycle (Indonesian → Japanese → English), settling into the hero in ~9–11s.
- **Arabic renders joined** (مرحبا, not م ر ح ب ا).
- Center word stays readable (contrast backing works).
- Skip button works; Escape works; Tab reaches Skip without skipping.
- Reload → returning-visitor short path (localStorage `hasSeenIntro`).
- DevTools → Rendering → emulate `prefers-reduced-motion: reduce` → static hero, no scramble.
- Throttle CPU 4× / open on a phone → field stays smooth (no long frames). If janky, lower `CELL` density or the 4% mutation rate, or implement the glyph-atlas `drawImage` optimization from the spec.

- [ ] **Step 2: Write `README.md`**

```markdown
# Portfolio — Ferdinan Nathanael

Next.js + TypeScript personal site with a decode-in-place multilingual intro.

## Develop
    npm install
    npm run dev

## Test
    npm test

## Build
    npm run build

## Deploy (Vercel)
1. Push this repo to GitHub.
2. Import it at https://vercel.com/new (free Hobby tier).
3. Framework preset: Next.js (auto-detected). No env vars needed.
4. Every push to `main` auto-deploys.
```

- [ ] **Step 3: Commit**

```bash
git add README.md src/lib/timing.ts src/components/GlyphFieldCanvas.tsx
git commit -m "docs: readme + deploy notes; qa tuning"
```

- [ ] **Step 4: Deploy to Vercel**

Push to GitHub and import at https://vercel.com/new (see README). Confirm the deployed URL renders the intro and hero, and that mobile is smooth. (This step is done with the user — it needs their GitHub/Vercel accounts.)

---

## Self-Review

**Spec coverage:**
- Decode-in-place, multilingual hello + name → Tasks 4, 6, 13. ✔
- Curated subsets & pacing → Tasks 4 (codes), 5 (timing), 14/15 (sequencing). ✔
- Canvas field w/ budgets → Task 12. ✔ (atlas optimization deferred to Task 17 QA, noted.)
- Arabic whole-word/connecting → Tasks 4, 6, 13. ✔
- SSR hero + client overlay + no-JS → Tasks 11, 15, 16. ✔
- Reduced motion mandatory → Tasks 8, 13, 15. ✔
- Skip semantics (Escape/button, not Tab) → Task 15 (tested). ✔
- Focus contract → Task 15 (tested). ✔
- aria-hidden decode + accessible hero → Tasks 11, 13, 15. ✔
- Returning visitor (localStorage) → Tasks 9, 15. ✔
- Deterministic SSR / no random during render → Tasks 13 (reducedMotion initial = target; animated initial = '' then post-mount), 16 (SSR test). ✔
- Site structure/nav → Task 11. ✔
- Deploy to Vercel → Task 17. ✔

**Placeholder scan:** No TBD/TODO in steps; every code step has full code. Section content is intentionally placeholder per spec Non-Goals (empty shells), not a plan gap.

**Type consistency:** `LangEntry`, `Cadence`, `DecodeParams/DecodeResult`, `Phase/IntroState/IntroEvent/MachineConfig`, `IntroApi/Current` names are used consistently across Tasks 4–15. `decodeFrame`, `lockTimes`, `wordDurationMs`, `segment`, `makeRng`, `poolFor`, `useRaf` signatures match their consumers.

**Note on import paths:** modules live under `src/` and are imported as `@/src/...` (alias `@` → repo root). Keep this consistent; if you prefer `@/lib/...`, change `tsconfig` `paths` and all imports together.
