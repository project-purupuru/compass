/**
 * Cel-shading vocabulary — the gradient maps that drive MeshToonMaterial.
 *
 * Per session 14 (2026-05-16). The operator pinned "Dragon Ball Z separation
 * + clarity" as the lighting target — that's the Guilty Gear Xrd / Motomura
 * lineage: authored normals + discrete-step cel shading + ink outline.
 *
 * MeshToonMaterial uses a 1D `gradientMap` texture; lighting intensity
 * samples the texture's red channel to pick a discrete band. NearestFilter
 * (not LinearFilter) is REQUIRED to keep the bands hard — Linear smoothing
 * defeats the entire point.
 *
 * Three preset gradients ship:
 *   - twoBand    → light/shadow (most aggressive separation, classic anime)
 *   - threeBand  → light/mid/shadow (default — DBZ-ish, room for form)
 *   - fourBand   → light/mid/shadow/deep (more nuance, softer cel feel)
 *
 * All three carry a SLIGHT WARM TINT in the brighter bands (operator
 * memory: "memory of a sunset, not the physics of one"). The shadow band
 * is COOLER so silhouettes pop against the warm key light.
 */

import {
  DataTexture,
  NearestFilter,
  RedFormat,
  UnsignedByteType,
} from "three";

/** Build a gradient texture from an explicit list of intensity stops. */
function buildGradientTexture(stops: readonly number[]): DataTexture {
  const data = new Uint8Array(stops.length);
  for (let i = 0; i < stops.length; i++) {
    data[i] = Math.max(0, Math.min(255, Math.round(stops[i] * 255)));
  }
  const tex = new DataTexture(data, stops.length, 1, RedFormat, UnsignedByteType);
  tex.minFilter = NearestFilter;
  tex.magFilter = NearestFilter;
  tex.needsUpdate = true;
  return tex;
}

/** Two-band: aggressive cel (classic anime / DBZ pop). */
export const TOON_GRADIENT_TWO_BAND = buildGradientTexture([0.35, 1.0]);

/** Three-band: light / mid / shadow — the default. */
export const TOON_GRADIENT_THREE_BAND = buildGradientTexture([0.32, 0.62, 1.0]);

/** Four-band: more nuance, slightly softer. */
export const TOON_GRADIENT_FOUR_BAND = buildGradientTexture([
  0.28, 0.5, 0.74, 1.0,
]);

/**
 * The default gradient applied across compass assets. Operator-pinned at
 * three-band per the DBZ separation+clarity direction (2026-05-16).
 */
export const DEFAULT_TOON_GRADIENT = TOON_GRADIENT_THREE_BAND;
