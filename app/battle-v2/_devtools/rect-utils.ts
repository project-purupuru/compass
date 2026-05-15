/**
 * rect-utils — geometry helpers for fence rectangles.
 *
 * `iou` (intersection-over-union) is how the FenceLayer detects when a freshly
 * drawn fence is really a duplicate of an existing one — the "double overlap"
 * that happens when a region gets fenced twice.
 */

import type { RectPct } from "./dom-resolve";

/** Intersection-over-union of two viewport-% rects. 0 = disjoint, 1 = identical. */
export function iou(a: RectPct, b: RectPct): number {
  const ax2 = a.xPct + a.wPct;
  const ay2 = a.yPct + a.hPct;
  const bx2 = b.xPct + b.wPct;
  const by2 = b.yPct + b.hPct;
  const ix = Math.max(0, Math.min(ax2, bx2) - Math.max(a.xPct, b.xPct));
  const iy = Math.max(0, Math.min(ay2, by2) - Math.max(a.yPct, b.yPct));
  const inter = ix * iy;
  const union = a.wPct * a.hPct + b.wPct * b.hPct - inter;
  return union <= 0 ? 0 : inter / union;
}

/** Threshold above which two fences are treated as the same region. */
export const DUPLICATE_IOU = 0.75;
