/**
 * /honeycomb — engine surface for architectural observability.
 *
 * Renamed from /battle-v2/vfx-lab in cycle-2 S0 (route taxonomy /play +
 * /honeycomb · same substrate). Cycle-1 3-pane shape preserved: EffectPicker
 * (left) · PreviewPane (center) · KnobPane (right). Cycle-2 S2 rebuilds this
 * surface on shadcn primitives; S3 re-verbs the tabs to BUILD + LIBRARY + Play.
 *
 * Substrate-coupled via @effect/schema configs in
 * `_components/vfx/VfxConfig.ts`; effects render in isolation; layering
 * primitive included via Composition.ts.
 *
 * Cycle-1 operator-locked decisions preserved (session 14):
 *   - sandbox-first (no gameplay wiring)
 *   - vanilla tweakpane in useEffect
 *   - @effect/schema for configs (not Zod)
 *   - 2 effects ship v1: tree-fall + water-splash
 *   - layering primitive included
 *   - codex-grounded tree (green | autumn | sakura; reuses buildPuffCluster)
 */

"use client";

import { Suspense, useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";

import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { EffectComposer, TiltShift2 } from "@react-three/postprocessing";

// Lab-evolution cycle · substrate + visible spine inside existing header.
// IconProvider wraps the page · adapter-init registers all 9 adapters silently.
// Visible spine (PointerBreadcrumb + WorkspacesTabs) lives INSIDE the existing
// absolute-positioned header — no overlay, no FAB, no conflict with rails.
import { IconProvider } from "@/lib/ui/icons/provider";
import { ensureAdaptersRegistered } from "@/app/battle-v2/_components/lab/adapter-init";
import { PointerBreadcrumb } from "@/app/battle-v2/_components/lab/PointerBreadcrumb";
import { ModeTabsBar } from "@/app/battle-v2/_components/lab/mode-tabs/ModeTabsBar";
import { PlayButton } from "@/app/battle-v2/_components/lab/mode-tabs/PlayButton";
import { useActiveWorkspace } from "@/app/battle-v2/_components/lab/workspaces/WorkspacesTabs";
import {
  HOT_JUMP_SCHEMA_VERSION,
  serializeHotJumpState,
  type HotJumpState,
} from "@/lib/lab/state/hot-jump.schema";
import type { PointerChain, PointerSegment } from "@/lib/lab/pointer-chain/schema";

import {
  CARD_LAB_DEFAULTS,
  HEX_SCENE_DEFAULTS,
  MINI_SCENE_DEFAULTS,
  BIG_REALM_SCENE_DEFAULTS,
  REALM_SCENE_DEFAULTS,
  TREE_FALL_DEFAULTS,
  WATER_SPLASH_DEFAULTS,
  ZONE_SCENE_DEFAULTS,
  type CardLabConfigT,
  type HexSceneConfigT,
  type MiniSceneConfigT,
  type BigRealmSceneConfigT,
  type RealmSceneConfigT,
  type TreeFallConfigT,
  type WaterSplashConfigT,
  type ZoneSceneConfigT,
} from "@/app/battle-v2/_components/vfx/VfxConfig";
import {
  COMPOSITION_WOOD_VS_WATER,
  runComposition,
} from "@/app/battle-v2/_components/vfx/Composition";
import { TreeFallPreview } from "@/app/battle-v2/_components/vfx/effects/TreeFall";
import { WaterSplashPreview } from "@/app/battle-v2/_components/vfx/effects/WaterSplash";
import {
  VFX_REGISTRY,
  getDefinition,
  type PreviewProps,
} from "@/app/battle-v2/_components/vfx/VfxRegistry";
import { EffectPicker } from "@/app/battle-v2/vfx-lab/_components/EffectPicker";
import { KnobPane } from "@/app/battle-v2/vfx-lab/_components/KnobPane";
import { PostPane } from "@/app/battle-v2/vfx-lab/_components/PostPane";
import {
  deriveTiltShiftLine,
  POST_DEFAULTS,
  type PostConfig,
} from "@/app/battle-v2/vfx-lab/_components/postConfig";
import { PreviewPane } from "@/app/battle-v2/vfx-lab/_components/PreviewPane";

const FIRST_EFFECT_ID = VFX_REGISTRY[0].id;

/**
 * /honeycomb — engine surface for architectural observability.
 *
 * Wrapped in IconProvider so the IconRegistry substrate works for any
 * <Icon> consumers. Adapters register silently on mount (cycle-DoD).
 * Visible chrome (breadcrumb · inspector · composability panel · workspaces)
 * rebuilds on shadcn primitives in cycle-2 S2.
 */
export default function VfxLabPage() {
  useEffect(() => {
    void ensureAdaptersRegistered();
  }, []);

  return (
    <IconProvider>
      <VfxLabPageInner />
    </IconProvider>
  );
}

function VfxLabPageInner() {
  const [activeId, setActiveId] = useState<string>(FIRST_EFFECT_ID);
  const [workspace, setWorkspace] = useActiveWorkspace("build");

  // S3.4 + S3.5: hot-jump handler · F5 or PlayButton click triggers this.
  // Serializes current scene state to URL · navigates to /play.
  const onHotJump = useCallback(() => {
    const state: HotJumpState = {
      schemaVersion: HOT_JUMP_SCHEMA_VERSION,
      activeTab: workspace,
      selectedAdapterId: activeId,
      // selectedNodeId optional · cycle-2 S5+ wires composition drill-in
    };
    const encoded = serializeHotJumpState(state);
    if (typeof window !== "undefined") {
      window.location.href = `/play?state=${encoded}`;
    }
  }, [workspace, activeId]);

  // S3.4: F5 keyboard listener (DockShell root stand-in · S4 will move this
  // to the real DockShell). ⌘1 + ⌘2 already covered by useActiveWorkspace's
  // cycle-1 keyboard handler (re-verbed via S3.1).
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "F5") {
        e.preventDefault();
        onHotJump();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onHotJump]);

  const [composeMode, setComposeMode] = useState(false);
  const [, bumpKnob] = useReducer((x: number) => x + 1, 0);
  const [treeFallTriggerKey, setTreeFallTriggerKey] = useState(0);
  const [waterSplashTriggerKey, setWaterSplashTriggerKey] = useState(0);
  const [miniSceneTriggerKey, setMiniSceneTriggerKey] = useState(0);
  const [hexSceneTriggerKey, setHexSceneTriggerKey] = useState(0);
  const [zoneSceneTriggerKey, setZoneSceneTriggerKey] = useState(0);
  const [realmSceneTriggerKey, setRealmSceneTriggerKey] = useState(0);
  const [bigRealmSceneTriggerKey, setBigRealmSceneTriggerKey] = useState(0);
  const [cardLabTriggerKey, setCardLabTriggerKey] = useState(0);
  // Global post-process config (Scheimpflug DoF). Mutable ref so PostPane's
  // tweakpane writes back in place; bumpPost bumps a version so PreviewPane
  // re-reads.
  const postRef = useRef<PostConfig>({ ...POST_DEFAULTS });
  const [postVersion, bumpPost] = useReducer((x: number) => x + 1, 0);
  void postVersion;

  // Per-effect configs — mutable refs so tweakpane can write in place and
  // edits persist when the operator switches effects.
  const treeFallConfigRef = useRef<TreeFallConfigT>({ ...TREE_FALL_DEFAULTS });
  const waterSplashConfigRef = useRef<WaterSplashConfigT>({
    ...WATER_SPLASH_DEFAULTS,
  });
  const miniSceneConfigRef = useRef<MiniSceneConfigT>({
    ...MINI_SCENE_DEFAULTS,
  });
  const hexSceneConfigRef = useRef<HexSceneConfigT>({ ...HEX_SCENE_DEFAULTS });
  const zoneSceneConfigRef = useRef<ZoneSceneConfigT>({ ...ZONE_SCENE_DEFAULTS });
  const realmSceneConfigRef = useRef<RealmSceneConfigT>({ ...REALM_SCENE_DEFAULTS });
  const bigRealmSceneConfigRef = useRef<BigRealmSceneConfigT>({
    ...BIG_REALM_SCENE_DEFAULTS,
  });
  const cardLabConfigRef = useRef<CardLabConfigT>({ ...CARD_LAB_DEFAULTS });

  const activeDef = useMemo(
    () => getDefinition(activeId) ?? VFX_REGISTRY[0],
    [activeId],
  );

  // Pointer chain for the active effect · displayed in the header breadcrumb.
  // Derived from the registered adapter shape — card-composition gets a Pantry
  // segment (codex slug), others get Primitive + Consumer only.
  const activeChain = useMemo<PointerChain>(() => {
    const segments: PointerSegment[] = [];
    if (activeDef.id === "card-composition") {
      segments.push({
        _tag: "Pantry",
        slug: "earth-jani",
        path: "/codex/cards/earth-jani",
        label: "earth-jani",
      });
    }
    segments.push({
      _tag: "Primitive",
      name: activeDef.id,
      path: `app/battle-v2/_components/vfx/effects/${activeDef.label.replace(/\s/g, "")}.tsx`,
      label: activeDef.label,
    });
    segments.push({
      _tag: "Consumer",
      consumers:
        activeDef.id === "card-composition"
          ? ["vfx-lab", "battle-v2", "card-showcase"]
          : activeDef.id === "card-lab"
            ? ["card-lab", "vfx-lab"]
            : ["vfx-lab", "battle-v2"],
    });
    return segments;
  }, [activeDef]);

  const activeConfigRef =
    activeDef.id === "tree-fall"
      ? (treeFallConfigRef as React.RefObject<Record<string, unknown>>)
      : activeDef.id === "water-splash"
        ? (waterSplashConfigRef as React.RefObject<Record<string, unknown>>)
        : activeDef.id === "mini-scene"
          ? (miniSceneConfigRef as React.RefObject<Record<string, unknown>>)
          : activeDef.id === "hex-scene"
            ? (hexSceneConfigRef as React.RefObject<Record<string, unknown>>)
            : activeDef.id === "zone-scene"
              ? (zoneSceneConfigRef as React.RefObject<Record<string, unknown>>)
              : activeDef.id === "big-realm-scene"
                ? (bigRealmSceneConfigRef as React.RefObject<Record<string, unknown>>)
                : activeDef.id === "card-lab"
                  ? (cardLabConfigRef as React.RefObject<Record<string, unknown>>)
                  : (realmSceneConfigRef as React.RefObject<Record<string, unknown>>);

  const triggerActive = useCallback(() => {
    if (activeDef.id === "tree-fall") {
      setTreeFallTriggerKey((k) => k + 1);
    } else if (activeDef.id === "water-splash") {
      setWaterSplashTriggerKey((k) => k + 1);
    } else if (activeDef.id === "mini-scene") {
      setMiniSceneTriggerKey((k) => k + 1);
    } else if (activeDef.id === "hex-scene") {
      setHexSceneTriggerKey((k) => k + 1);
    } else if (activeDef.id === "zone-scene") {
      // zone-scene main trigger = fire BOTH sides simultaneously. Per-side
      // triggers also live in the KnobPane's "trigger ↑ player/opponent"
      // buttons.
      const zc = zoneSceneConfigRef.current as unknown as Record<string, number>;
      zc.playerRampCounter = (zc.playerRampCounter ?? 0) + 1;
      zc.opponentRampCounter = (zc.opponentRampCounter ?? 0) + 1;
      setZoneSceneTriggerKey((k) => k + 1);
    } else if (activeDef.id === "big-realm-scene") {
      setBigRealmSceneTriggerKey((k) => k + 1);
    } else if (activeDef.id === "card-lab") {
      setCardLabTriggerKey((k) => k + 1);
    } else {
      setRealmSceneTriggerKey((k) => k + 1);
    }
  }, [activeDef.id]);

  const compositionRef = useRef<ReturnType<typeof runComposition> | null>(null);

  const triggerCompose = useCallback(() => {
    compositionRef.current?.cancel();
    if (!composeMode) setComposeMode(true);
    compositionRef.current = runComposition(
      COMPOSITION_WOOD_VS_WATER,
      (effectId) => {
        if (effectId === "tree-fall") setTreeFallTriggerKey((k) => k + 1);
        if (effectId === "water-splash") setWaterSplashTriggerKey((k) => k + 1);
      },
    );
  }, [composeMode]);

  // Reuse the SAME Preview component the single-mode PreviewPane uses, so
  // visuals stay consistent. In compose mode we render BOTH at offset
  // positions on a shared ground.
  const SingleActivePreview = useCallback(
    (props: PreviewProps<unknown>) => {
      const ActivePreview = activeDef.Preview as React.ComponentType<
        PreviewProps<unknown>
      >;
      return <ActivePreview {...props} />;
    },
    [activeDef.Preview],
  );

  return (
    <main
      style={{
        position: "fixed",
        inset: 0,
        display: "grid",
        gridTemplateColumns: "220px minmax(0, 1fr) 300px",
        background: "#0a0805",
        color: "var(--puru-ink-base, #d8cdae)",
        fontFamily: "var(--font-puru-body)",
      }}
    >
      <EffectPicker
        entries={VFX_REGISTRY}
        activeId={activeId}
        onSelect={(id) => {
          setActiveId(id);
          setComposeMode(false);
          compositionRef.current?.cancel();
        }}
      />

      <section
        style={{
          position: "relative",
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header strip */}
        <header
          style={{
            position: "absolute",
            top: 16,
            left: 20,
            right: 20,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            zIndex: 7,
            pointerEvents: "none",
          }}
        >
          <div style={{ pointerEvents: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
              <h1
                style={{
                  margin: 0,
                  fontFamily: "var(--font-puru-display)",
                  fontSize: 24,
                  color: "var(--puru-ink-rich, #f3e9d2)",
                  textShadow: "0 1px 0 rgba(0,0,0,0.6)",
                  letterSpacing: "0.01em",
                }}
              >
                vfx lab
              </h1>
              <p
                style={{
                  margin: 0,
                  fontFamily: "var(--font-puru-mono)",
                  fontSize: 10,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "var(--puru-ink-soft, #c2b89c)",
                  textShadow: "0 1px 0 rgba(0,0,0,0.6)",
                }}
              >
                {composeMode
                  ? "compose · wood vs water · sequence"
                  : `${activeDef.label} · ${workspace}`}
              </p>
            </div>

            {/*
              Cycle-2 spine · visible chrome inside the header (no overlay).
              S3 re-verb: ModeTabsBar (BUILD · LIBRARY) + PlayButton (F5 hot-jump)
              replaces cycle-1 WorkspacesTabs (compose/preview/export).
              PointerBreadcrumb: the active effect's pointer chain at the surface.
              Per FR-4 (BARTH probe verdict) · per FR-25/26 (hot-jump round-trip).
            */}
            <div style={{ display: "inline-flex", gap: 10, alignItems: "center" }}>
              <div style={{ minWidth: 0 }}>
                <ModeTabsBar active={workspace} onChange={setWorkspace} />
              </div>
              <PlayButton onHotJump={onHotJump} />
            </div>
            <div style={{ maxWidth: "calc(100vw - 580px)" }}>
              <PointerBreadcrumb chain={activeChain} />
            </div>
          </div>

          {composeMode && (
            <button
              type="button"
              onClick={() => {
                compositionRef.current?.cancel();
                setComposeMode(false);
              }}
              style={{
                pointerEvents: "auto",
                padding: "6px 14px",
                fontFamily: "var(--font-puru-mono)",
                fontSize: 10,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                background: "var(--puru-cloud-bright, #2f291f)",
                color: "var(--puru-ink-base, #d8cdae)",
                border: "1px solid var(--puru-surface-border)",
                borderRadius: "var(--radius-sm, 6px)",
                cursor: "pointer",
              }}
            >
              exit compose
            </button>
          )}
        </header>

        {composeMode ? (
          <ComposePreviewPane
            treeFallConfig={treeFallConfigRef.current}
            waterSplashConfig={waterSplashConfigRef.current}
            treeFallTriggerKey={treeFallTriggerKey}
            waterSplashTriggerKey={waterSplashTriggerKey}
            onCompose={triggerCompose}
            post={postRef.current}
          />
        ) : (
          <PreviewPane
            Preview={SingleActivePreview}
            config={
              activeDef.id === "tree-fall"
                ? treeFallConfigRef.current
                : activeDef.id === "water-splash"
                  ? waterSplashConfigRef.current
                  : activeDef.id === "mini-scene"
                    ? miniSceneConfigRef.current
                    : activeDef.id === "hex-scene"
                      ? hexSceneConfigRef.current
                      : activeDef.id === "zone-scene"
                        ? zoneSceneConfigRef.current
                        : activeDef.id === "big-realm-scene"
                          ? bigRealmSceneConfigRef.current
                          : activeDef.id === "card-lab"
                            ? cardLabConfigRef.current
                            : realmSceneConfigRef.current
            }
            triggerKey={
              activeDef.id === "tree-fall"
                ? treeFallTriggerKey
                : activeDef.id === "water-splash"
                  ? waterSplashTriggerKey
                  : activeDef.id === "mini-scene"
                    ? miniSceneTriggerKey
                    : activeDef.id === "hex-scene"
                      ? hexSceneTriggerKey
                      : activeDef.id === "zone-scene"
                        ? zoneSceneTriggerKey
                        : activeDef.id === "big-realm-scene"
                          ? bigRealmSceneTriggerKey
                          : activeDef.id === "card-lab"
                            ? cardLabTriggerKey
                            : realmSceneTriggerKey
            }
            onTrigger={triggerActive}
            onCompose={triggerCompose}
            composeLabel="compose ▶ wood→water"
            post={postRef.current}
          />
        )}

        {/* Global post-process pane — persistent across effect switches. */}
        <PostPane config={postRef.current} onChange={bumpPost} />
      </section>

      <KnobPane
        effectDef={activeDef}
        config={activeConfigRef.current as unknown as Record<string, unknown>}
        onChange={() => bumpKnob()}
        onTrigger={triggerActive}
      />
    </main>
  );
}

// ── Compose preview ──────────────────────────────────────────────────────────

interface ComposePreviewPaneProps {
  readonly treeFallConfig: TreeFallConfigT;
  readonly waterSplashConfig: WaterSplashConfigT;
  readonly treeFallTriggerKey: number;
  readonly waterSplashTriggerKey: number;
  readonly onCompose: () => void;
  readonly post: PostConfig;
}

function ComposePreviewPane({
  treeFallConfig,
  waterSplashConfig,
  treeFallTriggerKey,
  waterSplashTriggerKey,
  onCompose,
  post,
}: ComposePreviewPaneProps) {
  const postLine = deriveTiltShiftLine(post);
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
        <PerspectiveCamera makeDefault position={[0, 3.2, 6.4]} fov={44} />
        <OrbitControls
          target={[0, 0.6, 0]}
          maxPolarAngle={Math.PI / 2 - 0.05}
          minDistance={3}
          maxDistance={16}
          enablePan
        />
        <Suspense fallback={null}>
          <ambientLight intensity={0.4} color="#fff2d4" />
          <directionalLight
            position={[-6, 9, 5]}
            intensity={1.25}
            color="#fff0c0"
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
          <directionalLight position={[5, 2, 3]} intensity={0.35} color="#ffe8c0" />
          {/* RIM — cool catch from behind-above (cel separation). */}
          <directionalLight
            position={[-3, 6, -7]}
            intensity={0.55}
            color="#c7d8e8"
          />
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, -0.005, 0]}
            receiveShadow
          >
            <planeGeometry args={[60, 60]} />
            <meshStandardMaterial color="#4a3d28" roughness={0.95} metalness={0} />
          </mesh>
          <TreeFallPreview
            config={treeFallConfig}
            triggerKey={treeFallTriggerKey}
            origin={[-1.6, 0, 0]}
          />
          <WaterSplashPreview
            config={waterSplashConfig}
            triggerKey={waterSplashTriggerKey}
            origin={[1.8, 0, 0.4]}
          />
          {post.enabled && (
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

      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: 24,
          transform: "translateX(-50%)",
          zIndex: 6,
        }}
      >
        <button
          type="button"
          onClick={onCompose}
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
          fire sequence ▶
        </button>
      </div>
    </div>
  );
}
