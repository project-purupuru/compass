/**
 * /play layout — wraps the player surface and mounts dev tooling.
 *
 * Mirrors the cycle-1 /battle-v2 layout (FenceLayer dev overlay + dark theme).
 * Renamed per cycle-2 S0 (route taxonomy /play + /honeycomb · same substrate).
 *
 * FenceLayerMount stays at @/app/battle-v2/_devtools/ per S0 scope (only page
 * files moved; co-located components remain in place until S2 rebuilds them).
 */

import type { ReactNode } from "react";

import { FenceLayerMount } from "@/app/battle-v2/_devtools/FenceLayerMount";

export default function PlayLayout({ children }: { readonly children: ReactNode }) {
  // Force the Old Horai dark theme across the whole /play route. Matches
  // cycle-1 /battle-v2 dark-mode-first direction (operator FEEL 2026-05-14).
  return (
    <div data-theme="old-horai">
      {children}
      <FenceLayerMount />
    </div>
  );
}
