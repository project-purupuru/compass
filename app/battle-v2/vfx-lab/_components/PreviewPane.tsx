/**
 * PreviewPane — center r3f Canvas hosting the active effect.
 *
 * Mirrors the warm Ghibli lighting + dark gradient backdrop from
 * /battle-v2/puppet-3d (operator-grounded reference, session 14 build
 * doc §"Design Rules"). Ground plane is warm-tinted (#4a3d28) so the
 * shadow falloff reads correctly with the directional light.
 *
 * Effects are passed in via `Preview` + `config` + `triggerKey`. The pane
 * is presentation-only — it doesn't own state.
 */

"use client";

import { Suspense, type ComponentType } from "react";

import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { EffectComposer, TiltShift2 } from "@react-three/postprocessing";

import type { PreviewProps } from "../../_components/vfx/VfxRegistry";
import { deriveTiltShiftLine, type PostConfig } from "./postConfig";

interface PreviewPaneProps<TConfig> {
  readonly Preview: ComponentType<PreviewProps<TConfig>>;
  readonly config: TConfig;
  readonly triggerKey: number;
  readonly onTrigger: () => void;
  readonly onCompose?: () => void;
  readonly composeLabel?: string;
  /** Global post-process config — TiltShift2 wired when enabled. */
  readonly post?: PostConfig;
}

function GroundAndLights() {
  return (
    <>
      {/* Warm Ghibli ambient — never neutral white. Dropped from 0.55 to 0.4
       *  since cel shading needs more contrast between lit and shadow bands. */}
      <ambientLight intensity={0.4} color="#fff2d4" />

      {/* KEY light — warm strong directional from upper-left. The dominant
       *  source that drives the cel material's lit band. */}
      <directionalLight
        position={[-6, 9, 5]}
        intensity={1.25}
        color="#fff0c0"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      {/* FILL — warm soft from below-right. Lifts the shadow side without
       *  killing the silhouette contrast. */}
      <directionalLight position={[5, 2, 3]} intensity={0.35} color="#ffe8c0" />

      {/* RIM — cool tint from behind-above. The DBZ-signature edge catch
       *  that separates subjects from the warm ground + dark backdrop. */}
      <directionalLight
        position={[-3, 6, -7]}
        intensity={0.55}
        color="#c7d8e8"
      />

      {/* Ground — warm-tinted so shadows + dust read warm. Standard material
       *  (not toon) — the ground is the backdrop, not a cel subject. */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.005, 0]}
        receiveShadow
      >
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#4a3d28" roughness={0.95} metalness={0} />
      </mesh>
    </>
  );
}

export function PreviewPane<TConfig>({
  Preview,
  config,
  triggerKey,
  onTrigger,
  onCompose,
  composeLabel,
  post,
}: PreviewPaneProps<TConfig>) {
  const postLine = post ? deriveTiltShiftLine(post) : null;
  return (
    <div
      style={{
        position: "relative",
        height: "100%",
        background:
          "radial-gradient(ellipse at 50% 25%, #3a2f1c 0%, #1f1810 60%, #0f0a06 100%)",
        overflow: "hidden",
      }}
    >
      <Canvas shadows dpr={[1, 2]} style={{ position: "absolute", inset: 0 }}>
        <PerspectiveCamera makeDefault position={[0, 2.8, 5.4]} fov={42} />
        <OrbitControls
          target={[0, 0.6, 0]}
          maxPolarAngle={Math.PI / 2 - 0.05}
          minDistance={3}
          maxDistance={14}
          enablePan
        />
        <Suspense fallback={null}>
          <GroundAndLights />
          <Preview config={config} triggerKey={triggerKey} />
          {post?.enabled && postLine && (
            <EffectComposer>
              <TiltShift2
                blur={post.blur}
                taper={post.taper}
                start={postLine.start}
                end={postLine.end}
                samples={post.samples}
                direction={[0, 1]}
              />
            </EffectComposer>
          )}
        </Suspense>
      </Canvas>

      {/* Grain overlay — same vocab as motion-lab + puppet-3d. */}
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

      {/* Trigger overlay — center-bottom, large enough to be unmissable. */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: 24,
          transform: "translateX(-50%)",
          display: "flex",
          gap: 12,
          zIndex: 6,
          pointerEvents: "auto",
        }}
      >
        <button
          type="button"
          onClick={onTrigger}
          style={{
            padding: "12px 28px",
            fontFamily: "var(--font-puru-mono)",
            fontSize: 12,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            background: "var(--puru-honey-base, #e1ad3d)",
            color: "oklch(0.15 0.04 80)",
            border: "1px solid var(--puru-honey-base, #e1ad3d)",
            borderRadius: "var(--radius-md, 12px)",
            cursor: "pointer",
            boxShadow: "0 6px 24px rgba(0,0,0,0.45)",
          }}
        >
          trigger ▶
        </button>
        {onCompose && (
          <button
            type="button"
            onClick={onCompose}
            style={{
              padding: "12px 22px",
              fontFamily: "var(--font-puru-mono)",
              fontSize: 11,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              background: "var(--puru-cloud-bright, #2f291f)",
              color: "var(--puru-ink-base, #d8cdae)",
              border: "1px solid var(--puru-surface-border)",
              borderRadius: "var(--radius-md, 12px)",
              cursor: "pointer",
              boxShadow: "0 6px 24px rgba(0,0,0,0.4)",
            }}
          >
            {composeLabel ?? "compose"}
          </button>
        )}
      </div>
    </div>
  );
}
