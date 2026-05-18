---
status: scaffold · AC-17
sprint: S6.5
date: 2026-05-12
gate: S7 final audit
---

# Playability Checklist · AC-17

Twelve checks defined per SDD §9.3. Six automated via Playwright (S6.5 deliverable
`tests/e2e/battle-playability.spec.ts`). Six operator-confirmed manually at S7 close.

| # | Check | Verification | Status |
|---|---|---|---|
| 1 | No console errors during a full match | Playwright `page.on('pageerror')` listener · 0 errors during select→clash→result | automated · S6.5 |
| 2 | Animations complete without jank (≥60fps during arrange + clash) | Playwright `--video=on` + visual eyeball + chrome devtools perf | manual · S7 |
| 3 | Error boundary catches catastrophic state | Manual: throw in BattleScene render · verify ErrorBoundary fallback shows | manual · S7 |
| 4 | Mid-match refresh handled (resume or restart) | Playwright reload during clash phase · assert ResultScreen OR restart UI shows | automated · S6.5 |
| 5 | All 5 element-AIs played to completion at least once | Playwright sweep · 5 matches with different opponent elements | automated · S6.5 |
| 6 | Rapid-input doesn't desync state | Playwright `.click({count: 10, delay: 0})` on select · assert state ≤5 selectedIndices | automated · S6.5 |
| 7 | ResultScreen renders for win + lose + draw | Three forced-outcome matches via seed | automated · S6.5 |
| 8 | ElementQuiz persists in localStorage | Playwright completes quiz · reloads · asserts skip-quiz behavior | automated · S6.5 |
| 9 | Tutorial fires for first-time match · re-triggerable from settings | localStorage clear → play → assert tutorial appears | automated · S6.5 |
| 10 | Guide hint-mode dismissible + persists dismissed state | Playwright dismiss · reload · assert no hint shown | automated · S6.5 |
| 11 | Screen-reader announces phase transitions | axe-core ARIA assertions + manual VoiceOver pass | manual · S7 |
| 12 | Keyboard-only completion of full match flow | Playwright `--no-mouse` simulation · complete match with only Tab/Space/Enter/Arrows | manual · S7 |
