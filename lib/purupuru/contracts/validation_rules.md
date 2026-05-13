# Purupuru Validation Rules

These rules are examples of design lint and runtime assertions to pair with the JSON schemas.

## Schema validation

- Every `id` must be stable, lowercase, and globally unique within its content category.
- Every `nameKey` and `descriptionKey` must be a localization key, not final player-facing prose.
- Every referenced `elementId`, `zoneId`, `eventId`, `sequenceId`, `artId`, `vfxCueId`, and `audioCueId` must resolve through the content database.
- `presentationSequence` files must set `mutatesGameState: false`.
- `card` files must include valid targeting data unless `targeting.mode` is `none`.

## Design lint

- A localized-weather card cannot target `global_map` unless it has `scope: global` and elevated approval.
- A card with `elementId: wood` must include at least one Wood verb from the Wood element profile.
- A card cannot include both `rarity: common` and `powerBand: boss`.
- A presentation sequence with `inputLock: hard` must include an `unlock_input` beat or declare a transition to another hard-lock sequence.
- Idle daemon VFX cannot exceed saliency tier 2.
- Single-target card resolution cannot create more than one active focus zone unless `multiFocusAllowed: true`.
- Any UI component with `interactive: true` must define `idle`, `hovered`, `pressed`, `selected`, `disabled`, and `resolving` states.
- Baked text in art is invalid unless `debugOnly: true`.

## Runtime assertions

- A card cannot exist in two locations at once.
- A committed card cannot be replayed until returned by an explicit resolver step.
- A zone cannot be both `locked` and `active`.
- A target commit cannot occur outside `Targeting` or `Confirming` UI state.
- An input lock owner must be registered and must release or transfer ownership.
- A presentation sequence cannot emit gameplay mutations directly.
- A content pack cannot define a locked resolver operation unless it is Tier 0 Core.

## Golden replay: core_wood_demo_001

Initial state:

```yaml
weather: wood
hand:
  - water_reflection
  - fire_kindling
  - wood_awakening
  - metal_focus
  - earth_tea_house
zones:
  wood_grove: idle
  water_harbor: idle
  fire_station: idle
  metal_mountain: idle
  earth_teahouse: idle
```

Command:

```yaml
type: play_card
cardInstanceId: hand_003
targetZoneId: wood_grove
```

Expected state:

```yaml
activeZoneId: wood_grove
zones:
  wood_grove: active
spawnedEvents:
  - wood_spring_seedling
cardLocations:
  hand_003: resolving_or_discard
semanticEvents:
  - CardCommitted
  - ZoneActivated
  - ZoneEventStarted
  - DaemonReacted
presentation:
  activeSequence: wood_activation_sequence
input:
  finalState: unlocked
```
