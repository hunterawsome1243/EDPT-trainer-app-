# EDPT Trainer

An unofficial, all-in-one study app for the U.S. Air Force **Electronic Data Processing Test (EDPT)**,
the aptitude exam used for cyber and programming career fields (1D7X1, legacy 1B4X1, 17S/17D and others).

It runs as an installable web app (PWA) on phone or desktop, works offline, and keeps every bit of
progress on the device. There is no backend and no account.

> **Disclaimer.** This project is not affiliated with the U.S. Air Force. Question counts, time
> limits, cutoff scores and retest rules are taken from commonly cited sources and may be out of
> date. Verify with your recruiter or Military Personnel Flight (MPF). All questions are generated
> by the app's own generators; none are taken from the real test.

## What it does

- **Learn** – six modules (number sequences, letter sequences, arithmetic reasoning, figure
  patterns, logical reasoning, reading and verbal), each with concept explanations, worked
  examples, a "spot it in 10 seconds" checklist, common traps, and a mastery check that unlocks the
  next difficulty tier. Plus a test-strategy guide, timed mental-math drills, a browsable rule
  library, a glossary and an exam-facts page.
- **Practice** – procedurally generated questions (effectively infinite) from 70+ rule families,
  each at five difficulty levels, with a Pattern / How to spot it / Trap explanation. Modes: untimed
  with instant feedback, timed per question, weak-areas-only, spaced review of due rules, and
  re-do recent mistakes. Difficulty adapts automatically.
- **Simulate** – full, half and quarter-length timed exams with the real section mix, a countdown,
  flag-for-review, an on-screen scratch pad, optional no-backtracking, and resume after closing the
  app. The report shows raw score, an estimated score band, per-section accuracy and pace,
  right-but-slow items, and the rules you missed.
- **Analyze** – readiness meter against your target career field, daily accuracy and pace trends,
  simulation history, and a per-rule heatmap.
- **Plan** – a day-by-day study plan from your test date and minutes per day that rebalances toward
  weak areas and schedules simulations.
- **Settings** – target AFSC, test date, scoring model (penalty or no penalty), theme, larger text,
  reduced motion, JSON export/import, and a full reset.

## Getting started

```
npm install
npm run dev        # http://localhost:5173
```

Other commands:

```
npm run build      # typecheck + production build into dist/
npm run preview    # serve the production build
npm run test       # unit tests (generators, engine, database)
npm run typecheck  # tsc only
npm run check      # typecheck + tests
npm run smoke      # end-to-end browser test of the built app (needs `npm run build` first)
```

The smoke test uses Playwright. Run `npx playwright install chromium` once, or point it at an
existing browser with `CHROMIUM_PATH=/path/to/chrome npm run smoke`.

## How it is built

- TypeScript, React 19, Vite, Tailwind v4, `vite-plugin-pwa`, Dexie (IndexedDB), Vitest.
- `src/generators/` – pure, seeded question generators, one file per question type. Every question
  has an id of the form `type:rule:difficulty:seed` and can be rebuilt from it.
- `src/engine/` – exam assembly, scoring, SM-2 spaced repetition, readiness, study plan.
- `src/content/` – lessons, strategy guide, glossary, mental-math drills and `reference.ts`.
- `src/db/` – Dexie schema, settings, export/import, aggregate queries.
- `src/ui/` – React pages and components. Figures are rendered as SVG from a `FigureSpec`.

See `CLAUDE.md` for the working rules of the codebase and `EDPT_APP_PROMPT.md` for the full spec.

## Adding a rule family

1. Open the generator for the question type, for example `src/generators/numberSequence.ts`.
2. Add an entry to its `*_FAMILIES` array with an `id`, `name`, `minDifficulty` and a `build(rng,
   difficulty)` that returns the stem (or figures), the correct answer, three or four distractors and
   an explanation. Use only the `rng` passed in, never `Math.random()`.
3. Run `npm run test`. The shared suite in `src/generators/generators.test.ts` automatically checks
   the new family at every difficulty and 40 seeds: one unique correct answer, no duplicate options,
   deterministic by seed, and generated in under 50 ms.
4. Add a line for the rule to the module's `rules` list in `src/content/lessons/`, so it appears in
   the lesson and the rule library.

## Adjusting exam facts and scoring

Everything uncertain lives in `src/content/reference.ts`:

- `EXAM.questionCount`, `EXAM.timeLimitMinutes`, `EXAM.guessingPenalty` (the default for the
  scoring model; users can override it in Settings), `EXAM.retestPolicy`.
- `SECTION_MIX` – the proportion of each question type in a simulation.
- `CUTOFFS` – commonly cited minimum scores per AFSC.
- `estimateScore()` – the rough mapping from percent correct to an EDPT score band. The real scale
  is not published, so this is deliberately conservative and always labelled as an estimate.

The disclaimer text is shown wherever these values appear.

## Assumptions made

- The exam is modelled as about 120 items in 90 minutes with no calculator and scratch paper
  allowed. These are the most commonly cited figures, not official ones.
- The section mix used for simulations is an approximation.
- No penalty for wrong answers is the default; the strategy guide's guessing advice changes when
  the penalty model is selected.
- Score bands are estimates for planning, not predictions.
