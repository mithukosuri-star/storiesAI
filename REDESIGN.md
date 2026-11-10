# storiesAI — cinematic redesign (implementation notes)

## What was analysed

**Reference (fiabamia.com)** — full-bleed scroll-driven night sky; one idea per screen;
huge serif/italic display type with wide negative space; a fixed vertical chapter rail
(`AWAKE / ASLEEP`); persistent minimal chrome (wordmark, sign-in, CTA, sound);
scroll-linked particle scenes that morph per chapter; interactive demo rows
(music pills, golden sound words, voice colours, age chips); editorial "spread"
headings in letterspaced uppercase; long quiet pauses between statements.

**storiesAI (before)** — already had the particle sky (`world.js` WebGL + `stars.js`
fallback), nine sky modes, the golden sound words, the offline story engine, the
wizard, reader, library and PWA shell. The bones were right, the *presentation* was not:

| Problem | Evidence | Fix |
|---|---|---|
| Content was nearly unreadable | every scene was dimmed to `opacity ≈ .3` unless dead-centre, plus blur/scale | replaced with an IntersectionObserver reveal: content arrives crisp and stays crisp |
| The cookie card covered the whole story on first visit | full-width card, centred, permanent until answered | slim bottom bar, delayed, never over the hero copy |
| All sections looked the same | centred headline + chips on the same starfield | 13 distinct editorial compositions (spread, split, ledger, pinned panel, spectrum, timeline…) |
| Demos were labels, not demonstrations | music was 4 pills, ages were 5 pills | real players: mood dial + waveform + stop/mute, voice spectrum with sample passages, age timeline with example openings |
| No atmosphere per section | one global sky | per-section accent tint, parallax layers, light pools |
| Typography had one voice | display / spread / script mixed by accident | strict scale: display serif, italic script accents, uppercase Jost micro-labels, 62ch body measure |
| Missing sections from the brief | no stars/credits explanation, no "atmosphere" demo | added section IX (Stars / credits) and the atmosphere half of the music chapter |

## Motion approach

GSAP is *not* used: the deliverable is one self-contained offline `index.html` with no
CDN and no dependency budget, so adding GSAP would break the offline contract.
The same vocabulary is implemented by hand, cheaply:

* `[data-reveal]` — IntersectionObserver, `opacity + translateY + clip`, staggered with `--i`.
* `[data-parallax]` — one shared rAF loop, transform-only, disabled under reduced motion / coarse pointers.
* sticky pinned panels for the music chapter (no scroll hijacking; native scrolling untouched).
* scroll progress drives the rail, the chapter label and the sky mode.
* `prefers-reduced-motion` removes transforms and keeps short fades.

## Preserved

All business logic: local story engine (`engine.js`), WebAudio scores (`audio.js`),
wizard → generating → reader → library flow, stars pouch, languages, PWA/offline,
export/import, settings, print, share, clipboard, wake lock, reading focus.

## Second pass — fidelity to the reference's *quiet*

A visual audit of the built page against fiabamia.com found places where the redesign
had drifted into landing-page habits the reference never uses. Each was removed rather
than decorated around:

| Was | Why it was off | Now |
|---|---|---|
| Chapter numerals `01 … 09` and `✦` dividers between scenes | invented furniture; the reference lets negative space divide chapters | removed from markup and CSS; chapters are separated by height and light alone |
| Music chapter: two-pane split, bordered player box, button toolbar | reads as a product dashboard | one centred column: glowing orb, mood name, waveform, text-link transport, then a **row of four circles** with labels + italic one-line hints |
| Voice chapter: bordered cards | card grid | four borderless coloured circles, centred, over a single ruled sample passage |
| Stars: three "pack" cards with prices | pricing-page pattern | a three-column **ledger** of serif numerals (`3 · 1 · 0`) over hairline rules, plus one italic line and one quiet text link for the free top-up |
| How-it-works appended to the FAQ scene | one scene holding two unrelated ideas, 2 scenes' worth of height | split into `IX · How it works` (six prose bars) and `X · Questions` (narrow FAQ column) |
| Reviews as boxed cards | SaaS testimonial tiles | borderless quotes on a hairline, in a masked, snap-scrolling track |
| Two-column footer link grid | site-map footer | centred lockup, italic strapline, one wrapped link row, hairline note |
| Violet body gradient | too purple for "near-black navy" | deep navy radial washes on both `body::before` states |
| Ledger with `0N` counters | SaaS numbering | italic script labels only |

Details tightened in the same pass: display leading to `1.02–1.05` with `-.03em`
tracking, `.script-huge` to `1.0`, spread headings to `.16em`, body measure locked to
`--measure`, and a keyboard **skip link** to `#main`.

Also fixed in the same pass: the pinned music chapter now starts at the top of its scene
instead of centring when the composition is taller than the screen (phones, laptops), so
the heading never hides under the fixed chrome.

Verified after the pass (headless Chromium, 360 / 390 / 768 / 834 / 1024 / 1280 / 1440 /
1920 px): no horizontal overflow at any width, zero console errors, all 11 rail chapters
land on the scene their label names, mood → play → mute → stop, golden-word taps, voice
colour selection, age panel swap, FAQ expand, free-Stars modal, and a full wizard →
weaving → reader → library run (3 → 2 Stars, one story saved). Reduced-motion run: all
reveals visible, no transform animations, tab order starts at the skip link.

## Final refinement pass · every remaining weakness

A full audit of the built page (landing + wizard + reader + library + dialogs) at
desktop and phone widths, with the actual console, the actual audio, the actual
storage and an automated small-text contrast sweep. What was still wrong, and what
was changed:

### Bugs found by testing, not by looking
| Found | Cause | Fix |
|---|---|---|
| The reader toolbar drifted up **under** the fixed chrome while scrolling | `overflow-x:hidden` on `body` makes it a scroll container, which silently kills `position:sticky` on every descendant | `overflow-x:clip` on `html`/`body` |
| Route changes flew through 15,000 px of the landing page | `html{scroll-behavior:smooth}` also applied to `window.scrollTo(0,0)` | explicit `behavior:'instant'` on route change |
| The music chapter's "pin" never pinned | scene height equalled sticky height, so there was no travel | scene `min-height:168svh`, sticky `100svh`, composition compacted to fit |
| The topbar scrim had been neutralised | `isolation:isolate` on `::before` created its own stacking context, so `z-index:-1` no longer went behind the bar | isolate on `.topbar`, scrim pinned at `top:-26px` with its own height |
| FAQ answers clipped | hard-coded `max-height:360px` | measured `scrollHeight`, `hidden` when closed, real `aria-controls`/`role=region` |
| Small text failed AA | `--dim` was 4.5:1, corner labels 3.6:1, footer links 4.0:1 | dim tier lifted to ~6.2:1, corner/footer/meta moved to ≥5.5:1 (swept automatically until clean) |
| Emoji on story covers and in the sound feedback | platform-dependent glyphs broke the hairline icon language | drawn `ICONS` mappings + `✦` |

### What was made to feel handcrafted
- **Chapter transitions** — every scene now carries a soft accent bloom into the next; two enormous drifting light pools breathe behind the whole night (64 s, off for reduced motion and on phones).
- **One button vocabulary** — outline, gold, pill, tool, circle and card all answer with the same hairline warmth, 1 px press and gold bloom; one gold focus ring everywhere.
- **The music chapter** — genuinely pinned now: the composition holds still for 68 svh while the sky passes behind it.
- **The wizard** — directional page-turn between steps, numbered progress with `aria-valuenow`, inline validation (shake + `role=alert`), a sticky primary bar on phones, help text in the script voice.
- **The reader** — a bookmark rail down the left edge that fills per chapter, chapter dots that follow the eye instead of only clicks, a no-wrap toolbar, a page with a lit spine, and paragraph focus that *lifts* the current line instead of dimming the rest to 35 %.
- **The library** — drawn glyph covers, hairline metal frame, an empty state that reads like an invitation.
- **The menu** — three doors and a settings list instead of nine identical pills.
- **Performance** — the particle sky pauses behind any dialog and only runs at full strength on the landing page; a hidden tab for over two minutes frees the WebGL context and rebuilds it on return. Measured: LCP 453 ms, CLS 0.001, ~800 DOM nodes.
- **Accessibility** — skip link, focus trap + restore + Esc in dialogs, `aria-live` toast that re-announces, chapter dots with real labels, progress semantics, and a contrast sweep that now reports zero failures.
