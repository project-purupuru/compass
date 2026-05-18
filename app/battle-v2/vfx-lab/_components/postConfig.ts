/**
 * Post-process config — global state for the vfx-lab's Scheimpflug DoF.
 *
 * Defaults derived from dig-session-2026-05-16-T4:
 *   Poimandres recipe: tight focal band at ~50% screen-Y, soft taper, flat
 *   rotation (the tilt is achieved by spreading startY/endY across screen).
 *   For Scheimpflug feel, tilt the band 4-10° (left/right asymmetry).
 *
 * TiltShift2 (from @react-three/postprocessing) takes:
 *   start: [x, y]   — line origin in screen-space [0..1]
 *   end:   [x, y]   — line terminus in screen-space [0..1]
 *   direction: [x, y] — blur direction (perpendicular to focus line)
 *   blur, taper, samples
 *
 * We expose simplified knobs (startY, endY, tilt) and compute the line:
 *   start = [0,                  startY + tilt-offset]
 *   end   = [1,                  endY   + tilt-offset]
 *   direction = [0, 1]  (vertical blur for a horizontal-ish band)
 */

export interface PostConfig {
  enabled: boolean;
  blur: number;
  taper: number;
  /** Top edge of focus band (0..1 screen-Y, 0 = top). */
  startY: number;
  /** Bottom edge of focus band (0..1 screen-Y). */
  endY: number;
  /** Tilt the band (degrees) — creates the Scheimpflug effect. */
  tilt: number;
  samples: number;
}

export const POST_DEFAULTS: PostConfig = {
  enabled: true,
  blur: 0.65,
  taper: 0.45,
  startY: 0.42,
  endY: 0.58,
  tilt: 4,
  samples: 10,
};

/**
 * Derive TiltShift2 `start` and `end` from operator-facing config.
 * Tilt is applied as a Y delta between left and right edges.
 */
export function deriveTiltShiftLine(cfg: PostConfig): {
  start: [number, number];
  end: [number, number];
} {
  const tiltRad = (cfg.tilt * Math.PI) / 180;
  // Tilt translates to a vertical delta proportional to screen width.
  const delta = Math.tan(tiltRad) * 0.5; // half-width delta
  const centerY = (cfg.startY + cfg.endY) / 2;
  return {
    start: [0, centerY - delta],
    end: [1, centerY + delta],
  };
}
