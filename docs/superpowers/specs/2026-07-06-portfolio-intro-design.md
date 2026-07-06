# Portfolio Intro — Design Spec

**Date:** 2026-07-06
**Author:** Ferdinan Nathanael (with Claude)
**Status:** Draft for review (revised after multi-lens review)

## Summary

A personal portfolio site whose landing experience is a cinematic intro: a full-screen
field of endlessly-scrambling monochrome glyphs, out of which a centered word **decodes in
place** (each slot rapidly cycles random characters, then locks the correct glyph in reading
order). The centered word runs a fast **"hello" flurry** across a few script-contrasting
languages, then decodes **"my name is Ferdinan Nathanael"** across a few curated languages,
ending on a slow English resolve that settles into a real hero (name, tagline, scroll cue,
minimal nav). Below the hero, the single page continues into Work / About / Contact sections.

The full visible page (hero + sections) is **server-rendered** and always present; the intro
is a **client overlay** on top of it that fades away to reveal the hero. So no-JS visitors,
crawlers, and reduced-motion users get a real, meaningful page immediately.

## Goals

- A striking, memorable opening that reads as *designer*, not *gimmick*.
- Smooth full-screen animation on both desktop and mobile (explicit perf budgets below).
- The **resolved hero and page content** are real, accessible, indexable text with a no-JS
  fallback. (The decorative scrambling greetings are intentionally *not* exposed to assistive
  tech — see Accessibility.)
- Skippable, and respectful of returning visitors and reduced-motion preferences.
- A minimal but real single-page portfolio shell (hero + Work/About/Contact anchors).
- Clean, one-click deploy to Vercel (free tier).

## Non-Goals (YAGNI for now)

- Content for the Work / About / Contact sections — the structure and anchors are decided
  (see **Site Structure & Nav**), but the sections ship as empty/placeholder shells for now.
- CMS, blog, analytics, contact form backend.
- Multiple themes — a single minimal-mono theme only.
- Sound.

## Stack & Deployment

- **Next.js (App Router) + React + TypeScript.**
- Styling: CSS Modules or plain CSS (no heavy UI framework needed for a mono aesthetic).
- Animation: hand-rolled canvas render loop + a pure decode state machine. **No animation
  library** — CSS transitions / `@keyframes` / WAAPI cover the hero fade and skip crossfade,
  all gated by `@media (prefers-reduced-motion: reduce)`. (framer-motion dropped — it cuts
  against the minimal ethos and adds a client-only dependency.)
- Testing: **Vitest + React Testing Library**.
- **Deploy: Vercel** (free Hobby tier), auto-deploy on push to GitHub.

## Aesthetic (Minimal Mono)

- Background: near-black (`#0a0a0a`).
- Noise glyphs: dim grey, low + varied per-cell opacity, small.
- Resolved center word / hero: bright white, larger, crisp.
- Typography: monospace for the glyph field and decode; the hero name may use a slightly
  more expressive but still restrained face.
- No color, no glow, no scanlines. Motion is the only ornament.
- **Behind the center word:** suppress glyph cells under its bounding box (or a subtle
  radial vignette / solid backing plate) so the word keeps **≥4.5:1** contrast against its
  *real local* background — never let live noise sit directly behind text.
- **Anti-gimmick palette:** bias the scramble glyph pool toward the *current target word's
  script family* + Latin; keep symbols sparse; **avoid half-width katakana "Matrix rain"**
  (the exact cliché to avoid). Lower density, slower churn — it should read as "particles of
  language sorting themselves," not a terminal dump.

## Site Structure & Nav (decided)

Single-page site with anchor navigation. The name (top-left) is the scroll-to-top home
link; the hero itself is **not** a nav item.

Nav tabs: **Work · About · Contact**

Section order on the page:

1. **Hero** — where the intro settles: name, tagline, scroll cue.
2. **Work** (`#work`) — 3–4 featured projects, strongest first. Curated, not exhaustive.
3. **About** (`#about`) — 2–3 sentences of who Ferdinan is, with skills folded in as a
   single monospace line (`TypeScript · React · Next.js · …`). No logo grids, no skill
   bars — the plain glyph-list treatment stays on-theme with the decode aesthetic.
4. **Contact** (`#contact`) — email, GitHub, LinkedIn. Short and final.

A standalone Skills section was considered and dropped (weakest section as filler; its
content lives in About). It can be promoted to its own section later if there's enough
depth — e.g. certifications or a long tool list — to warrant it.

## Sequence & Pacing — The State Machine

Runtime is driven by **accumulated *active* elapsed time** (a monotonic clock that pauses
when the tab is hidden or reduced-motion is on), **not frame count** — so pacing is
identical on 60Hz and 120Hz devices and never "fast-forwards" after a background tab returns.

**Time budget:** hero fully populated by **~9–11s**; returning visitors reach the hero in
**<0.8s**. Skip is available and keyboard-operable from the very first frame.

Phases:

1. **`NOISE_IN`** (~0.0–0.8s) — the grey glyph field ignites (staggered center-out reveal,
   ease-out). The first "Hello" begins ~0.5s, overlapping the field settling.
2. **`HELLO_CYCLE`** (~0.5–3.7s) — fast "hello" flurry across the **curated hello subset**
   (~5 languages chosen for maximum script contrast), short crests (~150–300ms holds),
   morphing between words; **ends on English "Hello."**
3. **`NAME_CYCLE`** (~3.9–~9s) — "my name is Ferdinan Nathanael" across the **curated name
   subset** (~3 languages, quick), ending on a **slow, deliberate English decode**
   (~1.4–1.8s to lock, then a ~0.4s breath-hold) that becomes the hero handoff.
4. **`SETTLE`** (~last ~1s) — the field shimmer *decelerates to stillness* and dims to alpha
   0. The overlay's final decoded name animates (position/scale, ease-out ~700–1000ms) to
   sit **pixel-aligned over the server-rendered hero `<h1>`**, then crossfades into it (the
   real hero fades up as the overlay word fades out at the same spot) so it reads as one
   continuous morph — *not* a jarring node swap, but *not* literally reparenting the
   decorative node into the hero either (the accessible hero stays the server node). Hero
   chrome (tagline, nav, scroll cue) staggers in *after* the name lands (~80–150ms each).
5. **`HERO`** — terminal state; focus moves to the hero `<h1>`. `SETTLE` **always resolves
   `languages[0]` (English)** regardless of where NAME cycling ended.

**Skip:** transitions immediately to `HERO` (short ≤200ms crossfade). Triggers: **Escape**,
or Enter/Space activating the **Skip button**. Explicitly **excludes** Tab, arrow keys, and
modifier keys (Shift/Alt/Ctrl/Meta) and key-repeat, so Tab can reach the Skip button and AT
navigation never fires a skip. Click-to-skip is bound **only to the decorative canvas
layer** (never controls or the text layer) and ignores clicks that are part of a text
selection.

**Reduced motion (`prefers-reduced-motion: reduce`) — mandatory, not optional:** do **not**
create the rAF loop, do **not** run the scramble, do **not** run any SETTLE transform. Render
the static resolved English hero (one low-salience frame at most). Only an opacity crossfade
≤200ms is allowed. Subscribe **live** — if the preference flips to `reduce` mid-intro,
immediately settle to `HERO`.

**Returning visitors:** a `localStorage` flag (`hasSeenIntro`) → short path (quick fade to
hero, <0.8s). A **Replay intro** button in the hero re-runs it (and returns focus to itself
when done).

### Timing constants (all in `lib/timing.ts`)

- Per-slot scramble cadence **accelerates** and is **length-aware & capped**: ~55ms between
  locks decaying to ~20ms, with adjacent locks overlapping so it reads as a *wave*. Short
  words (hello) land in ~400–600ms; the ~29-grapheme name locks in ~1.4–1.8s (never the
  "length-blind 600–900ms" that would make the name flash by).
- Per-slot random cycling **decelerates** over the final 2–3 steps before locking (a
  catch/settle), optional 1-frame lock micro-pop.
- Global phase transitions use ease-out (`cubic-bezier(0.2, 0.8, 0.2, 1)`), never
  linear/ease-in-out for arrivals. Ambient field texture may stay linear.
- Word→word transitions: morph slot-by-slot from the current locked word into the next
  word's scramble (carry shared glyphs where scripts share them); overlap outgoing dissolve
  and incoming build ~120ms so the center is never empty; jitter holds ±10–15%.

## Curated language subsets

The **full 9-language set lives in `lib/languages.ts`** and is reorderable/editable in one
place. The intro plays curated subsets (constants referencing entries by `code`):

- **Hello flurry (~5, max script contrast, ends English):** `ru` (Cyrillic) → `ar` (Arabic
  RTL, whole-word) → `hi` (Devanagari) → `ja` (CJK) → `en` (Latin, last).
- **Name cycle (~3, ends English slow):** `id` (Indonesian — personally meaningful) → `ja`
  (CJK contrast) → `en` (English, slow resolve → hero).

These subset lists are config constants; swapping/reordering is a one-line edit.

## Composition — "Field Keeps Living"

The viewport stays filled with faint, endlessly-scrambling grey glyphs (a living
background) while the current word is bright and sharp in the center (over its contrast
backing). The field never fully clears until `SETTLE`, where it decelerates, dims to alpha
0, and is then torn down (`cancelAnimationFrame`, release canvas + atlas).

## Architecture — Boundaries, SSR & Progressive Enhancement

- **`app/page.tsx` is a Server Component** and renders the **full visible page** — `Hero`
  plus the Work / About / Contact section shells — as real HTML. It owns
  `export const metadata` for SEO.
- A **client `IntroOverlay`** (`'use client'`) layers on top and owns the state machine,
  canvas, and decode. It is **hidden by default** (revealed only post-mount via a
  `data-intro` attribute) and force-hidden via `<noscript>`, so no-JS users and crawlers see
  the page, not a blank screen. At `SETTLE` the overlay fades to reveal the already-present
  hero beneath it. The server-rendered page is the single semantic source of truth (no
  separate visually-hidden name line).
- **Deterministic SSR baseline (no hydration mismatch):** the t=0 server render and first
  client render are the static resolved English hero — independent of any client-only state.
  `hasSeenIntro` (localStorage) and `prefers-reduced-motion` (matchMedia) are read **only in
  post-mount effects**, then the machine switches into `NOISE_IN`. **No `Math.random()` /
  scramble output during render** — `DecodingWord`'s SSR + first client paint is the plain
  resolved target string; scramble→lock starts only in a post-mount effect.
- **`'use client'` components:** `IntroOverlay`, `GlyphFieldCanvas`, `DecodingWord`, and the
  hooks. `page.tsx`, `Hero`, and the section shells stay Server Components.

## Components

- **`IntroOverlay`** — owns the machine, phase, current word, skip / reduced-motion / seen
  logic; renders `GlyphFieldCanvas` + `DecodingWord`; fades to reveal the hero at `SETTLE`.
- **`GlyphFieldCanvas`** — **presentational**: receives `running`/`paused`, size, and DPR as
  props (env subscriptions live in hooks, not here). Renders an `aria-hidden` `<canvas>`;
  must not throw when `getContext` returns `null` (text-only fallback). Rendering pipeline
  below.
- **`DecodingWord`** — renders the centered target as **DOM text** layered above the canvas
  field (per approved approach B; DOM makes the SETTLE pixel-alignment with the server hero
  straightforward, and RTL uses per-slot direction-locked boxes). Runs the decode.
  `aria-hidden="true"` for its entire lifetime (see Accessibility). Carries `lang` + `dir` on
  the final rendered text for correctness/copy-paste.
- **`Hero`** (Server Component) — name ("Ferdinan Nathanael"), tagline ("Full-Stack
  Developer"), a subtle scroll-down cue, a minimal top nav per **Site Structure & Nav** (name
  as scroll-to-top home link; Work / About / Contact anchors to `#work` / `#about` /
  `#contact`), and a **Replay intro** button. The `<h1>` has `tabindex="-1"` as the focus
  target.
- **Section shells** (`Work` / `About` / `Contact`, Server Components) — placeholder content
  per **Site Structure & Nav**, with the matching anchor ids.
- **`useHasSeenIntro`** / **`usePrefersReducedMotion`** — SSR-safe hooks; browser APIs read
  only after mount; `usePrefersReducedMotion` subscribes live.
- **`useIntroMachine`** — React wrapper around the pure machine (below).

## State machine & decode purity (testability)

- **`lib/introMachine.ts`** — `Phase`/`State`/`Event` types, `initialState`, and a pure
  `reducer` with **zero React/canvas/timer imports**. Transitions:
  `NOISE_IN → HELLO_CYCLE → NAME_CYCLE → SETTLE → HERO` (+ skip/reduced-motion shortcuts).
- **`lib/decode.ts`** — pure `decodeFrame(target, activeElapsedMs, timing, rng) →
  displayString`, using an **injected seedable RNG** (`lib/rng.ts`) so tests are
  deterministic and synchronous.
- **`hooks/useIntroMachine.ts`** — wires the pure pieces to rAF + the active-time clock.

## Canvas rendering pipeline (performance)

1. **Glyph atlas:** pre-render the glyph pool (cap ~48–96 glyphs) **once** into an offscreen
   canvas at target cell size × DPR; blit cells via `ctx.drawImage`. **Never per-cell
   `fillText`** in the loop.
2. **Cell budget:** clamp total cells to a hard cap (~2000–2500 desktop, ~800–1200 mobile)
   with a minimum cell size.
3. **Update rate:** decouple from rAF with a time accumulator — target ~24–30fps desktop /
   ~20–24fps mobile (not native 120Hz).
4. **Dirty-rect updates:** model cells in a `TypedArray`; each tick mutate only **K** cells
   (`fillRect` backing + `drawImage` glyph). **Never `clearRect` the whole canvas.**
5. **DPR:** render at `min(devicePixelRatio, 2)`, cap ~1.5 on touch/coarse-pointer.
6. **Teardown:** on `HERO`, fade field alpha to 0, then `cancelAnimationFrame`, release
   canvas + atlas. (Dim is not stop.)
7. **Resize:** debounce (~150–250ms); rebuild backing store/atlas only when *rounded CSS
   width* changes (ignore height-only changes from mobile URL bar / keyboard); handle
   `orientationchange`; prefer `ResizeObserver` on a stable container over window `resize`.
8. **Visibility:** pause the loop and the active-time clock on `visibilitychange` (hidden).
9. Nice-to-have: `getContext('2d', { alpha:false })` painting the bg; `position:fixed;
   inset:0; pointer-events:none; contain:strict`; integer device-pixel cell coords.

**Adaptive governor (nice-to-have):** track rolling frame time; step quality down (fewer
cells → lower fps → smaller K → DPR 1) when it exceeds ~1.5× target for N frames; seed the
initial tier from `hardwareConcurrency` / `deviceMemory` / coarse-pointer; keep a visual
floor. Optional `OffscreenCanvas` + worker where supported.

## Data — Languages

All content lives in `lib/languages.ts`. Shape:

```ts
type LangEntry = {
  code: string;          // 'en', 'id', 'ja', ...
  label: string;         // human name, for reference/comments
  hello: string;         // greeting in native script
  intro: string;         // "my name is ..." in native script; name kept in Latin
  dir?: 'ltr' | 'rtl';   // default 'ltr'
  connecting?: boolean;  // true for cursive/joining scripts (Arabic) → whole-word decode
};
```

Full set (name **stays in Latin script** within every sentence — names aren't translated):

| code | label | hello | intro | dir | connecting |
|------|-------|-------|-------|-----|-----------|
| en | English | Hello | My name is Ferdinan Nathanael | ltr | – |
| id | Indonesian | Halo | Nama saya Ferdinan Nathanael | ltr | – |
| ja | Japanese | こんにちは | 私の名前は Ferdinan Nathanael です | ltr | – |
| ko | Korean | 안녕하세요 | 제 이름은 Ferdinan Nathanael입니다 | ltr | – |
| zh | Chinese | 你好 | 我叫 Ferdinan Nathanael | ltr | – |
| hi | Hindi | नमस्ते | मेरा नाम Ferdinan Nathanael है | ltr | – |
| ar | Arabic | مرحبا | اسمي Ferdinan Nathanael | rtl | ✔ |
| ru | Russian | Привет | Меня зовут Ferdinan Nathanael | ltr | – |
| fr | French | Bonjour | Je m'appelle Ferdinan Nathanael | ltr | – |

English is `languages[0]` and is the language the hero resolves to. Notes from review:
- **Korean** copula fixed: `제 이름은 Ferdinan Nathanael입니다` (no space before the bound
  particle `입니다`).
- **Russian** `Привет` is deliberately casual/friendly (other rows lean neutral-polite); kept
  as a conscious choice. Formal alternative if ever wanted: `Здравствуйте`.
- **Arabic** text is correct; the issue is rendering (see below), handled via `connecting`.

### Decode over mixed scripts / bidi (correctness)

- Decode animates over **grapheme clusters** (via `Intl.Segmenter`, grapheme granularity),
  not UTF-16 code units, so CJK / Devanagari conjuncts / combining marks lock as single
  units. **Caveat:** conjunct clustering depends on the engine's Unicode version (≥15.1 /
  GB9c); on older ICU, `नमस्ते` may split at the virama. Mitigation: pre-segment Indic by
  orthographic syllable (merge trailing virama+consonant into the preceding cluster). The
  `Array.from()` fallback (no `Intl.Segmenter`) splits every code point and **breaks** Indic
  matras/viramas and RTL — treat it as a last-resort graceful-degradation path, not a target.
- **Connecting scripts (Arabic; future Persian/Urdu/Syriac):** do **NOT** decode as
  independent per-grapheme slots — isolated letters render disconnected forms (م ر ح ب ا) and
  can never preview correct joining. Instead **scramble/crossfade the whole word as one
  shaping unit.** (`Intl.Segmenter` / `<bdi>` do not perform Arabic joining.)
- **RTL positioning:** do **NOT** run the Unicode bidi algorithm on a live-mutating string —
  random per-frame glyphs would recompute every slot's x-position and make slots jump. Lay
  out each grapheme slot as an independently positioned, **direction-locked** DOM box in
  *visual reading order*. Apply `dir` + `<bdi>`/isolates + `lang`
  **only on the final rendered text** for a11y/copy-paste. (For Arabic this is moot — it uses
  the whole-word path.)

## Accessibility (WCAG 2.2)

- **Screen readers:** the animating decode node is `aria-hidden="true"` for its **entire**
  lifetime; **never** `aria-live`/`role=status`/`aria-atomic` (per-frame scramble would fire
  a torrent of garbage). The decorative multilingual cycle is not exposed to AT at all; the
  accessible/indexable text is the **resolved server-rendered page**.
- **Skip control:** a real `<button type="button">` labeled "Skip intro" (aria-label "Skip
  intro animation"), the **first focusable element** in DOM order, persistently visible (not
  hover-only), z-ordered above the canvas (never obscured — WCAG 2.4.11), ≥3:1 background
  contrast, ≥3:1 visible focus ring, hit target ≥24×24 CSS px (prefer 44×44 touch). It is
  the WCAG 2.2.2 pause/hide mechanism and is present from the first `NOISE_IN` frame.
- **Focus contract (WCAG 2.4.3):** on entering `HERO` (completion, skip, reduced-motion, or
  returning-visitor path) move focus to the hero `<h1>` (`tabindex="-1"`). Replay returns
  focus to the Replay button when it re-launches and again when it ends. Overlay removal must
  never drop focus to `<body>`.
- **Reduced motion:** as specified in Sequence — mandatory, no rAF/scramble/transform, live
  subscription. Replay under reduced motion has nothing to animate: relabel/disable it or
  announce a brief polite status ("Intro skipped — reduced motion").
- **Language of parts (WCAG 3.1.2):** each rendered greeting/intro container carries both
  `lang={code}` and `dir`.
- **Contrast:** center word ≥4.5:1 against its *real local* background (backing plate /
  suppressed cells). All functional controls (Skip, Replay, nav, scroll cue) ≥4.5:1 text
  (≥3:1 large) and ≥3:1 for controls/focus rings — only the decorative field is exempt. Use
  explicit hex/opacity targets, not "subtle."
- **Flash/seizure (WCAG 2.3.1):** no region larger than the flash-safe area changes
  luminance/contrast >3×/sec; keep per-cell and center-word luminance deltas small (low-opacity
  greys); no full-field opacity strobes. Add a manual flash check to visual QA.

## Error Handling & Resilience

- `localStorage` unavailable (private mode) → treat as "not seen," never throw.
- `Intl.Segmenter` unavailable → `Array.from()` code-point fallback (documented as degraded
  for Indic/RTL; the resolved hero is unaffected).
- `getContext` returns null → skip the field, render text-only intro, never crash.
- SSR: no `window`/`document`/`localStorage` during server render; deterministic baseline as
  above; server HTML already contains the meaningful page.

## Testing

**Prefer pure functions (no timers):**
- `introMachine` reducer: `NOISE_IN → HELLO_CYCLE → NAME_CYCLE → SETTLE → HERO`; skip and
  reduced-motion shortcuts; **SETTLE resolves `languages[0]` (English)** assertion.
- `decodeFrame` with a seeded RNG: eventually renders the **exact** target string, including
  an RTL/`connecting` entry, and locks CJK/Devanagari as single graphemes.
- **RTL-joining assertion** for Arabic: whole-word path yields the joined form (not
  independent isolated slots) — not merely "eventually equals target."

**Integration (Vitest + RTL):** `vi.useFakeTimers` with faked rAF/`performance` +
`advanceTimersByTime`; `window.matchMedia` mock; `getContext===null` to exercise the
text-only fallback (`Intl.Segmenter` is native under Node). Cases:
- decode node has `aria-hidden`; no `aria-live`.
- focus lands on the hero heading after skip / settle; Replay returns focus.
- Tab reaches the Skip button **without** triggering skip; Escape/Enter/Space skip; Tab /
  arrows / modifier keys do **not**.
- reduced-motion path renders the static hero directly, no scramble, no rAF.
- `useHasSeenIntro` sets/reads the flag; returning-visitor short path.
- **SSR snapshot** shows the visible hero (heading + tagline) and no random scramble output.

**Manual / visual QA:** canvas smoothness on desktop + mobile, RTL Arabic joining, contrast
behind the center word, flash check.

## Project Layout (initial)

```
portfolio/
  app/
    layout.tsx
    page.tsx              # Server Component: renders <Hero/> + sections + <IntroOverlay/>; owns metadata
    globals.css
  components/
    IntroOverlay.tsx      # 'use client' — machine + canvas + decode, fades to reveal hero
    GlyphFieldCanvas.tsx  # 'use client' — presentational canvas
    DecodingWord.tsx      # 'use client' — decode render (aria-hidden)
    Hero.tsx              # Server Component — heading/tagline/nav/scroll cue/replay button
    sections/
      Work.tsx            # Server Component — #work placeholder shell
      About.tsx           # Server Component — #about placeholder shell (skills as mono line)
      Contact.tsx         # Server Component — #contact placeholder shell
  hooks/
    useIntroMachine.ts    # 'use client'
    useHasSeenIntro.ts    # 'use client'
    usePrefersReducedMotion.ts # 'use client'
  lib/
    introMachine.ts       # pure reducer + types (no React/canvas/timer)
    decode.ts             # pure decodeFrame(target, activeElapsedMs, timing, rng)
    rng.ts                # seedable RNG
    languages.ts          # full set + curated subset constants
    timing.ts             # all timing/pacing constants
  docs/superpowers/specs/  # this spec
  (tests co-located as *.test.ts/tsx)
```

## Open Questions

- None blocking. Exact timing values and the curated subset ordering are best tuned live in
  the browser after a first cut.
