# storiesAI — publish it yourself (GitHub → live URL)

Everything is already prepared. `storiesAI-pwa.zip` (in the workspace root, next to this file) contains
the whole project: `index.html` (the built, self-contained app), `src/`, `icons/`, `manifest.webmanifest`,
`sw.js`, `.github/workflows/deploy.yml` and the tests.

---

## Fastest route: GitHub website, no command line

1. **Download the zip** from this chat (`storiesAI-pwa.zip`) and unzip it.
   You get a folder `storiesAI/`.
2. Go to <https://github.com/new>, name it `storiesAI`, keep it **Public**, click **Create repository**.
3. On the empty repo page click **“uploading an existing file”**.
4. Open the unzipped `storiesAI/` folder, select **everything inside it** (not the folder itself) and
   drag it into the browser. Make sure hidden files are included: `.nojekyll` and `.github/`
   (on macOS press `Cmd+Shift+.` to show hidden files; on Windows enable *View → Hidden items*).
   *If the drag-and-drop skips hidden files, use “Add file → Create new file”, type `.nojekyll`,
   leave it empty and commit — the workflow folder can be added the same way via “Add file → Upload files”
   after selecting the `.github` folder.*
5. Commit with the message `storiesAI`.
6. **Settings → Pages → Build and deployment → Source: “GitHub Actions”.**
   The included `deploy.yml` then publishes the site on every push to `main`.
   (Prefer the simplest possible setup? Choose **Source: “Deploy from a branch” → `main` / `/ (root)`** —
   that also works, because `index.html` is committed and self-contained.)
7. Watch it build: **Actions** tab → the “Deploy storiesAI to GitHub Pages” run → after ~1 minute
   your URL appears: **`https://<your-username>.github.io/storiesAI/`**

Open it on your phone → menu → **Install app** (or *Add to Home Screen*). That address is served over
HTTPS, which the service worker and install prompt require.

---

## Command-line route (if you prefer git)

```bash
cd storiesAI
git init -b main
git add -A
git commit -m "storiesAI"
git remote add origin https://github.com/<your-username>/storiesAI.git
git push -u origin main
```

Then Settings → Pages → Source: **GitHub Actions** (or `main` / root), as above.

---

## Making changes after it is live

The app is **generated**: `index.html` is built from `src/`. So edit `src/`, then rebuild and commit.

```bash
# fonts + CSS + JS are inlined into one index.html
python3 build.py

git add -A && git commit -m "tweak: hero spacing" && git push
```

The GitHub Action also runs `python3 build.py` before deploying, so a forgotten rebuild gets caught
(it prints a warning if the committed `index.html` differs from the fresh build).

Where things live:

| I want to change… | Edit |
|---|---|
| headline / scene copy / wizard fields | `src/index.template.html` |
| colours, type, spacing, layout | `src/styles.css` |
| the 3D particle world (forest, path, sky, camera flight) | `src/world.js` |
| the 2D fallback sky | `src/stars.js` |
| the custom cursor + magnetic buttons | `src/cursor.js` |
| stories, options, phrase banks, FAQ, reviews | `src/data.js` |
| sound, music, read-aloud | `src/audio.js` |
| the offline story weaver + optional AI hook | `src/engine.js` |
| screens, routing, state, storage | `src/app.js` |
| app name, icons, install shortcuts | `manifest.webmanifest`, `make_assets.py` |
| offline cache version | `sw.js` (`CACHE = 'storiesai-shell-vN'` — bump it after a big change) |

---

## Running it locally (optional)

```bash
cd storiesAI
python3 -m http.server 8000 --bind 0.0.0.0
# open http://localhost:8000/index.html
```

Serve it rather than double-clicking the file: `file://` blocks the service worker, and the offline
install only works from `http://localhost` or HTTPS.

## Tests (optional, needs Node)

```bash
npm install --no-save jsdom playwright && npx playwright install chromium
node tests/smoke.js         # landing, generation, wizard → reader, library, AI fallback
node tests/screenshots.js   # desktop + mobile screenshots, fails on any console error
node tests/offline-check.js # real service-worker offline reload
node tests/cursor-shots.js  # custom cursor + magnetic hover
node tests/world-check.js   # WebGL world boots, screenshots along the flight
```

---

## Using a different host

`index.html` is a single file with no external requests, so any static host works as-is:
**Netlify / Cloudflare Pages / Vercel** → “import from GitHub”, build command `python3 build.py`,
publish directory `/`. **Firebase Hosting**, **S3 + CloudFront**, etc. work too — just make sure it is
served over **HTTPS** and that `sw.js` is served from the site root (scope must be `/`).

---

## About connecting GitHub in a new chat

This chat has no GitHub connection enabled, so I cannot push to your account from here — the zip plus
the two-minute upload above is the reliable path, and the repo then owns the code.

If you want me to do the git work in a **new chat**: enable/authorise GitHub for that conversation first
(if it is offered there), then send me the repo URL and say “push this project to that repo”. Without an
authorised connection I can only prepare the files and the commands — I will not ask for your password,
token or any credential in chat.
