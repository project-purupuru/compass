---
date: 2026-05-17
type: cleanup-evidence
status: zero-orphans
scope: app/battle-v2/_components/vfx/effects
---

# Effects Orphan Hunt — 2026-05-17

Command shape used:

```sh
for f in app/battle-v2/_components/vfx/effects/*.tsx; do
  base=$(basename "$f" .tsx)
  refs=$(grep -rln "effects/$base\\|import.*$base\\b" app/ lib/ \
    --include="*.tsx" --include="*.ts" | grep -v "$f")
  [ -z "$refs" ] && echo "ORPHAN: $f"
done
```

Outcome: no `ORPHAN:` lines emitted.

Disposition: commit the referenced effect files. No archive/tombstone move needed.
