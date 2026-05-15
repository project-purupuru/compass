/**
 * FenceLayerMount — the `?fence=1` gate for the FenceLayer dev overlay.
 *
 * Reads `window.location.search` in an effect (mirrors the pattern BattleV2.tsx
 * uses for its `?3d` flag — avoids the Suspense boundary that `useSearchParams`
 * would require). When the flag is absent, this renders nothing and ships zero
 * runtime cost into the game flow.
 */

"use client";

import { useEffect, useState } from "react";

import { FenceLayer } from "./FenceLayer";

export function FenceLayerMount() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const flag = new URLSearchParams(window.location.search).get("fence");
    setEnabled(flag === "1" || flag === "true");
  }, []);

  if (!enabled) return null;
  return <FenceLayer />;
}
