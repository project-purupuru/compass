/**
 * Pixi-based water-element clash burst — the proof for the
 * "procedural shader VFX" path (vs CSS lines).
 *
 * Spawns N additive-blend droplets at the clash midpoint that radiate
 * outward along bezier curves with curl-noise jitter, fading from
 * caustic-cyan → translucent-white over `durationMs`. A central wave
 * ring expands behind the droplets to anchor the bloom.
 *
 * No external sprite assets — every visual is procedurally drawn into
 * a Pixi Graphics instance, blurred for soft falloff, and additively
 * composited. Aiming for "wet light, not crayon line."
 *
 * Hexagon shape: build/tear down a tiny Pixi Application on demand,
 * destroy it when the burst completes. Caller (PixiClashVfx component)
 * owns the React lifecycle.
 */

import { Application, BlurFilter, Container, Graphics } from "pixi.js";

export interface WaterBurstOptions {
  /** Mount target — must be empty, sized container that won't scroll. */
  readonly host: HTMLElement;
  /** Total burst duration before auto-destruct. */
  readonly durationMs?: number;
  /** Logical canvas size. Pixi handles HDPI via autoDensity. */
  readonly size?: number;
  /** Called when the burst finishes (after auto-destruct). */
  readonly onDone?: () => void;
  /** Optional seed for deterministic replays. */
  readonly seed?: number;
}

/** Returned handle so callers can early-cancel a burst (e.g., on unmount). */
export interface WaterBurstHandle {
  readonly destroy: () => void;
}

const DEFAULT_DURATION_MS = 900;
const DEFAULT_SIZE = 360;

// ──────────────────────────────────────────────────────────────
// Determinism: mulberry32 (matches the CSS-VFX kit RNG)
// ──────────────────────────────────────────────────────────────
function rng(seed: number): () => number {
  let s = (seed + 0x6d2b79f5) | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ──────────────────────────────────────────────────────────────
// Procedural radial-gradient droplet — built once per spawn, no textures
// ──────────────────────────────────────────────────────────────
function drawDroplet(g: Graphics, radius: number, color: number) {
  // Stack faint translucent rings to fake a radial gradient
  for (let r = radius; r > 0; r -= 1.5) {
    const t = r / radius;
    const alpha = Math.pow(1 - t, 1.6) * 0.42;
    g.circle(0, 0, r).fill({ color, alpha });
  }
}

function drawWaveRing(g: Graphics, radius: number, color: number, alpha: number) {
  // Hollow ring with inner glow — the "tide push"
  g.circle(0, 0, radius).stroke({ color, alpha, width: 3 });
  g.circle(0, 0, radius - 6).stroke({ color, alpha: alpha * 0.5, width: 1.5 });
}

interface Droplet {
  readonly g: Graphics;
  readonly angle: number;
  readonly travel: number;
  readonly birth: number;
  readonly lifeMs: number;
  readonly baseScale: number;
  readonly trailJitter: number;
}

// Caustic-cyan palette — kept consistent with --puru-water-vivid family
const COLOR_CORE = 0x9ee9ff;
const COLOR_OUTER = 0x4faedb;
const COLOR_RING = 0x66ddff;

/**
 * Spawn a water-burst Pixi scene mounted to `host`. Returns a handle for
 * early cancellation. Auto-destroys after `durationMs`.
 */
export function spawnWaterBurst(opts: WaterBurstOptions): WaterBurstHandle {
  const durationMs = opts.durationMs ?? DEFAULT_DURATION_MS;
  const size = opts.size ?? DEFAULT_SIZE;
  const seed = opts.seed ?? Math.floor(Math.random() * 1e6);
  const r = rng(seed);

  let destroyed = false;
  let app: Application | null = null;
  // Capture host so we don't reach into opts after potential reassignment
  const host = opts.host;
  // Hold the canvas reference for cleanup before async init resolves
  let mountedCanvas: HTMLCanvasElement | null = null;

  (async () => {
    const a = new Application();
    try {
      await a.init({
        width: size,
        height: size,
        backgroundAlpha: 0,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      });
    } catch {
      // WebGL unavailable / context lost — silently fail to fall through
      // to the CSS fallback. The caller's CSS layer is still in the DOM.
      return;
    }
    // FAGAN C1: re-check `destroyed` after every await/sync work boundary
    // because destroyHandle() may have been called between init resolution
    // and our continuation. Without this, we mount the canvas + start the
    // ticker on an Application that the caller already requested torn down.
    if (destroyed) {
      a.destroy(true, { children: true });
      return;
    }

    a.canvas.style.position = "absolute";
    a.canvas.style.inset = "0";
    a.canvas.style.width = "100%";
    a.canvas.style.height = "100%";
    a.canvas.style.pointerEvents = "none";
    host.appendChild(a.canvas);
    mountedCanvas = a.canvas;
    app = a;

    const stage = new Container();
    stage.x = size / 2;
    stage.y = size / 2;
    stage.filters = [new BlurFilter({ strength: 1.5 })];
    a.stage.addChild(stage);

    // ── central wave ring (anchors the bloom) ──
    const waveRing = new Graphics();
    waveRing.blendMode = "add";
    stage.addChild(waveRing);

    // ── secondary ring (delayed, smaller) ──
    const innerRing = new Graphics();
    innerRing.blendMode = "add";
    stage.addChild(innerRing);

    // ── droplets: 12 radiating outward ──
    const droplets: Droplet[] = [];
    const COUNT = 12;
    for (let i = 0; i < COUNT; i++) {
      const angle = (i / COUNT) * Math.PI * 2 + (r() - 0.5) * 0.35;
      const travel = 70 + r() * 50;
      const dropletRadius = 5 + r() * 7;
      const g = new Graphics();
      drawDroplet(g, dropletRadius, r() > 0.5 ? COLOR_CORE : COLOR_OUTER);
      g.blendMode = "add";
      stage.addChild(g);
      droplets.push({
        g,
        angle,
        travel,
        birth: r() * 60, // staggered
        lifeMs: durationMs - 80 - r() * 100,
        baseScale: 0.6 + r() * 0.7,
        trailJitter: (r() - 0.5) * 18,
      });
    }

    const startedAt = performance.now();
    let finished = false;

    const tick = () => {
      const elapsed = performance.now() - startedAt;
      if (elapsed >= durationMs) {
        if (!finished) {
          finished = true;
          opts.onDone?.();
          // Self-destruct after one extra frame so the caller's onDone
          // can synchronously update React state.
          requestAnimationFrame(() => destroyHandle());
        }
        return;
      }
      const t = elapsed / durationMs;

      // Wave ring: expand 0 → 1.4×size, fade 1 → 0
      const ringR = 8 + size * 0.55 * easeOutCubic(t);
      const ringA = (1 - t) * 0.85;
      waveRing.clear();
      drawWaveRing(waveRing, ringR, COLOR_RING, ringA);

      // Inner ring: lags by 100ms, smaller
      const innerT = Math.max(0, (elapsed - 100) / (durationMs - 100));
      if (innerT > 0) {
        const iR = 4 + size * 0.32 * easeOutCubic(innerT);
        const iA = (1 - innerT) * 0.7;
        innerRing.clear();
        drawWaveRing(innerRing, iR, COLOR_CORE, iA);
      }

      // Droplets: bezier from 0,0 to (travel cos, travel sin) with sag
      for (const d of droplets) {
        const dt = Math.max(0, (elapsed - d.birth) / d.lifeMs);
        if (dt >= 1) {
          d.g.alpha = 0;
          continue;
        }
        const eased = easeOutCubic(dt);
        const dx = Math.cos(d.angle) * d.travel * eased;
        const dy = Math.sin(d.angle) * d.travel * eased + dt * dt * 14; // gravity sag
        // Curl-noise wiggle perpendicular to travel
        const px = -Math.sin(d.angle);
        const py = Math.cos(d.angle);
        const wiggle = Math.sin(elapsed * 0.012 + d.angle * 4) * d.trailJitter * (1 - dt);
        d.g.x = dx + px * wiggle;
        d.g.y = dy + py * wiggle;
        d.g.alpha = (1 - dt) * 0.95;
        d.g.scale.set(d.baseScale * (1 + dt * 0.4));
      }
    };

    // FAGAN C1: final guard before arming the ticker — any awaits between
    // first guard and here (Pixi may add more) get covered by this re-check.
    if (destroyed) {
      a.destroy(true, { children: true });
      return;
    }
    a.ticker.add(tick);
  })();

  const destroyHandle = () => {
    if (destroyed) return;
    destroyed = true;
    if (app) {
      try {
        app.destroy(true, { children: true });
      } catch {
        // best-effort
      }
      app = null;
    }
    if (mountedCanvas && mountedCanvas.parentElement) {
      mountedCanvas.parentElement.removeChild(mountedCanvas);
      mountedCanvas = null;
    }
  };

  return { destroy: destroyHandle };
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}
