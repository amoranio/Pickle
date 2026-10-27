# Pickle — a little brain adventure

A responsive, account-free learning site starring Pickle, an original green dinosaur. Built with React, TypeScript and Vite. Browser-local progress; no analytics, backend or runtime AI.

## Develop and verify

Use Node 22 or later:

```sh
npm ci
npm run dev
npm test
npm run build
```

Two top-level hash routes work on static hosts: `#flash-cards` and `#maths`. The Flash Cards page is the default. Nested routes open individual packs and games.

## Learning

- 30 spelling and 30 vocabulary cards, evenly split between Year 3–4 foundations and Year 5 extension. Reveal/self-rate, multiple-choice and typed-answer modes.
- Number and times-table flash cards; ten-card practice sessions favour previously missed literacy cards.
- Table Trainer: individual tables 1–12 or a mixture, multiplication, inverse division and missing factors.
- Pickle Sprint: 30/60/120-second rounds of mental arithmetic. Timer pauses when the page is hidden; changing level starts a fresh round.
- Challenge Trail: ten arithmetic, fraction, decimal, percentage and number-property questions.
- Puzzle Missions: five untimed multi-step word problems and sequences.
- Warm-up, Year 4 Mix (8 foundation/2 extension), Year 5 Mix (2 foundation/8 extension) and Stretch. Stretch is labelled as introductory Year 6.
- Hints and retries do not earn first-attempt mastery. Self-rated recall is recorded as self-reported success. Completion gives 20 points plus 10 per solved question. Sprint bests are separated by level and round length.

Number content is informed by [England's Department for Education mathematics programme](https://www.gov.uk/government/publications/national-curriculum-in-england-mathematics-programmes-of-study/national-curriculum-in-england-mathematics-programmes-of-study). This is focused number practice, not full curriculum coverage. Geometry, measurement and statistics are intentionally outside this release.

## Structure and storage

- `src/engine.ts`: typed question generators, exact fraction/decimal comparisons, choice generation and curriculum mixes.
- `src/content.ts`: curated literacy prompts, hints and answers.
- `src/progress.ts`: versioned progress, topic accuracy, recommendations, rewards and duplicate-completion protection.
- `src/App.tsx`: setup, navigation, sessions and gameplay; `src/Pickle.tsx`: original scalable character illustrations.

`pickle-progress-v1` in local storage holds points, preferences, mastery, missed cards, topic accuracy, session history and best scores. `pickle-session-v1` in session storage restores the current activity after refresh. Finish later returns to the activity list without discarding the session. A new activity replaces the resumable session. Clearing browser data resets progress. Unavailable storage does not prevent play. No progress syncs between devices.

Fonts currently load from Google Fonts with system fallbacks; all learning content and character artwork ship with the site. No child details are collected.

## Hosting

The GitHub Actions workflow checks every pull request. On `main`, successful tests and a build deploy to GitHub Pages. In repository Settings → Pages, choose GitHub Actions as the build source. Relative asset paths support `https://amoranio.github.io/Pickle/`. No custom domain or DNS change is included.

The original Cbear site is independent and unchanged. Review and merge the implementation PR before production release.
