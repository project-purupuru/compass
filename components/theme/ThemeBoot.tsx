// Pre-paint theme resolver — inline <script> placed in <head> so it
// runs synchronously before React hydrates and before the browser
// rasterizes the first frame. Without this, the page paints with
// :root (light) or prefers-color-scheme:dark, then the
// ObservatoryClient effect snaps to data-theme="old-horai" /
// "day-horai" once the weather feed lands. That snap is the flash.
//
// Resolution order (matches lib/theme/resolve.ts doc):
//   1. cookie puru-theme — also read server-side, so SSR HTML carries
//      the right data-theme already
//   2. cached sunrise/sunset → recompute is_night with user's actual
//      local boundary
//   3. hour-of-day heuristic — first-visit fallback
//   4. matchMedia('prefers-color-scheme: dark') — final fallback
//
// The script body is duplicated logic from lib/theme/resolve.ts. We
// can't import the module in an inline script — by definition it
// runs before any module loads. The two MUST stay in sync; if you
// change the heuristic in one, change it in the other.

const THEME_BOOT_SCRIPT = `
(function () {
  try {
    var doc = document.documentElement;
    var COOKIE = "puru-theme";
    var STORAGE_THEME = "puru-theme";
    var STORAGE_SUNRISE = "puru-sunrise-iso";
    var STORAGE_SUNSET = "puru-sunset-iso";

    function readCookie(name) {
      var match = document.cookie.match(
        new RegExp("(?:^|; )" + name.replace(/[-/\\\\^$*+?.()|[\\]{}]/g, "\\\\$&") + "=([^;]*)")
      );
      return match ? decodeURIComponent(match[1]) : null;
    }

    function isNightFromBoundary(nowMs, sr, ss) {
      if (!sr || !ss) return null;
      var srMs = Date.parse(sr);
      var ssMs = Date.parse(ss);
      if (!isFinite(srMs) || !isFinite(ssMs)) return null;
      var now = new Date(nowMs);
      var cached = new Date(srMs);
      if (
        now.getFullYear() !== cached.getFullYear() ||
        now.getMonth() !== cached.getMonth() ||
        now.getDate() !== cached.getDate()
      ) {
        return null;
      }
      return nowMs < srMs || nowMs >= ssMs;
    }

    function isNightFromHour(nowMs) {
      var h = new Date(nowMs).getHours();
      return h < 6 || h >= 18;
    }

    var resolved = null;

    var ck = readCookie(COOKIE);
    if (ck === "old-horai" || ck === "day-horai") {
      resolved = ck;
    }

    if (!resolved) {
      try {
        var ls = localStorage.getItem(STORAGE_THEME);
        if (ls === "old-horai" || ls === "day-horai") resolved = ls;
      } catch (_) {}
    }

    if (!resolved) {
      try {
        var sr = localStorage.getItem(STORAGE_SUNRISE);
        var ss = localStorage.getItem(STORAGE_SUNSET);
        var nightBoundary = isNightFromBoundary(Date.now(), sr, ss);
        if (nightBoundary !== null) {
          resolved = nightBoundary ? "old-horai" : "day-horai";
        }
      } catch (_) {}
    }

    if (!resolved) {
      // First-visit heuristic: the puru world follows the actual sky,
      // not the OS preference. Hour-of-day decides unconditionally.
      // The OS chrome (Safari address bar etc) is handled in parallel
      // by viewport.themeColor's prefers-color-scheme media split in
      // app/layout.tsx — that's the only place system pref should
      // win, because OS chrome is OS territory; the canvas inside is
      // ours. Resolved in this order from ALEXANDER craft review:
      // the systemDark fallback was overriding local-day for sys-dark
      // users, contradicting the "follow the sky" doctrine.
      resolved = isNightFromHour(Date.now()) ? "old-horai" : "day-horai";
    }

    doc.dataset.theme = resolved;

    // Update <meta name="theme-color"> for the OS browser chrome
    // (Safari address bar, Android task switcher) so it matches the
    // resolved theme. The static viewport.themeColor in layout.tsx
    // gets overridden here at the right moment.
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute(
        "content",
        resolved === "old-horai" ? "#332518" : "#d4a80a"
      );
    }
  } catch (e) {
    // Silently swallow — worst case the page renders with system
    // preference, which is the same as before this script existed.
  }
})();
`.trim();

export function ThemeBoot() {
  return (
    <script
      // Runs synchronously in <head> before <body> paints. Must be
      // dangerouslySetInnerHTML — Next.js's <Script> component injects
      // async/defer by default, which would let the first frame paint
      // with the wrong theme.
      dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }}
    />
  );
}
