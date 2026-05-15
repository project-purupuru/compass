/**
 * media-match — given a fence's resolved DOM hint, surface the media assets
 * that belong to that region.
 *
 * This is what makes the annotation tool "aware": a fence over the caretaker
 * panel now knows the caretaker portraits exist (and where), so the exported
 * brief carries them. The gap that produced "got puruhani but not caretaker"
 * is closed by data, not by memory.
 */

import type { FenceDomHint } from "./dom-resolve";
import { MEDIA_INDEX } from "./media-index.generated";
import type { MediaElement, MediaEntry } from "./media-types";

/** componentHint substring → relevant media categories. */
const COMPONENT_CATEGORIES: ReadonlyArray<readonly [string, readonly string[]]> = [
  ["CaretakerCorner", ["caretakers", "characters", "characters-hd", "stickers", "puruhani"]],
  ["StonesColumn", ["stones", "icons", "element-effects"]],
  ["WorldFocusRail", ["stones", "scenes", "scenes-hd", "icons", "maps", "weather"]],
  ["Ribbon", ["icons", "brand"]],
  ["ZoneToken", ["stones", "icons", "scenes", "scenes-hd", "element-effects"]],
  ["WorldMap", ["stones", "scenes", "scenes-hd", "icons", "maps", "weather"]],
  ["WorldOverview", ["stones", "scenes", "scenes-hd", "characters", "maps"]],
  ["ZoneScene", ["scenes", "scenes-hd", "characters", "stones", "element-effects"]],
  ["CardFace", ["cards", "jani", "characters", "element-effects"]],
  ["CardHandFan", ["cards", "jani", "characters"]],
];

function elementOf(domHint: FenceDomHint | null): MediaElement | null {
  const raw = domHint?.dataAttributes["data-element"];
  if (
    raw === "wood" ||
    raw === "fire" ||
    raw === "earth" ||
    raw === "metal" ||
    raw === "water"
  ) {
    return raw;
  }
  return null;
}

export interface MediaMatch {
  readonly entries: readonly MediaEntry[];
  readonly element: MediaElement | null;
  readonly categories: readonly string[];
}

/**
 * Resolve the media relevant to a fenced region. Element-keyed when the DOM
 * hint carries `data-element`; category-scoped by the component hint; ranked
 * so already-usable (inCompass) and element-specific assets come first.
 */
export function matchMedia(domHint: FenceDomHint | null): MediaMatch {
  const element = elementOf(domHint);
  const hint = domHint?.componentHint ?? "";

  const cats = new Set<string>();
  for (const [match, categories] of COMPONENT_CATEGORIES) {
    if (hint.includes(match)) categories.forEach((c) => cats.add(c));
  }

  let entries: readonly MediaEntry[] = MEDIA_INDEX;
  if (cats.size > 0) entries = entries.filter((e) => cats.has(e.category));
  if (element) entries = entries.filter((e) => e.element === element || e.element === null);

  const ranked = [...entries].sort((a, b) => {
    if (a.inCompass !== b.inCompass) return a.inCompass ? -1 : 1;
    if (a.source !== b.source) {
      const order = { compass: 0, "purupuru-assets": 1, "world-purupuru": 2 } as const;
      return order[a.source] - order[b.source];
    }
    const aKeyed = a.element !== null;
    const bKeyed = b.element !== null;
    if (aKeyed !== bKeyed) return aKeyed ? -1 : 1;
    if (a.labelQuality !== b.labelQuality) {
      const order = { semantic: 0, "path-inferred": 1, "numeric-id": 2 } as const;
      return order[a.labelQuality] - order[b.labelQuality];
    }
    return a.id.localeCompare(b.id);
  });

  return { entries: ranked.slice(0, 12), element, categories: [...cats] };
}
