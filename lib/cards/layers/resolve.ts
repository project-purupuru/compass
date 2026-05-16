/**
 * Card Layer Resolver — pure function: ResolveInput → ResolvedLayer[]
 *
 * Walks the registry, filters by face + reveal stage, applies each layer's
 * selectionLogic, interpolates `{element}`/`{caretaker}`/`{cardType}`/`{rarity}`
 * placeholders, prepends cdnBase for relative paths, and returns the queue
 * sorted by zIndex (low → high).
 *
 * Pure + deterministic. Memoize at the call site via React `useMemo`.
 */

import type {
  LayerDefinition,
  LayerElement,
  ResolveInput,
  ResolvedLayer,
  SelectionLogic,
} from "./types";
import { bucketResonance } from "./types";

const CARETAKER_BY_ELEMENT: Readonly<Record<LayerElement, string>> = {
  wood: "kaori",
  fire: "akane",
  earth: "nemu",
  metal: "ren",
  water: "ruan",
  harmony: "kaori",
};

export function resolve(input: ResolveInput): ResolvedLayer[] {
  const queue: ResolvedLayer[] = [];
  for (const layer of input.registry.layers) {
    if (!appliesToFace(layer, input)) continue;
    if (!appliesToRevealStage(layer, input)) continue;
    const raw = pickPath(layer.selectionLogic, input);
    if (raw === null) continue;
    queue.push({
      url: interpolateAndPrefix(raw, input),
      zIndex: layer.zIndex,
      layerName: layer.name,
      source: layer.source,
    });
  }
  queue.sort((a, b) => a.zIndex - b.zIndex);
  return queue;
}

function appliesToFace(layer: LayerDefinition, input: ResolveInput): boolean {
  if (!layer.faces) return true;
  return layer.faces.includes(input.face);
}

function appliesToRevealStage(layer: LayerDefinition, input: ResolveInput): boolean {
  if (!layer.revealStages) return true;
  return layer.revealStages.includes(input.revealStage);
}

function pickPath(logic: SelectionLogic, input: ResolveInput): string | null {
  switch (logic.type) {
    case "element": {
      const eff = input.elementAffinity ?? input.element;
      return logic.variants[eff] ?? logic.variants[input.element] ?? null;
    }
    case "rarity":
      return logic.variants[input.rarity] ?? null;
    case "cardType":
      return logic.variants[input.cardType] ?? null;
    case "resonance": {
      const r = input.resonance ?? 50;
      const bucket = bucketResonance(r, logic.thresholds);
      const path = logic.paths[bucket];
      if (!path) return null;
      return path;
    }
    case "static":
      return logic.path;
  }
}

function interpolateAndPrefix(path: string, input: ResolveInput): string {
  const interpolated = path
    .replace(/\{element\}/g, input.element)
    .replace(/\{caretaker\}/g, CARETAKER_BY_ELEMENT[input.element])
    .replace(/\{cardType\}/g, input.cardType)
    .replace(/\{rarity\}/g, input.rarity);
  if (interpolated.startsWith("/") || interpolated.startsWith("http")) return interpolated;
  const base = input.registry.cdnBase.replace(/\/$/, "");
  return `${base}/${interpolated}`;
}
