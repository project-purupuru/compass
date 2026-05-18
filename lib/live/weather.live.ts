import { Effect, Layer, Stream } from "effect";
import { getSafe, setSafe } from "@/lib/storage-safe";
import type { Element } from "@/lib/domain/element";
import type { Precipitation, WeatherState } from "@/lib/domain/weather";
import { INITIAL_WEATHER_STATE } from "@/lib/domain/weather";
import { WeatherFeed } from "@/lib/ports/weather.port";

/**
 * Live weather adapter — browser geolocation → IP fallback → Tokyo,
 * then Open-Meteo for current conditions + sunrise/sunset, then a wuxing
 * mapping that ties the visible sky to the canvas tide.
 *
 * Public APIs used (no keys required):
 *   - Open-Meteo Forecast        https://open-meteo.com
 *   - BigDataCloud reverse geo   https://www.bigdatacloud.com/free-api/free-reverse-geocode-to-city-api
 *   - ipapi.co                   https://ipapi.co
 *
 * The feed boots with INITIAL_WEATHER_STATE so subscribers always have
 * something to render (SSR-safe, no flash of empty UI). First real emit
 * lands as soon as the geolocate + fetch chain resolves, then refreshes
 * every 10 min.
 */

const REFRESH_MS = 10 * 60 * 1000;
const GEO_CACHE_KEY = "puru.weather.geo.v4";
const GEO_TIMEOUT_MS = 6_000;

interface ResolvedLocation {
  lat: number;
  lon: number;
  name: string;
  countryCode: string;
  via: "browser" | "ip" | "fallback";
}

const TOKYO: ResolvedLocation = {
  lat: 35.6762,
  lon: 139.6503,
  name: "Tokyo",
  countryCode: "JP",
  via: "fallback",
};

const FAHRENHEIT_COUNTRIES = new Set(["US", "LR", "MM"]);

function unitFor(countryCode: string | undefined): "C" | "F" {
  if (!countryCode) return "C";
  return FAHRENHEIT_COUNTRIES.has(countryCode.toUpperCase()) ? "F" : "C";
}

const LEADING_GENERICS = new Set([
  "rancho",
  "mount",
  "mt",
  "lake",
  "fort",
  "ft",
  "cape",
  "port",
  "old",
  "new",
  "north",
  "south",
  "east",
  "west",
]);
const TRAILING_GENERICS = new Set(["city", "town", "village"]);

function compactName(raw: string): string {
  const head = raw.split(/[-,/;]/)[0]?.trim() || raw;
  let words = head.split(/\s+/).filter(Boolean);
  if (words.length <= 2) return words.join(" ");
  const last = words[words.length - 1]?.toLowerCase() ?? "";
  if (TRAILING_GENERICS.has(last) && words.length - 1 >= 2) {
    words = words.slice(0, -1);
  }
  if (words.length > 2 && LEADING_GENERICS.has(words[0]?.toLowerCase() ?? "")) {
    words = words.slice(1);
  }
  if (words.length > 2) {
    words = words.slice(-2);
  }
  return words.join(" ");
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function readCachedLocation(): ResolvedLocation | null {
  const raw = getSafe(GEO_CACHE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ResolvedLocation;
    if (typeof parsed.lat !== "number" || typeof parsed.lon !== "number") return null;
    if (typeof parsed.countryCode !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCachedLocation(loc: ResolvedLocation): void {
  setSafe(GEO_CACHE_KEY, JSON.stringify(loc));
}

function browserGeo(): Promise<{ lat: number; lon: number } | null> {
  if (typeof window === "undefined" || !navigator.geolocation) return Promise.resolve(null);
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => resolve(null),
      { timeout: GEO_TIMEOUT_MS, maximumAge: 5 * 60 * 1000, enableHighAccuracy: false },
    );
  });
}

interface ReverseGeo {
  name: string;
  countryCode: string;
}

async function reverseGeocode(lat: number, lon: number): Promise<ReverseGeo | null> {
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const j = (await res.json()) as {
      city?: string;
      locality?: string;
      principalSubdivision?: string;
      countryCode?: string;
    };
    const name = compactName(j.city || j.locality || j.principalSubdivision || "Here");
    return { name, countryCode: (j.countryCode || "").toUpperCase() };
  } catch {
    return null;
  }
}

async function ipGeo(): Promise<ResolvedLocation | null> {
  try {
    const res = await fetch("https://ipapi.co/json/");
    if (!res.ok) return null;
    const j = (await res.json()) as {
      latitude?: number;
      longitude?: number;
      city?: string;
      region?: string;
      country_code?: string;
    };
    if (typeof j.latitude !== "number" || typeof j.longitude !== "number") return null;
    return {
      lat: j.latitude,
      lon: j.longitude,
      name: compactName(j.city || j.region || "Unknown"),
      countryCode: (j.country_code || "").toUpperCase(),
      via: "ip",
    };
  } catch {
    return null;
  }
}

async function resolveLocation(): Promise<ResolvedLocation> {
  const cached = readCachedLocation();
  if (cached) return cached;

  const browser = await browserGeo();
  if (browser) {
    const rev = await reverseGeocode(browser.lat, browser.lon);
    const loc: ResolvedLocation = {
      ...browser,
      name: rev?.name ?? "Here",
      countryCode: rev?.countryCode ?? "",
      via: "browser",
    };
    writeCachedLocation(loc);
    return loc;
  }

  const ip = await ipGeo();
  if (ip) {
    writeCachedLocation(ip);
    return ip;
  }

  return TOKYO;
}

interface OpenMeteoCurrent {
  time: string;
  temperature_2m: number;
  weather_code: number;
  cloud_cover: number;
  uv_index: number | null;
  is_day: number;
}
interface OpenMeteoResponse {
  current: OpenMeteoCurrent;
  daily: { sunrise: string[]; sunset: string[] };
}

async function fetchOpenMeteo(
  lat: number,
  lon: number,
  unit: "C" | "F",
): Promise<OpenMeteoResponse | null> {
  try {
    const tempUnit = unit === "F" ? "&temperature_unit=fahrenheit" : "";
    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,weather_code,cloud_cover,uv_index,is_day` +
      `&daily=sunrise,sunset` +
      `&timezone=auto` +
      tempUnit;
    const res = await fetch(url);
    if (!res.ok) return null;
    return (await res.json()) as OpenMeteoResponse;
  } catch {
    return null;
  }
}

function mapPrecipitation(code: number): Precipitation {
  if (code >= 95) return "storm";
  if (code >= 71 && code <= 77) return "snow";
  if (code === 85 || code === 86) return "snow";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  return "clear";
}

function deriveAmplifiedElement(
  precip: Precipitation,
  temp: number,
  unit: "C" | "F",
  monthIndex: number,
): Element {
  if (precip === "rain" || precip === "storm") return "water";
  if (precip === "snow") return "metal";
  const hot = unit === "F" ? 79 : 26;
  const cold = unit === "F" ? 39 : 4;
  if (temp >= hot) return "fire";
  if (temp <= cold) return "water";
  if (monthIndex >= 2 && monthIndex <= 4) return "wood";
  if (monthIndex >= 5 && monthIndex <= 6) return "fire";
  if (monthIndex === 7) return "earth";
  if (monthIndex >= 8 && monthIndex <= 10) return "metal";
  return "water";
}

function deriveCosmicIntensity(
  uvIndex: number | null,
  cloudCoverPct: number,
  isDay: boolean,
): number {
  if (!isDay) {
    const t = Date.now() / 1000;
    return clamp(0.18 + 0.08 * Math.sin(t / 47), 0.12, 0.32);
  }
  const uv = uvIndex === null || uvIndex === undefined ? 4 : uvIndex;
  const sun = clamp(uv / 10, 0, 1);
  const dampen = 1 - clamp(cloudCoverPct, 0, 100) / 100 / 1.6;
  return Math.round(clamp(sun * dampen + 0.15, 0.1, 1) * 100) / 100;
}

function deriveIsNight(nowMs: number, sunriseIso?: string, sunsetIso?: string): boolean {
  if (!sunriseIso || !sunsetIso) return false;
  const sr = new Date(sunriseIso).getTime();
  const ss = new Date(sunsetIso).getTime();
  return nowMs < sr || nowMs >= ss;
}

function buildState(loc: ResolvedLocation, om: OpenMeteoResponse, unit: "C" | "F"): WeatherState {
  const c = om.current;
  const sunrise = om.daily.sunrise?.[0];
  const sunset = om.daily.sunset?.[0];
  const isDay = c.is_day === 1;
  const precip = mapPrecipitation(c.weather_code);
  const monthIndex = new Date().getMonth();
  const amplified = deriveAmplifiedElement(precip, c.temperature_2m, unit, monthIndex);
  const cosmic = deriveCosmicIntensity(c.uv_index, c.cloud_cover, isDay);
  return {
    temperature_c: Math.round(c.temperature_2m * 10) / 10,
    precipitation: precip,
    cosmic_intensity: cosmic,
    amplifiedElement: amplified,
    amplificationFactor: Math.round((0.85 + cosmic * 0.3) * 100) / 100,
    observed_at: c.time ? new Date(c.time).toISOString() : new Date().toISOString(),
    location: loc.name,
    source:
      loc.via === "browser"
        ? "open-meteo · here"
        : loc.via === "ip"
          ? "open-meteo · ip"
          : "open-meteo · default",
    sunrise,
    sunset,
    is_night: deriveIsNight(Date.now(), sunrise, sunset),
    temperature_unit: unit,
  };
}

// Module-private state machine. Single instance per page; subscribers'
// lifecycle starts the feed lazily and stops it when the last unsubscribes.
let state: WeatherState = INITIAL_WEATHER_STATE;
const subscribers = new Set<(s: WeatherState) => void>();
let refreshHandle: ReturnType<typeof setInterval> | null = null;
let location: ResolvedLocation | null = null;
let started = false;

function emit(s: WeatherState): void {
  state = s;
  for (const cb of subscribers) {
    try {
      cb(s);
    } catch {
      // isolate
    }
  }
}

async function refreshOnce(): Promise<void> {
  if (!location) return;
  const unit = unitFor(location.countryCode);
  const om = await fetchOpenMeteo(location.lat, location.lon, unit);
  if (!om) return;
  emit(buildState(location, om, unit));
}

async function start(): Promise<void> {
  if (started) return;
  if (typeof window === "undefined") return;
  started = true;
  location = await resolveLocation();
  await refreshOnce();
  refreshHandle = setInterval(() => {
    void refreshOnce();
  }, REFRESH_MS);
}

function stop(): void {
  if (refreshHandle !== null) {
    clearInterval(refreshHandle);
    refreshHandle = null;
  }
  started = false;
}

function subscribe(cb: (s: WeatherState) => void): () => void {
  subscribers.add(cb);
  if (subscribers.size === 1) void start();
  return () => {
    subscribers.delete(cb);
    if (subscribers.size === 0) stop();
  };
}

export const WeatherLive = Layer.succeed(WeatherFeed, {
  current: Effect.sync(() => state),
  stream: Stream.async<WeatherState>((emit) => {
    const unsub = subscribe((s) => {
      emit.single(s);
    });
    return Effect.sync(unsub);
  }),
});
