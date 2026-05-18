---
date: 2026-05-17
type: cleanup-defer
status: active
command: pnpm check
---

# Cleanup Deferred Errors

`pnpm check` currently fails at `oxlint` before `oxfmt --check` and `tsc --noEmit`.

Fixed in cleanup scope:
- `app/battle-v2/_components/vfx/effects/ZoneScene.tsx` — `== null` checks replaced with explicit `=== null`.
- `app/battle-v2/_components/vfx/effects/LeafPuff.tsx` — optional `swaySeed` check made explicit.
- `app/battle-v2/_components/vfx/effects/Rock.tsx` — optional `moss` check made explicit.
- `app/battle-v2/_components/vfx/effects/leafExtractors.ts` — optional `moss` check made explicit; dead helper removed.
- `app/battle-v2/_components/vfx/authoredNormals.ts` — unused import removed.

Deferred:
- `.agents/skills/bridgebuilder-review/resources/**` — 24 remaining `eqeqeq` errors.

Why deferred:
- `.agents/skills/**` is local agent skill/tooling surface, not the compass app substrate being cleaned in this pass.
- Changing the bridgebuilder skill pack would be a cross-lane tooling refactor with behavior risk outside the Janitor target.
- The app/VFX cleanup-scope files now pass scoped `oxlint`, scoped `oxfmt --check`, and `pnpm typecheck`.

Evidence commands:
- `pnpm exec oxlint --quiet app/battle-v2/_components/vfx/effects/leafExtractors.ts app/battle-v2/_components/vfx/effects/ZoneScene.tsx app/battle-v2/_components/vfx/effects/LeafPuff.tsx app/battle-v2/_components/vfx/effects/Rock.tsx app/battle-v2/_components/vfx/authoredNormals.ts lib/scene/atmosphere.tsx lib/scene/elementAmbient.tsx lib/scene/useScenePhase.ts app/battle-v2/_components/CardFace.tsx lib/cards/bridge.ts` → 0 warnings, 0 errors.
- `pnpm exec oxfmt --check <cleanup touched files>` → all matched files use the correct format.
- `pnpm typecheck` → 0 errors.
