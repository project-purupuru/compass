/**
 * ZoneMonument — per-element landmark mesh placed at a zone's focal plot.
 *
 * Session 17 latitude work: gives each element zone an *identity* the eye
 * can fix on. Each monument is a chunky low-poly stand-in grounded in a
 * canonical codex location:
 *
 *   - wood  → Konka Market: striped canopy + stall + crate pile
 *   - fire  → Heart's Hearth: stone ring + central pit
 *   - earth → Amber Garden / Golden Granary: squat silo + conical roof
 *   - metal → Sky-eyes Dome / Steel Jungle Shrine: small dome + antenna spire
 *   - water → The Sunken Shrine: half-submerged torii + small stone marker
 *
 * Per `[[project_art-direction-north-star]]` — perceptual affect, not
 * physics. Low-poly + flat-shaded + atmosphere-tinted. The eye reads "ah,
 * that's a stall" / "that's a torii" from the silhouette alone.
 *
 * When properly authored monument assets land in a future cycle, swap the
 * primitive geometry for textured/sculpted GLTFs — but the dispatch +
 * placement substrate carries over.
 */

"use client";

import {
  ELEMENT_META,
  type ElementIdT,
} from "@/lib/wuxing/element";

export interface ZoneMonumentProps {
  readonly element: ElementIdT;
  readonly hexSize: number;
  /** Base scale on top of hexSize. */
  readonly scale?: number;
}

export function ZoneMonument({
  element,
  hexSize,
  scale = 1,
}: ZoneMonumentProps) {
  const meta = ELEMENT_META[element];
  const accent = meta.canonicalHue;
  const woodHex = "#7a5536"; // canonical structural timber
  const stoneHex = "#7e858f"; // canonical stone
  const wallHex = "#efe2c4"; // warm plaster

  // Master scale folds hexSize × per-element scale.
  const s = hexSize * 0.55 * scale;

  switch (element) {
    case "wood":
      return <WoodMonument s={s} accent={accent} woodHex={woodHex} wallHex={wallHex} />;
    case "fire":
      return <FireMonument s={s} accent={accent} stoneHex={stoneHex} />;
    case "earth":
      return <EarthMonument s={s} accent={accent} stoneHex={stoneHex} wallHex={wallHex} />;
    case "metal":
      return <MetalMonument s={s} accent={accent} stoneHex={stoneHex} />;
    case "water":
      return <WaterMonument s={s} accent={accent} woodHex={woodHex} stoneHex={stoneHex} />;
    default:
      return null;
  }
}

// ── Konka Market — striped canopy stall + crate pile ─────────────────────

function WoodMonument({
  s, accent, woodHex, wallHex,
}: { s: number; accent: string; woodHex: string; wallHex: string }) {
  return (
    <group>
      {/* Four corner posts */}
      {[[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([x, z], i) => (
        <mesh key={`post-${i}`} position={[x * s * 0.65, s * 0.4, z * s * 0.65]}>
          <boxGeometry args={[s * 0.08, s * 0.8, s * 0.08]} />
          <meshStandardMaterial color={woodHex} flatShading roughness={1} />
        </mesh>
      ))}
      {/* Canopy — angled flat plane */}
      <mesh position={[0, s * 0.95, 0]} rotation={[0, 0, 0]}>
        <boxGeometry args={[s * 1.6, s * 0.06, s * 1.6]} />
        <meshStandardMaterial color={accent} flatShading roughness={1} />
      </mesh>
      {/* Stall counter */}
      <mesh position={[0, s * 0.32, 0]}>
        <boxGeometry args={[s * 1.2, s * 0.18, s * 0.5]} />
        <meshStandardMaterial color={wallHex} flatShading roughness={0.9} />
      </mesh>
      {/* Crates beside the stall */}
      <mesh position={[s * 0.85, s * 0.15, s * 0.55]}>
        <boxGeometry args={[s * 0.3, s * 0.3, s * 0.3]} />
        <meshStandardMaterial color={woodHex} flatShading roughness={1} />
      </mesh>
      <mesh position={[s * 1.05, s * 0.4, s * 0.55]}>
        <boxGeometry args={[s * 0.25, s * 0.25, s * 0.25]} />
        <meshStandardMaterial color={woodHex} flatShading roughness={1} />
      </mesh>
      {/* Hanging fruit basket — small color accent */}
      <mesh position={[0, s * 0.78, 0]}>
        <sphereGeometry args={[s * 0.1, 8, 6]} />
        <meshStandardMaterial color={accent} flatShading roughness={0.9} />
      </mesh>
    </group>
  );
}

// ── Heart's Hearth — stone ring with central fire pit ────────────────────

function FireMonument({
  s, accent, stoneHex,
}: { s: number; accent: string; stoneHex: string }) {
  return (
    <group>
      {/* Outer stone ring (8 stones in a circle) */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        return (
          <mesh
            key={`stone-${i}`}
            position={[
              Math.cos(angle) * s * 0.65,
              s * 0.12,
              Math.sin(angle) * s * 0.65,
            ]}
            rotation={[0, angle + Math.PI / 4, 0]}
          >
            <boxGeometry args={[s * 0.22, s * 0.24, s * 0.22]} />
            <meshStandardMaterial color={stoneHex} flatShading roughness={1} />
          </mesh>
        );
      })}
      {/* Inner fire-pit basin (dark) */}
      <mesh position={[0, s * 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[s * 0.45, 16]} />
        <meshStandardMaterial color="#2a1810" flatShading />
      </mesh>
      {/* Central log pile */}
      <mesh position={[0, s * 0.16, 0]} rotation={[0, Math.PI / 6, Math.PI / 2]}>
        <cylinderGeometry args={[s * 0.05, s * 0.05, s * 0.45, 6]} />
        <meshStandardMaterial color="#5e3a1f" flatShading roughness={1} />
      </mesh>
      <mesh position={[0, s * 0.16, 0]} rotation={[0, -Math.PI / 4, Math.PI / 2]}>
        <cylinderGeometry args={[s * 0.05, s * 0.05, s * 0.45, 6]} />
        <meshStandardMaterial color="#5e3a1f" flatShading roughness={1} />
      </mesh>
      {/* Flame stand-in — accent-colored cone */}
      <mesh position={[0, s * 0.42, 0]}>
        <coneGeometry args={[s * 0.16, s * 0.45, 6]} />
        <meshBasicMaterial color={accent} transparent opacity={0.85} />
      </mesh>
    </group>
  );
}

// ── Golden Granary — squat silo + conical roof ───────────────────────────

function EarthMonument({
  s, accent, stoneHex, wallHex,
}: { s: number; accent: string; stoneHex: string; wallHex: string }) {
  return (
    <group>
      {/* Granary body — slightly tapered cylinder */}
      <mesh position={[0, s * 0.45, 0]}>
        <cylinderGeometry args={[s * 0.55, s * 0.65, s * 0.9, 12]} />
        <meshStandardMaterial color={wallHex} flatShading roughness={0.95} />
      </mesh>
      {/* Conical roof — accent-tinted */}
      <mesh position={[0, s * 1.05, 0]}>
        <coneGeometry args={[s * 0.62, s * 0.45, 10]} />
        <meshStandardMaterial color={accent} flatShading roughness={0.9} />
      </mesh>
      {/* Door — small dark rectangle on the front */}
      <mesh position={[0, s * 0.28, s * 0.55]}>
        <boxGeometry args={[s * 0.22, s * 0.4, s * 0.04]} />
        <meshStandardMaterial color="#4a3220" flatShading />
      </mesh>
      {/* Stone foundation ring */}
      <mesh position={[0, s * 0.05, 0]}>
        <cylinderGeometry args={[s * 0.7, s * 0.7, s * 0.1, 14]} />
        <meshStandardMaterial color={stoneHex} flatShading roughness={1} />
      </mesh>
      {/* Pile of grain sacks beside */}
      <mesh position={[s * 0.85, s * 0.18, 0]}>
        <sphereGeometry args={[s * 0.18, 8, 6]} />
        <meshStandardMaterial color="#c9a050" flatShading roughness={1} />
      </mesh>
      <mesh position={[s * 0.92, s * 0.42, 0]}>
        <sphereGeometry args={[s * 0.15, 8, 6]} />
        <meshStandardMaterial color="#c9a050" flatShading roughness={1} />
      </mesh>
    </group>
  );
}

// ── Sky-eyes Dome — small dome + antenna spire ───────────────────────────

function MetalMonument({
  s, accent, stoneHex,
}: { s: number; accent: string; stoneHex: string }) {
  return (
    <group>
      {/* Stone base */}
      <mesh position={[0, s * 0.1, 0]}>
        <cylinderGeometry args={[s * 0.7, s * 0.75, s * 0.2, 12]} />
        <meshStandardMaterial color={stoneHex} flatShading roughness={1} />
      </mesh>
      {/* Dome — hemisphere via sphere + clip via positioning */}
      <mesh position={[0, s * 0.2, 0]}>
        <sphereGeometry args={[s * 0.55, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={accent} flatShading roughness={0.55} metalness={0.4} />
      </mesh>
      {/* Antenna mast */}
      <mesh position={[0, s * 0.95, 0]}>
        <cylinderGeometry args={[s * 0.025, s * 0.04, s * 0.7, 6]} />
        <meshStandardMaterial color={stoneHex} flatShading roughness={0.6} metalness={0.5} />
      </mesh>
      {/* Spire cap */}
      <mesh position={[0, s * 1.35, 0]}>
        <octahedronGeometry args={[s * 0.08, 0]} />
        <meshStandardMaterial color="#f0f4ff" flatShading metalness={0.7} />
      </mesh>
      {/* Cross-bar arms on the antenna */}
      <mesh position={[0, s * 1.1, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[s * 0.015, s * 0.015, s * 0.35, 4]} />
        <meshStandardMaterial color={stoneHex} flatShading metalness={0.5} />
      </mesh>
    </group>
  );
}

// ── The Sunken Shrine — half-submerged torii + stone marker ─────────────

function WaterMonument({
  s, accent, woodHex, stoneHex,
}: { s: number; accent: string; woodHex: string; stoneHex: string }) {
  // Torii style — pillars sunk slightly into the ground; top rail tilted
  // suggests the "half-submerged" codex framing.
  const tiltY = -s * 0.18; // sink into ground
  const toriiColor = "#9a3a3a"; // canonical torii vermillion
  return (
    <group position={[0, tiltY, 0]}>
      {/* Left pillar */}
      <mesh position={[-s * 0.45, s * 0.55, 0]}>
        <cylinderGeometry args={[s * 0.08, s * 0.1, s * 1.1, 8]} />
        <meshStandardMaterial color={toriiColor} flatShading roughness={0.9} />
      </mesh>
      {/* Right pillar */}
      <mesh position={[s * 0.45, s * 0.55, 0]}>
        <cylinderGeometry args={[s * 0.08, s * 0.1, s * 1.1, 8]} />
        <meshStandardMaterial color={toriiColor} flatShading roughness={0.9} />
      </mesh>
      {/* Top lintel — slightly oversize, tilted in Z for tilt-into-water feel */}
      <mesh position={[0, s * 1.05, 0]} rotation={[0, 0, -0.08]}>
        <boxGeometry args={[s * 1.25, s * 0.12, s * 0.16]} />
        <meshStandardMaterial color={toriiColor} flatShading roughness={0.9} />
      </mesh>
      {/* Cross-bar below lintel */}
      <mesh position={[0, s * 0.88, 0]} rotation={[0, 0, -0.08]}>
        <boxGeometry args={[s * 1.0, s * 0.08, s * 0.1]} />
        <meshStandardMaterial color={woodHex} flatShading roughness={0.95} />
      </mesh>
      {/* Stone marker at base */}
      <mesh position={[s * 0.85, s * 0.18, s * 0.3]}>
        <boxGeometry args={[s * 0.22, s * 0.35, s * 0.18]} />
        <meshStandardMaterial color={stoneHex} flatShading roughness={1} />
      </mesh>
      {/* Bioluminescent moss patch — small accent glow disc */}
      <mesh
        position={[-s * 0.25, s * 0.04, s * 0.4]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <circleGeometry args={[s * 0.16, 14]} />
        <meshBasicMaterial color={accent} transparent opacity={0.7} />
      </mesh>
    </group>
  );
}
