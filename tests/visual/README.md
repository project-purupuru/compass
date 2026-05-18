# Visual regression — `/battle`

Three Playwright snapshots covering the major battle phases:

- `arrange-default` — picked element, 5 player cards + 5 face-down opponents
- `clashing-impact` — 3rd clash mid-impact, hitstop flash, stamps on cards 0–2
- `result-player-wins` — match end, p1 5-2 victory

## First run (generate baselines)

```bash
# 1. Install Playwright browsers if you haven't already (200MB)
pnpm dlx playwright install --with-deps chromium

# 2. Make sure the dev server is up (the playwright.config.ts will
#    auto-start it if it isn't, but warm cache helps)
pnpm dev &

# 3. Generate baseline screenshots
pnpm test:visual:update

# 4. Inspect the generated images under __snapshots__/
ls tests/visual/__snapshots__/

# 5. Commit the baselines
git add tests/visual/__snapshots__
git commit -m "test(visual): commit baseline screenshots"
```

## CI / pre-push runs

```bash
pnpm test:visual
```

Tests compare against committed baselines with `maxDiffPixels: 200`
tolerance. Failures dump the actual + diff under
`tests/visual/__snapshots__/__diffs__/`.

## How the tests work

Each test:

1. Navigates to `/battle?dev=1&seed=fixed-seed-visual`
2. Waits for `__PURU_DEV__` to install (signal that the dev panel mounted
   and exposed the global)
3. Dispatches `beginMatch(seed)` + `chooseElement("wood")` via the dynamic
   import of `match.client.ts` (this populates `p1Lineup` and `p2Lineup`
   deterministically from the seed)
4. Injects the fixture's snapshot patch via `__PURU_DEV__.injectSnapshot()`
5. Waits for `networkidle` + 400ms for CDN images to settle
6. Captures the screenshot

The fixtures (`fixtures/*.json`) are partial `MatchSnapshot` patches —
they overlay onto the live snapshot via shallow-merge in `match.live.ts`.

## When a test fails

1. If the diff is intentional (you changed the UI):
   ```bash
   pnpm test:visual:update
   git add tests/visual/__snapshots__
   ```
2. If the diff is a regression: read `tests/visual/__snapshots__/__diffs__/<test>.png`
   to see exactly what changed.

## Configuration

See `playwright.config.ts` — the `visual` project sets:
- `reducedMotion: "reduce"` so animations land instantly
- `viewport: 1280×800` for deterministic dimensions
- `maxDiffPixels: 200` per `toHaveScreenshot`
