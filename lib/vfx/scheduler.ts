/**
 * VfxScheduler — single owner of "what's playing and what's allowed."
 *
 * Replaces the autonomous-spawner pattern (each component fires its
 * own setTimeout) with a coordinator. Components SUBSCRIBE; substrate
 * events REQUEST.
 *
 * v0 scope (this turn):
 *   - Per-family caps + cooldowns
 *   - Per-element renderer routing (CSS vs Pixi for the same family)
 *   - Auto-expire on expiresAt
 *   - Allowlist of phases each family is allowed in
 *   - Simple pub/sub for renderers
 *
 * NOT in v0:
 *   - Priority eviction (just reject when at cap)
 *   - Snapshot system
 *   - Substrate event auto-binding (operator wires the request: from
 *     BattleScene useEffect → vfxScheduler.request(...) for now)
 */

import type { Element } from "@/lib/honeycomb/wuxing";

export type VfxFamily = "orb" | "particle" | "wave" | "shake" | "petal";
export type VfxRenderer = "css" | "pixi";

/** Mutable runtime knobs — Tweakpane binds here. */
export interface VfxConfig {
  /** Per-family max concurrent. */
  maxConcurrent: Record<VfxFamily, number>;
  /** Per-family minimum gap (ms) between same-family same-element spawns. */
  cooldownMs: Record<VfxFamily, number>;
  /** Per-element renderer choice for the particle family. */
  particleRenderer: Record<Element, VfxRenderer>;
  /** Per-element renderer choice for the wave family. */
  waveRenderer: Record<Element, VfxRenderer>;
  /** Phases where each family is allowed. */
  allowedPhases: Record<VfxFamily, ReadonlyArray<string>>;
  /** Master multiplier (0..2) — affects all magnitude-bearing fields. */
  intensity: number;
  /** Hard kill switch (panel "panic" button). */
  enabled: boolean;
}

export const DEFAULT_VFX_CONFIG: VfxConfig = {
  maxConcurrent: { orb: 1, particle: 8, wave: 2, shake: 1, petal: 1 },
  cooldownMs: { orb: 80, particle: 40, wave: 60, shake: 100, petal: 0 },
  particleRenderer: {
    wood: "css",
    fire: "css",
    earth: "css",
    metal: "css",
    water: "pixi",
  },
  waveRenderer: {
    wood: "css",
    fire: "css",
    earth: "css",
    metal: "css",
    water: "pixi",
  },
  allowedPhases: {
    orb: ["clashing"],
    particle: ["clashing"],
    wave: ["clashing"],
    shake: ["clashing", "disintegrating"],
    petal: ["arrange", "between-rounds"],
  },
  intensity: 1.0,
  enabled: true,
};

export interface VfxRequest {
  readonly family: VfxFamily;
  readonly element?: Element;
  readonly renderer?: VfxRenderer; // Optional override; defaults to config-routed
  readonly currentPhase: string;
  readonly expectedDurationMs: number;
  readonly payload?: Record<string, unknown>;
}

export interface AdmittedEffect {
  readonly id: string;
  readonly family: VfxFamily;
  readonly element?: Element;
  readonly renderer: VfxRenderer;
  readonly startedAt: number;
  readonly expiresAt: number;
  readonly payload?: Record<string, unknown>;
}

type Listener = (active: readonly AdmittedEffect[]) => void;

export class VfxScheduler {
  readonly config: VfxConfig = JSON.parse(JSON.stringify(DEFAULT_VFX_CONFIG));
  private active: AdmittedEffect[] = [];
  private lastSpawnAt: Map<string, number> = new Map(); // key: `${family}:${element ?? "_"}`
  private listeners: Map<VfxFamily, Set<Listener>> = new Map();
  private allListeners: Set<Listener> = new Set();
  private gcTimer: ReturnType<typeof setTimeout> | null = null;
  private gcDeadline = 0;
  private nextId = 1;

  /**
   * Request an effect. Returns the admitted effect or null if rejected.
   * Reasons for rejection:
   *  - scheduler disabled
   *  - family not allowed in current phase
   *  - cooldown still active for same family+element
   *  - family at maxConcurrent
   */
  request(req: VfxRequest): AdmittedEffect | null {
    const cfg = this.config;
    if (!cfg.enabled) return null;
    // FAGAN M4: defensive lookup — preset import / hand-edit could leave
    // allowedPhases missing keys. Reject (rather than crash) on missing.
    const allowedForFamily = cfg.allowedPhases[req.family];
    if (!allowedForFamily || !allowedForFamily.includes(req.currentPhase)) return null;

    this.gc();

    const key = `${req.family}:${req.element ?? "_"}`;
    const last = this.lastSpawnAt.get(key) ?? 0;
    const now = performance.now();
    if (now - last < cfg.cooldownMs[req.family]) return null;

    const sameFamily = this.active.filter((e) => e.family === req.family);
    if (sameFamily.length >= cfg.maxConcurrent[req.family]) return null;

    const renderer: VfxRenderer =
      req.renderer ??
      (req.family === "particle" && req.element
        ? cfg.particleRenderer[req.element]
        : req.family === "wave" && req.element
          ? cfg.waveRenderer[req.element]
          : "css");

    const effect: AdmittedEffect = {
      id: `vfx-${this.nextId++}`,
      family: req.family,
      element: req.element,
      renderer,
      startedAt: now,
      expiresAt: now + req.expectedDurationMs,
      payload: req.payload,
    };
    this.active.push(effect);
    this.lastSpawnAt.set(key, now);
    this.scheduleGc(req.expectedDurationMs + 16);
    this.notify(req.family);
    return effect;
  }

  /** Subscribe to a specific family. Returns unsubscribe. */
  subscribe(family: VfxFamily, fn: Listener): () => void {
    let set = this.listeners.get(family);
    if (!set) {
      set = new Set();
      this.listeners.set(family, set);
    }
    set.add(fn);
    fn(this.active.filter((e) => e.family === family));
    return () => set?.delete(fn);
  }

  subscribeAll(fn: Listener): () => void {
    this.allListeners.add(fn);
    fn(this.active);
    return () => {
      this.allListeners.delete(fn);
    };
  }

  /** Cancel by family (or all). Used by phase-change hard reset + panic button. */
  cancel(family?: VfxFamily) {
    if (family) {
      this.active = this.active.filter((e) => e.family !== family);
      this.notify(family);
    } else {
      this.active = [];
      for (const f of Object.keys(this.config.maxConcurrent) as VfxFamily[]) {
        this.notify(f);
      }
      for (const fn of this.allListeners) fn(this.active);
      // FAGAN M2: clear the gcTimer chain so a previous-state sweep
      // doesn't fire after we just nuked everything.
      if (this.gcTimer !== null) {
        clearTimeout(this.gcTimer);
        this.gcTimer = null;
        this.gcDeadline = 0;
      }
    }
  }

  /** Read-only snapshot of currently-active effects (for monitor binding). */
  snapshot(): readonly AdmittedEffect[] {
    // FAGAN C3-shape: defensive copy so consumers can't mutate the live array
    return [...this.active];
  }

  /**
   * Tear down — cancel all pending effects + GC timer + clear listeners.
   * Call on page unmount or HMR cleanup. Idempotent.
   */
  dispose(): void {
    if (this.gcTimer !== null) {
      clearTimeout(this.gcTimer);
      this.gcTimer = null;
      this.gcDeadline = 0;
    }
    this.active = [];
    this.lastSpawnAt.clear();
    this.listeners.clear();
    this.allListeners.clear();
  }

  /**
   * Validated config patch — same shape as cameraEngine.setConfig.
   * Tweakpane preset import / hand-edit can't smuggle malformed config.
   */
  setConfig(patch: Partial<VfxConfig>): void {
    if (patch.enabled !== undefined) this.config.enabled = patch.enabled;
    if (patch.intensity !== undefined)
      this.config.intensity = clamp(0, 5, patch.intensity);
    if (patch.maxConcurrent) {
      for (const k of Object.keys(patch.maxConcurrent) as Array<keyof VfxConfig["maxConcurrent"]>) {
        const v = patch.maxConcurrent[k];
        if (typeof v === "number")
          this.config.maxConcurrent[k] = Math.max(0, Math.min(64, Math.floor(v)));
      }
    }
    if (patch.cooldownMs) {
      for (const k of Object.keys(patch.cooldownMs) as Array<keyof VfxConfig["cooldownMs"]>) {
        const v = patch.cooldownMs[k];
        if (typeof v === "number")
          this.config.cooldownMs[k] = Math.max(0, Math.min(10000, v));
      }
    }
    if (patch.particleRenderer) {
      for (const el of Object.keys(patch.particleRenderer) as Array<
        keyof VfxConfig["particleRenderer"]
      >) {
        const r = patch.particleRenderer[el];
        if (r === "css" || r === "pixi") this.config.particleRenderer[el] = r;
      }
    }
    if (patch.waveRenderer) {
      for (const el of Object.keys(patch.waveRenderer) as Array<keyof VfxConfig["waveRenderer"]>) {
        const r = patch.waveRenderer[el];
        if (r === "css" || r === "pixi") this.config.waveRenderer[el] = r;
      }
    }
  }

  private notify(family: VfxFamily) {
    const set = this.listeners.get(family);
    if (set) {
      const slice = this.active.filter((e) => e.family === family);
      for (const fn of set) fn(slice);
    }
    for (const fn of this.allListeners) fn(this.active);
  }

  private gc() {
    const now = performance.now();
    const before = this.active.length;
    this.active = this.active.filter((e) => e.expiresAt > now);
    if (this.active.length !== before) {
      // Notify all families that lost something
      for (const f of Object.keys(this.config.maxConcurrent) as VfxFamily[]) {
        this.notify(f);
      }
    }
  }

  private scheduleGc(delayMs: number) {
    const deadline = performance.now() + delayMs;
    if (this.gcTimer !== null) {
      if (deadline >= this.gcDeadline) return;
      clearTimeout(this.gcTimer);
    }
    this.gcDeadline = deadline;
    this.gcTimer = setTimeout(() => {
      this.gcTimer = null;
      this.gcDeadline = 0;
      this.gc();
      // If still active, schedule next sweep
      if (this.active.length > 0) {
        const nextExpiry = Math.min(...this.active.map((effect) => effect.expiresAt));
        const next = Math.max(50, nextExpiry - performance.now());
        this.scheduleGc(next);
      }
    }, delayMs);
  }
}

function clamp(min: number, max: number, n: number): number {
  return n < min ? min : n > max ? max : n;
}

let _instance: VfxScheduler | null = null;
export function vfxScheduler(): VfxScheduler {
  if (!_instance) _instance = new VfxScheduler();
  return _instance;
}
