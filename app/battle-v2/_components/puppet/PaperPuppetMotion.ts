/**
 * PaperPuppetMotion — the motion vocab for janis + puruhani.
 *
 * Pure data. Three variants of the same vocab live here as named configs:
 *   billboard  classic paper-mario · pure 2D · 2-frame flip · snap-pose
 *   bend       + paper-bend · sway · hinge-articulation · frame-fold death
 *   theater    + sticker decal layer · silhouette mode · multi-piece feel
 *
 * Per operator (2026-05-16): "going frame by frame for some things is a flex."
 * The variants split the budget: cheap procedural on AMBIENT (walk-flip,
 * idle bounce), bespoke frame motion on KEY MOMENTS (summon, crumple).
 *
 * The renderer (PaperPuppetSprite for DOM lab · future PaperPuppetSprite3D for
 * r3f world) consumes these configs and reads what it needs. The vocab itself
 * is renderer-agnostic.
 */

export type MotionVariant = "billboard" | "bend" | "theater";

/** The 5 states any paper puppet can be in. */
export type PuppetState = "idle" | "walk" | "action" | "summon" | "crumple";

/** Card-summon animation pattern — operator's 1/3 hybrid: sticker + popup-book.
 *  `puddle-ooze` is the puddle-only variant: spread-from-center on the ground,
 *  no vertical rise (the puddle is already on the floor). */
export type SummonPattern = "popup-book" | "origami" | "sticker-stamp" | "puddle-ooze";

/**
 * Frame-pacing mode per state — Cuphead/HD-2D doctrine (operator 2026-05-16):
 * "characters and stickers can go cuphead" while the 3D environment stays Ghibli-
 * smooth. Stepped pacing makes motion read as "drawn" (discrete authored poses);
 * smooth reads as "computed" (continuous tween).
 *
 *   stepped(N)   timing-function = steps(N, jump-end); CSS interpolation snaps
 *                to N discrete frames across the animation duration. The %-stops
 *                in the keyframe still drive transform values; steps() controls
 *                what fraction of the eye sees per frame.
 *   smooth       timing-function = the provided cubic-bezier; continuous tween.
 */
export type FramePacing =
  | { readonly mode: "stepped"; readonly steps: number }
  | { readonly mode: "smooth"; readonly easing: string };

/**
 * LightDirection — fake-directional rim/shadow/highlight via offset drop-shadows.
 *
 * Operator (2026-05-16): "Let's go true rim best to prototype directionally
 * towards the ideal setup. We can start cheap and go richer as we've been doing.
 * R3F would be next stage."
 *
 * Cheap implementation: offset all three lighting elements (ground shadow, rim
 * glow, edge highlight) per a 2D light vector. Reads as "lit from upper-left"
 * (the classic painterly convention). True directional rim requires r3f sprites
 * with per-jani normal maps — this CSS layer is the prototype, not the ceiling.
 */
export interface LightDirection {
  /** Light source X position relative to subject. -1 = left, 0 = center, 1 = right. */
  readonly x: number;
  /** Light source Y position. -1 = top (sky), 0 = side, 1 = below. */
  readonly y: number;
  /** 0-1 scalar; modulates shadow + rim + highlight strengths. */
  readonly intensity: number;
  /** Ground-shadow offset magnitude in px. */
  readonly shadowDistance: number;
  /** Rim-glow offset magnitude in px (rim appears on the BACK side from light). */
  readonly rimDistance: number;
  /** Edge-highlight offset magnitude in px (highlight on the LIT side). */
  readonly highlightDistance: number;
}

/**
 * What's visible on the back face of the paper during a 3D walk-flip.
 *
 *  frame2-direct        the sprite-sheet's second frame, pre-rotated 180° so
 *                       it reads correctly when the cardboard turns around.
 *                       The Paper Mario TTYD canonical move.
 *  mirror               horizontal flip of the front frame (puppet flipped
 *                       by an off-screen hand — theater feel).
 *  element-color-slice  back is a flat element-vivid panel (1-bit silhouette;
 *                       Mulan/Avatar shadow-puppet read).
 *  hidden               backface-visibility:hidden with no second face —
 *                       puppet vanishes mid-flip. Reads as a coin spinning.
 */
export type FlipBackface =
  | "frame2-direct"
  | "mirror"
  | "element-color-slice"
  | "hidden";

/**
 * CardboardFlip — the direction-flip atom (data-only).
 *
 * Triggered on DIRECTION CHANGE (puppet turns to face the other way), NOT
 * during walking. A walking puppet still just cycles its 2 frames via
 * background-position swap (the canonical TTYD walk). When the puppet
 * needs to turn around — manual flip button, walk-direction reversal, or
 * any future direction-change event — THIS animation plays once.
 *
 * The flip is a rotateY hinge in 3D camera space; at the midpoint (90°)
 * the sprite plane has zero projected width — the back face becomes the
 * new front, geometrically. With backface: "mirror", the back is the
 * front frame horizontally mirrored, so the puppet appears facing the
 * other way once the rotation completes.
 *
 * Spec converged from construct-kansei + construct-artisan + construct-vfx-playbook
 * (2026-05-16). Corrected after operator clarified: "walking shouldn't be
 * flipping; the flip is for switching direction."
 */
export interface CardboardFlip {
  /** Y = canonical horizontal direction flip. X = forward tumble (unusual). */
  readonly axis: "y" | "x";
  /** Pivot in CSS percent. "50% 100%" = feet (grounded). */
  readonly transformOriginX: string;
  readonly transformOriginY: string;
  /** Total rotation per direction change. 180 = full cardboard turn-around. */
  readonly sweepDeg: number;
  /** Overshoot past the target on rebound (degrees). 0 = clean stop. */
  readonly overshootDeg: number;
  /** Flip duration in ms — single direction-change animation. */
  readonly durationMs: number;
  /** Easing curve for the rotation. Spring-out for the rebound. */
  readonly easing: string;
  /** What lives on the back face. */
  readonly backface: FlipBackface;
  /** Perspective depth (px) the parent stage provides. Lower = more 3D. */
  readonly perspectivePx: number;
  /** Optional Z-translate at edge-on (px) — puppet dips INTO the plane at 90°. */
  readonly edgeOnDepthPx: number;
}

export interface MotionConfig {
  readonly variant: MotionVariant;
  readonly displayName: string;
  readonly description: string;

  // ── Ambient (cheap, procedural) ────────────────────────────────────────
  /** Walk-cycle FPS for the 2-frame flip. */
  readonly walkFps: number;
  /** Idle bounce amplitude (px) + period (s) — CSS sine, never frames. */
  readonly idleBouncePx: number;
  readonly idleBouncePeriod: number;
  /** When set, sprite sways in the ambient breath rhythm (CSS rotation). */
  readonly bendEnabled: boolean;
  /** Maximum sway angle (deg) when bendEnabled. */
  readonly bendDeg: number;

  // ── Key moments (frame-by-frame, the flex) ─────────────────────────────
  /** Crumple = fold-into-nothing on death. Duration in s. */
  readonly crumpleDuration: number;
  /** Action pose snap = swap to flex sprite (or scale-up pulse if no flex). */
  readonly actionDuration: number;
  /** Summon animation pattern + duration in s. */
  readonly summonPattern: SummonPattern;
  readonly summonDuration: number;

  // ── Decoration layer ───────────────────────────────────────────────────
  /** When set, render a paper-thin shadow under the puppet (drop-shadow). */
  readonly shadowEnabled: boolean;
  /** When set, expose a sticker-decal layer on top of the sprite. */
  readonly stickerLayerEnabled: boolean;
  /** When set, render a silhouette-only mode in element colour. */
  readonly silhouetteEnabled: boolean;

  // ── Direction-flip atom (cardboard rotates when changing direction) ────
  readonly directionFlip: CardboardFlip;

  // ── Frame-pacing per state (Cuphead body / smooth env) ──────────────────
  readonly framePacing: {
    readonly action: FramePacing;
    readonly summon: FramePacing;
    readonly crumple: FramePacing;
  };

  // ── Light direction for the cheap directional rim/shadow ────────────────
  readonly light: LightDirection;
}

/** Default upper-left light direction (classic painterly convention). */
export const DEFAULT_LIGHT_UPPER_LEFT: LightDirection = {
  x: -0.7,
  y: -0.7,
  intensity: 0.9,
  shadowDistance: 2.5,
  rimDistance: 3,
  highlightDistance: 1.2,
};

export const MOTION_VARIANTS: Record<MotionVariant, MotionConfig> = {
  billboard: {
    variant: "billboard",
    displayName: "Strict Billboard",
    description:
      "Paper Mario classic. 2D plane, 2-frame bg-swap walk, snap to action pose. No 3D rotation on walk. The cheap & deeply legible baseline.",
    walkFps: 4,
    idleBouncePx: 3,
    idleBouncePeriod: 1.6,
    bendEnabled: false,
    bendDeg: 0,
    crumpleDuration: 0.5,
    actionDuration: 0.4,
    summonPattern: "sticker-stamp",
    summonDuration: 0.7,
    shadowEnabled: true,
    stickerLayerEnabled: false,
    silhouetteEnabled: false,
    directionFlip: {
      axis: "y",
      transformOriginX: "50%",
      transformOriginY: "100%",
      sweepDeg: 180,
      overshootDeg: 0, // strict — no overshoot
      durationMs: 280,
      easing: "cubic-bezier(0.4, 0, 0.2, 1)", // direction-flip stays SMOOTH (single transformation)
      backface: "mirror",
      perspectivePx: 1200,
      edgeOnDepthPx: 0,
    },
    framePacing: {
      // billboard variant = strictest Cuphead read · low step counts = more "drawn"
      action: { mode: "stepped", steps: 6 },
      summon: { mode: "stepped", steps: 8 },
      crumple: { mode: "stepped", steps: 6 },
    },
    light: { ...DEFAULT_LIGHT_UPPER_LEFT, intensity: 1.0 }, // strong rim · dramatic
  },
  bend: {
    variant: "bend",
    displayName: "Billboard + Bend",
    description:
      "Cardboard walk-flip in 3D. 180° rotateY per step, frame swap concealed at edge-on. Paper-bend on idle, fold-forward on crumple.",
    walkFps: 5,
    idleBouncePx: 5,
    idleBouncePeriod: 1.8,
    bendEnabled: true,
    bendDeg: 4,
    crumpleDuration: 0.8,
    actionDuration: 0.5,
    summonPattern: "sticker-stamp",
    summonDuration: 0.9,
    shadowEnabled: true,
    stickerLayerEnabled: false,
    silhouetteEnabled: false,
    directionFlip: {
      axis: "y",
      transformOriginX: "50%",
      transformOriginY: "100%",
      sweepDeg: 180,
      overshootDeg: 6,
      durationMs: 340,
      easing: "cubic-bezier(0.34, 1.4, 0.64, 1)", // overshoot-out · stays smooth
      backface: "mirror",
      perspectivePx: 900,
      edgeOnDepthPx: 0,
    },
    framePacing: {
      // bend = middle ground · more frames than billboard for the softer read
      action: { mode: "stepped", steps: 8 },
      summon: { mode: "stepped", steps: 10 },
      crumple: { mode: "stepped", steps: 8 },
    },
    light: { ...DEFAULT_LIGHT_UPPER_LEFT, intensity: 0.85 },
  },
  theater: {
    variant: "theater",
    displayName: "Full Puppet Theater",
    description:
      "Bend + sticker decal + silhouette mode. 180° cardboard-flip with theatrical overshoot. Mulan/Avatar shadow-puppet apex.",
    walkFps: 6,
    idleBouncePx: 6,
    idleBouncePeriod: 2.0,
    bendEnabled: true,
    bendDeg: 6,
    crumpleDuration: 1.0,
    actionDuration: 0.55,
    summonPattern: "popup-book",
    summonDuration: 1.1,
    shadowEnabled: true,
    stickerLayerEnabled: true,
    silhouetteEnabled: true,
    directionFlip: {
      axis: "y",
      transformOriginX: "50%",
      transformOriginY: "100%",
      sweepDeg: 180,
      overshootDeg: 12,
      durationMs: 420,
      easing: "cubic-bezier(0.34, 1.56, 0.64, 1)", // theatrical bounce · stays smooth
      backface: "element-color-slice", // theater = Mulan-style silhouette mid-flip
      perspectivePx: 700,
      edgeOnDepthPx: 4,
    },
    framePacing: {
      // theater = richest · more frames for the puppet-show flourish (still stepped per operator)
      action: { mode: "stepped", steps: 12 },
      summon: { mode: "stepped", steps: 14 },
      crumple: { mode: "stepped", steps: 10 },
    },
    light: {
      ...DEFAULT_LIGHT_UPPER_LEFT,
      intensity: 0.75, // softer, more diffuse
      rimDistance: 4, // wider halo
      highlightDistance: 1.5,
    },
  },
};

export const MOTION_VARIANT_ORDER: readonly MotionVariant[] = [
  "billboard",
  "bend",
  "theater",
];
