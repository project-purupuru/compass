"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useWeather, sonifier } from "@/lib/runtime/react";
import type { Element } from "@/lib/score";
import type { PuruhaniIdentity } from "@/lib/sim/types";
import { activityStream } from "@/lib/activity";
import type { MintActivity } from "@/lib/activity";
import { populationStore } from "@/lib/sim/population.system";
import { persistResolvedTheme } from "@/lib/theme/persist";
import Image from "next/image";
import { KpiStrip } from "./KpiStrip";
import { ActivityRail } from "./ActivityRail";
import { WeatherTile } from "./WeatherTile";
import { IntroAnimation } from "./IntroAnimation";
import { PentagramCanvas } from "./PentagramCanvas";
import { FocusCard } from "./FocusCard";
import { MusicPlayer } from "./MusicPlayer";
import { MobileBottomPanel } from "./MobileBottomPanel";
import { StoneCeremony, readWelcomeElement } from "./StoneCeremony";

const ZERO_DISTRIBUTION: Record<Element, number> = {
  wood: 0,
  fire: 0,
  earth: 0,
  water: 0,
  metal: 0,
};

const ELEMENT_DISPLAY_ORDER: readonly Element[] = [
  "wood",
  "fire",
  "earth",
  "metal",
  "water",
] as const;

export function ObservatoryClient() {
  const [introDone, setIntroDone] = useState(false);
  // Stone Recognition Ceremony — element to celebrate, set after intro
  // when the ?welcome=<element> URL param is present and the per-element
  // shown flag isn't set in localStorage. Null means no ceremony to play
  // (returning visit, no welcome param, or invalid element). The
  // post-intro defer is intentional: the IntroAnimation logo flash
  // gets to land before the ceremony scrim covers it.
  const [ceremonyElement, setCeremonyElement] = useState<Element | null>(null);
  const [distribution, setDistribution] = useState<Record<Element, number>>(ZERO_DISTRIBUTION);
  const weather = useWeather();
  const [focused, setFocused] = useState<PuruhaniIdentity | null>(null);
  // `playing` drives the MusicPlayer's <audio> element. `sfxEnabled`
  // independently toggles the pentatonic sonifier — both must be true
  // for the per-event chimes to fire, so the user can run the
  // soundtrack alone, the chimes alone (rare, but possible after a
  // first play), or both. The sonifier's AudioContext is independent
  // of the MP3 audio routing, so the two streams don't fight for the
  // same resource.
  const [playing, setPlaying] = useState(false);
  const [sfxEnabled, setSfxEnabled] = useState(true);
  const focusCardRef = useRef<HTMLElement>(null);
  // Pentagram pane container ref — passed to StoneCeremony so the
  // exit migration can compute its target wedge in viewport coords.
  // The PentagramCanvas mounts inside this div and Pixi sizes itself
  // to the host's CSS box, so the canvas's internal geometry maps
  // 1:1 to this element's getBoundingClientRect().
  const pentagramPaneRef = useRef<HTMLDivElement>(null);
  // Timestamp of the most-recent sprite-click. Used by the
  // outside-click-closes-focus listener to ignore the same click that
  // *opened* the card via Pixi's pointertap (Pixi's federated event and
  // the underlying DOM click both fire on the same gesture).
  const lastSpriteClickRef = useRef(0);

  const handleSpriteClick = useCallback((id: PuruhaniIdentity) => {
    lastSpriteClickRef.current = Date.now();
    setFocused(id);
  }, []);

  // Stable identities for the music player's prop callbacks. The
  // sonifier lifecycle is owned by the effect below — these handlers
  // just flip React state.
  const handlePlayingChange = useCallback((next: boolean) => {
    setPlaying(next);
  }, []);
  const handleSfxToggle = useCallback(() => {
    setSfxEnabled((prev) => !prev);
  }, []);

  // Auto theme — flip <html data-theme> on the user's local sunrise/sunset
  // and persist the resolved value (cookie + localStorage with the
  // sunrise/sunset cache) so the inline ThemeBoot script can resolve
  // pre-paint on subsequent visits and navigations. ThemeBoot already
  // set a best-guess data-theme before this effect runs; this branch
  // is the authoritative correction once the weather feed lands.
  // "day-horai" is a sentinel that defeats the prefers-color-scheme:dark
  // mirror in globals.css (which only applies to :root:not([data-theme]))
  // so a system-dark visitor still gets light during their local day.
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (weather.is_night === undefined) return;
    document.documentElement.dataset.theme = weather.is_night ? "old-horai" : "day-horai";
    persistResolvedTheme({
      isNight: weather.is_night,
      sunriseIso: weather.sunrise,
      sunsetIso: weather.sunset,
    });
  }, [weather.is_night, weather.sunrise, weather.sunset]);

  // YOU sprite — spawned only when (a) a wallet is connected AND (b) a
  // real radar StoneClaimed event matches the wallet. Lands in the
  // wedge of the actually-claimed element, not a random one. Guest
  // sessions never trigger this so no YOU pill appears on the canvas
  // or YOU badge in the rail.
  //
  // First-fire flow:
  //   1. publicKey changes → effect runs.
  //   2. Scan existing radar events for any matching mint; if found,
  //      spawn YOU immediately (handles page-load-after-claim case).
  //   3. Otherwise subscribe; on first matching mint, spawn YOU and
  //      unsubscribe.
  //
  // populationStore.spawnYou is idempotent — repeated calls with the
  // same wallet are no-ops, so re-running this effect on a re-connect
  // doesn't double-spawn.
  const { publicKey } = useWallet();
  useEffect(() => {
    if (!publicKey) return;
    const wallet = publicKey.toBase58();
    const trigger = (m: MintActivity): void => {
      populationStore.spawnYou({
        trader: m.actor,
        element: m.element,
        identity: m.identity,
        joinedAt: m.at,
      });
    };
    const existing = activityStream
      .recent(200)
      .find((e): e is MintActivity => e.kind === "mint" && e.actor === wallet);
    if (existing) {
      trigger(existing);
      return;
    }
    const unsub = activityStream.subscribe((e) => {
      if (e.kind !== "mint") return;
      if (e.actor !== wallet) return;
      trigger(e);
      unsub();
    });
    return unsub;
  }, [publicKey]);

  // Sonifier lifecycle — runs only while BOTH music is playing AND sfx
  // is enabled. Cleanup unsubscribes and suspends the AudioContext, so
  // toggling either flag off silences the chimes without affecting the
  // <audio> element. The first sonifier.start() call rides the user
  // gesture from a button click (effect runs synchronously after the
  // click-driven render); subsequent resumes don't need a fresh gesture
  // per AudioContext spec.
  useEffect(() => {
    if (!playing || !sfxEnabled) return;
    void sonifier.start();
    const unsub = activityStream.subscribe((e) => {
      sonifier.play({ element: e.element, kind: e.kind });
    });
    return () => {
      unsub();
      sonifier.stop();
    };
  }, [playing, sfxEnabled]);

  // Outside-click-closes — listener attaches only while a sprite is
  // focused, so the click that *opened* the card never reaches this
  // handler (effect runs after the open render). The 80ms guard catches
  // the rare case of clicking a different sprite while one is focused —
  // setFocused replaces the identity; without the guard the document
  // listener would also fire and clobber it back to null.
  useEffect(() => {
    if (!focused) return;
    const onDocClick = (e: MouseEvent) => {
      if (Date.now() - lastSpriteClickRef.current < 80) return;
      const card = focusCardRef.current;
      if (card && card.contains(e.target as Node)) return;
      setFocused(null);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [focused]);

  // KPI sources — strip counts come straight from the populationStore so
  // the numbers always equal the actual on-map sprite count per element.
  // Subscribing fires on every spawn (initial seed = no fires; YOU spawn
  // + each trickle = one fire) — cheap recompute, no polling needed.
  // Weather is driven separately via the useWeather hook.
  useEffect(() => {
    setDistribution(populationStore.distribution());
    const unsubPop = populationStore.subscribe(() => {
      setDistribution(populationStore.distribution());
    });
    return unsubPop;
  }, []);

  // Leading clan — same computation as KpiStrip; powers the canvas-pane
  // edge gradient so the ambient backdrop tint follows whichever clan
  // is currently winning.
  const leader = useMemo(() => {
    let best: Element = "wood";
    let bestVal = -Infinity;
    for (const el of ELEMENT_DISPLAY_ORDER) {
      if (distribution[el] > bestVal) {
        bestVal = distribution[el];
        best = el;
      }
    }
    return best;
  }, [distribution]);

  return (
    <div className="flex h-dvh flex-col bg-puru-cloud-deep text-puru-ink-base">
      {!introDone && (
        <IntroAnimation
          onDone={() => {
            setIntroDone(true);
            // Read welcome only after the logo lands — defers cookie /
            // localStorage access until after first paint AND lets the
            // StoneCeremony scrim cover the post-intro state cleanly
            // instead of competing with the intro fade.
            const welcome = readWelcomeElement();
            if (welcome) setCeremonyElement(welcome);
          }}
        />
      )}
      {ceremonyElement && (
        <StoneCeremony
          element={ceremonyElement}
          pentagramPaneRef={pentagramPaneRef}
          onDismiss={() => setCeremonyElement(null)}
        />
      )}
      {/* Mobile-only compact header — brand wordmark + a tiny live pulse.
          The world stats live in the Stats tab below. Desktop's full
          KpiStrip takes over above lg via its own breakpoint. */}
      <div className="flex shrink-0 items-center justify-between border-b border-puru-surface-border bg-puru-cloud-bright px-4 py-2.5 lg:hidden">
        <span className="puru-wordmark-drift inline-flex">
          <Image
            src="/brand/purupuru-wordmark.svg"
            alt="purupuru"
            width={76}
            height={24}
            priority
            className="dark:hidden"
          />
          <Image
            src="/brand/purupuru-wordmark-white.svg"
            alt="purupuru"
            width={76}
            height={24}
            priority
            className="hidden dark:block"
          />
        </span>
        <span className="inline-flex items-center gap-2 font-puru-mono text-2xs uppercase tracking-[0.22em] text-puru-ink-dim">
          <span
            className="puru-live-dot inline-block h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: "var(--puru-wood-vivid)" }}
            aria-hidden
          />
          <span>live</span>
        </span>
      </div>
      <div className="hidden lg:block">
        <KpiStrip distribution={distribution} />
      </div>
      <main className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[1fr_440px]">
        <div ref={pentagramPaneRef} className="relative min-h-0">
          <PentagramCanvas
            onSpriteClick={handleSpriteClick}
            focusedTrader={focused?.trader ?? null}
            amplifiedElement={weather.amplifiedElement}
          />
          {/* Leading-clan edge gradient — soft cloud-like vignette
              tinted by whichever element is currently winning. Updates
              every 3s when the score adapter refreshes; the 1.2s
              transition smooths the cross-fade so a leader change
              reads as the cosmos shifting weather, not a snap. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-0 transition-[background] duration-[1200ms] ease-out"
            style={{
              background: `radial-gradient(ellipse at center, transparent 35%, color-mix(in oklch, var(--puru-${leader}-vivid) 18%, transparent) 100%)`,
            }}
          />
          {/* Synthetic-data disclaimer — top-right corner of the canvas
              pane. Honest signal to judges that this is a v0 demo with
              mocked stream + score data; the design vocab matches the
              other "live"/timestamp eyebrows so it reads as a UI label
              rather than a watermark. */}
          <span className="pointer-events-none absolute right-4 top-4 z-10 inline-flex items-center gap-2 rounded-puru-sm border border-puru-surface-border bg-puru-cloud-bright/85 px-2.5 py-1 font-puru-mono text-2xs uppercase tracking-[0.22em] text-puru-ink-dim shadow-puru-tile backdrop-blur-sm">
            <span
              aria-hidden
              className="inline-block h-1.5 w-1.5 rounded-full bg-puru-ink-dim/60"
            />
            synthetic data · demo
          </span>
          {/* MusicPlayer + FocusCard share the canvas pane's stacking
              context so the focus card cleanly slides in over the
              player when a sprite is clicked. Both anchored to bottom-
              left at the same width (340px) so they line up exactly. */}
          <MusicPlayer
            playing={playing}
            onPlayingChange={handlePlayingChange}
            sfxEnabled={sfxEnabled}
            onSfxToggle={handleSfxToggle}
            isNight={weather.is_night}
          />
          <FocusCard
            identity={focused}
            onClose={() => setFocused(null)}
            wrapperRef={focusCardRef}
          />
        </div>
        <aside className="hidden min-h-0 grid-rows-[minmax(0,1fr)_minmax(280px,auto)] overflow-hidden lg:grid">
          <div className="min-h-0 overflow-hidden">
            <ActivityRail />
          </div>
          <div className="min-h-0 overflow-hidden">
            <WeatherTile state={weather} />
          </div>
        </aside>
      </main>
      <MobileBottomPanel distribution={distribution} weather={weather} />
    </div>
  );
}
