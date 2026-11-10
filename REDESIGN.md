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
| No atmosphere per section | one global sky | per-section accent tint, parallax layers, light pools, chapter numerals |
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
