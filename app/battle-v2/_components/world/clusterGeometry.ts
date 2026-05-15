/**
 * clusterGeometry — the painterly-cluster trick.
 *
 * Per the For-The-King + Island-Beekeeper + Ghibli dig (2026-05-14). The
 * single biggest readability win for a cluster of low-poly blobs (fluffy
 * cumulus, leafy canopy, foliage clump) is to make them read as ONE organic
 * volume instead of "lumps stuck together."
 *
 * The trick is **spherical-pivot normals**. Each blob's icosphere has its own
 * outward-pointing normals — so light shades each blob like its own little
 * planet, and the cluster fragments visually. Replacing every vertex's normal
 * with a vector pointing from the CLUSTER's pivot to that vertex makes the
 * shading interpolate smoothly across the whole cluster: the faceted, lumpy
 * silhouette stays (low-poly read preserved), but the lighting gradient flows
 * as if the whole cluster were one sphere. Cumulus reads as one cloud.
 * A canopy reads as one leaf-mass.
 *
 * Smooth shading is REQUIRED (`flatShading: false`) for this — flatShading
 * uses face normals and would discard the override. The faceted look comes
 * from the geometry's low subdivision count, not from the lighting model.
 *
 * Implementation: merge all puffs into one BufferGeometry; one mesh per
 * cluster instead of N — fewer draw calls AND the unified-volume read.
 *
 * Emergence from the dig:
 *   *"The memory of a sunset, not the physics of one. Haptic visuality —
 *   a world that looks like it would feel warm to the touch."*
 */

import {
  BufferGeometry,
  Float32BufferAttribute,
  IcosahedronGeometry,
} from "three";

export interface ClusterPuff {
  readonly offset: readonly [number, number, number];
  readonly radius: number;
  /** Icosphere subdivision — 1 default (cumulus). 0 sharper, 2 softer. */
  readonly detail?: number;
}

/**
 * Merge `puffs` into one BufferGeometry with spherical-pivot normals.
 *
 * `pivot` defaults to the local origin — pass an explicit pivot when the
 * cluster's centre of mass isn't at (0,0,0) (e.g. a tree canopy whose puffs
 * sit above the trunk root).
 */
export function buildPuffCluster(
  puffs: readonly ClusterPuff[],
  pivot: readonly [number, number, number] = [0, 0, 0],
): BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];

  for (const puff of puffs) {
    const ico = new IcosahedronGeometry(1, puff.detail ?? 1);
    const posAttr = ico.attributes.position;
    const indAttr = ico.index;
    const indexOffset = positions.length / 3;

    for (let i = 0; i < posAttr.count; i++) {
      // Vertex in cluster space: scaled by puff.radius, offset by puff.offset.
      const x = posAttr.getX(i) * puff.radius + puff.offset[0];
      const y = posAttr.getY(i) * puff.radius + puff.offset[1];
      const z = posAttr.getZ(i) * puff.radius + puff.offset[2];
      positions.push(x, y, z);

      // Spherical-pivot normal — from cluster pivot to this vertex.
      const dx = x - pivot[0];
      const dy = y - pivot[1];
      const dz = z - pivot[2];
      const len = Math.hypot(dx, dy, dz) || 1;
      normals.push(dx / len, dy / len, dz / len);
    }

    if (indAttr) {
      for (let i = 0; i < indAttr.count; i++) {
        indices.push((indAttr.getX(i) as number) + indexOffset);
      }
    } else {
      // IcosahedronGeometry is NON-INDEXED — every triangle has its own
      // three positions, no separate index buffer. Synthesize sequential
      // indices so the merged result is uniformly indexed (and not empty,
      // which is what made the cluster invisible in the first cut).
      for (let i = 0; i < posAttr.count; i++) {
        indices.push(indexOffset + i);
      }
    }
    ico.dispose();
  }

  const geo = new BufferGeometry();
  geo.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geo.setAttribute("normal", new Float32BufferAttribute(normals, 3));
  geo.setIndex(indices);
  return geo;
}
