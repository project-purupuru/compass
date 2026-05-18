// Celestial position — sun by day, moon by night, arcing east-to-west
// across the sky.
//
// Used by the intro screen (and other ambient surfaces) to render a
// honey sun or pale moon at a position that mirrors the user's actual
// local time. Composes with the theme system's cached sunrise/sunset
// (`lib/theme/persist.ts` writes `puru-sunrise-iso` and
// `puru-sunset-iso` to localStorage when the weather feed lands), so
// the celestial body lands at the right elevation pre-paint on
// returning visits — no waiting for the weather adapter.
//
// The math is intentionally simple. We're not modeling actual
// astronomical altitude/azimuth — that would require lat/lon and
// solar calculations far beyond the visual pay-off. Instead:
//
//   t = fraction of day-arc (0 at sunrise, 1 at sunset)
//   x = lerp(EAST_EDGE, WEST_EDGE, t)
//   y = HORIZON - sin(π·t) · ARC_HEIGHT     ← parabolic dome
//
// "East" is left, "west" is right (default reading direction). Y is a
// percentage from the TOP of the container — smaller = higher.
//
// Night-arc uses the same parabolic shape applied to (sunset → next
// sunrise + 24h-day-loop). When the next-day's sunrise isn't cached
// (first visit, or a day rollover), we estimate it by mirroring the
// day's length around midnight — accurate within a few minutes for
// most latitudes outside polar regions.

import { getSafe } from "@/lib/storage-safe";
import { SUNRISE_STORAGE_KEY, SUNSET_STORAGE_KEY } from "@/lib/theme/resolve";

export type CelestialBody = "sun" | "moon";

export interface CelestialPosition {
  body: CelestialBody;
  /** % from container's left edge — 0 = east horizon, 100 = west horizon. */
  xPct: number;
  /** % from container's top — smaller = higher in the sky. */
  yPct: number;
  /** Visual opacity hint — lower at the horizons (just risen / about to set). */
  opacity: number;
  /** True when no sunrise/sunset cache is available — caller may want
   *  to show the body at a default mid-arc position rather than risk
   *  a wrong timezone calculation. */
  isApproximate: boolean;
}

// Tuning — these decide how the celestial body sits within the intro
// container. Container is the viewport-sized intro overlay; a real
// horizon doesn't sit at the bottom of the page, so HORIZON_Y_PCT
// gives the body somewhere reasonable to "rise from" + "set to."
const EAST_EDGE_PCT = 8;
const WEST_EDGE_PCT = 92;
const HORIZON_Y_PCT = 78;
const ARC_HEIGHT_PCT = 60; // mid-arc apex sits at HORIZON - ARC_HEIGHT
const DEFAULT_DAY_HOURS = 12; // fallback when sunrise/sunset cache missing

/**
 * Resolve where the sun or moon should sit RIGHT NOW. Reads cached
 * sunrise/sunset from localStorage (theme persist writes these); falls
 * back to a hour-of-day heuristic when no cache is present.
 *
 * Pure / synchronous / SSR-safe — returns null if called before
 * window is available, so callers should handle the null case (typically
 * by deferring the celestial render to after mount).
 */
export function resolveCelestialPosition(nowMs: number = Date.now()): CelestialPosition | null {
  if (typeof window === "undefined") return null;

  const sunriseIso = getSafe(SUNRISE_STORAGE_KEY);
  const sunsetIso = getSafe(SUNSET_STORAGE_KEY);

  // Cache present + same calendar day = exact-as-possible position.
  if (sunriseIso && sunsetIso) {
    const srMs = Date.parse(sunriseIso);
    const ssMs = Date.parse(sunsetIso);
    if (Number.isFinite(srMs) && Number.isFinite(ssMs)) {
      const cachedDay = new Date(srMs);
      const now = new Date(nowMs);
      const sameCalendarDay =
        now.getFullYear() === cachedDay.getFullYear() &&
        now.getMonth() === cachedDay.getMonth() &&
        now.getDate() === cachedDay.getDate();

      if (sameCalendarDay && nowMs >= srMs && nowMs < ssMs) {
        return arcPosition("sun", nowMs, srMs, ssMs, false);
      }
      if (sameCalendarDay && nowMs < srMs) {
        // Pre-dawn — moon arcing toward set. Estimate previous
        // sunset = sunset - 24h.
        const prevSs = ssMs - 24 * 60 * 60 * 1000;
        return arcPosition("moon", nowMs, prevSs, srMs, false);
      }
      if (sameCalendarDay && nowMs >= ssMs) {
        // Post-sunset — moon arcing across the night. Estimate next
        // sunrise = sunrise + 24h.
        const nextSr = srMs + 24 * 60 * 60 * 1000;
        return arcPosition("moon", nowMs, ssMs, nextSr, false);
      }
      // Cache from a different day — fall through to heuristic.
    }
  }

  // Heuristic fallback — hour-of-day estimate. Day arc 6am→6pm,
  // night arc 6pm→6am. Wrong by up to ~2 hours around twilight,
  // but the intro renders for ~3-5 seconds so this is acceptable
  // for a true cold first visit.
  const hour = new Date(nowMs).getHours() + new Date(nowMs).getMinutes() / 60;
  const isDay = hour >= 6 && hour < 18;
  if (isDay) {
    const t = (hour - 6) / DEFAULT_DAY_HOURS;
    return arcAt("sun", t, true);
  }
  // Night maps 18→6 the next day onto t=0..1
  const nightHour = hour >= 18 ? hour - 18 : hour + 6;
  const t = nightHour / DEFAULT_DAY_HOURS;
  return arcAt("moon", t, true);
}

function arcPosition(
  body: CelestialBody,
  nowMs: number,
  startMs: number,
  endMs: number,
  isApproximate: boolean,
): CelestialPosition {
  const t = (nowMs - startMs) / (endMs - startMs);
  return arcAt(body, Math.max(0, Math.min(1, t)), isApproximate);
}

function arcAt(body: CelestialBody, t: number, isApproximate: boolean): CelestialPosition {
  const xPct = EAST_EDGE_PCT + (WEST_EDGE_PCT - EAST_EDGE_PCT) * t;
  const yPct = HORIZON_Y_PCT - Math.sin(Math.PI * t) * ARC_HEIGHT_PCT;
  // Opacity rolls in from the horizon — body fades up over the first
  // ~12% of arc and fades back over the last 12% so it doesn't punch
  // a hole in the sky right at the rising / setting moment.
  const horizonFade = Math.min(1, Math.sin(Math.PI * t) * 4 + 0.45);
  const opacity = Math.max(0.45, Math.min(1, horizonFade));
  return { body, xPct, yPct, opacity, isApproximate };
}
