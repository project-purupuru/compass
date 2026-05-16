/**
 * The Registry Of Registries — single source of truth for "what mutable
 * state exists in this app, and where does it live."
 *
 * Doctrine: grimoires/loa/proposals/registry-doctrine-2026-05-12.md
 *
 * Convention:
 *   - Every singleton ENGINE goes here (mutable, RAF/audio-context-owning)
 *   - Every static REGISTRY goes here (immutable lookup tables)
 *   - Every MutationGuard goes here
 *   - Consumers import { registry } from "@/lib/registry"
 *   - Direct imports from the registry's source file are a smell —
 *     route through this file so dependencies are auditable by grep
 *
 * AI grounding:
 *   - When asking "where does X live?" — read THIS file.
 *   - When adding a new shared mutable — add it HERE.
 *   - When a registry isn't here, it's a defect or it's intentionally
 *     out of scope (UI-local state, MatchSnapshot which has its own
 *     reducer-shaped contract).
 */

import { audioEngine, SNAPSHOTS } from "@/lib/audio/engine";
import { SOUND_REGISTRY } from "@/lib/audio/registry";
import { cameraEngine } from "@/lib/camera/parallax-engine";
import { LAYER_REGISTRY } from "@/lib/cards/layers";
import { CARD_DEFINITIONS, TYPE_POWER } from "@/lib/honeycomb/cards";
import { COMBO_META } from "@/lib/honeycomb/discovery";
import { ELEMENT_META, KE, SHENG } from "@/lib/honeycomb/wuxing";
import { ELEMENT_VFX } from "@/lib/vfx/clash-particles";
import { vfxScheduler } from "@/lib/vfx/scheduler";

// Conditions registry — guard against missing module without breaking startup
import * as conditionsModule from "@/lib/honeycomb/conditions";
const CONDITIONS = (conditionsModule as { CONDITIONS?: unknown }).CONDITIONS ?? {};

// Opponent policies — same defensive shape
import * as opponentModule from "@/lib/honeycomb/opponent.port";
const POLICIES = (opponentModule as { POLICIES?: unknown }).POLICIES ?? {};

/**
 * The canonical registry. Every consumer should import { registry } from
 * "@/lib/registry" and route through this object.
 */
export const registry = {
  // ── Singleton engines (mutable runtime state) ────────────────────
  /** Camera/parallax engine. RAF loop owner. Tweakpane: CameraPane. */
  camera: cameraEngine,
  /** VFX scheduler. Per-family caps + cooldowns. Tweakpane: VfxPane. */
  vfx: vfxScheduler,
  /** Audio engine. Bus + ducking + snapshot owner. Tweakpane: AudioPane. */
  audio: audioEngine,

  // ── Static registries (immutable lookup tables, keyed by union) ──
  /** All registered SFX + music sounds. Adding requires a file edit. */
  sounds: SOUND_REGISTRY,
  /** Per-element CSS particle kit factories. */
  elementVfx: ELEMENT_VFX,
  /** Card system — definitions + layer compositor registry. */
  cards: {
    /** Card definitions (jani / caretaker / transcendence). */
    definitions: CARD_DEFINITIONS,
    /** Layer compositor registry — DOM-stacked `<img>` primitive per kickoff brief Pillar 1. */
    layers: LAYER_REGISTRY,
  },
  /** Per-card-type base power multiplier. */
  typePower: TYPE_POWER,
  /** Per-element battle conditions (status effects). */
  conditions: CONDITIONS,
  /** Per-element opponent AI policies. */
  policies: POLICIES,
  /** Wuxing generative cycle (wood→fire→earth→metal→water→wood). */
  sheng: SHENG,
  /** Wuxing overcoming cycle (wood→earth, fire→metal, etc.). */
  ke: KE,
  /** Per-element metadata (kanji, caretaker name, virtue, etc.). */
  elementMeta: ELEMENT_META,
  /** Per-combo-kind discovery metadata. */
  combos: COMBO_META,
  /** Named audio mix snapshots (combat / menu / victory / silent). */
  audioSnapshots: SNAPSHOTS,
} as const;

export type RegistryKey = keyof typeof registry;

/**
 * Introspection helper for dev panels — list every registry name +
 * a one-line description.
 */
export const registryIndex: Record<RegistryKey, string> = {
  camera: "Camera/parallax engine — singleton, RAF loop, target/current LERP",
  vfx: "VFX scheduler — per-family caps + cooldowns + per-element renderer routing",
  audio: "Audio engine — bus mixer (master/sfx/music) + ducking + snapshots",
  sounds: "Static array of every registered SFX + music",
  elementVfx: "Per-element CSS particle kit factories (build per impact)",
  cards: "Card system — { definitions: catalog, layers: DOM-stack layer compositor registry }",
  typePower: "Card-type → base power multiplier (jani 1.0 / caretaker 0.85 / etc.)",
  conditions: "Per-element battle conditions (status effects)",
  policies: "Per-element opponent AI policies (greedy / defensive / random / etc.)",
  sheng: "Wuxing generative cycle (5-element graph)",
  ke: "Wuxing overcoming cycle (5-element graph)",
  elementMeta: "Per-element metadata (kanji, caretaker name, virtue glyph, etc.)",
  combos: "Per-combo-kind discovery ceremony metadata",
  audioSnapshots: "Named atomic audio mix presets",
};

/** Quick sanity-check at boot — every registered key has a corresponding index entry. */
export function assertRegistryIntegrity(): void {
  const keys = Object.keys(registry) as RegistryKey[];
  const indexKeys = Object.keys(registryIndex);
  const missing = keys.filter((k) => !indexKeys.includes(k));
  const extra = indexKeys.filter((k) => !keys.includes(k as RegistryKey));
  if (missing.length || extra.length) {
    throw new Error(
      `Registry integrity violation: missing index for [${missing.join(", ")}]; extra in index [${extra.join(", ")}]`,
    );
  }
}
