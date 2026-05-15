/**
 * /battle-v2 layout — wraps the route children and mounts dev tooling.
 *
 * Purely additive: the only thing this layout adds over the root layout is
 * the FenceLayer dev overlay, which is inert unless `?fence=1` is present in
 * the URL (per the dev-tuning-separation rule: dev panels behind a query flag,
 * never in the game flow).
 *
 * Authored as an isolated dev-tooling surface so it does not touch any
 * in-flight battle-v2 component files.
 */

import type { ReactNode } from "react";

import { FenceLayerMount } from "./_devtools/FenceLayerMount";

export default function BattleV2Layout({ children }: { readonly children: ReactNode }) {
  // Force the Old Horai dark theme across the whole /battle-v2 route. The HUD
  // restyle is dark-mode-first (operator FEEL direction 2026-05-14) — this sets
  // every --puru-* token to its dark value regardless of system preference.
  // Light mode is deferred (the token system already has light values; it's a
  // data-theme flip later, not a rewrite). Spec: context/15-battle-v2-taste-tokens.md
  return (
    <div data-theme="old-horai">
      {children}
      <FenceLayerMount />
    </div>
  );
}
