/**
 * /honeycomb layout — wraps the engine surface and mounts dev tooling.
 *
 * Mirrors the cycle-1 /battle-v2 layout (FenceLayer dev overlay + dark theme).
 * Renamed per cycle-2 S0 (route taxonomy /play + /honeycomb · same substrate).
 *
 * S3.2 adds TooltipProvider wrap — required for shadcn Tooltip on the
 * PlayButton header button (F5 keyboard-shortcut tooltip). Provider has
 * delayDuration=0 default per shadcn ergonomics.
 *
 * FenceLayerMount stays at @/app/battle-v2/_devtools/ per S0 scope (only page
 * files moved; co-located components remain in place until S2 rebuilds them).
 */

import type { ReactNode } from "react";

import { TooltipProvider } from "@/components/ui/tooltip";
import { FenceLayerMount } from "@/app/battle-v2/_devtools/FenceLayerMount";

export default function HoneycombLayout({ children }: { readonly children: ReactNode }) {
  // Force the Old Horai dark theme across the whole /honeycomb route. Matches
  // cycle-1 /battle-v2 dark-mode-first direction (operator FEEL 2026-05-14).
  return (
    <div data-theme="old-horai">
      <TooltipProvider delayDuration={300}>
        {children}
      </TooltipProvider>
      <FenceLayerMount />
    </div>
  );
}
