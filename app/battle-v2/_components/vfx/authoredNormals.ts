/**
 * authoredNormals — the three canonical normal-authoring tricks.
 *
 * Per dig-session-2026-05-16-T3 (Motomura GDC 2015 + BoTW grass + Dedene
 * spherical-pivot). Lighting is treated as an authored data mask, not as
 * a simulation. Three algorithms, named after their canonical source:
 *
 *   1. `spherical-pivot`  — already in clusterGeometry.ts (canopy clusters).
 *                           Vertex normals point from cluster pivot to vertex
 *                           → light shades the whole cluster as one volume.
 *
 *   2. `up-bias` (BoTW)   — override normals to point straight up `(0, 1, 0)`.
 *                           Grass cards read as a coherent field, not a
 *                           noisy intersection of papery planes.
 *
 *   3. `face-flatten`     — flatten per-triangle (face-normal style) so the
 *      (Motomura)          mesh shows "broad clean shadow blobs" instead of
 *                           smooth Lambertian gradients. The Guilty Gear Xrd
 *                           "anti-photon" hack ported to BufferGeometry.
 *
 * All three return a BufferGeometry with `position`, `normal`, and (where
 * relevant) `index` attributes. Memoize at call site (or wrap in useMemo).
 */

import {
  BufferAttribute,
  BufferGeometry,
  Float32BufferAttribute,
  IcosahedronGeometry,
  Vector3,
} from "three";

// ── up-bias (BoTW grass) ───────────────────────────────────────────────────

export interface GrassCardSpec {
  /** World position of the card root. */
  readonly position: readonly [number, number, number];
  /** Rotation around Y (radians) — keeps cards facing different ways. */
  readonly rotationY: number;
  /** Card height (world units). */
  readonly height: number;
  /** Card width (world units). */
  readonly width: number;
}

/** A grass TUFT — 3 blades sharing a base, fanned at 60° intervals. */
export interface GrassTuftSpec {
  /** World position of the tuft base. */
  readonly position: readonly [number, number, number];
  /** Base rotation around Y; the 3 blades are offset by 0°, 60°, 120° from it. */
  readonly rotationY: number;
  /** Tuft height (world units, applies to all 3 blades). */
  readonly height: number;
  /** Tuft base width (world units). */
  readonly width: number;
  /** Seed for per-blade variation. */
  readonly seed: number;
}

/**
 * Build a merged geometry for a field of grass blades. Per session 14
 * structural revision:
 *
 *   - Multi-SEGMENT blades (3 segments / 4 rings of 2 vertices = 8 verts each)
 *   - Slight FORWARD CURL — mid-rings + tip offset in the blade's "forward"
 *     direction, giving an organic C-curve like wind-leaning grass
 *   - Strong tip TAPER (0.7 default — top 30% of base width) for the bladey
 *     silhouette
 *   - All vertex normals forced UP (BoTW trick — single coherent mass)
 *   - Vertex COLORS: base = darker (0.8), mid = neutral, tip = warm-light
 *     → tonal gradient base→tip reads as a real blade
 *
 * Each blade = 3 quads = 6 triangles = 18 vertex slots (non-indexed for
 * trivial color authoring per vertex).
 *
 * @param tipNarrow 0 = no taper (rectangle), 0.7 = top 30% width (default)
 * @param curl forward-bend at tip in world units (default 0.12)
 * @param tipColorTint RGB multiplier for tip vertices
 * @param baseColorTint RGB multiplier for base vertices
 */
export function buildGrassFieldUpBias(
  cards: readonly GrassCardSpec[],
  tipNarrow: number = 0.7,
  curl: number = 0.12,
  tipColorTint: readonly [number, number, number] = [1.05, 1.0, 0.7],
  baseColorTint: readonly [number, number, number] = [0.6, 0.7, 0.55],
): BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];
  const colors: number[] = [];

  for (const card of cards) {
    const cos = Math.cos(card.rotationY);
    const sin = Math.sin(card.rotationY);
    const hw = card.width / 2;
    const taper = Math.max(0, Math.min(1, tipNarrow));
    // Per-ring widths (linear taper base → tip).
    const w0 = hw; // base
    const w1 = hw * (1 - taper * 0.33);
    const w2 = hw * (1 - taper * 0.66);
    const w3 = hw * (1 - taper); // tip
    // Per-ring forward-curl offsets (in local +x of the blade after rotation).
    // Forward direction = (cos, sin) in xz.
    const curlScale = curl * card.height;
    const c0 = 0;
    const c1 = curlScale * 0.12;
    const c2 = curlScale * 0.5;
    const c3 = curlScale * 1.0;
    // Per-ring y positions.
    const y0 = 0;
    const y1 = card.height * 0.33;
    const y2 = card.height * 0.66;
    const y3 = card.height;
    // Per-ring color tints (interpolated base → tip).
    const cBase = baseColorTint;
    const cTip = tipColorTint;
    const lerp3 = (
      a: readonly [number, number, number],
      b: readonly [number, number, number],
      t: number,
    ): readonly [number, number, number] => [
      a[0] + (b[0] - a[0]) * t,
      a[1] + (b[1] - a[1]) * t,
      a[2] + (b[2] - a[2]) * t,
    ];
    const col0 = cBase;
    const col1 = lerp3(cBase, cTip, 0.33);
    const col2 = lerp3(cBase, cTip, 0.66);
    const col3 = cTip;

    const [px, py, pz] = card.position;
    // Rotate (lx, lz) by rotationY around card root, keep y.
    const rot = (lx: number, lz: number): [number, number] => [
      lx * cos - lz * sin,
      lx * sin + lz * cos,
    ];
    // Build each ring's left/right vertices.
    // Local: blade lies along world X (perpendicular to forward); forward = (cos, sin) in xz.
    // So left vertex is at (-w, 0, 0) local, right at (+w, 0, 0) local, both with
    // forward offset c along (cos, sin).
    const ringVerts = (
      w: number,
      y: number,
      c: number,
    ): {
      L: [number, number, number];
      R: [number, number, number];
    } => {
      // Left vertex local
      const [llx, llz] = rot(-w, c);
      // Right vertex local
      const [rlx, rlz] = rot(w, c);
      return {
        L: [px + llx, py + y, pz + llz],
        R: [px + rlx, py + y, pz + rlz],
      };
    };
    const r0 = ringVerts(w0, y0, c0);
    const r1 = ringVerts(w1, y1, c1);
    const r2 = ringVerts(w2, y2, c2);
    const r3 = ringVerts(w3, y3, c3);

    // Emit 3 quads (6 triangles), bottom-to-top.
    // Each quad: ringA.L, ringA.R, ringB.R, ringB.L → triangles (L,R,RR), (L,RR,LL).
    const emitQuad = (
      a: { L: [number, number, number]; R: [number, number, number] },
      b: { L: [number, number, number]; R: [number, number, number] },
      colorA: readonly [number, number, number],
      colorB: readonly [number, number, number],
    ) => {
      positions.push(...a.L, ...a.R, ...b.R, ...a.L, ...b.R, ...b.L);
      for (let n = 0; n < 6; n++) normals.push(0, 1, 0);
      colors.push(...colorA); // a.L
      colors.push(...colorA); // a.R
      colors.push(...colorB); // b.R
      colors.push(...colorA); // a.L
      colors.push(...colorB); // b.R
      colors.push(...colorB); // b.L
    };
    emitQuad(r0, r1, col0, col1);
    emitQuad(r1, r2, col1, col2);
    emitQuad(r2, r3, col2, col3);
  }

  const geo = new BufferGeometry();
  geo.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geo.setAttribute("normal", new Float32BufferAttribute(normals, 3));
  geo.setAttribute("color", new Float32BufferAttribute(colors, 3));
  return geo;
}

/**
 * Build a merged geometry from grass TUFTS. Each tuft = 3 multi-segment
 * blades fanned at 60° from each other (cross/star pattern), giving the
 * field VOLUME instead of flat cards.
 *
 * Per session 14 (2026-05-16) operator feedback: flat cards read as paint,
 * cross-fan tufts give the cel material something to wrap around.
 *
 * The 3 blades per tuft share their base position; each is constructed via
 * the same 3-segment + curl logic as `buildGrassFieldUpBias`.
 */
export function buildGrassTufts(
  tufts: readonly GrassTuftSpec[],
  tipNarrow: number = 0.7,
  curl: number = 0.12,
  tipColorTint: readonly [number, number, number] = [1.05, 1.0, 0.7],
  baseColorTint: readonly [number, number, number] = [0.62, 0.72, 0.55],
): BufferGeometry {
  // Reuse the card-builder by expanding each tuft into 3 cards at fan angles.
  const cards: GrassCardSpec[] = [];
  for (const tuft of tufts) {
    const rand = seededRand(tuft.seed);
    // 3 blades at 0°, 60°, 120° offsets from tuft.rotationY, each with
    // slight per-blade height/width variation for organic feel.
    for (let i = 0; i < 3; i++) {
      const fanAngle = (i * Math.PI) / 3; // 0, 60°, 120°
      const heightVar = 0.85 + rand() * 0.3; // 0.85..1.15
      const widthVar = 0.9 + rand() * 0.25; // 0.9..1.15
      cards.push({
        position: tuft.position,
        rotationY: tuft.rotationY + fanAngle,
        height: tuft.height * heightVar,
        width: tuft.width * widthVar,
      });
    }
  }
  return buildGrassFieldUpBias(cards, tipNarrow, curl, tipColorTint, baseColorTint);
}

// ── face-flatten (Motomura) ────────────────────────────────────────────────

/**
 * Convert an indexed geometry to a NON-indexed flat-shaded one with every
 * triangle carrying its own face normal. The "clean broad shadow blob" read
 * comes from the LACK of cross-face normal interpolation — every face is
 * lit as a single tone.
 *
 * Optionally bias the face normal toward an `axisBias` direction (e.g.,
 * world-up for grounded rocks) by `axisBiasAmount` (0..1) — pulls the lit
 * tone slightly off the face normal so the rock-top stays consistently
 * brighter regardless of camera angle. Pure Motomura = 0 bias.
 */
export function flattenFaceNormals(
  source: BufferGeometry,
  opts: { axisBias?: readonly [number, number, number]; axisBiasAmount?: number } = {},
): BufferGeometry {
  const sourcePos = source.attributes.position as BufferAttribute;
  const sourceIdx = source.index;

  const positions: number[] = [];
  const normals: number[] = [];

  const triangleCount = sourceIdx ? sourceIdx.count / 3 : sourcePos.count / 3;
  const biasVec = opts.axisBias
    ? new Vector3(opts.axisBias[0], opts.axisBias[1], opts.axisBias[2]).normalize()
    : null;
  const biasAmt = Math.max(0, Math.min(1, opts.axisBiasAmount ?? 0));

  for (let t = 0; t < triangleCount; t++) {
    const i0 = sourceIdx ? sourceIdx.getX(t * 3 + 0) : t * 3 + 0;
    const i1 = sourceIdx ? sourceIdx.getX(t * 3 + 1) : t * 3 + 1;
    const i2 = sourceIdx ? sourceIdx.getX(t * 3 + 2) : t * 3 + 2;
    const a = new Vector3(sourcePos.getX(i0), sourcePos.getY(i0), sourcePos.getZ(i0));
    const b = new Vector3(sourcePos.getX(i1), sourcePos.getY(i1), sourcePos.getZ(i1));
    const c = new Vector3(sourcePos.getX(i2), sourcePos.getY(i2), sourcePos.getZ(i2));
    // Face normal = (b-a) × (c-a), normalized.
    const ab = b.clone().sub(a);
    const ac = c.clone().sub(a);
    const face = ab.cross(ac).normalize();
    // Optional bias toward an axis.
    if (biasVec && biasAmt > 0) {
      face.lerp(biasVec, biasAmt).normalize();
    }
    positions.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
    for (let v = 0; v < 3; v++) normals.push(face.x, face.y, face.z);
  }

  const geo = new BufferGeometry();
  geo.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geo.setAttribute("normal", new Float32BufferAttribute(normals, 3));
  return geo;
}

// ── Rock primitive geometry helper ─────────────────────────────────────────

/**
 * Build a "rock" — a faceted icosphere or box-jittered geometry with
 * face-flatten authored normals. Returns a flat-shaded BufferGeometry ready
 * for any meshStandardMaterial.
 *
 * Two shape modes:
 *   - "boulder"   — icosphere subdivision 1, slight per-vertex jitter
 *   - "slab"      — box geometry, jittered top
 *
 * Both pass through face-flatten so light reads as broad clean facets.
 */
export interface RockOptions {
  readonly shape?: "boulder" | "slab";
  /** Random seed for vertex jitter. */
  readonly seed?: number;
  /** Jitter strength (0..0.3). */
  readonly jitter?: number;
  /** Bias face normals toward world-up so the top reads consistently lit. */
  readonly upBias?: number;
}

function seededRand(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildRockGeometry(opts: RockOptions = {}): BufferGeometry {
  const seed = opts.seed ?? 0x70c;
  const jitter = opts.jitter ?? 0.18;
  const upBias = opts.upBias ?? 0.15;

  // Detail 3 = 320 faces. Enough silhouette breaks for face-flatten cel to
  // read as ROCK (volumetric facets), not POLYHEDRON (single visible cell).
  const base = new IcosahedronGeometry(1, 3);

  const rand = seededRand(seed);
  const pos = base.attributes.position as BufferAttribute;

  // Directional jitter — bias OUTWARD with r² weighting (some vertices push
  // far, most stay close → asymmetric bumps + crevices like real stone).
  // Also LOW-FREQUENCY noise via vertex-index bins so neighbouring vertices
  // share a "bulge zone" instead of jittering independently (no fuzz).
  const bulgeCount = 6 + Math.floor(rand() * 4); // 6..9 macro-bulge centers
  const bulges: { dir: [number, number, number]; strength: number; radius: number }[] = [];
  for (let i = 0; i < bulgeCount; i++) {
    const phi = rand() * Math.PI * 2;
    const cosT = rand() * 2 - 1;
    const sinT = Math.sqrt(1 - cosT * cosT);
    bulges.push({
      dir: [sinT * Math.cos(phi), cosT, sinT * Math.sin(phi)],
      strength: (0.4 + rand() * 0.6) * (rand() < 0.3 ? -1 : 1), // some inward (crevices)
      radius: 0.5 + rand() * 0.6,
    });
  }

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const len = Math.hypot(x, y, z) || 1;
    const nx = x / len,
      ny = y / len,
      nz = z / len;
    // Sum contributions from each bulge whose dome covers this vertex.
    let totalRadial = 0;
    for (const b of bulges) {
      const dot = nx * b.dir[0] + ny * b.dir[1] + nz * b.dir[2];
      if (dot > 0) {
        // Smooth gaussian-like falloff from the bulge direction.
        const falloff = Math.pow(dot, 1 / Math.max(0.1, b.radius));
        totalRadial += falloff * b.strength * jitter;
      }
    }
    pos.setX(i, x + nx * totalRadial);
    pos.setY(i, y + ny * totalRadial);
    pos.setZ(i, z + nz * totalRadial);
  }
  pos.needsUpdate = true;

  const flat = flattenFaceNormals(base, {
    axisBias: [0, 1, 0],
    axisBiasAmount: upBias,
  });
  base.dispose();
  return flat;
}
