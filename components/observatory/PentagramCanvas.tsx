"use client";

import { useEffect, useRef } from "react";
import {
  Application,
  Assets,
  BlurFilter,
  Container,
  Graphics,
  Sprite,
  Text,
  Texture,
} from "pixi.js";
import { ELEMENTS, scoreAdapter, type Element } from "@/lib/score";
import { ELEMENT_KANJI } from "@/lib/domain/element";
import { createPentagram, pentagonEdges, innerStarEdges } from "@/lib/sim/pentagram";
import { advanceBreath, restingPositionFor } from "@/lib/sim/entities";
import { populationStore, type SpawnedPuruhani } from "@/lib/sim/population.system";
import type { Puruhani, PuruhaniIdentity } from "@/lib/sim/types";
import { avatarToCanvas } from "@/lib/sim/avatar";
import { orbitalWobble } from "@/lib/sim/tides";

interface PentagramCanvasProps {
  onSpriteClick?: (identity: PuruhaniIdentity) => void;
  /** Wallet of the currently-focused puruhani; non-focused sprites dim. */
  focusedTrader?: string | null;
  /** Element amplified by the user's location weather — biases wrapper tint
   *  + boosts the matching vertex aura. */
  amplifiedElement?: Element;
}

const ELEMENT_HEX: Record<Element, number> = {
  wood: 0xb8c940,
  fire: 0xd14a3a,
  earth: 0xdcb245,
  water: 0x3a4ec5,
  metal: 0x7e5ca7,
};

// Vertex aura colors — sampled from the dominant non-transparent
// pixels of each /art/elements/ PNG so the glow matches the art's
// own palette rather than a UI swatch. Metal samples as pure gray
// (#a7a7a7); nudged toward cool silver so it reads as glow rather
// than dead pixels.
const AURA_HEX: Record<Element, number> = {
  wood: 0xba7349,
  fire: 0xff8e00,
  earth: 0xa1a55c,
  water: 0x9cd7eb,
  metal: 0xc8ccd6,
};

// Element icon PNGs — self-hosted under /public/art/elements/.
// Same-origin paths only — Pixi v8's Assets.load decodes in a
// blob-URL worker that can't follow cross-origin redirects even
// when the remote serves permissive CORS.
const ELEMENT_ICON_URL: Record<Element, string> = {
  wood: "/art/elements/wood.png",
  fire: "/art/elements/fire.png",
  earth: "/art/elements/earth.png",
  water: "/art/elements/water.png",
  metal: "/art/elements/metal.png",
};

// Reference geometry — the radius at which the original asset sizes
// (VERTEX_ICON_BASE / AVATAR_DISPLAY_BASE / shadow / aura / focus glow)
// were tuned. On mobile the canvas's min-dimension shrinks, the
// pentagram radius shrinks with it (× 0.38), and we scale every
// pixel-derived asset by `radius / BASE_RADIUS` so the diagram
// reads proportionally instead of vertex icons swallowing the
// pentagram on a narrow screen. Bumped from 228 → 340 to dial down
// laptop/desktop asset sizes ~30% (vertex icons + sprites felt too
// dominant on lg/xl viewports relative to the pentagram). At a
// typical 14" MBP canvas pane (radius ≈ 354) the scale lands at
// ~1.04 — vertex icons render ~104px instead of the original ~155px.
// The floor below keeps mobile sized exactly as before.
const BASE_RADIUS = 340;
const VERTEX_ICON_BASE = 100;
const AVATAR_DISPLAY_BASE = 40;
const SHADOW_RX_BASE = 13;
const SHADOW_RY_BASE = 4;
const SHADOW_OFFSET_BASE = 14;
const AURA_RADIUS_BASE = 32;
const FOCUS_GLOW_R_BASE = 28;

// Sprite contact-shadow vocabulary. Two stacked ellipses inside one
// Graphics object: a softer outer "ambient occlusion" ring at ~1.7×
// the contact radius, and the original tighter contact ellipse on top.
// Stacking the soft ring under the dense disk gives the lil guys a
// readable falloff against the canvas instead of a flat-disk read.
// Both fills ride the same Graphics.alpha (focus-dim modulation),
// so the relative weighting between ring + disk stays constant
// whether a sprite is focused or dimmed.
const SHADOW_OUTER_SCALE = 1.7;
const SHADOW_OUTER_FILL_ALPHA = 0.14;
const SHADOW_INNER_FILL_ALPHA = 0.38;

// Avatar texture sizing — generated bigger than display so retina
// rendering stays crisp regardless of mobile/desktop display target.
const AVATAR_TEX_SIZE = 96;

interface AssetSizes {
  vertexIcon: number;
  avatarDisplay: number;
  shadowRx: number;
  shadowRy: number;
  shadowOffsetY: number;
  auraRadius: number;
  focusGlowR: number;
  focusGlowBreathDelta: number;
}

function computeAssetSizes(radius: number): AssetSizes {
  // Floor at 0.63 of the desktop reference. With BASE_RADIUS=270 the
  // typical mobile pane (radius ≈ 145) computes a scale of ~0.54 which
  // would shrink mobile alongside desktop — clamping to 0.63 keeps
  // mobile sized as it was before the BASE_RADIUS bump while letting
  // larger viewports inherit the new, smaller scale curve. Above the
  // floor it scales linearly with radius.
  const scale = Math.max(0.63, radius / BASE_RADIUS);
  return {
    vertexIcon: VERTEX_ICON_BASE * scale,
    avatarDisplay: AVATAR_DISPLAY_BASE * scale,
    shadowRx: SHADOW_RX_BASE * scale,
    shadowRy: SHADOW_RY_BASE * scale,
    shadowOffsetY: SHADOW_OFFSET_BASE * scale,
    auraRadius: AURA_RADIUS_BASE * scale,
    focusGlowR: FOCUS_GLOW_R_BASE * scale,
    focusGlowBreathDelta: 4 * scale,
  };
}

interface SpriteEntry {
  entity: Puruhani;
  node: Sprite;
  shadow: Graphics; // soft elliptical contact shadow underneath
  baseScale: number;
  spawnDelay: number; // ms · staggered fade-in offset from canvas start
  focusAlpha: number; // 0..1 — smoothly tracks focus dim/restore target
}

function topAffinity(affinity: Record<Element, number>, primary: Element): Element {
  let best: Element = primary;
  let bestVal = -1;
  for (const el of ELEMENTS) {
    if (el === primary) continue;
    if (affinity[el] > bestVal) {
      bestVal = affinity[el];
      best = el;
    }
  }
  return best;
}

function makeAvatarTexture(identity: PuruhaniIdentity, primary: Element, accent: Element): Texture {
  const cnv = avatarToCanvas(identity.pfp, primary, accent, AVATAR_TEX_SIZE);
  return Texture.from(cnv);
}

// Returns the vertex's mutable graphics handles so the ticker can
// modulate visuals (halo alpha, disk/ring brightness) per the
// element-energy state. Halo, disk, and ring all respond — total
// "energy mass" across the 5 vertices is conserved (Flow-Lenia
// per ref doc 03-observatory-visual-references-dig-2026-05-08.md).
interface VertexHandle {
  icon: Sprite | null;
  aura: Graphics;
}

// Aura fill is baked at the boost-max alpha; the Graphics' display alpha
// modulates between rest (matches historical 0.38 effective) and 1.0 when
// the vertex's element is amplified by the live weather feed.
const AURA_BOOST_MAX_ALPHA = 0.62;
const AURA_REST_DISPLAY_ALPHA = 0.61; // 0.62 × 0.61 ≈ 0.378 effective at rest
const AURA_LERP_TC_MS = 420;

function drawVertex(
  layer: Container,
  el: Element,
  v: { x: number; y: number },
  iconTextures: Record<Element, Texture> | null,
  sizes: AssetSizes,
): VertexHandle {
  // Diffuse aura — blurred circle behind the icon so each vertex
  // carries an element-keyed energy field. Smaller base radius +
  // strong blur reads as glow rather than disk.
  const aura = new Graphics();
  aura.circle(0, 0, sizes.auraRadius);
  aura.fill({ color: AURA_HEX[el], alpha: AURA_BOOST_MAX_ALPHA });
  // Display alpha is the modulation channel — fill is baked at the boosted
  // max so the ticker can smoothly lerp display alpha between rest and 1.0
  // depending on whether this vertex's element is currently amplified.
  aura.alpha = AURA_REST_DISPLAY_ALPHA;
  // Padding lets the blur tail render past the Graphics bounding box —
  // without it the soft falloff gets clipped to the source rectangle
  // and the aura reads as a hard square edge instead of fading out.
  const auraBlur = new BlurFilter({ strength: 18 });
  auraBlur.padding = 48;
  aura.filters = [auraBlur];
  aura.x = v.x;
  aura.y = v.y;
  layer.addChild(aura);

  let icon: Sprite | null = null;
  const tex = iconTextures?.[el];
  if (tex) {
    icon = new Sprite(tex);
    icon.anchor.set(0.5);
    // Uniform scale that fits the icon inside a sizes.vertexIcon box.
    // Setting width/height directly would non-uniformly squish icons
    // whose source PNGs aren't square (e.g. jani-face is 399×384).
    const dim = Math.max(tex.width, tex.height) || sizes.vertexIcon;
    const scale = sizes.vertexIcon / dim;
    icon.scale.set(scale);
    icon.x = v.x;
    icon.y = v.y;
    layer.addChild(icon);
  } else {
    // Pre-load fallback — keep the kanji glyph briefly until textures arrive.
    const label = new Text({
      text: ELEMENT_KANJI[el],
      style: {
        fontFamily: "ZCOOL KuaiLe, FOT-Yuruka Std, serif",
        fontSize: sizes.vertexIcon * 0.28,
        fill: 0xffffff,
        align: "center",
      },
    });
    label.anchor.set(0.5, 0.55);
    label.x = v.x;
    label.y = v.y;
    layer.addChild(label);
  }

  return { icon, aura };
}

function drawPentagon(g: Graphics, geometry: ReturnType<typeof createPentagram>): void {
  g.clear();
  for (const [from, to] of pentagonEdges()) {
    const a = geometry.vertex(from);
    const b = geometry.vertex(to);
    g.moveTo(a.x, a.y).lineTo(b.x, b.y);
  }
  g.stroke({ width: 2, color: 0xc4b890, alpha: 0.7 });
}

function drawStar(g: Graphics, geometry: ReturnType<typeof createPentagram>): void {
  g.clear();
  for (const [from, to] of innerStarEdges()) {
    const a = geometry.vertex(from);
    const b = geometry.vertex(to);
    g.moveTo(a.x, a.y).lineTo(b.x, b.y);
  }
  g.stroke({ width: 1, color: 0x9a8b6f, alpha: 0.4 });
}

function rng(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s * 1664525 + 1013904223) | 0;
    return ((s >>> 0) % 1_000_000) / 1_000_000;
  };
}

// Per-channel lerp between two hex colors. t=0 → a, t=1 → b.
// Used for the smooth tint transition when sprite focus dim/restores.
function lerpHex(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 0xff,
    ag = (a >> 8) & 0xff,
    ab = a & 0xff;
  const br = (b >> 16) & 0xff,
    bg = (b >> 8) & 0xff,
    bb = b & 0xff;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return (r << 16) | (g << 8) | bl;
}

export function PentagramCanvas({
  onSpriteClick,
  focusedTrader = null,
  amplifiedElement,
}: PentagramCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  // Read-by-Pixi-ticker mirror of the focusedTrader prop — keeps the
  // canvas useEffect from re-initializing on every focus change while
  // letting the ticker observe the latest selection each frame.
  const focusedTraderRef = useRef<string | null>(null);
  useEffect(() => {
    focusedTraderRef.current = focusedTrader;
  }, [focusedTrader]);
  // Same ref-mirror pattern for amplifiedElement so the aura ticker
  // smoothly chases the latest weather state without re-initializing
  // the Pixi stage on every weather poll.
  const amplifiedElementRef = useRef<Element | undefined>(undefined);
  useEffect(() => {
    amplifiedElementRef.current = amplifiedElement;
  }, [amplifiedElement]);

  useEffect(() => {
    let cancelled = false;
    let rafCleanup: (() => void) | undefined;
    const host = containerRef.current;
    if (!host) return;

    const app = new Application();
    appRef.current = app;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    (async () => {
      await app.init({
        resizeTo: host,
        backgroundAlpha: 0,
        antialias: true,
        autoDensity: true,
        resolution: window.devicePixelRatio || 1,
      });
      if (cancelled) {
        app.destroy(true, { children: true });
        return;
      }
      host.appendChild(app.canvas);

      const center = { x: app.screen.width / 2, y: app.screen.height / 2 };
      const radius = Math.min(app.screen.width, app.screen.height) * 0.38;
      let geometry = createPentagram(center, radius);
      // `let` so the resize handler can swap in fresh sizes when the
      // host element flexes (mobile rotation, mobile-panel-tab swap
      // shrinking the canvas pane). `assetSizes` is the single source
      // of truth for every pixel-derived asset size in this canvas.
      let assetSizes = computeAssetSizes(radius);

      // ─── Pentagon edges (生 generation) ────────────────────────────────────
      const pentagonG = new Graphics();
      drawPentagon(pentagonG, geometry);

      // ─── Inner-star edges (克 destruction) ─────────────────────────────────
      const starG = new Graphics();
      drawStar(starG, geometry);

      app.stage.addChild(pentagonG);
      app.stage.addChild(starG);

      // ─── Vertex glyphs (large halo + element icon sprite) ──────────────────
      // Preload all five element icon textures in parallel; cache for the
      // resize re-build. Falls back to the kanji glyph if any URL fails.
      let iconTextures: Record<Element, Texture> | null = null;
      try {
        const entries = await Promise.all(
          ELEMENTS.map(async (el) => {
            const tex = (await Assets.load(ELEMENT_ICON_URL[el])) as Texture;
            return [el, tex] as const;
          }),
        );
        iconTextures = Object.fromEntries(entries) as Record<Element, Texture>;
      } catch (err) {
        console.warn("[pentagram] element icon preload failed", err);
      }
      if (cancelled) {
        app.destroy(true, { children: true });
        return;
      }

      let vertexLayer = new Container();
      const vertexByElement = {} as Record<Element, VertexHandle>;
      for (const el of ELEMENTS) {
        vertexByElement[el] = drawVertex(
          vertexLayer,
          el,
          geometry.vertex(el),
          iconTextures,
          assetSizes,
        );
      }
      app.stage.addChild(vertexLayer);

      // ─── Entities — driven by populationStore ─────────────────────────────
      // Initial seed (~14 sprites) is read from current(); each gets a
      // small per-sprite spawn-delay so the cluster materializes over
      // ~700ms rather than in one frame. Future spawns (YOU at ~1.5s,
      // then trickle every 6-18s) arrive through subscribe() and play
      // their pop-in from the moment they're added. `tMs` is hoisted
      // here so live-spawn callbacks can capture it for spawnDelay.
      let tMs = 0;
      const SPAWN_FADE_MS = 420;
      const shadowLayer = new Container();
      const spriteLayer = new Container();
      const sprites: SpriteEntry[] = [];
      const seenTraders = new Set<string>();
      let youSpriteEntry: SpriteEntry | null = null;

      async function addSpriteForSpawn(spawn: SpawnedPuruhani, spawnAtTms: number): Promise<void> {
        if (seenTraders.has(spawn.trader)) return;
        seenTraders.add(spawn.trader);

        // Fetch profile for affinity → resting position. Falls back to
        // an even split if the score adapter doesn't return a profile.
        const profile = await scoreAdapter.getWalletProfile(spawn.trader);
        if (cancelled) return;
        const affinity = profile?.elementAffinity ?? {
          wood: 20,
          fire: 20,
          earth: 20,
          water: 20,
          metal: 20,
        };
        const positionRng = rng(spawn.seed + 1009);
        const resting = restingPositionFor(spawn.primaryElement, affinity, geometry, positionRng);
        const phaseRng = rng(spawn.seed + 13);

        const entity: Puruhani = {
          id: `p-${spawn.seed}`,
          trader: spawn.trader,
          primaryElement: spawn.primaryElement,
          affinity,
          position: { ...resting },
          velocity: { x: 0, y: 0 },
          state: "idle",
          breath_phase: phaseRng(),
          resting_position: { ...resting },
          identity: spawn.identity,
        };

        const accent = topAffinity(entity.affinity, entity.primaryElement);
        const tex = makeAvatarTexture(entity.identity, entity.primaryElement, accent);
        const node = new Sprite(tex);
        node.anchor.set(0.5);
        const baseScale = assetSizes.avatarDisplay / AVATAR_TEX_SIZE;
        node.scale.set(baseScale);
        node.x = entity.position.x;
        node.y = entity.position.y;
        node.eventMode = "static";
        node.cursor = "pointer";
        node.on("pointertap", () => onSpriteClick?.(entity.identity));
        spriteLayer.addChild(node);

        const shadow = new Graphics();
        shadow.ellipse(
          0,
          0,
          assetSizes.shadowRx * SHADOW_OUTER_SCALE,
          assetSizes.shadowRy * SHADOW_OUTER_SCALE,
        );
        shadow.fill({ color: 0x000000, alpha: SHADOW_OUTER_FILL_ALPHA });
        shadow.ellipse(0, 0, assetSizes.shadowRx, assetSizes.shadowRy);
        shadow.fill({ color: 0x000000, alpha: SHADOW_INNER_FILL_ALPHA });
        shadow.x = entity.position.x;
        shadow.y = entity.position.y + assetSizes.shadowOffsetY;
        shadowLayer.addChild(shadow);

        const entry: SpriteEntry = {
          entity,
          node,
          shadow,
          baseScale,
          spawnDelay: spawnAtTms,
          focusAlpha: 1,
        };
        node.alpha = 0;
        node.scale.set(0);
        shadow.alpha = 0;
        sprites.push(entry);

        if (spawn.isYou) youSpriteEntry = entry;
      }

      // Subscribe FIRST so any spawn that arrives during the initial-seed
      // hydration is not missed (dedupe via seenTraders).
      const unsubPopulation = populationStore.subscribe((spawn) => {
        // Live spawns start their pop-in from the current canvas time.
        void addSpriteForSpawn(spawn, tMs);
      });
      const initialSpawns = populationStore.current();
      for (let i = 0; i < initialSpawns.length; i++) {
        await addSpriteForSpawn(initialSpawns[i], (i * 9) % 700);
        if (cancelled) return;
      }

      app.stage.addChild(shadowLayer);
      app.stage.addChild(spriteLayer);

      // ─── Focus glow — soft element-tinted ring under the selected sprite ──
      // Sits above shadows but below sprites so it reads as a halo on the
      // ground rather than a bezel painted over the avatar. Single Graphics
      // updated per-tick — drawn only when focusedTraderRef has a match.
      const focusGlow = new Graphics();
      focusGlow.alpha = 0;
      app.stage.addChildAt(focusGlow, app.stage.getChildIndex(spriteLayer));
      const FOCUS_LERP_TC_MS = 280;
      const SHADOW_BASE_ALPHA = 0.22;
      const FOCUS_DIM_TINT = 0x4a4a4a;

      // ─── YOU tag — neutral pill above the user's sprite ──────────────
      // Built once at canvas init; the ticker positions it over whichever
      // sprite is the current `youSpriteEntry` (set when populationStore
      // spawns its `isYou` entry — typically ~1.5s after page load). Pill
      // stays alpha=0 until that sprite both exists and has visibly faded
      // in, so it arrives WITH the YOU sprite's pop-in rather than
      // hovering over an empty wedge.
      const PILL_BG = 0xffffff;
      const PILL_BG_ALPHA = 0.96;
      const PILL_TEXT = 0x1f1c18;
      const PILL_BORDER = 0x000000;
      const PILL_BORDER_ALPHA = 0.16;
      const PILL_SHADOW = 0x000000;
      const PILL_SHADOW_ALPHA = 0.18;
      const youContainer = new Container();
      const youText = new Text({
        text: "YOU",
        style: {
          fontFamily: 'system-ui, -apple-system, "Helvetica Neue", sans-serif',
          fontSize: 9,
          fontWeight: "700",
          fill: PILL_TEXT,
          letterSpacing: 1.5,
        },
      });
      youText.anchor.set(0.5);
      const youPadX = 8;
      const youPadY = 4;
      const youPillH = youText.height + youPadY * 2;
      const youPillW = youText.width + youPadX * 2;
      const youPillShadow = new Graphics();
      youPillShadow.roundRect(-youPillW / 2, -youPillH / 2 + 1.5, youPillW, youPillH, youPillH / 2);
      youPillShadow.fill({ color: PILL_SHADOW, alpha: PILL_SHADOW_ALPHA });
      const youPillBg = new Graphics();
      youPillBg.roundRect(-youPillW / 2, -youPillH / 2, youPillW, youPillH, youPillH / 2);
      youPillBg.fill({ color: PILL_BG, alpha: PILL_BG_ALPHA });
      youPillBg.roundRect(-youPillW / 2, -youPillH / 2, youPillW, youPillH, youPillH / 2);
      youPillBg.stroke({ width: 1, color: PILL_BORDER, alpha: PILL_BORDER_ALPHA });
      const youPointer = new Graphics();
      youPointer.poly([-4, 0, 4, 0, 0, 5]).fill({ color: PILL_BG, alpha: PILL_BG_ALPHA });
      youPointer.y = youPillH / 2 + 0.5;
      youContainer.addChild(youPillShadow);
      youContainer.addChild(youPillBg);
      youContainer.addChild(youText);
      youContainer.addChild(youPointer);
      youContainer.alpha = 0;
      app.stage.addChild(youContainer);

      // ─── Main ticker ───────────────────────────────────────────────────────
      // No migrations · no tide flow. Sprites stay in the wedge they were
      // seeded into; idle motion is the orbital wobble + element-paced
      // breath scale. Initial cluster materializes over ~700ms via staggered
      // per-sprite spawn-delays; later spawns from populationStore play
      // their pop-in from the moment they're added.
      const ticker = (delta: { deltaMS: number }) => {
        const dt = delta.deltaMS;
        tMs += dt;

        for (const s of sprites) {
          if (!reduce) advanceBreath(s.entity, dt);

          // Spawn-in: scale + alpha rise from 0 → 1 with easeOutCubic.
          // Reduce-motion skips the curve and lands at full state on
          // frame one.
          const spawnT = reduce
            ? 1
            : Math.min(1, Math.max(0, (tMs - s.spawnDelay) / SPAWN_FADE_MS));
          const spawnEase = 1 - Math.pow(1 - spawnT, 3);

          // Position: resting + per-sprite orbital wobble so each
          // individual reads as visibly alive without drifting between
          // wedges.
          if (!reduce) {
            const wob = orbitalWobble(s.entity.breath_phase, tMs);
            s.node.x = s.entity.resting_position.x + wob.x;
            s.node.y = s.entity.resting_position.y + wob.y;
          } else {
            s.node.x = s.entity.resting_position.x;
            s.node.y = s.entity.resting_position.y;
          }
          s.entity.position.x = s.node.x;
          s.entity.position.y = s.node.y;

          // Shadow tracks the physics anchor (resting), not the wobble,
          // so the sprite appears to bob over a stationary ground point.
          s.shadow.x = s.entity.resting_position.x;
          s.shadow.y = s.entity.resting_position.y + assetSizes.shadowOffsetY;

          // Element-paced breath × spawn-in scale.
          const phase = s.entity.breath_phase;
          const breath = 1 + 0.06 * Math.sin(2 * Math.PI * phase);
          s.node.scale.set(s.baseScale * spawnEase * (reduce ? 1 : breath));
          s.node.alpha = spawnT;

          // Focus tint — selected sprite stays full color, others dim
          // toward FOCUS_DIM_TINT. Shadow rides a half-amplitude version
          // and fades with spawn so ground-presence enters with the avatar.
          const focusedT = focusedTraderRef.current;
          const focusTarget = focusedT === null || s.entity.trader === focusedT ? 1 : 0;
          const focusLerp = 1 - Math.exp(-dt / FOCUS_LERP_TC_MS);
          s.focusAlpha += (focusTarget - s.focusAlpha) * focusLerp;
          s.node.tint = lerpHex(FOCUS_DIM_TINT, 0xffffff, s.focusAlpha);
          s.shadow.alpha = SHADOW_BASE_ALPHA * (0.55 + 0.45 * s.focusAlpha) * spawnT;
        }

        // ─── YOU tag — track the populationStore's `isYou` sprite ──────────
        // Position above the sprite by half-avatar + half-pill + a small
        // gap so the pointer lands on the avatar's crown without overlap.
        // Alpha matches the sprite's spawn-fade so the label only appears
        // once the user-sprite has materialized; we don't dim it on focus
        // so the user can always find themselves even when another sprite
        // is selected.
        if (youSpriteEntry) {
          const offsetY = assetSizes.avatarDisplay / 2 + youPillH / 2 + 6;
          youContainer.x = youSpriteEntry.node.x;
          youContainer.y = youSpriteEntry.node.y - offsetY;
          youContainer.alpha = youSpriteEntry.node.alpha;
        } else {
          youContainer.alpha = 0;
        }

        // ─── Vertex aura amplification — boost the matching element ────────
        // Each aura's display alpha smoothly chases its target: 1.0 when
        // that vertex's element is currently amplified by the user's local
        // weather, AURA_REST_DISPLAY_ALPHA otherwise. Fill is baked at
        // AURA_BOOST_MAX_ALPHA so display-alpha modulation produces an
        // effective 0.38 → 0.62 alpha sweep on the boosted vertex.
        const amplifiedEl = amplifiedElementRef.current;
        const auraLerp = 1 - Math.exp(-dt / AURA_LERP_TC_MS);
        for (const el of ELEMENTS) {
          const handle = vertexByElement[el];
          if (!handle) continue;
          const target = el === amplifiedEl ? 1 : AURA_REST_DISPLAY_ALPHA;
          handle.aura.alpha += (target - handle.aura.alpha) * auraLerp;
        }

        // ─── Focus glow — draw soft element-tinted ring under selected ─────
        // Single Graphics, redrawn each frame from scratch. Cheap enough
        // (1 circle + breath) and keeps the position dead-true to the
        // sprite's render-time offset (wobble baked into s.node.x/y above).
        const focusedT = focusedTraderRef.current;
        if (focusedT) {
          const target = sprites.find((s) => s.entity.trader === focusedT);
          if (target) {
            const breathPhase = 0.5 + 0.5 * Math.sin(tMs / 1300);
            const r = assetSizes.focusGlowR + assetSizes.focusGlowBreathDelta * breathPhase;
            const color = ELEMENT_HEX[target.entity.primaryElement];
            focusGlow.clear();
            focusGlow.circle(target.node.x, target.node.y + 2, r + 6);
            focusGlow.fill({ color, alpha: 0.1 });
            focusGlow.circle(target.node.x, target.node.y + 2, r);
            focusGlow.stroke({ width: 1.5, color, alpha: 0.55 });
            focusGlow.alpha = Math.min(1, focusGlow.alpha + dt / 200);
          } else {
            focusGlow.alpha = Math.max(0, focusGlow.alpha - dt / 200);
          }
        } else {
          focusGlow.alpha = Math.max(0, focusGlow.alpha - dt / 200);
          if (focusGlow.alpha === 0) focusGlow.clear();
        }
      };
      app.ticker.add(ticker);

      // ─── Resize handling ───────────────────────────────────────────────────
      const ro = new ResizeObserver(() => {
        const cx = app.screen.width / 2;
        const cy = app.screen.height / 2;
        const r = Math.min(app.screen.width, app.screen.height) * 0.38;
        geometry = createPentagram({ x: cx, y: cy }, r);
        // Recompute responsive asset sizes for the new pane dimensions.
        // Mutating the same `assetSizes` binding the ticker closes over
        // means focus glow + shadow offsets pick up the new values on
        // the next tick without needing to re-bind the ticker.
        assetSizes = computeAssetSizes(r);

        // Re-build vertex layer. Re-insert at the original z-position
        // (just above the inner-star edges) so it stays UNDER shadow
        // and sprite layers — addChild() would push it to the top and
        // occlude sprites on every resize.
        app.stage.removeChild(vertexLayer);
        vertexLayer.destroy({ children: true });
        vertexLayer = new Container();
        for (const el of ELEMENTS) {
          vertexByElement[el] = drawVertex(
            vertexLayer,
            el,
            geometry.vertex(el),
            iconTextures,
            assetSizes,
          );
        }
        const starIdx = app.stage.getChildIndex(starG);
        app.stage.addChildAt(vertexLayer, starIdx + 1);

        // Re-anchor sprites at new resting positions for the new geometry.
        const newBaseScale = assetSizes.avatarDisplay / AVATAR_TEX_SIZE;
        for (let i = 0; i < sprites.length; i++) {
          const s = sprites[i];
          const positionRng = rng(i + 1009);
          const resting = restingPositionFor(
            s.entity.primaryElement,
            s.entity.affinity,
            geometry,
            positionRng,
          );
          s.entity.resting_position = resting;
          s.entity.position = { ...resting };
          s.node.x = resting.x;
          s.node.y = resting.y;
          // Apply new responsive avatar scale; ticker's per-tick
          // breath × spawn-in multipliers ride this baseScale on next frame.
          s.baseScale = newBaseScale;
          // Redraw shadow geometry at the new dimensions — clear()
          // wipes both ellipses, ellipse()+fill() pairs re-issue them
          // (outer ring first, tighter contact disk on top). shadow.y
          // is updated by the ticker every frame from assetSizes.shadowOffsetY.
          s.shadow.clear();
          s.shadow.ellipse(
            0,
            0,
            assetSizes.shadowRx * SHADOW_OUTER_SCALE,
            assetSizes.shadowRy * SHADOW_OUTER_SCALE,
          );
          s.shadow.fill({ color: 0x000000, alpha: SHADOW_OUTER_FILL_ALPHA });
          s.shadow.ellipse(0, 0, assetSizes.shadowRx, assetSizes.shadowRy);
          s.shadow.fill({ color: 0x000000, alpha: SHADOW_INNER_FILL_ALPHA });
        }

        drawPentagon(pentagonG, geometry);
        drawStar(starG, geometry);
      });
      ro.observe(host);

      rafCleanup = () => {
        app.ticker.remove(ticker);
        ro.disconnect();
        unsubPopulation();
      };
    })();

    return () => {
      cancelled = true;
      rafCleanup?.();
      const a = appRef.current;
      if (a) {
        try {
          a.destroy(true, { children: true });
        } catch {
          // StrictMode double-effect: destroy may race with init; ignore.
        }
        appRef.current = null;
      }
    };
  }, [onSpriteClick]);

  // ─── Wrapper background — Tsuheji continent, felt-not-seen ──────────
  // Single tsuheji-map.png centered behind the pentagram, treated to
  // match purupuru.world's hero continent: low opacity, desaturated,
  // and feathered out by a radial-gradient mask so the edges fade into
  // cloud-base instead of cutting hard against the strip / rails. The
  // visitor knows this dashboard "is" Tsuheji without any image ever
  // pulling focus from the canvas.
  //
  // Theme tuning lives in CSS tokens so the dark theme can drop opacity
  // and bump brightness without a JS branch — see globals.css for
  // --puru-continent-{opacity,saturate,brightness}.
  //
  // amplifiedElement still rides as a very faint (4%) ambient tint so
  // the cosmos's currently-amplified element is visible in the backdrop
  // the same way it is in the vertex auras.
  const ambientTint = amplifiedElement
    ? `color-mix(in oklch, var(--puru-${amplifiedElement}-vivid) 4%, transparent)`
    : "transparent";
  const continentMask =
    "radial-gradient(ellipse 80% 70% at 50% 50%, black 10%, oklch(0 0 0 / 0.4) 35%, transparent 70%)";

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{
        perspective: "1400px",
        perspectiveOrigin: "center 60%",
        background: "var(--puru-cloud-base)",
      }}
    >
      {/* Continent — masked + muted. Lives on the OUTER wrapper (no tilt)
          so the inner rotateX(6deg) on the canvas mount can't reveal
          page-void along the top edge. 120%-of-wrapper width keeps the
          continent body behind the pentagram on most aspect ratios; the
          mask hides whatever bleeds past. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: "120%",
          maxWidth: "1100px",
          aspectRatio: "1 / 1",
          backgroundImage: "url('/art/tsuheji-map.png')",
          backgroundSize: "contain",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          opacity: "var(--puru-continent-opacity)",
          filter:
            "saturate(var(--puru-continent-saturate)) brightness(var(--puru-continent-brightness))",
          WebkitMaskImage: continentMask,
          maskImage: continentMask,
        }}
      />
      {/* Faint amplified-element tint — the cosmos signal in the backdrop. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: ambientTint }}
      />
      <div
        ref={containerRef}
        className="relative h-full w-full"
        style={{
          transform: "rotateX(6deg)",
          transformOrigin: "center 55%",
        }}
        data-testid="pentagram-canvas"
      >
        <noscript>
          <p className="p-6 text-puru-ink-soft">
            The observatory requires JavaScript to render the wuxing pentagram.
          </p>
        </noscript>
      </div>
    </div>
  );
}
