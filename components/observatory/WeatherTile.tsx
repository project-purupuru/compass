"use client";

import { useEffect, useState } from "react";
import type { WeatherState, Precipitation } from "@/lib/domain/weather";
import type { Element } from "@/lib/score";
import { ELEMENT_KANJI } from "@/lib/domain/element";
import { timeAgo } from "@/lib/time/format";
import { KpiCell } from "./KpiCell";
import {
  Sun,
  CloudRain,
  CloudSnow,
  CloudLightning,
  MapPin,
  Thermometer,
  type Icon,
} from "@phosphor-icons/react";

// Maps precipitation state to its Phosphor fill-weight icon. Picked
// to mirror the original Unicode glyphs (☀ ☂ ❄ ⚡) that read at a
// glance — sun for clear, rain/snow clouds for the wet states, and
// lightning for storm.
const PRECIP_ICON: Record<Precipitation, Icon> = {
  clear: Sun,
  rain: CloudRain,
  snow: CloudSnow,
  storm: CloudLightning,
};

export function WeatherTile({
  state,
  flush,
}: {
  state: WeatherState;
  /** Mobile-panel mode: cells sit flush against each other with 1px
   * dividers, no rounded corners or tile shadow. */
  flush?: boolean;
}) {
  // `now` is null during SSR + first paint so server and client both render
  // the same "—" placeholder for the "X ago" span. useEffect runs only on
  // the client, populating real Date.now() and the 1s tick from there.
  // Prevents hydration mismatch (was: server "8m ago" vs client "6s ago").
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  return (
    <section className="relative z-10 flex h-full min-h-0 flex-col overflow-hidden border-t border-l border-puru-surface-border bg-puru-cloud-bright shadow-puru-rim-left">
      <header className="relative z-10 shrink-0 bg-puru-cloud-bright px-6 py-4 shadow-[0_1px_0_0_var(--puru-surface-border),0_2px_4px_var(--puru-surface-shadow-sm)]">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 flex-col">
            <h3 className="font-puru-display text-xl text-puru-ink-rich">Weather</h3>
          </div>
          <span className="inline-flex shrink-0 items-center gap-2.5 font-puru-mono text-2xs uppercase tracking-[0.22em] text-puru-ink-dim">
            <span
              className="puru-live-dot inline-block h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: "var(--puru-wood-vivid)" }}
              aria-hidden
            />
            <span className="inline-block min-w-[5.25em] text-right tabular-nums">
              {now === null ? "—" : timeAgo(state.observed_at, now)}
            </span>
          </span>
        </div>
      </header>
      <div
        className={
          flush
            ? "grid flex-1 grid-cols-2 auto-rows-fr gap-px overflow-y-auto bg-puru-surface-border"
            : "grid flex-1 grid-cols-2 auto-rows-fr gap-3 overflow-y-auto bg-puru-cloud-base px-4 py-4"
        }
        style={
          flush
            ? undefined
            : {
                backgroundImage: `linear-gradient(to left, color-mix(in oklch, var(--puru-${state.amplifiedElement}-vivid) var(--puru-bleed-mix), transparent) 0%, transparent var(--puru-bleed-stop))`,
              }
        }
      >
        <KpiCell
          flush={flush}
          label="temperature"
          value={`${state.temperature_c}°${state.temperature_unit ?? ""}`}
          aside={<Thermometer weight="fill" />}
        />
        {(() => {
          const PrecipIcon = PRECIP_ICON[state.precipitation];
          return (
            <KpiCell
              flush={flush}
              label="sky"
              value={<span className="capitalize">{state.precipitation}</span>}
              aside={<PrecipIcon weight="fill" />}
            />
          );
        })()}
        <KpiCell
          flush={flush}
          label="location"
          value={state.location}
          aside={<MapPin weight="fill" />}
        />
        <KpiCell
          flush={flush}
          label="amplifies"
          value={<span className="capitalize">{state.amplifiedElement}</span>}
          aside={ELEMENT_KANJI[state.amplifiedElement]}
          // Same "leader" treatment as the KpiStrip's winning cell —
          // element-tinted bleed gradient on the cell + kanji bumped
          // from the ambient 0.10 to 0.42 so the cosmos signal reads
          // clearly instead of looking washed-out.
          cellStyle={{
            backgroundImage: `linear-gradient(to left, color-mix(in oklch, var(--puru-${state.amplifiedElement}-vivid) var(--puru-bleed-mix), transparent) 0%, transparent var(--puru-bleed-stop))`,
          }}
          asideStyle={{
            color: `var(--puru-${state.amplifiedElement}-vivid)`,
            opacity: 0.42,
          }}
        />
      </div>
    </section>
  );
}
