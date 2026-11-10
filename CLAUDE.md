# CLAUDE.md

This file gives Claude Code guidance for working in this repository.

## Overview

Rizq (رزق) is a Brogue-inspired, turn-based roguelike set in modern Kuwait, live at https://rizq.sala.company. The player explores 26 depths across five zones (Neighborhood, Shuwaikh Industrial, Wafra Farms, Winter Camps, Deep Desert), trades and builds a herd, and wins by reaching 100,000 KD net worth and returning home. It is plain HTML/CSS/JavaScript with no framework and no build step. It is drawn on a canvas and works on desktop and phones, with an on-screen touch pad.

## Commands

```bash
npm run dev                      # node tests/serve.mjs: static server on http://localhost:4174 (PORT env overrides), no-store caching
npm install                      # installs @playwright/test (the only dependency)
npx playwright install chromium  # one-time browser install
npm test                         # playwright test: runs tests/e2e/*.spec.mjs (starts serve.mjs automatically)
```

There is no linter or bundler. You can also open `tests.html` from a local server for in-browser "Run checks" (level connectivity, taming, trader, herd, save/load) and "Run balance" (a bot plays full games). Use balance runs after changing numbers.

## Architecture

- `index.html` holds the page markup and all CSS. It loads `app/*.js` as **classic `defer` scripts that share one global scope**, in this order: `data.js`, `mapgen.js`, `world.js`, `game.js`, `ai.js`, `save.js`, `render.js`, `ui.js`, `input.js`. Order matters: keep it when adding files, and don't convert them to modules.
  - `app/data.js`: constants and data tables (tiles, zones, animals, traders, items).
  - `app/mapgen.js`: per-zone level generation, stairs, deal rooms, populating depths.
  - `app/world.js`: current-level helpers, messages, feedback/sound, field of view.
  - `app/game.js`: run start, depth changes, inventory, player actions, turn engine. The global game state is `G` and the player is `P`.
  - `app/ai.js`: animal behavior, auto-explore, travel, resting.
  - `app/save.js`: serialize/deserialize. `SAVE_VERSION` (currently 3) is stored in saves. `deserialize` migrates older saves (e.g. barley to dates, defaults for `bank`/`herdStay`) and rejects newer ones. If you change the save shape, bump `SAVE_VERSION` and add a migration so old saves keep loading.
  - `app/render.js`: map drawing and zoom. `app/ui.js`: sidebar, inspect, bag, trader, end screen. `app/input.js`: keyboard/mouse/touch, title screen, boot.
- `tests.html`: an in-browser test runner that exposes `window.rizqTests` (used by the Playwright suite). It is **not** deployed.
- `tests/e2e/rizq.spec.mjs`: Playwright tests covering game checks, a bot playing several depths, the desktop title/new run/auto-explore flow, and a phone layout check (the touch pad shows and the page never scrolls sideways). Any uncaught page error fails a test.
- `check.html`: a bare device-diagnostics page (screen, localStorage, canvas, modern JS, Google Fonts reachability).
- Fonts load from Google Fonts (IBM Plex Mono/Sans, Reem Kufi). There is no service worker.

### localStorage keys

`rizq-save` (current run, auto-saved; removed when the run ends), `rizq-sound`, `rizq-zoom`, `rizq-daily-<date key>` (best daily-run result). Saving can fail in private or blocked storage. The game reports this in-game instead of failing silently, so keep every storage access wrapped in try/catch.

## Deployment

`.github/workflows/deploy.yml` ("Test and deploy") runs on every push (all branches), on PRs and on manual dispatch:
1. The `test` job runs Node 22, `npm install`, Playwright with Chromium, and `npx playwright test`.
2. The `deploy` job runs only on `main` (not PRs) and only if tests pass. It copies `index.html check.html CNAME app` into `_site/` and deploys it with `actions/deploy-pages` (GitHub Pages via Actions).

**Pushing to `main` deploys to the live site** once tests pass. `CNAME` sets the custom domain `rizq.sala.company`. If you add a new top-level file or folder the site needs, add it to the `cp` line in the workflow, or it won't be published.

## Conventions and gotchas

- The GoatCounter analytics snippet at the bottom of `index.html` (endpoint `https://salacompany.goatcounter.com/count`, paths prefixed with `location.host`, skipped on localhost) must stay intact.
- Mobile matters. The layout is a one-screen console with `overflow:hidden`, `viewport-fit=cover` and a touch pad. The e2e phone test asserts there is no horizontal scroll.
- The UI is in English, with Arabic used only for branding (Reem Kufi) and flavor text. The page is LTR.
- Daily runs and seeds make generation deterministic: game logic uses `rand()` (backed by the seeded `gameRng` in `app/data.js`, state in `G.rs`), not `Math.random`, so seeds replay identically.
