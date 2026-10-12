# EDPT Trainer — project guide for Claude Code

Unofficial study app for the U.S. Air Force **EDPT (Electronic Data Processing Test)**.
The full product spec is `EDPT_APP_PROMPT.md`. Read it before any non-trivial change. This file
covers how the codebase is laid out and the rules for working in it.

## Stack
- TypeScript + React 19 + Vite, Tailwind v4 (`@tailwindcss/vite`), installable PWA (`vite-plugin-pwa`).
- Local-first: Dexie (IndexedDB) holds all user data. No backend. No network calls at runtime.
- Tests: Vitest. `npm run check` = typecheck + tests. Run it before every commit.

## Commands
```
npm run dev        # dev server
npm run build      # tsc -b && vite build
npm run test       # vitest run
npm run typecheck  # tsc -b
npm run check      # typecheck + test
npm run smoke      # Playwright end-to-end run of the built app (build first; CHROMIUM_PATH=... to reuse a browser)
```

## Layout
```
src/
  generators/   Pure, seeded question generators. One file per question type.
                Each exports `generate(seed, difficulty): Question` and a RULE_FAMILIES list.
                No React, no DB, no Date.now(). Fully unit-tested.
  engine/       Session, timer, scoring, spaced repetition, study plan, readiness. Pure logic.
  content/      Lessons, strategy guide, glossary, reference tables (cutoffs, retest policy).
  db/           Dexie schema and typed accessors.
  ui/           React components, pages, hooks. The only place that touches the DOM or DB.
  types.ts      Shared types (Question, QuestionType, Attempt, ...).
scripts/smoke.mjs  Browser smoke test that drives every main flow and fails on console/page errors.
```

## Rules that must hold
1. **Original content only.** Never reproduce or imitate real, leaked, or copyrighted EDPT items.
2. **Generators are pure and seeded.** Same `(seed, difficulty)` → identical question. Use `rng.ts`,
   never `Math.random()` inside `generators/` or `engine/`.
3. **Every generated question has exactly one correct answer** and no distractor equal to it.
   Options are shuffled by seed. The generator tests enforce this for every rule family at every
   difficulty 1–5; keep those tests passing when adding families.
4. **Explanations teach the rule** in the format: Pattern / How to spot it / Trap.
5. **Uncertain test facts are constants with a disclaimer.** Question count, time limit, score cutoffs,
   and retest policy live in `src/content/reference.ts`. Do not hard-code them elsewhere, and keep the
   "verify with your recruiter / MPF" note visible wherever they are shown.
6. **Figures are generated SVG**, described by a `FigureSpec`, rendered by `ui/Figure.tsx`.
   Screen-reader labels describe the figure without revealing the answer.
7. **Accessibility:** keyboard operable, visible focus, WCAG AA contrast, respect reduced-motion.
8. **Mobile-first.** The timed exam must work on a phone.

## Adding a rule family
1. Add a `RuleFamily` entry to the relevant generator (id, name, minDifficulty, `build(rng, difficulty)`).
2. `build` returns stem, correct answer, distractors (3–4), explanation, and `ruleId`.
3. Run `npm run test` — the shared generator test suite picks it up automatically.
4. Add a lesson paragraph for the rule in `src/content/lessons/`.

## Conventions
- Commit after each vertical slice; the app must run at every commit.
- Keep components small; put logic in `engine/` so it can be tested without React.
- Do not add dependencies without a reason stated in the commit message.
