# Battle V2 Asset Baseline

This folder's asset surface is agent-facing. The deterministic entrypoint is:

```bash
pnpm assets:scan
pnpm assets:scan -- --json
```

The scanner emits `media-index.generated.ts`, which is the FenceLayer catalog used by `media-match.ts`.

## Sources

| Source | Role | Default path |
| --- | --- | --- |
| `purupuru-assets` | Source library and manifest authority | `/Users/zksoju/Documents/GitHub/purupuru-assets` |
| `world-purupuru` | Deployed world subset and Sky-Eyes reference | `/Users/zksoju/Documents/GitHub/world-purupuru/sites/world/static` |
| `compass` | Assets already servable in this app | `public/` |

Override source paths with `PURUPURU_ASSETS_ROOT` and `WORLD_PURUPURU_STATIC`.

## Agent Contract

Each `MediaEntry` carries:

- `source`, `sourcePath`, `sha256`, and `bytes` for provenance.
- `semanticTags`, `labelQuality`, and `category` for deterministic matching.
- `migrationStatus` and `publicUrl` so agents know whether an asset is usable in Compass now.
- `storage.consumerLabel` and `storage.storageKey` as the future Freeside storage/AWS bridge.

Use `labelQuality: "numeric-id"` as a cue that the asset still needs human naming before it should drive product copy or visual decisions.

## Freeside Storage Bridge

No AWS upload happens here. The scanner only emits stable storage hints:

- consumer label: `purupuru:battle-v2-devtools:v1`
- bucket env: `FREESIDE_STORAGE_BUCKET`
- CDN env: `FREESIDE_STORAGE_CDN_BASE_URL`
- object key shape: `Purupuru/<source>/<path>`

That matches the Freeside pattern: local deterministic catalog first, live adapter later.
