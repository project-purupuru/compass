/**
 * /battle-v2/puppet-3d — paper-puppet janis in a real r3f scene.
 *
 * Operator direction (2026-05-16): "Wire it into the game so I can see it.
 * Map it into R3F. The billboard feels the most right atm."
 *
 * This route ports the DOM motion-lab vocab into a real Three.js Canvas:
 *   - Ground plane (warm Ghibli-tinted)
 *   - Directional light from upper-left (matches LightDirection convention)
 *   - Warm ambient (no neutral white — Ghibli rule per construct synthesis)
 *   - 5 PaperPuppet3D instances, one per element, billboard variant (default)
 *   - DOM HUD overlay for state control + variant + flip
 *
 * Substrate-coupled: PaperPuppet3D consumes the same JaniManifest + MotionConfig
 * data the DOM lab uses. What's tuned in the lab ports forward verbatim.
 */

"use client";

import { Suspense, useCallback, useState } from "react";

import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";

import { ELEMENT_LABELS, ELEMENT_ORDER, type ElementId } from "../_components/puppet/JaniManifest";
import { PaperPuppet3D } from "../_components/puppet/PaperPuppet3D";
import {
  MOTION_VARIANTS,
  MOTION_VARIANT_ORDER,
  type MotionConfig,
  type MotionVariant,
  type PuppetState,
} from "../_components/puppet/PaperPuppetMotion";

interface PuppetSpec {
  readonly element: ElementId;
  readonly variant?: "normal" | "flex" | "puddle";
  readonly position: readonly [number, number, number];
}

/** Scene layout — 5 normals in a row; wood flex + water puddle behind. */
const PUPPET_LAYOUT: readonly PuppetSpec[] = [
  // Front row: 5 normals across, spaced 1.6 world units apart
  ...ELEMENT_ORDER.map(
    (el, i): PuppetSpec => ({
      element: el,
      position: [(i - (ELEMENT_ORDER.length - 1) / 2) * 1.6, 0, 0] as const,
    }),
  ),
  // Back row: variants
  { element: "wood", variant: "flex", position: [-2.4, 0, -2.2] },
  { element: "water", variant: "puddle", position: [2.4, 0, -2.2] },
];

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <planeGeometry args={[60, 60]} />
      {/* Warm Ghibli-tinted ground — saturated yellow-orange OKLCH approximation in sRGB */}
      <meshStandardMaterial color="#4a3d28" roughness={0.95} metalness={0} />
    </mesh>
  );
}

function Scene({
  motion,
  globalState,
  flipAll,
  perPuppetState,
  onPuppetClick,
}: {
  readonly motion: MotionConfig;
  readonly globalState: PuppetState | null;
  readonly flipAll: boolean;
  readonly perPuppetState: Record<string, PuppetState>;
  readonly onPuppetClick: (key: string) => void;
}) {
  return (
    <>
      {/* Warm Ghibli ambient — never neutral white (per the-easel) */}
      <ambientLight intensity={0.55} color="#fff2d4" />
      {/* Directional from upper-left to match LightDirection {-0.7, -0.7} */}
      <directionalLight
        position={[-6, 9, 5]}
        intensity={1.1}
        color="#fff0c0"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      {/* Warm fill from below-right to soften shadow side */}
      <directionalLight position={[5, 2, 3]} intensity={0.3} color="#ffe8c0" />

      <Suspense fallback={null}>
        <Ground />
        {PUPPET_LAYOUT.map((spec) => {
          const key = `${spec.element}-${spec.variant ?? "normal"}`;
          const localState = perPuppetState[key] ?? "idle";
          const state = globalState ?? localState;
          return (
            <group
              key={key}
              position={[spec.position[0], spec.position[1], spec.position[2]]}
              onClick={(e) => {
                e.stopPropagation();
                onPuppetClick(key);
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                document.body.style.cursor = "pointer";
              }}
              onPointerOut={() => {
                document.body.style.cursor = "auto";
              }}
            >
              <PaperPuppet3D
                element={spec.element}
                variant={spec.variant}
                motion={motion}
                state={state}
                flipX={flipAll}
                worldHeight={1.4}
              />
            </group>
          );
        })}
      </Suspense>
    </>
  );
}

const STATE_OPTIONS: readonly (PuppetState | "release")[] = [
  "release",
  "walk",
  "action",
  "summon",
  "crumple",
];

export default function PaperPuppet3DPage() {
  const [variant, setVariant] = useState<MotionVariant>("billboard");
  const [globalState, setGlobalState] = useState<PuppetState | null>(null);
  const [flipAll, setFlipAll] = useState(false);
  const [perPuppetState, setPerPuppetState] = useState<Record<string, PuppetState>>({});
  const [cycle, setCycle] = useState(0); // bumps to re-trigger animations on same state

  const motion = MOTION_VARIANTS[variant];

  const handleStateButton = useCallback((s: PuppetState | "release") => {
    if (s === "release") {
      setGlobalState(null);
      setPerPuppetState({});
    } else {
      setGlobalState(s);
      setCycle((c) => c + 1);
      // Auto-release after key-moment animations so puppets return to idle.
      const duration = s === "walk" ? 0 : 2500;
      if (duration > 0) {
        window.setTimeout(() => {
          setGlobalState(null);
        }, duration);
      }
    }
  }, []);

  const handlePuppetClick = useCallback((key: string) => {
    if (globalState !== null) return;
    setPerPuppetState((prev) => ({ ...prev, [key]: "action" }));
    window.setTimeout(() => {
      setPerPuppetState((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }, 1200);
  }, [globalState]);

  // Force re-render on cycle bump so animations re-trigger (React reconciliation).
  void cycle;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background:
          "radial-gradient(ellipse at 50% 25%, #3a2f1c 0%, #1f1810 60%, #0f0a06 100%)",
        overflow: "hidden",
      }}
    >
      {/* THE CANVAS */}
      <Canvas shadows dpr={[1, 2]} style={{ position: "absolute", inset: 0 }}>
        <PerspectiveCamera makeDefault position={[0, 2.6, 5.2]} fov={42} />
        <OrbitControls
          target={[0, 0.7, -0.5]}
          maxPolarAngle={Math.PI / 2 - 0.05}
          minDistance={3}
          maxDistance={12}
          enablePan={false}
        />
        <Scene
          motion={motion}
          globalState={globalState}
          flipAll={flipAll}
          perPuppetState={perPuppetState}
          onPuppetClick={handlePuppetClick}
        />
      </Canvas>

      {/* Paper grain overlay — dropped from 0.38 → 0.22 after operator flagged
       * opacity-layering as cheap (2026-05-16). If 0.22 still reads cheap,
       * remove entirely; the right path becomes a real r3f postprocess pass
       * with animated "boil" grain over the scene. */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "url(/art/patterns/grain-warm.webp)",
          backgroundSize: "256px 256px",
          mixBlendMode: "soft-light",
          opacity: 0.22,
          pointerEvents: "none",
          zIndex: 5,
        }}
      />

      {/* DOM HUD overlay */}
      <header
        style={{
          position: "absolute",
          top: 24,
          left: 24,
          right: 24,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          pointerEvents: "none",
        }}
      >
        <div style={{ pointerEvents: "auto" }}>
          <h1
            style={{
              margin: 0,
              fontFamily: "var(--font-puru-display)",
              fontSize: 28,
              color: "var(--puru-ink-rich)",
              textShadow: "0 1px 0 rgba(0,0,0,0.6)",
              letterSpacing: "0.01em",
            }}
          >
            puppet · 3D
          </h1>
          <p
            style={{
              margin: "4px 0 0 0",
              fontFamily: "var(--font-puru-body)",
              fontSize: 13,
              color: "var(--puru-ink-soft)",
              textShadow: "0 1px 0 rgba(0,0,0,0.6)",
            }}
          >
            same data layer as /motion-lab · r3f renderer · drag to orbit · click a puppet for action
          </p>
        </div>

        {/* Variant pills */}
        <div
          style={{
            display: "flex",
            gap: 8,
            pointerEvents: "auto",
            padding: 12,
            background: "var(--puru-cloud-bright)",
            border: "1px solid var(--puru-surface-border)",
            borderRadius: "var(--radius-md, 12px)",
            alignSelf: "flex-start",
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          }}
        >
          {MOTION_VARIANT_ORDER.map((v) => {
            const active = v === variant;
            return (
              <button
                key={v}
                type="button"
                onClick={() => setVariant(v)}
                style={{
                  padding: "6px 14px",
                  fontFamily: "var(--font-puru-mono)",
                  fontSize: 10,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  background: active ? "var(--puru-honey-base)" : "var(--puru-cloud-base)",
                  color: active ? "oklch(0.15 0.04 80)" : "var(--puru-ink-base)",
                  border: `1px solid ${active ? "var(--puru-honey-base)" : "var(--puru-surface-border)"}`,
                  borderRadius: "var(--radius-sm, 6px)",
                  cursor: "pointer",
                }}
              >
                {MOTION_VARIANTS[v].displayName}
              </button>
            );
          })}
        </div>
      </header>

      {/* Bottom state controls */}
      <footer
        style={{
          position: "absolute",
          bottom: 24,
          left: 24,
          right: 24,
          display: "flex",
          justifyContent: "center",
          gap: 12,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 8,
            padding: "12px 16px",
            background: "var(--puru-cloud-bright)",
            border: "1px solid var(--puru-surface-border)",
            borderRadius: "var(--radius-md, 12px)",
            pointerEvents: "auto",
            boxShadow: "0 -4px 24px rgba(0,0,0,0.4)",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-puru-mono)",
              fontSize: 10,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "var(--puru-ink-soft)",
              marginRight: 6,
            }}
          >
            broadcast
          </span>
          {STATE_OPTIONS.map((s) => {
            const active =
              (s === "release" && globalState === null) ||
              (s !== "release" && globalState === s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => handleStateButton(s)}
                style={{
                  padding: "8px 14px",
                  fontFamily: "var(--font-puru-mono)",
                  fontSize: 10,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  background: active ? "var(--puru-honey-base)" : "var(--puru-cloud-base)",
                  color: active ? "oklch(0.15 0.04 80)" : "var(--puru-ink-base)",
                  border: `1px solid ${active ? "var(--puru-honey-base)" : "var(--puru-surface-border)"}`,
                  borderRadius: "var(--radius-sm, 6px)",
                  cursor: "pointer",
                }}
              >
                {s}
              </button>
            );
          })}
          <span
            style={{
              width: 1,
              height: 22,
              background: "var(--puru-surface-border)",
              margin: "0 4px",
            }}
          />
          <button
            type="button"
            onClick={() => setFlipAll((f) => !f)}
            style={{
              padding: "8px 14px",
              fontFamily: "var(--font-puru-mono)",
              fontSize: 10,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              background: flipAll ? "var(--puru-honey-base)" : "var(--puru-cloud-base)",
              color: flipAll ? "oklch(0.15 0.04 80)" : "var(--puru-ink-base)",
              border: `1px solid ${flipAll ? "var(--puru-honey-base)" : "var(--puru-surface-border)"}`,
              borderRadius: "var(--radius-sm, 6px)",
              cursor: "pointer",
            }}
          >
            ↔ flip all {flipAll ? "(left)" : "(right)"}
          </button>
        </div>
      </footer>

      {/* Element legend (left) */}
      <aside
        style={{
          position: "absolute",
          left: 24,
          top: "50%",
          transform: "translateY(-50%)",
          display: "flex",
          flexDirection: "column",
          gap: 4,
          padding: 12,
          background: "var(--puru-cloud-bright)",
          border: "1px solid var(--puru-surface-border)",
          borderRadius: "var(--radius-md, 12px)",
          fontFamily: "var(--font-puru-mono)",
          fontSize: 9,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "var(--puru-ink-soft)",
          pointerEvents: "auto",
          boxShadow: "0 4px 18px rgba(0,0,0,0.45)",
        }}
      >
        <div style={{ color: "var(--puru-ink-rich)", marginBottom: 6 }}>
          line-up · L→R
        </div>
        {ELEMENT_ORDER.map((el) => (
          <div key={el}>{ELEMENT_LABELS[el]}</div>
        ))}
        <div
          style={{
            marginTop: 8,
            paddingTop: 8,
            borderTop: "1px solid var(--puru-surface-border)",
            color: "var(--puru-ink-dim)",
          }}
        >
          back row
          <br />
          wood · flex
          <br />
          water · puddle
        </div>
      </aside>
    </div>
  );
}
