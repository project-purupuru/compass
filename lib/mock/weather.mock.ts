import { Effect, Layer, Stream } from "effect";
import { ELEMENTS, type Element } from "@/lib/domain/element";
import type { Precipitation, WeatherState } from "@/lib/domain/weather";
import { INITIAL_WEATHER_STATE } from "@/lib/domain/weather";
import { WeatherFeed } from "@/lib/ports/weather.port";

/**
 * Weather mock — emits subtle drift every 18-25s so the tile feels
 * actively tracked rather than static. State changes are intentionally
 * rare (the awareness layer reads weather as ambient backdrop, not
 * foreground signal); the live indicator carries the "tracking" feel.
 */

const PRECIP: Precipitation[] = ["clear", "rain", "snow", "storm"];

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

let state: WeatherState = INITIAL_WEATHER_STATE;
const subscribers = new Set<(s: WeatherState) => void>();
let tickHandle: ReturnType<typeof setTimeout> | null = null;

function nextState(prev: WeatherState): WeatherState {
  const tDelta = (Math.random() - 0.5) * 1.6;
  const temperature_c = Math.round(clamp(prev.temperature_c + tDelta, 8, 22) * 10) / 10;

  const tSec = Date.now() / 1000;
  const cosmic = 0.5 + 0.25 * Math.sin(tSec / 53) + 0.15 * Math.sin(tSec / 17 + 0.7);
  const cosmic_intensity = Math.round(clamp(cosmic, 0, 1) * 100) / 100;

  const amp = 0.85 + 0.3 * Math.sin(tSec / 38);
  const amplificationFactor = Math.round(amp * 100) / 100;

  const precipitation =
    Math.random() < 0.08
      ? (PRECIP[Math.floor(Math.random() * PRECIP.length)] as Precipitation)
      : prev.precipitation;
  const amplifiedElement =
    Math.random() < 0.05
      ? (ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)] as Element)
      : prev.amplifiedElement;

  return {
    temperature_c,
    precipitation,
    cosmic_intensity,
    amplifiedElement,
    amplificationFactor,
    observed_at: new Date().toISOString(),
    location: prev.location,
    source: prev.source,
  };
}

function emit(s: WeatherState): void {
  state = s;
  for (const cb of subscribers) {
    try {
      cb(s);
    } catch {
      /* isolate */
    }
  }
}

function scheduleNext(): void {
  if (typeof window === "undefined") return;
  const delay = 18_000 + Math.random() * 7_000;
  tickHandle = setTimeout(() => {
    emit(nextState(state));
    scheduleNext();
  }, delay);
}

function start(): void {
  if (tickHandle !== null) return;
  if (typeof window === "undefined") return;
  scheduleNext();
}

function stop(): void {
  if (tickHandle !== null) {
    clearTimeout(tickHandle);
    tickHandle = null;
  }
}

function subscribe(cb: (s: WeatherState) => void): () => void {
  subscribers.add(cb);
  if (subscribers.size === 1) start();
  return () => {
    subscribers.delete(cb);
    if (subscribers.size === 0) stop();
  };
}

export const WeatherMock = Layer.succeed(WeatherFeed, {
  current: Effect.sync(() => state),
  stream: Stream.async<WeatherState>((emit) => {
    const unsub = subscribe((s) => {
      emit.single(s);
    });
    return Effect.sync(unsub);
  }),
});
