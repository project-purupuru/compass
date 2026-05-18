"use client";

/**
 * Intro / entry screen.
 *
 * The overlay's bg-puru-cloud-base layer is solid from frame 0 — the
 * observatory mounts behind it but is never visible until the exit
 * fade. Only the contents (logo, then buttons) animate in over the
 * solid backdrop.
 *
 * Three stages:
 *   1. `logo`     — wordmark fades + softly scales in over solid bg.
 *   2. `buttons`  — buttons arc up from below into their resting place,
 *                   then logo shifts as the column grows.
 *   3. `exit`     — whole overlay fades out and unmounts; parent's
 *                   `onDone` fires from AnimatePresence's onExitComplete.
 *
 * Pre-connect: two buttons — `Connect Wallet` (opens the wallet modal)
 * and `Enter as guest` (skips wallet). Post-connect (or auto-connect
 * from prior session): single `Enter →` button + a small "connected
 * as <truncated>" label.
 *
 * Reduced-motion: skips the whole animation, fires `onDone` immediately.
 *
 * Ambient celestial — sun by day, moon by night, positioned along an
 * arc that mirrors the user's actual local time (read from the theme
 * system's cached sunrise/sunset). Same source the main observatory
 * uses, so the world's "what time is it" is consistent across surfaces:
 *   intro → ceremony → observatory all see the same sky.
 *
 * Styling: follows the puru design system (cloud-base canvas,
 * fire-vivid primary accent, font-puru-mono uppercase tracking for
 * button labels). No wallet-adapter-react-ui default purple gradient
 * appears in the entry UI — its modal does pop up on connect-click
 * but it's user-action-bound so the brand-cloud entry surface stays
 * brand-consistent.
 */

import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { CELESTIAL } from "@/lib/world-purupuru-cdn";
import { resolveCelestialPosition, type CelestialPosition } from "@/lib/celestial/position";

const EASE = [0.22, 1, 0.36, 1] as const;
const LOGO_TO_BUTTONS_DELAY_MS = 1200;
/** Brief beat to acknowledge the connected wallet before auto-exiting. */
const CONNECTED_AUTO_ENTER_MS = 500;

type Stage = "logo" | "buttons" | "exit";

export function IntroAnimation({ onDone }: { onDone: () => void }) {
  const reduce = useReducedMotion();
  const { publicKey, connecting } = useWallet();
  const { setVisible } = useWalletModal();
  const connected = publicKey !== null;
  const [stage, setStage] = useState<Stage>("logo");
  // Celestial position is computed client-side from cached
  // sunrise/sunset + current time. Resolved in an effect to avoid
  // SSR / hydration mismatches (Date.now() differs between server
  // and client).
  const [celestial, setCelestial] = useState<CelestialPosition | null>(null);

  useEffect(() => {
    setCelestial(resolveCelestialPosition());
  }, []);

  // Reduced motion: skip the choreography entirely.
  useEffect(() => {
    if (reduce) onDone();
  }, [reduce, onDone]);

  // Read latest `connected` inside the timer body without making the
  // logo-stage timer reset whenever the wallet state flips.
  const connectedRef = useRef(connected);
  useEffect(() => {
    connectedRef.current = connected;
  }, [connected]);

  // Advance the logo stage after the hold delay. If the wallet has already
  // auto-connected by then, skip the buttons stage entirely and exit
  // straight to the app (logo → app).
  useEffect(() => {
    if (reduce) return;
    if (stage !== "logo") return;
    const t = window.setTimeout(() => {
      setStage(connectedRef.current ? "exit" : "buttons");
    }, LOGO_TO_BUTTONS_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [stage, reduce]);

  // Auto-enter when the user finishes connecting mid-buttons-stage.
  useEffect(() => {
    if (reduce) return;
    if (!connected) return;
    if (stage !== "buttons") return;
    const t = window.setTimeout(() => setStage("exit"), CONNECTED_AUTO_ENTER_MS);
    return () => window.clearTimeout(t);
  }, [connected, stage, reduce]);

  if (reduce) return null;

  const handleEnter = () => setStage("exit");
  const handleConnect = () => setVisible(true);

  const truncated = publicKey
    ? `${publicKey.toBase58().slice(0, 4)}…${publicKey.toBase58().slice(-4)}`
    : "";

  return (
    <AnimatePresence onExitComplete={onDone}>
      {stage !== "exit" && (
        <motion.div
          key="intro"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
          className="pointer-events-auto fixed inset-0 z-30 flex flex-col items-center justify-center gap-12 overflow-hidden bg-puru-cloud-base px-6 md:gap-14"
        >
          {/* ── Ambient celestial · sun by day / moon by night ──────
                Positioned along an east→west arc matching the user's
                actual local time. Reads cached sunrise/sunset from
                the theme system (same source as the observatory's
                day/night flip), so all three surfaces see the same
                sky. Soft breathing on opacity + scale; the body never
                competes with the wordmark for the eye — it's the
                room the brand sits inside. */}
          {celestial && <CelestialBody position={celestial} />}

          {/* Wordmark — fades + softly scales in over the solid bg.
              Reflow when buttons mount naturally pushes it up since
              the flex column is justify-center. */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.15, ease: EASE }}
            className="relative z-10"
          >
            <Image
              src="/brand/purupuru-wordmark.svg"
              alt="purupuru"
              width={320}
              height={120}
              priority
              className="dark:hidden"
            />
            <Image
              src="/brand/purupuru-wordmark-white.svg"
              alt="purupuru"
              width={320}
              height={120}
              priority
              className="hidden dark:block"
            />
          </motion.div>

          {/* Action panel — ALWAYS rendered (just opacity-gated by
              stage) so the flex column's height never changes when
              buttons "appear." Mounting buttons via AnimatePresence
              triggered a layout reflow that shifted the wordmark
              upward — the eye reads that shift as the brand getting
              displaced. Reserving the space avoids the reflow.
              Operator note 2026-05-11: the celestial body is the
              arc (sun/moon east→west across the sky); the buttons
              should just enter naturally, no bouncy motion. */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{
              opacity: stage === "buttons" ? 1 : 0,
              y: stage === "buttons" ? 0 : 8,
            }}
            transition={{ duration: 0.7, ease: EASE }}
            className="relative z-10 flex w-full max-w-xs flex-col gap-2.5"
            // Block clicks until visible — keeps the buttons inert
            // during the logo stage so an accidental click can't
            // skip the intro entirely.
            style={{ pointerEvents: stage === "buttons" ? "auto" : "none" }}
            aria-hidden={stage !== "buttons"}
          >
            {connected ? (
              <p className="text-center font-puru-mono text-2xs uppercase tracking-[0.22em] text-puru-ink-dim">
                connected · {truncated} · entering…
              </p>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleConnect}
                  disabled={connecting || stage !== "buttons"}
                  tabIndex={stage === "buttons" ? 0 : -1}
                  className="rounded-puru-sm border border-puru-ink-soft bg-puru-cloud-bright px-6 py-3.5 font-puru-mono text-xs uppercase tracking-[0.22em] text-puru-ink-rich shadow-puru-tile transition-[background-color,border-color,box-shadow] hover:border-puru-ink-rich hover:bg-puru-cloud-dim hover:shadow-puru-tile-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-puru-ink-soft disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {connecting ? "Connecting…" : "Connect Wallet"}
                </button>
                <button
                  type="button"
                  onClick={handleEnter}
                  disabled={stage !== "buttons"}
                  tabIndex={stage === "buttons" ? 0 : -1}
                  className="rounded-puru-sm px-6 py-2.5 font-puru-mono text-2xs uppercase tracking-[0.22em] text-puru-ink-dim transition-colors hover:text-puru-ink-rich focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-puru-surface-border disabled:cursor-default"
                >
                  Enter as guest
                </button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Celestial body · sun or moon at time-mapped position ───────────
//
// Sized to feel atmospheric, not iconographic — large enough to read
// as "the sky" but soft enough not to compete with the wordmark.
// Day-mode sun is honey-warm and sits behind the type at low opacity
// to avoid pulling the eye. Night-mode moon is paler + cooler.
//
// Breathing rhythm matches the rest of the puru system (~6s) — slow
// enough that you don't notice it as motion, fast enough to read as
// "alive" if you stare. Y-axis only (HoloCard discipline · no scale
// breath that would pulse the silhouette).

function CelestialBody({ position }: { position: CelestialPosition }) {
  const src = position.body === "sun" ? CELESTIAL.sun : CELESTIAL.moon;
  // Sun is slightly larger than moon — sun has the rays, moon's
  // clouds add visual mass on their own.
  const sizePx = position.body === "sun" ? 220 : 200;
  const breathSec = 6;

  // Memoize the position style so framer doesn't re-trigger entry on
  // every parent render.
  const positionStyle = useMemo(
    () => ({
      left: `${position.xPct}%`,
      top: `${position.yPct}%`,
      width: sizePx,
      height: sizePx,
      // Translate-50 for true centering on the computed coordinate.
      transform: "translate(-50%, -50%)",
    }),
    [position.xPct, position.yPct, sizePx],
  );

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute"
      style={positionStyle}
      // Body itself fades in slow — the sky doesn't snap into being.
      // Opacity target respects the horizon-fade hint from the
      // position helper so a body that just rose / is about to set
      // reads softer.
      initial={{ opacity: 0, y: 8 }}
      animate={{
        opacity: position.opacity * (position.body === "sun" ? 0.85 : 0.92),
        // Subtle breathing translateY — overlays the entry.
        y: [0, -3, 0],
      }}
      transition={{
        opacity: { duration: 1.6, ease: EASE, delay: 0.1 },
        y: {
          duration: breathSec,
          delay: 1.6,
          repeat: Infinity,
          ease: [0.45, 0.05, 0.55, 0.95],
        },
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        width={sizePx}
        height={sizePx}
        className="h-full w-full object-contain"
        style={{
          // Soft glow behind the body — element of the sky responding
          // to the body's presence. Sun glows honey-warm; moon glows
          // pale cool. Drop-shadow rather than outer ring so the body
          // stays the focal mark.
          filter:
            position.body === "sun"
              ? "drop-shadow(0 0 28px color-mix(in oklch, var(--puru-honey-bright) 60%, transparent)) drop-shadow(0 0 12px color-mix(in oklch, var(--puru-honey-base) 40%, transparent))"
              : "drop-shadow(0 0 24px color-mix(in oklch, var(--puru-water-tint) 70%, transparent)) drop-shadow(0 0 10px oklch(0.92 0.02 230 / 0.4))",
        }}
      />
    </motion.div>
  );
}
