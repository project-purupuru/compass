/**
 * IconRegistry · provider lookup
 *
 * Per PRD G5: icon swappability IS substrate, not UX polish. The registry
 * maps a provider ID (e.g., "phosphor" | "stub") to the full IconName →
 * Component map. Swapping the provider replaces every icon in lab + game-UI
 * with one Context update.
 */

import { phosphorProvider } from "./providers/phosphor";
import { stubProvider } from "./providers/stub";
import type { IconComponent } from "./providers/phosphor";
import type { IconName } from "./names";

export type IconProviderId = "phosphor" | "stub";

const REGISTRY: Record<IconProviderId, Record<IconName, IconComponent>> = {
  phosphor: phosphorProvider,
  stub: stubProvider,
};

export function getIconComponent(
  provider: IconProviderId,
  name: IconName,
): IconComponent {
  const map = REGISTRY[provider];
  if (!map) {
    throw new Error(`[IconRegistry] unknown provider: ${provider}`);
  }
  const comp = map[name];
  if (!comp) {
    throw new Error(`[IconRegistry] unknown icon name '${name}' in provider '${provider}'`);
  }
  return comp;
}

export function listProviders(): IconProviderId[] {
  return Object.keys(REGISTRY) as IconProviderId[];
}
