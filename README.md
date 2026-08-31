# FitTrack — Fitness & Daily Routine Tracking Platform

A production-ready, full-featured fitness and daily routine tracker built
with **React + TypeScript + Vite + Tailwind CSS v4 + shadcn-style UI +
Supabase**, deployable as a web app (Vercel), installable PWA, and native
Android app (Capacitor).

## ✨ Features

- **Auth** — email/password sign up, login, forgot/reset password, guided
  onboarding wizard that collects body stats & goals.
- **Home Dashboard** — hero health score ring, XP/level progress, streaks,
  today's tasks checklist, quick actions, weekly/monthly progress cards.
- **Calendar** — color-coded month grid (gym day, rest day, PR day, missed
  day, challenge day...) with a full day-detail drill-down view.
- **Workouts** — start/stop gym session timer, strength set/rep/weight
  logger with auto volume + PR detection, cardio session logger (distance,
  duration, pace, calories), exercise library (~30 seeded exercises) with
  per-exercise progression charts, reusable workout templates, full history.
- **Nutrition** — meal logging across 8 meal types, macro summary ring,
  food search, favorites, reusable meal templates.
- **Trackers** — water (circular progress + quick-add + history chart),
  weight (multi-range trend charts), steps, sleep, mood (5-point scale),
  body measurements (13 metrics), progress photos (angle-tagged gallery +
  before/after slider).
- **Gamification** — XP & levelling, points ledger, daily/weekly/monthly
  streaks with milestone bonuses, achievement catalog, custom challenges.
- **Analytics** — aggregate metric cards, weight & health-score trend
  charts, workout heatmap, personal records grouped by category.
- **Reports** — one-click monthly/yearly PDF report generation (jsPDF).
- **Settings** — theme (light/dark/system), unit system, goal targets,
  notification toggles, data export, account deletion, sign out.
- **Design system** — glassmorphism cards, gradient accents, animated
  progress rings, framer-motion transitions, fully responsive (desktop
  sidebar + mobile bottom nav), dark/light mode via CSS variables.
- **Installable PWA** — web manifest + offline-caching service worker.
- **Native Android app** — via Capacitor (see `android_setup/README.md`).

## 🧱 Tech Stack

| Layer      | Choice                                                          |
|------------|------------------------------------------------------------------|
| Frontend   | React 19, TypeScript, Vite 8                                    |
| Styling    | Tailwind CSS v4, CSS-variable theming, shadcn-style primitives   |
| State      | Zustand (auth/UI/active-workout stores)                          |
| Data       | @tanstack/react-query + Supabase JS client                       |
| Forms      | react-hook-form + zod                                            |
| Charts     | Recharts                                                         |
| Animation  | Framer Motion                                                    |
| PDF        | jsPDF + jspdf-autotable                                          |
| Backend    | Supabase (Postgres, Auth, Storage, RLS)                          |
| Mobile     | Capacitor (Android)                                              |

## 📁 Project Structure

```
src/
  components/       shared UI primitives + feature components (dashboard,
                     workout, layout, shared)
  hooks/            react-query hooks per domain (dashboard, workout,
                     nutrition, tracking, analytics, calendar)
  pages/            route-level pages, grouped by domain
  services/         thin Supabase API layer (one file per domain) +
                     scoring.engine.ts (health score / XP / streak logic)
  stores/            zustand stores (auth, ui, active-workout)
  types/            database.types.ts (DB row shapes) + models.ts (view
                     models, XP/points/streak constants)
  utils/            date helpers
  lib/              supabase client, cn() helper
supabase/
  migrations/       0001 schema, 0002 seed data, 0003 storage buckets
android_setup/       Capacitor/Android build guide
```

## 🚀 Setup & Deployment Guide

This walks through everything in order: run it locally first, then push to
GitHub, then deploy the backend/frontend, then build the Android APK.

GitHub isn't strictly required just to run the app on localhost — you only
need it for Vercel's Git-integration auto-deploy (Step 2 can be skipped if
you plan to deploy manually via the Vercel CLI instead).

---

### Step 1 — Run as a web app on localhost

**1.1 Install dependencies**
```bash
npm install
```

**1.2 Create a Supabase project** (needed even for localhost, since the
app talks to a real backend)
1. Go to [supabase.com](https://supabase.com) → **New Project**.
2. Wait for provisioning, then go to **Settings → API** and copy:
   - Project URL
   - `anon` public key

**1.3 Run the database migrations**
In the Supabase dashboard → **SQL Editor**, run these three files **in
order** (copy/paste contents and run each):
- `supabase/migrations/0001_init_schema.sql`
- `supabase/migrations/0002_seed_data.sql`
- `supabase/migrations/0003_storage_buckets.sql`

(Alternative: use the Supabase CLI — `supabase link --project-ref <ref>`
then `supabase db push` — if you have it installed.)

**1.4 Configure environment variables**
```bash
cp .env.example .env.local
```
Edit `.env.local`:
```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

**1.5 Start the dev server**
```bash
npm run dev
```
Open **http://localhost:5173** — register an account, complete
onboarding, and click around.

**1.6 (Optional) test a production build locally**
```bash
npm run build
npm run preview
```
Opens on http://localhost:4173 using the optimized production bundle.

---

### Step 2 — Push the code to GitHub

You need this for the recommended Vercel Git-integration deploy
(auto-deploys on every push). Skip to Step 3 if you'd rather deploy
manually via the Vercel CLI.

**2.1 Initialize git and make the first commit**
```bash
git init
git add .
git commit -m "Initial commit: FitTrack app"
```
The repo's `.gitignore` already excludes `node_modules`, `dist`,
`.env`/`.env.local`, and Android build artifacts — so secrets and build
output won't be committed.

**2.2 Create a GitHub repo**
Go to [github.com/new](https://github.com/new), create a repo (e.g.
`fittrack-app`). Don't initialize it with a README — this project already
has one.

**2.3 Push**
```bash
git remote add origin https://github.com/<your-username>/fittrack-app.git
git branch -M main
git push -u origin main
```

⚠️ Double-check `.env.local` was **not** committed (`git status` should
not show it). Never commit real Supabase keys to a public repo.

---

### Step 3 — Deploy the backend (Supabase)

You already did this in Step 1.3 for local dev — it's the same Supabase
project you'll point production at. No extra work needed unless you want
separate dev/prod Supabase projects (recommended for real production use,
but optional to start).

If you do want separate projects: create a second Supabase project, run
the same 3 migrations against it, and use its URL/key in Vercel's env
vars instead of your local dev project's.

---

### Step 4 — Deploy the frontend to Vercel

**4.1 Import the project**
1. Go to [vercel.com/new](https://vercel.com/new).
2. Connect your GitHub account and select the `fittrack-app` repo.
3. Vercel auto-detects Vite — leave the defaults:
   - Build command: `npm run build`
   - Output directory: `dist`

**4.2 Add environment variables**
In the Vercel project → **Settings → Environment Variables**, add:

| Key | Value |
|---|---|
| `VITE_SUPABASE_URL` | your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | your Supabase anon key |

**4.3 Deploy**
Click **Deploy**. You'll get a URL like `https://fittrack-app.vercel.app`.

**4.4 Whitelist the URL in Supabase**
In Supabase → **Authentication → URL Configuration**, add your Vercel URL
to:
- Site URL
- Redirect URLs (needed for password reset / email confirmation links to
  work)

From now on, every `git push` to `main` auto-redeploys.

---

### Step 5 — Build the Android APK (Capacitor)

Prerequisites: Android Studio installed (includes SDK + JDK).

**5.1 Build the web app** (Capacitor packages the `dist/` output)
```bash
npm run build
```
Make sure `.env.local` has real Supabase values — they get baked into
this build.

**5.2 Add the Android platform (first time only)**
```bash
npm run cap:add:android
```
This creates an `android/` folder — a full Android Studio project,
configured via `capacitor.config.ts`.

**5.3 Sync web assets into the native project**
Run this any time you change frontend code and rebuild:
```bash
npm run cap:sync
```

**5.4 Open in Android Studio**
```bash
npm run cap:open
```
From there:
- **Debug APK**: `Build → Build Bundle(s)/APK(s) → Build APK(s)` → output
  at `android/app/build/outputs/apk/debug/app-debug.apk`
- **Signed release APK**: use Android Studio's *Build → Generate Signed
  Bundle/APK* wizard (creates/uses a keystore)

Full signing instructions (keystore generation, `key.properties`, gradle
config) are in [`android_setup/README.md`](./android_setup/README.md) —
step 5 there covers it in detail.

**5.5 Re-build after future code changes**
```bash
npm run build
npm run cap:sync
npm run cap:open
```

---

### Quick reference — full command sequence

```bash
# Local
npm install
cp .env.example .env.local   # fill in Supabase URL + anon key
npm run dev                  # http://localhost:5173

# GitHub
git init && git add . && git commit -m "Initial commit"
git remote add origin https://github.com/<you>/fittrack-app.git
git push -u origin main

# Vercel: import repo in dashboard, add env vars, deploy

# Android APK
npm run build
npm run cap:add:android   # first time only
npm run cap:open          # build APK from Android Studio
```

## 🗄️ Database Overview

Normalized Postgres schema (see `supabase/migrations/0001_init_schema.sql`)
covering: `profiles`, `settings`, `exercise_library`, `workout_templates` +
`workout_template_exercises`, `workout_sessions`, `strength_exercises`,
`cardio_sessions`, `foods`, `meal_templates`, `meals`, `water_logs`,
`weight_logs`, `body_measurements`, `progress_photos`, `sleep_logs`,
`mood_logs`, `step_logs`, `daily_routines`, `daily_scores`,
`points_ledger`, `streaks`, `achievement_catalog`, `user_achievements`,
`personal_records`, `challenges`, `notifications`. All user-owned tables
are protected by row-level security (owner-only access); reference tables
(`exercise_library`, `achievement_catalog`) are readable by all
authenticated users.

## 🎨 Design System

Theming is CSS-variable based (`src/index.css`), supporting light/dark
mode with utility classes for gradients (`gradient-primary`,
`gradient-secondary`, `gradient-accent`, `gradient-fire`, `gradient-hero`),
`glass-card` (glassmorphism), and `shadow-glow`. All UI primitives live in
`src/components/ui/` and follow a shadcn-inspired API (Button, Card, Input,
Dialog, Tabs, Select, Badge, Progress, CircularProgress, Avatar, Skeleton).

## 📜 License

Proprietary — internal project.
