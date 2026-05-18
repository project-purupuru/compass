/**
 * Card Layer System — barrel export.
 *
 * Consumers route through `@/lib/cards/layers` for everything the layer
 * primitive offers. Avoid deep imports from individual files so the
 * surface area is auditable by one Cmd-click.
 */

export { CardStack, type CardStackProps } from "./CardStack";
export { resolve } from "./resolve";
export {
  bucketResonance,
  cardTypeToRarity,
  type Face,
  type LayerDefinition,
  type LayerElement,
  type LayerRarity,
  type LayerRegistry,
  type LayerSource,
  type ResolveInput,
  type ResolvedLayer,
  type ResonanceBucket,
  type RevealStage,
  type SelectionLogic,
} from "./types";

import registryJson from "./registry.json";
import type { LayerRegistry } from "./types";

/** Canonical layer registry. Re-exported for direct consumption. */
export const LAYER_REGISTRY: LayerRegistry = registryJson as LayerRegistry;
