# S0 Spike Report · 2-Tab Framing Validation

**Cycle**: honeycomb-engine-2026-05-19 · **Sprint**: S0 · **Task**: bd-3kl + bd-2xb
**Generated**: 2026-05-19T03:48:00.796Z

## Method

Walked all 9 cycle-1 effect adapters · called `inspector.listInspectableNodes(state)` with minimal fixture state · classified each `PointerSegment` in each node's `pointerChain` as **BUILD**, **LIBRARY**, or **AMBIGUOUS**.

**Classification rules**:
- `Pantry` segments → **LIBRARY** (codex/asset entry)
- `Primitive` segments with `/codex/` or `cards+codex` paths → **LIBRARY** (asset descriptor)
- `Primitive` segments otherwise → **BUILD** (render module)
- `Consumer` segments → **BUILD** (substrate wiring)
- `Scene` segments → **BUILD** (composition authoring)

## Per-Adapter Classification

| Adapter | Nodes | Segments | BUILD | LIBRARY | AMBIGUOUS |
|---|---|---|---|---|---|
| `big-realm-scene` | 1 | 2 | 2 | 0 | 0 |
| `card-composition` | 5 | 19 | 10 | 9 | 0 |
| `card-lab` | 4 | 11 | 11 | 0 | 0 |
| `hex-scene` | 4 | 11 | 11 | 0 | 0 |
| `mini-scene` | 4 | 11 | 11 | 0 | 0 |
| `realm-scene` | 1 | 2 | 2 | 0 | 0 |
| `tree-fall` | 1 | 2 | 2 | 0 | 0 |
| `water-splash` | 1 | 2 | 2 | 0 | 0 |
| `zone-scene` | 1 | 2 | 2 | 0 | 0 |

## Totals

- **Total segments**: 62
- **BUILD**: 53 (85.5%)
- **LIBRARY**: 9 (14.5%)
- **AMBIGUOUS**: 0 (0.0%)
- **Clean classification %**: 100.0%

## Verdict

### **GREEN**

✓ 2-tab framing (BUILD + LIBRARY) is **safe to commit to** for S2 chrome rebuild. ≥80% of segments map cleanly to one tab without forcing cross-tab visibility.

**Recommendation**: proceed with S1 (shadcn install) and S2 (chrome rebuild) using BARTH's 2-tab + Play header button verb-set as ratified.

## Detailed Segment Breakdown

### big-realm-scene (1 node)

| # | Verdict | Tag | Reason |
|---|---|---|---|
| 1 | **BUILD** | `Primitive` | Primitive render module (big-realm-scene) |
| 2 | **BUILD** | `Consumer` | Consumer wiring (2 consumers) |

### card-composition (5 nodes)

| # | Verdict | Tag | Reason |
|---|---|---|---|
| 1 | **LIBRARY** | `Pantry` | Pantry segment (codex entry: earth-jani) |
| 2 | **BUILD** | `Primitive` | Primitive render module (card-composition) |
| 3 | **BUILD** | `Consumer` | Consumer wiring (3 consumers) |
| 4 | **LIBRARY** | `Pantry` | Pantry segment (codex entry: earth-jani) |
| 5 | **BUILD** | `Primitive` | Primitive render module (card-composition) |
| 6 | **LIBRARY** | `Primitive` | Primitive with codex path (/codex/cards/earth-jani/layers.json#layers[0]) |
| 7 | **BUILD** | `Consumer` | Consumer wiring (3 consumers) |
| 8 | **LIBRARY** | `Pantry` | Pantry segment (codex entry: earth-jani) |
| 9 | **BUILD** | `Primitive` | Primitive render module (card-composition) |
| 10 | **LIBRARY** | `Primitive` | Primitive with codex path (/codex/cards/earth-jani/layers.json#layers[1]) |
| 11 | **BUILD** | `Consumer` | Consumer wiring (3 consumers) |
| 12 | **LIBRARY** | `Pantry` | Pantry segment (codex entry: earth-jani) |
| 13 | **BUILD** | `Primitive` | Primitive render module (card-composition) |
| 14 | **LIBRARY** | `Primitive` | Primitive with codex path (/codex/cards/earth-jani/layers.json#layers[2]) |
| 15 | **BUILD** | `Consumer` | Consumer wiring (3 consumers) |
| 16 | **LIBRARY** | `Pantry` | Pantry segment (codex entry: earth-jani) |
| 17 | **BUILD** | `Primitive` | Primitive render module (card-composition) |
| 18 | **LIBRARY** | `Primitive` | Primitive with codex path (/codex/cards/earth-jani/layers.json#layers[3]) |
| 19 | **BUILD** | `Consumer` | Consumer wiring (3 consumers) |

### card-lab (4 nodes)

| # | Verdict | Tag | Reason |
|---|---|---|---|
| 1 | **BUILD** | `Primitive` | Primitive render module (card-lab) |
| 2 | **BUILD** | `Consumer` | Consumer wiring (1 consumer) |
| 3 | **BUILD** | `Primitive` | Primitive render module (card-lab) |
| 4 | **BUILD** | `Primitive` | Primitive render module (card-lab-layer-0) |
| 5 | **BUILD** | `Consumer` | Consumer wiring (1 consumer) |
| 6 | **BUILD** | `Primitive` | Primitive render module (card-lab) |
| 7 | **BUILD** | `Primitive` | Primitive render module (card-lab-layer-1) |
| 8 | **BUILD** | `Consumer` | Consumer wiring (1 consumer) |
| 9 | **BUILD** | `Primitive` | Primitive render module (card-lab) |
| 10 | **BUILD** | `Primitive` | Primitive render module (card-lab-layer-2) |
| 11 | **BUILD** | `Consumer` | Consumer wiring (1 consumer) |

### hex-scene (4 nodes)

| # | Verdict | Tag | Reason |
|---|---|---|---|
| 1 | **BUILD** | `Primitive` | Primitive render module (hex-scene) |
| 2 | **BUILD** | `Consumer` | Consumer wiring (2 consumers) |
| 3 | **BUILD** | `Primitive` | Primitive render module (hex-scene) |
| 4 | **BUILD** | `Scene` | Scene composition (plot-0) |
| 5 | **BUILD** | `Consumer` | Consumer wiring (2 consumers) |
| 6 | **BUILD** | `Primitive` | Primitive render module (hex-scene) |
| 7 | **BUILD** | `Scene` | Scene composition (plot-1) |
| 8 | **BUILD** | `Consumer` | Consumer wiring (2 consumers) |
| 9 | **BUILD** | `Primitive` | Primitive render module (hex-scene) |
| 10 | **BUILD** | `Scene` | Scene composition (plot-2) |
| 11 | **BUILD** | `Consumer` | Consumer wiring (2 consumers) |

### mini-scene (4 nodes)

| # | Verdict | Tag | Reason |
|---|---|---|---|
| 1 | **BUILD** | `Primitive` | Primitive render module (mini-scene) |
| 2 | **BUILD** | `Consumer` | Consumer wiring (2 consumers) |
| 3 | **BUILD** | `Primitive` | Primitive render module (mini-scene) |
| 4 | **BUILD** | `Primitive` | Primitive render module (mini-scene-layer-0) |
| 5 | **BUILD** | `Consumer` | Consumer wiring (2 consumers) |
| 6 | **BUILD** | `Primitive` | Primitive render module (mini-scene) |
| 7 | **BUILD** | `Primitive` | Primitive render module (mini-scene-layer-1) |
| 8 | **BUILD** | `Consumer` | Consumer wiring (2 consumers) |
| 9 | **BUILD** | `Primitive` | Primitive render module (mini-scene) |
| 10 | **BUILD** | `Primitive` | Primitive render module (mini-scene-layer-2) |
| 11 | **BUILD** | `Consumer` | Consumer wiring (2 consumers) |

### realm-scene (1 node)

| # | Verdict | Tag | Reason |
|---|---|---|---|
| 1 | **BUILD** | `Primitive` | Primitive render module (realm-scene) |
| 2 | **BUILD** | `Consumer` | Consumer wiring (2 consumers) |

### tree-fall (1 node)

| # | Verdict | Tag | Reason |
|---|---|---|---|
| 1 | **BUILD** | `Primitive` | Primitive render module (tree-fall) |
| 2 | **BUILD** | `Consumer` | Consumer wiring (2 consumers) |

### water-splash (1 node)

| # | Verdict | Tag | Reason |
|---|---|---|---|
| 1 | **BUILD** | `Primitive` | Primitive render module (water-splash) |
| 2 | **BUILD** | `Consumer` | Consumer wiring (2 consumers) |

### zone-scene (1 node)

| # | Verdict | Tag | Reason |
|---|---|---|---|
| 1 | **BUILD** | `Primitive` | Primitive render module (zone-scene) |
| 2 | **BUILD** | `Consumer` | Consumer wiring (2 consumers) |

---

*Spike script self-deletes after this report lands (NET 0 LOC contract per S0 doctrine).*
