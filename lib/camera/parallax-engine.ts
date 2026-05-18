/**
 * CameraEngine — single owner of camera state.
 *
 * Replaces the direct-write ParallaxLayer with a target/current LERP
 * loop running on a single requestAnimationFrame. Mouse position sets
 * the TARGET; the engine LERPs the CURRENT toward it each frame.
 *
 * Composes:
 *   target          ← mouse (or programmatic)
 *   idleDrift       ← sin/cos micro-motion when mouse hasn't moved >2s
 *   impulse         ← clash-punch (decays fast)
 *   shake           ← screen shake (decays + jitters)
 *
 * Output (written to <html> root each frame):
 *   --parallax-x          : px (deepest layer travel)
 *   --parallax-y          : px
 *   --parallax-arena-x    : px (mid layer, 0.5×)
 *   --parallax-arena-y    : px
 *   --parallax-card-y     : px (foreground, 0.2×)
 *   --camera-shake-x      : px
 *   --camera-shake-y      : px
 *
 * Tunable via `engine.config` (mutable, exposed for Tweakpane bindings).
 */

import type { Element } from "@/lib/honeycomb/wuxing";

/** Public, mutable knobs. Tweakpane binds to this object. */
export interface CameraConfig {
  /** LERP factor 0.05..0.30 — higher = snappier, lower = lazier. */
  smoothing: number;
  /** Max travel for deepest layer (px). */
  maxTravelPx: number;
  /** Idle drift enabled (subtle sin-wave when target settled). */
  idleDriftEnabled: boolean;
  /** Idle drift amplitude factor (0..1, multiplied by maxTravelPx). */
  idleDriftAmp: number;
  /** Idle drift period in seconds (one full cycle). */
  idleDriftPeriodSec: number;
  /** Idle drift triggers after this many ms of mouse stillness. */
  idleDriftDelayMs: number;
  /** Punch impulse decay rate per frame (0..1). */
  punchDecay: number;
  /** Shake decay per frame (0..1). */
  shakeDecay: number;
  /** Shake jitter scale — multiplied by shake intensity each frame. */
  shakeJitterPx: number;
  /** Layer depth multipliers. */
  arenaDepth: number;
  cardDepth: number;
}

export const DEFAULT_CAMERA_CONFIG: CameraConfig = {
  smoothing: 0.12,
  maxTravelPx: 6,
  idleDriftEnabled: true,
  idleDriftAmp: 0.35,
  idleDriftPeriodSec: 9,
  idleDriftDelayMs: 1500,
  punchDecay: 0.18,
  shakeDecay: 0.14,
  shakeJitterPx: 8,
  arenaDepth: 0.5,
  cardDepth: 0.2,
};

interface CameraState {
  // Normalized -1..+1 (multiplied by maxTravelPx for output)
  targetX: number;
  targetY: number;
  currentX: number;
  currentY: number;
  // Impulse decays each frame (additive)
  impulseX: number;
  impulseY: number;
  // Trauma 0..1 → output shake = trauma² (Eiserloh GDC 2016 canonical curve)
  trauma: number;
  // Last-clash hitstop expiry — global timeScale held near 0 until this ms
  hitstopUntil: number;
  // Tracking
  lastMouseMoveAt: number;
  birthMs: number;
  // Frame-rate-independent timing
  lastTickMs: number;
}

class CameraEngine {
  readonly config: CameraConfig = { ...DEFAULT_CAMERA_CONFIG };
  private state: CameraState;
  private rafId: number | null = null;
  private root: HTMLElement | null = null;
  /** Event-driven listeners — called on setTarget/punch/shake (NOT every frame). */
  private listeners: Set<() => void> = new Set();
  /** Frame-driven listeners — called on every RAF tick. Use sparingly. */
  private frameListeners: Set<() => void> = new Set();
  private running = false;

  constructor() {
    const now = typeof performance !== "undefined" ? performance.now() : 0;
    this.state = {
      targetX: 0,
      targetY: 0,
      currentX: 0,
      currentY: 0,
      impulseX: 0,
      impulseY: 0,
      trauma: 0,
      hitstopUntil: 0,
      lastMouseMoveAt: now,
      birthMs: now,
      lastTickMs: now,
    };
  }

  /** Start the RAF loop. Idempotent. */
  start(root?: HTMLElement) {
    if (this.running) return;
    if (typeof window === "undefined") return;
    this.root = root ?? document.documentElement;
    this.running = true;
    this.tick();
  }

  /** Stop the RAF loop and zero out CSS vars. */
  stop() {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.zeroOut();
  }

  /** Set normalized target (-1..+1). Caller responsible for normalization. */
  setTarget(x: number, y: number) {
    this.state.targetX = clamp(-1, 1, x);
    this.state.targetY = clamp(-1, 1, y);
    this.state.lastMouseMoveAt = performance.now();
    this.notify();
  }

  /** Brief impulse (e.g., clash punch). Magnitude in normalized units. */
  punch(magnitudeX: number, magnitudeY: number) {
    this.state.impulseX += magnitudeX;
    this.state.impulseY += magnitudeY;
    this.notify();
  }

  /**
   * Add trauma. Output shake = trauma² (Eiserloh GDC 2016 canonical curve)
   * — trauma 0.30 → 9% shake, 0.60 → 36%, 0.90 → 81%. Linear-decay trauma
   * combined with squared output produces the natural-feeling "big hit
   * → fast fade" curve every modern game uses.
   */
  shake(intensity: number) {
    this.state.trauma = Math.min(1, this.state.trauma + intensity);
    this.notify();
  }

  /**
   * Hitstop / freeze-frame. Holds the camera (+ the substrate, if hooked)
   * for `ms` milliseconds before resuming. Sakurai canon: 150-215ms is
   * the indie-game zone. Wire `audio.duck()` separately so the audio
   * keeps playing — silence during hitstop reads as a crash.
   */
  freezeFrames(ms: number) {
    this.state.hitstopUntil = Math.max(this.state.hitstopUntil, performance.now() + ms);
    this.notify();
  }

  /** True while hitstop is active. UI can read this to pause animations. */
  isHitstopActive(): boolean {
    return performance.now() < this.state.hitstopUntil;
  }

  /**
   * Snapshot of current state (for monitor bindings).
   *
   * FAGAN C3: returns a SHALLOW COPY — Tweakpane monitor bindings hold
   * references to whatever object you give them and read it on every
   * frame. If we returned `this.state` directly, the panel could mutate
   * (or appear to mutate) engine state through the monitor binding,
   * AND the panel's polling would race notify() inside tick() for
   * unbounded re-entrancy.
   */
  readState(): Readonly<CameraState> {
    return { ...this.state };
  }

  /**
   * Subscribe to event-driven state changes (setTarget, punch, shake).
   * NOT called on every frame — use subscribeFrame() for that.
   * FAGAN M6: separating these prevents 60Hz fanout to listeners that
   * only care about user-driven events.
   */
  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  /**
   * Subscribe to per-frame ticks. Called every RAF (~60Hz). Use only for
   * Tweakpane monitor bindings or other displays that need frame-rate
   * updates. Adding more than ~3 frame listeners may cost frame budget.
   */
  subscribeFrame(fn: () => void): () => void {
    this.frameListeners.add(fn);
    return () => {
      this.frameListeners.delete(fn);
    };
  }

  /**
   * Tear down — cancel RAF, clear listeners, zero CSS vars. Call on
   * page unmount or HMR cleanup. Idempotent.
   */
  dispose(): void {
    this.stop();
    this.listeners.clear();
    this.frameListeners.clear();
  }

  /**
   * Validated config patch — clamps each field to its allowed range.
   * Tweakpane hits this on every change so engine.config can never
   * land in a state that breaks the math.
   */
  setConfig(patch: Partial<CameraConfig>): void {
    if (patch.smoothing !== undefined)
      this.config.smoothing = clamp(0.01, 0.5, patch.smoothing);
    if (patch.maxTravelPx !== undefined)
      this.config.maxTravelPx = clamp(0, 64, patch.maxTravelPx);
    if (patch.idleDriftEnabled !== undefined)
      this.config.idleDriftEnabled = patch.idleDriftEnabled;
    if (patch.idleDriftAmp !== undefined)
      this.config.idleDriftAmp = clamp(0, 1, patch.idleDriftAmp);
    if (patch.idleDriftPeriodSec !== undefined)
      this.config.idleDriftPeriodSec = clamp(0.5, 60, patch.idleDriftPeriodSec);
    if (patch.idleDriftDelayMs !== undefined)
      this.config.idleDriftDelayMs = clamp(0, 30000, patch.idleDriftDelayMs);
    if (patch.punchDecay !== undefined)
      this.config.punchDecay = clamp(0.01, 0.5, patch.punchDecay);
    if (patch.shakeDecay !== undefined)
      this.config.shakeDecay = clamp(0.01, 0.5, patch.shakeDecay);
    if (patch.shakeJitterPx !== undefined)
      this.config.shakeJitterPx = clamp(0, 64, patch.shakeJitterPx);
    if (patch.arenaDepth !== undefined)
      this.config.arenaDepth = clamp(0, 1, patch.arenaDepth);
    if (patch.cardDepth !== undefined)
      this.config.cardDepth = clamp(0, 1, patch.cardDepth);
  }

  private notify() {
    for (const fn of this.listeners) fn();
  }

  /** Frame fanout — called from inside tick(). Cheaper than notify(). */
  private notifyFrame() {
    for (const fn of this.frameListeners) fn();
  }

  private tick = () => {
    if (!this.running) return;
    const now = performance.now();
    // Frame-rate-independent timing (Eiserloh GDC 2016): rate-decay derived
    // from the operator-tunable "smoothing" factor as if at 60fps.
    const dtSec = Math.min(0.1, (now - this.state.lastTickMs) / 1000);
    this.state.lastTickMs = now;
    const cfg = this.config;
    const inHitstop = now < this.state.hitstopUntil;

    // Idle drift — sin(ωt) for X, Perlin-style fractal noise for Y so it
    // never lines up. Period stays operator-tunable.
    let driftX = 0;
    let driftY = 0;
    const sinceMove = now - this.state.lastMouseMoveAt;
    if (cfg.idleDriftEnabled && sinceMove > cfg.idleDriftDelayMs && !inHitstop) {
      const t = (now - this.state.birthMs) / 1000;
      const omega = (Math.PI * 2) / cfg.idleDriftPeriodSec;
      driftX = Math.sin(t * omega) * cfg.idleDriftAmp;
      // Fractal-noise approximation (smooth value noise) for the Y axis —
      // organic, never-repeating drift even when X is mid-cycle.
      driftY = (smoothNoise(t * 0.6) - 0.5) * 2 * cfg.idleDriftAmp;
    }

    // Composite target = pointer + drift + impulse
    const compositeX = this.state.targetX + driftX + this.state.impulseX;
    const compositeY = this.state.targetY + driftY + this.state.impulseY;

    // Frame-rate-independent exponential decay. lerp(a, b, k_per_frame)
    // at 60fps becomes b + (a-b) * exp(-rate * dt) where rate maps:
    //   rate = -ln(1 - k) * 60         (60fps reference)
    // This makes camera lazy-ness feel identical at 30Hz / 60Hz / 120Hz.
    const decayRate = inHitstop
      ? 0.5 // near-frozen during hitstop
      : -Math.log(Math.max(0.001, 1 - cfg.smoothing)) * 60;
    const decay = Math.exp(-decayRate * dtSec);
    this.state.currentX = compositeX + (this.state.currentX - compositeX) * decay;
    this.state.currentY = compositeY + (this.state.currentY - compositeY) * decay;

    // Impulse decay — same exponential treatment.
    const impulseDecay = Math.exp(
      -(-Math.log(Math.max(0.001, 1 - cfg.punchDecay)) * 60) * dtSec,
    );
    this.state.impulseX *= impulseDecay;
    this.state.impulseY *= impulseDecay;
    if (Math.abs(this.state.impulseX) < 0.0005) this.state.impulseX = 0;
    if (Math.abs(this.state.impulseY) < 0.0005) this.state.impulseY = 0;

    // Trauma decay — linear, tied to dt so 30Hz / 120Hz behave identically.
    this.state.trauma = Math.max(0, this.state.trauma - cfg.shakeDecay * 60 * dtSec);

    // Write CSS vars on this.root (default <html>)
    if (this.root) {
      const px = this.state.currentX * cfg.maxTravelPx;
      const py = this.state.currentY * cfg.maxTravelPx;
      this.root.style.setProperty("--parallax-x", `${px.toFixed(2)}px`);
      this.root.style.setProperty("--parallax-y", `${py.toFixed(2)}px`);
      this.root.style.setProperty(
        "--parallax-arena-x",
        `${(px * cfg.arenaDepth).toFixed(2)}px`,
      );
      this.root.style.setProperty(
        "--parallax-arena-y",
        `${(py * cfg.arenaDepth).toFixed(2)}px`,
      );
      this.root.style.setProperty(
        "--parallax-card-y",
        `${(py * cfg.cardDepth).toFixed(2)}px`,
      );
      // Trauma² → shake output (Eiserloh canonical curve).
      // Perlin-style noise sampling instead of pure random for continuous
      // motion — Roystan idiom: frequency 25Hz, seed-offset per axis.
      const traumaSq = this.state.trauma * this.state.trauma;
      const noiseT = (now - this.state.birthMs) / 40; // 25Hz period
      const jx = (smoothNoise(noiseT + 0) - 0.5) * 2 * traumaSq * cfg.shakeJitterPx;
      const jy = (smoothNoise(noiseT + 100) - 0.5) * 2 * traumaSq * cfg.shakeJitterPx;
      this.root.style.setProperty("--camera-shake-x", `${jx.toFixed(2)}px`);
      this.root.style.setProperty("--camera-shake-y", `${jy.toFixed(2)}px`);
      // Expose hitstop as a CSS var so animations can opt in to pausing
      this.root.style.setProperty("--hitstop-active", inHitstop ? "1" : "0");
    }

    this.notifyFrame();
    this.rafId = requestAnimationFrame(this.tick);
  };

  private zeroOut() {
    if (!this.root) return;
    for (const v of [
      "--parallax-x",
      "--parallax-y",
      "--parallax-arena-x",
      "--parallax-arena-y",
      "--parallax-card-y",
      "--camera-shake-x",
      "--camera-shake-y",
    ]) {
      this.root.style.setProperty(v, "0px");
    }
  }
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
function clamp(min: number, max: number, n: number): number {
  return n < min ? min : n > max ? max : n;
}

// Smooth value noise — cheap Perlin-style sampler for shake + idle drift
// (Roystan / Vlambeer idiom). Returns 0..1, continuous, deterministic.
function smoothNoise(t: number): number {
  const i = Math.floor(t);
  const f = t - i;
  const a = hash01(i);
  const b = hash01(i + 1);
  const u = f * f * (3 - 2 * f); // smoothstep
  return a + (b - a) * u;
}
function hash01(n: number): number {
  // simple deterministic hash, output in [0, 1)
  let x = ((n + 0x9e3779b9) | 0) ^ ((n << 13) | 0);
  x = Math.imul(x ^ (x >>> 15), x | 1);
  x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
  return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
}

// ─── Singleton ──────────────────────────────────────────────────
let _instance: CameraEngine | null = null;
export function cameraEngine(): CameraEngine {
  if (!_instance) _instance = new CameraEngine();
  return _instance;
}

// ─── Convenience: per-element clash punch presets ───────────────
export function punchForElement(element: Element): { x: number; y: number; shake: number } {
  switch (element) {
    case "fire":
      return { x: 0, y: -0.18, shake: 0.5 }; // upward jolt + medium shake
    case "earth":
      return { x: 0, y: 0.08, shake: 0.85 }; // downward + heavy shake
    case "metal":
      return { x: 0.12, y: -0.05, shake: 0.4 }; // sideways slash
    case "wood":
      return { x: 0, y: -0.05, shake: 0.15 }; // gentle bloom
    case "water":
      return { x: 0, y: 0.05, shake: 0.25 }; // ripple-down
  }
}
