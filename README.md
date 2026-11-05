# FiabaMia — a bedtime fairy tale (PWA)

An installable web app that writes **personalized bedtime stories for children aged 0 to 10**.
A faithful, self-contained re-creation of [fiabamia.com](https://www.fiabamia.com/): same
story, same quiet night-time art direction, same little rituals — rebuilt as an offline-first
Progressive Web App.

> Not affiliated with FiabaMia. Built as a design/engineering study of the original.

## What is in here

**The landing page** — a scroll you can *enter*: a moon, a real star field, letter-by-letter
hero, and an "Awake → Asleep" scale that counts the chapters of the night backwards as you read.
Then: the story recipe (name, age, value, place, little villain) with a live preview page,
music moods you can actually hear, golden words you can tap, voice colours that read themselves
aloud, age groups, parent quotes, Star packs, how it works, FAQ, and a goodnight.

**The app** — `/create`, `/story/:id`, `/library`:

- six-step form (single story or **bedtime series**, names, age band, value, place, mood, villain,
  length, plus optional characters / objects / notes)
- a **story engine** that composes an original story on the device — 12 worlds, 9 values,
  7 little villains, 5 age voices, 3 lengths; every chapter is colour-coded for reading aloud
- music, wind, bells, thunder, owls, water and magic **synthesised with the Web Audio API**
  (no audio files — works offline)
- golden words that play a sound and politely duck the music
- "let's talk about it": three questions at the end of every story
- Stars: 3 free on sign-up, 1 per story, free packs, invite code
- a personal library kept in `localStorage`, series chapters continue from the last one

**The PWA** — web manifest, maskable icons, service worker precache (app shell + fonts + stories
you have read), install prompt, `standalone` display, offline navigation fallback.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build + generated service worker in dist/
npm run preview  # serve the production build
```

## Notes on the build

- **No backend, no keys, no network at runtime.** Stories come from a template/grammar engine
  (`src/lib/storyEngine.ts`), not from a model API — which is what lets the app work in airplane
  mode, in the dark, at 21:40.
- **Fonts** are bundled (`@fontsource`): Cormorant Garamond for the display serif, Jost for UI.
- **Everything else** is hand-written CSS (`src/styles/`), SVG scenery and canvas stars. No image
  assets other than the generated app icons (`npm run icons`).
- `scripts/ssr-check.mjs` renders every page on the server as a smoke test;
  `scripts/dump-story.mjs` prints a generated story to the terminal.

## Structure

```
src/
  lib/        content.ts · storyEngine.ts · audio.ts · store.tsx
  components/ Header · SleepRail · Decor (stars, landscape) · Motion · GoldenLine · Icons · Overlays
  pages/      Landing · Create · StoryPage · Library
  styles/     base.css · landing.css · app.css
public/icons  generated PWA icons
```
