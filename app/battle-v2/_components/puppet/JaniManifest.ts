/**
 * JaniManifest — the registry of all jani sprite sheets in the project.
 *
 * Pure data. The motion-lab renders via DOM; the in-world ElementColony will
 * render via r3f (SpriteSheetPlane). Both consume this manifest verbatim —
 * the renderer is the only thing that swaps. Substrate doctrine: data ports,
 * renderers don't.
 *
 * Sprite-sheet metadata measured from Gumi's 2026-05-16 asset drop:
 *   normalWoodJani_sprite.PNG  (432×227) → 2 frames × 216×227
 *   normalFireJani_sprite.PNG  (432×239) → 2 frames × 216×239
 *   normalEarthJani_sprite.PNG (432×215) → 2 frames × 216×215
 *   normalMetalJani_sprite.PNG (432×215) → 2 frames × 216×215
 *   normalWaterJani_sprite.PNG (432×215) → 2 frames × 216×215
 *   flexWoodJani_sprite.PNG    (454×213) → 2 frames × 227×213
 *   puddleWaterJani_sprite.PNG (882×400) → 2 frames × 441×400 (puddle form)
 */

export type ElementId = "wood" | "fire" | "earth" | "metal" | "water";

export interface SpriteSheet {
  readonly src: string;
  readonly columns: number;
  readonly rows: number;
  readonly frameCount: number;
  readonly frameWidth: number;
  readonly frameHeight: number;
}

export interface JaniVariants {
  /** The bipedal walking form — 2-frame flip. */
  readonly normal: SpriteSheet;
  /** The action / flex pose form, for snap-pose moments. Optional. */
  readonly flex?: SpriteSheet;
  /** Element-specific transformation form (water has puddle). Optional. */
  readonly puddle?: SpriteSheet;
}

export const JANI_MANIFEST: Record<ElementId, JaniVariants> = {
  wood: {
    normal: {
      src: "/brand/sprites/janis/normal-wood-jani.png",
      columns: 2,
      rows: 1,
      frameCount: 2,
      frameWidth: 216,
      frameHeight: 227,
    },
    flex: {
      src: "/brand/sprites/janis/flex-wood-jani.png",
      columns: 2,
      rows: 1,
      frameCount: 2,
      frameWidth: 227,
      frameHeight: 213,
    },
  },
  fire: {
    normal: {
      src: "/brand/sprites/janis/normal-fire-jani.png",
      columns: 2,
      rows: 1,
      frameCount: 2,
      frameWidth: 216,
      frameHeight: 239,
    },
  },
  earth: {
    normal: {
      src: "/brand/sprites/janis/normal-earth-jani.png",
      columns: 2,
      rows: 1,
      frameCount: 2,
      frameWidth: 216,
      frameHeight: 215,
    },
  },
  metal: {
    normal: {
      src: "/brand/sprites/janis/normal-metal-jani.png",
      columns: 2,
      rows: 1,
      frameCount: 2,
      frameWidth: 216,
      frameHeight: 215,
    },
  },
  water: {
    normal: {
      src: "/brand/sprites/janis/normal-water-jani.png",
      columns: 2,
      rows: 1,
      frameCount: 2,
      frameWidth: 216,
      frameHeight: 215,
    },
    puddle: {
      src: "/brand/sprites/janis/puddle-water-jani.png",
      columns: 2,
      rows: 1,
      frameCount: 2,
      frameWidth: 441,
      frameHeight: 400,
    },
  },
};

export const ELEMENT_ORDER: readonly ElementId[] = [
  "wood",
  "fire",
  "earth",
  "metal",
  "water",
];

export const ELEMENT_LABELS: Record<ElementId, string> = {
  wood: "Wood · 木 · Konka",
  fire: "Fire · 火 · Hearth",
  earth: "Earth · 土 · Veil",
  metal: "Metal · 金 · Shrine",
  water: "Water · 水 · Sea Street",
};

/** Per-element breathing-rhythm CSS variable name (defined in globals.css). */
export const ELEMENT_BREATH_VAR: Record<ElementId, string> = {
  wood: "--breath-wood",
  fire: "--breath-fire",
  earth: "--breath-earth",
  metal: "--breath-metal",
  water: "--breath-water",
};
