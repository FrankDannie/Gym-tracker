# Iron Plan

A training companion built from the *Muscle & Weight-Gain Plan*. It turns the document into something you can use in the gym and at your desk:

- **Today**: the session scheduled for the day, with set-by-set logging, last-time numbers, a rest timer and a hold timer for planks, and a prompt to go heavier once you hit the top of the rep range. Cardio, posture and recovery days are checklists.
- **Plan**: the weekly schedule and every session, exactly as written in the document. Swap any day's session from Today.
- **Progress**: weekly averages instead of single readings, a chart with the planned 0.15–0.25 kg/week band, waist tracking, and notes that apply the plan's own adjustment rules.
- **Fuel**: calories, protein and fat against your targets, with quick re-add for meals you eat often.
- **Guide**: progression rules, posture notes and timeline expectations from the document.

Everything is stored in the browser (`localStorage`). There is no backend, no account and no tracking. Use **Settings → Download backup** to move data between devices.

## Run it locally

Requires Node 20.19 or newer (Node 22 recommended; the repo has an `.nvmrc`).

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build into dist/
npm run preview    # serve the production build locally
```

## Put it in git

```bash
git init
git add .
git commit -m "Initial commit: Iron Plan"
git branch -M main
git remote add origin git@github.com:<you>/iron-plan.git
git push -u origin main
```

`node_modules/`, `dist/` and `.wrangler/` are already in `.gitignore`. Commit `package-lock.json`: Cloudflare uses it for reproducible installs.

## Deploy to Cloudflare

The app is a static site, so it needs no server code. Two routes are set up.

### Option A: connect the git repo (recommended)

Every push to `main` then builds and deploys automatically.

1. In the Cloudflare dashboard go to **Workers & Pages**, create a new application and import your git repository.
2. Use these settings:

   | Setting | Value |
   | --- | --- |
   | Build command | `npm run build` |
   | Deploy command (Workers) | `npx wrangler deploy` |
   | Build output directory (Pages) | `dist` |
   | Node version | 22 (the repo has an `.nvmrc`; set `NODE_VERSION=22` if your project ignores it) |

   Workers projects use the deploy command, which reads `wrangler.jsonc`. Pages projects use the output directory and have no deploy command.
3. Save and deploy. Your app is live on a `*.workers.dev` or `*.pages.dev` address; add a custom domain from the project's settings if you want one.

Cloudflare's dashboard wording changes from time to time. If a label differs, the build command and output directory above are what matter.

### Option B: deploy from your machine

```bash
npx wrangler login
npm run deploy     # builds, then runs wrangler deploy
```

`wrangler.jsonc` points at `dist/` and enables single-page-app fallback. Change `name` if you want a different project name.

### What `public/_headers` does

Works on both Workers static assets and Pages. It adds security headers (including a strict Content-Security-Policy), long-lived caching for hashed files in `/assets/`, and `no-cache` for `index.html` and `sw.js` so new deploys reach users promptly. If you later add a third-party script, font or API, loosen the matching CSP directive there.

## Make it yours

| To change | Edit |
| --- | --- |
| Exercises, sets, reps, notes, schedule, nutrition targets, guide text | `src/data/plan.ts` |
| Design tokens (colours, radii) | `src/styles/tokens.css` |
| Progress rules and thresholds | `src/lib/stats.ts` |

Two thresholds are the app's own choices, because the plan describes them in words only:

- `STALL_TOLERANCE_KG = 0.05`: a weekly average within 0.05 kg of the previous week counts as "not increased".
- `WAIST_RISE_CM = 1.5`: a waist rise of at least 1.5 cm across the last few weekly averages counts as "increasing quickly".

The plan's own numbers (100–150 kcal adjustments, 0.15–0.25 kg/week, 2-week rule) are used as written.

The rest timer (default 90 seconds) is an app addition; the plan doesn't specify rest periods. Change or turn it off in Settings.

## Project layout

```
src/
  data/plan.ts        Plan content transcribed from the document
  lib/                Store (localStorage), stats and rules, dates, hash router
  components/         Plate, chart, meters, dialog, toast, rest timer
  screens/            Today, Plan, Progress, Fuel, Guide, Settings
  styles/             Tokens, base, UI
public/               Icons, manifest, service worker, _headers
wrangler.jsonc        Cloudflare config
```

Routing uses the URL hash (`#/progress`), so no redirect rules are needed on any host.

## Notes

This is a personal training guide, not medical advice. As the plan says, adjust to comfort, recovery and available equipment, and consider a physiotherapist for persistent pain or a pronounced posture concern.
