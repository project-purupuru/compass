/**
 * /battle-v2/motion-lab — the paper-puppet motion sandbox.
 *
 * Operator direction (2026-05-16): "Need to actually visualize the different
 * variants … having a sandbox area that connects to the same substrate is
 * important for game infra and game engineering."
 *
 * This route is the sandbox. It renders one Station per element, each running
 * the same PaperPuppetSprite the in-world ElementColony will run. The motion
 * vocab (variant A/B/C, summon-pattern, frame counts, bend angles) is pure
 * data — what's discovered here ports forward verbatim.
 *
 * Additive · no in-flight files touched. Substrate-coupled via the data layer
 * (JaniManifest + PaperPuppetMotion). Renderer is DOM for iteration speed;
 * r3f equivalent slots in later (same data, different renderer).
 */

"use client";

import { useState } from "react";

import {
  JANI_MANIFEST,
  type ElementId,
} from "../_components/puppet/JaniManifest";
import "../_components/puppet/paper-puppet.css";
import {
  MOTION_VARIANTS,
  type MotionVariant,
  type PuppetState,
} from "../_components/puppet/PaperPuppetMotion";
import { Station } from "./_components/Station";
import { Toolbar } from "./_components/Toolbar";

interface StationSpec {
  readonly key: string;
  readonly element: ElementId;
  readonly variant?: "normal" | "flex" | "puddle";
  readonly variantLabel?: string;
}

/**
 * The lab's station roster. Every sprite-sheet variant in JaniManifest gets
 * its own visible station so flex + puddle aren't hidden behind state changes.
 * Order: wood family · fire · earth · metal · water family.
 */
const STATION_ROSTER: readonly StationSpec[] = [
  { key: "wood-normal", element: "wood" },
  { key: "wood-flex", element: "wood", variant: "flex", variantLabel: "flex" },
  { key: "fire-normal", element: "fire" },
  { key: "earth-normal", element: "earth" },
  { key: "metal-normal", element: "metal" },
  { key: "water-normal", element: "water" },
  { key: "water-puddle", element: "water", variant: "puddle", variantLabel: "puddle" },
];

export default function MotionLabPage() {
  const [variant, setVariant] = useState<MotionVariant>("billboard");
  const [globalState, setGlobalState] = useState<PuppetState | null>(null);

  const motion = MOTION_VARIANTS[variant];

  return (
    <main
      style={{
        // globals.css locks html+body at overflow:hidden / 100dvh for the
        // in-game canvas. The lab is a long-form sandbox — make <main> its
        // own scroll container so it lives inside the locked viewport.
        height: "100dvh",
        overflowY: "auto",
        padding: "32px 24px 64px",
        background:
          "radial-gradient(ellipse at top, oklch(0.22 0.014 80) 0%, oklch(0.10 0.008 80) 90%)",
        color: "var(--puru-ink-base)",
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Header */}
        <header style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <h1
            style={{
              margin: 0,
              fontFamily: "var(--font-puru-display)",
              fontSize: "clamp(28px, 4vw, 40px)",
              lineHeight: 1.1,
              color: "var(--puru-ink-rich)",
            }}
          >
            motion lab · paper-puppet vocabulary
          </h1>
          <p
            style={{
              margin: 0,
              fontFamily: "var(--font-puru-body)",
              fontSize: 14,
              color: "var(--puru-ink-soft)",
              maxWidth: 720,
            }}
          >
            5 element stations. one global motion vocab. cycle the variants,
            trigger events, watch how the cardboard reads.{" "}
            <span style={{ color: "var(--puru-ink-dim)" }}>
              substrate-coupled via JaniManifest · PaperPuppetMotion · all data.
            </span>
          </p>
        </header>

        <Toolbar
          variant={variant}
          onVariantChange={setVariant}
          globalState={globalState}
          onGlobalStateChange={setGlobalState}
        />

        {/* Station grid — every sprite variant gets its own slot */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
          }}
        >
          {STATION_ROSTER.map((spec) => {
            // Skip a spec if its variant isn't defined in the manifest (defensive).
            if (
              spec.variant &&
              !JANI_MANIFEST[spec.element][spec.variant]
            ) {
              return null;
            }
            return (
              <Station
                key={spec.key}
                element={spec.element}
                variant={spec.variant}
                variantLabel={spec.variantLabel}
                motion={motion}
                globalState={globalState}
              />
            );
          })}
        </section>

        {/* Footer note */}
        <footer
          style={{
            padding: "16px 20px",
            fontFamily: "var(--font-puru-mono)",
            fontSize: 10,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--puru-ink-dim)",
            background: "var(--puru-cloud-deep)",
            border: "1px solid var(--puru-surface-border)",
            borderRadius: "var(--radius-sm, 6px)",
            lineHeight: 1.6,
          }}
        >
          puppet-vocab · v0.1 · paper-mario+mulan+avatar · frame-by-frame as the flex
          <br />
          ambient = cheap procedural (walk-flip, bounce) · key moments = bespoke (crumple, summon, action)
          <br />
          renderer: DOM (sandbox) · ports to r3f via same JaniManifest+MotionConfig data
        </footer>
      </div>
    </main>
  );
}
