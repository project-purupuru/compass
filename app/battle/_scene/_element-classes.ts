/**
 * Static Tailwind class maps for element-driven styling.
 *
 * Tailwind 4 JIT can't detect dynamically-interpolated class names — every
 * class must appear literally somewhere in source. These maps satisfy that
 * scanner while keeping element-driven styling ergonomic.
 *
 * Add a new variant by adding a new map below.
 */

import type { Element } from "@/lib/honeycomb/wuxing";

export const ELEMENT_TINT_BG: Record<Element, string> = {
  wood: "bg-puru-wood-tint",
  fire: "bg-puru-fire-tint",
  earth: "bg-puru-earth-tint",
  metal: "bg-puru-metal-tint",
  water: "bg-puru-water-tint",
};

export const ELEMENT_VIVID_BG: Record<Element, string> = {
  wood: "bg-puru-wood-vivid",
  fire: "bg-puru-fire-vivid",
  earth: "bg-puru-earth-vivid",
  metal: "bg-puru-metal-vivid",
  water: "bg-puru-water-vivid",
};

export const ELEMENT_VIVID_DOT: Record<Element, string> = ELEMENT_VIVID_BG;

export const ELEMENT_TINT_FROM: Record<Element, string> = {
  wood: "from-puru-wood-tint",
  fire: "from-puru-fire-tint",
  earth: "from-puru-earth-tint",
  metal: "from-puru-metal-tint",
  water: "from-puru-water-tint",
};

export const ELEMENT_PASTEL_BG: Record<Element, string> = {
  wood: "bg-puru-wood-pastel",
  fire: "bg-puru-fire-pastel",
  earth: "bg-puru-earth-pastel",
  metal: "bg-puru-metal-pastel",
  water: "bg-puru-water-pastel",
};
