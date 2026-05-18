// Theme persistence — write the resolved theme + sunrise/sunset cache
// after the weather feed lands, so the next visit (and the next
// navigation) gets pre-paint correct via the inline ThemeBoot script
// and the server-side cookie read in app/layout.tsx + app/demo/page.tsx.
//
// Cookie scope: site-wide, max-age = 30 days (rotates faster than
// sunrise/sunset can drift meaningfully). Path=/ so every route
// inherits the same signal.

import { setSafe } from "@/lib/storage-safe";
import {
  SUNRISE_STORAGE_KEY,
  SUNSET_STORAGE_KEY,
  THEME_COOKIE,
  THEME_STORAGE_KEY,
  themeFromIsNight,
} from "./resolve";

const COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 30;

export function persistResolvedTheme(opts: {
  isNight: boolean;
  sunriseIso?: string | null;
  sunsetIso?: string | null;
}) {
  if (typeof document === "undefined") return;
  const theme = themeFromIsNight(opts.isNight);

  // Cookie — server-readable. SameSite=Lax is fine; theme isn't
  // security-sensitive and a same-site request from a navigation is
  // exactly when we need it on the server. Secure on https so the
  // cookie can't be rewritten over a downgraded http proxy hop —
  // ALEXANDER craft-review hardening, no behavior change otherwise.
  const secureFlag =
    typeof location !== "undefined" && location.protocol === "https:" ? ["Secure"] : [];
  document.cookie = [
    `${THEME_COOKIE}=${encodeURIComponent(theme)}`,
    `Path=/`,
    `Max-Age=${COOKIE_MAX_AGE_SEC}`,
    `SameSite=Lax`,
    ...secureFlag,
  ].join("; ");

  setSafe(THEME_STORAGE_KEY, theme);
  if (opts.sunriseIso) setSafe(SUNRISE_STORAGE_KEY, opts.sunriseIso);
  if (opts.sunsetIso) setSafe(SUNSET_STORAGE_KEY, opts.sunsetIso);
}
