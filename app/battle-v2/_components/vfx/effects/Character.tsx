/**
 * Character — hex-fixture adapter around the canonical PaperPuppet3D bear.
 *
 * Per session 14 (2026-05-16) operator note: use the existing bear system
 * from `_components/puppet/PaperPuppet3D` instead of the placeholder
 * geometry. This file is the THIN adapter between the hex Plot's fixture
 * interface (position / scale / facing / seed / variant) and the puppet's
 * own props (element / motion / state / worldHeight / flipX).
 *
 * Fixture-variant string carries the element ('wood'|'fire'|'earth'|'metal'
 * |'water'). Defaults to 'wood' (Konka Market / the canonical bear).
 */

"use client";

import { PaperPuppet3D } from "../../puppet/PaperPuppet3D";
import {
  type ElementId,
  JANI_MANIFEST,
} from "../../puppet/JaniManifest";
import { MOTION_VARIANTS } from "../../puppet/PaperPuppetMotion";

const VALID_ELEMENTS: readonly ElementId[] = [
  "wood",
  "fire",
  "earth",
  "metal",
  "water",
];

function resolveElement(variant: string | undefined): ElementId {
  if (variant && VALID_ELEMENTS.includes(variant as ElementId)) {
    return variant as ElementId;
  }
  return "wood";
}

interface CharacterProps {
  readonly position?: readonly [number, number, number];
  readonly scale?: number;
  readonly facing?: number;
  /** Element variant — maps to one of the 5 canonical paper-puppets. */
  readonly variant?: string;
}

export function Character({
  position = [0, 0, 0],
  scale = 0.4,
  facing = 0,
  variant,
}: CharacterProps) {
  const element = resolveElement(variant);
  // Skip elements without sprite sheets defined in the manifest (defensive).
  if (!JANI_MANIFEST[element]) return null;

  // Map hex-fixture scale (cell-relative) to PaperPuppet3D worldHeight
  // (foot-to-ear in world units). 1.4 is the puppet default; we scale
  // proportionally so a "0.18 * hexSize" character at hexSize=3 reads at
  // ~0.54 worldHeight (small relative to the hex but readable).
  const worldHeight = Math.max(0.3, scale * 3);

  // `facing` (radians) → flipX. Right-facing = no flip; left-facing = flip.
  // The puppet's idle "normal" sheet faces right by convention.
  const flipX = Math.cos(facing) < 0;

  return (
    <PaperPuppet3D
      position={position}
      element={element}
      motion={MOTION_VARIANTS.billboard}
      state="idle"
      flipX={flipX}
      worldHeight={worldHeight}
    />
  );
}
