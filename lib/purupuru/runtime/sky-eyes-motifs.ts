/**
 * SKY EYES Priority-1 per-element persistent-motif tokens.
 *
 * Per PRD r2 G10 + FR-14 (cut to wood-only per Opus MED-4) +
 * audit-feel-verdict-2026-05-12 SKY EYES P1 retrofit.
 *
 * Cycle 1: wood ONLY. Other 4 elements deferred to cycle 2 when their
 * element.*.yaml files vendor (with their own motifs.shrineRelief).
 */

import type { ElementId } from "../contracts/types";

export type SkyEyeMotifToken =
  | "sky_eye_leaf" // wood — from element.wood.yaml:31 motifs.shrineRelief
  // cycle-2: fire (ember-trail) · water (ripple-circles) · metal (clockwork-glints) · earth (honeycomb)
  ;

export const SKY_EYES_MOTIFS: Partial<Record<ElementId, SkyEyeMotifToken>> = {
  wood: "sky_eye_leaf",
};

export function getSkyEyeMotif(elementId: ElementId): SkyEyeMotifToken | undefined {
  return SKY_EYES_MOTIFS[elementId];
}
