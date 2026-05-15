#!/usr/bin/env python3
"""
extract-map-geometry.py — turn the painted Tsuheji silhouette into game geometry.

Per build doc Session 11 (operator: "understand the map itself ... collision
areas ... position actual locations"). The continent has been a flat texture;
this gives it GEOMETRY:

  1. a land/sea bitmask grid   → runtime `isOnLand(x,z)` (collision + placement)
  2. a traced coastline polygon → outline rendering + future 3D extrusion
  3. an SVG of the coastline    → the editable vector source-of-truth

Pipeline: alpha threshold → connected components → marching-squares contour of
the largest landmass → Douglas-Peucker simplification. No heavy deps — PIL only
(macOS system Python has it).

Coordinate basis matches `world/zones.ts pctToWorld`: normalized [0,1] = pct/100,
origin top-left, so the landmass and the canonical district positions share one
coordinate space by construction.

    python3 app/battle-v2/_tools/extract-map-geometry.py

Outputs:
    app/battle-v2/_components/world/landmass-data.ts   (generated — do not hand-edit)
    public/art/tsuheji-coastline.svg                   (editable vector boundary)
"""

import os
import sys
from collections import deque

try:
    from PIL import Image
except ImportError:
    print("error: PIL/Pillow not available", file=sys.stderr)
    sys.exit(1)

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
SRC = os.path.join(REPO, "public", "art", "tsuheji-map.png")
OUT_TS = os.path.join(
    REPO, "app", "battle-v2", "_components", "world", "landmass-data.ts"
)
OUT_SVG = os.path.join(REPO, "public", "art", "tsuheji-coastline.svg")

GRID = 160          # runtime bitmask resolution (≈0.34 world-units/cell at MAP_SIZE 54)
ALPHA_THRESHOLD = 128
DP_EPSILON = 0.004  # Douglas-Peucker tolerance in normalized [0,1] units


def load_mask(path, size):
    """Load the PNG, downsample, threshold alpha → binary land grid (row-major).

    NEAREST (not BILINEAR): bilinear bleeds alpha across the downsample, so the
    bitmask ends up FATTER than the crisp alphaTest-rendered texture — districts
    snapped to those phantom edge cells render floating in the sea. Nearest
    keeps the bitmask a faithful subset of the visible landmass.
    """
    img = Image.open(path).convert("RGBA").resize((size, size), Image.NEAREST)
    px = img.load()
    return [
        [1 if px[x, y][3] >= ALPHA_THRESHOLD else 0 for x in range(size)]
        for y in range(size)
    ]


def largest_component(mask, size):
    """BFS-label connected land components; return a mask of only the biggest."""
    seen = [[False] * size for _ in range(size)]
    best, best_cells = 0, []
    for sy in range(size):
        for sx in range(size):
            if mask[sy][sx] != 1 or seen[sy][sx]:
                continue
            cells, q = [], deque([(sx, sy)])
            seen[sy][sx] = True
            while q:
                x, y = q.popleft()
                cells.append((x, y))
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < size and 0 <= ny < size and not seen[ny][nx] and mask[ny][nx] == 1:
                        seen[ny][nx] = True
                        q.append((nx, ny))
            if len(cells) > best:
                best, best_cells = len(cells), cells
    only = [[0] * size for _ in range(size)]
    for x, y in best_cells:
        only[y][x] = 1
    return only


def marching_squares(mask, size):
    """Contour the binary grid → linked closed loops of normalized [0,1] points."""
    # Each cell's 4 corners → which of the 4 edges (T,R,B,L) have a land/sea crossing.
    # Edge midpoints are keyed by the grid edge they sit on so segments link up.
    segs = {}  # edge-id -> list of edge-ids it connects to

    def hkey(i, j):  # horizontal edge midpoint between (i,j)-(i+1,j)
        return ("h", i, j)

    def vkey(i, j):  # vertical edge midpoint between (i,j)-(i,j+1)
        return ("v", i, j)

    def connect(a, b):
        segs.setdefault(a, []).append(b)
        segs.setdefault(b, []).append(a)

    for j in range(size - 1):
        for i in range(size - 1):
            tl, tr = mask[j][i], mask[j][i + 1]
            bl, br = mask[j + 1][i], mask[j + 1][i + 1]
            edges = []
            if tl != tr:
                edges.append(hkey(i, j))          # top
            if tr != br:
                edges.append(vkey(i + 1, j))      # right
            if bl != br:
                edges.append(hkey(i, j + 1))      # bottom
            if tl != bl:
                edges.append(vkey(i, j))          # left
            if len(edges) == 2:
                connect(edges[0], edges[1])
            elif len(edges) == 4:
                # saddle — resolve by the cell's majority so loops stay consistent
                if tl + tr + bl + br >= 2:
                    connect(edges[0], edges[1])
                    connect(edges[2], edges[3])
                else:
                    connect(edges[1], edges[2])
                    connect(edges[3], edges[0])

    def midpoint(key):
        kind, i, j = key
        if kind == "h":
            return ((i + 0.5) / (size - 1), j / (size - 1))
        return (i / (size - 1), (j + 0.5) / (size - 1))

    # Walk linked edges into closed loops.
    loops, visited = [], set()
    for start in segs:
        if start in visited:
            continue
        loop, cur, prev = [], start, None
        while cur is not None and cur not in visited:
            visited.add(cur)
            loop.append(midpoint(cur))
            nxts = [n for n in segs[cur] if n != prev]
            prev, cur = cur, (nxts[0] if nxts else None)
        if len(loop) >= 8:
            loops.append(loop)
    loops.sort(key=len, reverse=True)
    return loops


def douglas_peucker(pts, eps):
    """Ramer–Douglas–Peucker polyline simplification."""
    if len(pts) < 3:
        return pts[:]
    ax, ay = pts[0]
    bx, by = pts[-1]
    dx, dy = bx - ax, by - ay
    norm = (dx * dx + dy * dy) ** 0.5 or 1e-9
    far_i, far_d = 0, 0.0
    for i in range(1, len(pts) - 1):
        px, py = pts[i]
        d = abs((px - ax) * dy - (py - ay) * dx) / norm
        if d > far_d:
            far_i, far_d = i, d
    if far_d > eps:
        left = douglas_peucker(pts[: far_i + 1], eps)
        right = douglas_peucker(pts[far_i:], eps)
        return left[:-1] + right
    return [pts[0], pts[-1]]


def main():
    if not os.path.exists(SRC):
        print(f"error: {SRC} not found", file=sys.stderr)
        sys.exit(1)

    mask = load_mask(SRC, GRID)
    continent = largest_component(mask, GRID)

    land_cells = sum(sum(row) for row in continent)
    coverage = land_cells / (GRID * GRID)

    loops = marching_squares(continent, GRID)
    coastline = douglas_peucker(loops[0], DP_EPSILON) if loops else []
    # ensure closed
    if coastline and coastline[0] != coastline[-1]:
        coastline.append(coastline[0])

    # ── emit landmass-data.ts ────────────────────────────────────────────────
    grid_str = "".join("".join(str(c) for c in row) for row in continent)
    coast_lit = ",".join(f"[{x:.5f},{y:.5f}]" for x, y in coastline)
    sys.setrecursionlimit(10000)
    ts = f"""/**
 * landmass-data.ts — GENERATED by app/battle-v2/_tools/extract-map-geometry.py
 * Do not hand-edit. Re-run the tool if `tsuheji-map.png` changes.
 *
 * Geometry extracted from the painted Tsuheji continent silhouette.
 * Coordinates are normalized [0,1], origin top-left — same basis as
 * `zones.ts pctToWorld` (normalized = pct/100).
 */

/** Land/sea bitmask resolution (row-major, GRID×GRID). */
export const LANDMASS_GRID = {GRID};

/** Row-major land/sea mask of the main continent. '1' = land, '0' = sea. */
export const LANDMASS_MASK =
  "{grid_str}";

/** Fraction of the map plane that is the main landmass. */
export const LANDMASS_COVERAGE = {coverage:.4f};

/** Simplified coastline of the main continent — closed loop, normalized [0,1]. */
export const COASTLINE_NORM: readonly (readonly [number, number])[] = [
  {coast_lit}
];
"""
    os.makedirs(os.path.dirname(OUT_TS), exist_ok=True)
    with open(OUT_TS, "w") as f:
        f.write(ts)

    # ── emit the coastline SVG (editable vector source-of-truth) ─────────────
    if coastline:
        d = "M " + " L ".join(f"{x*1000:.2f} {y*1000:.2f}" for x, y in coastline) + " Z"
        svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">
  <!-- Tsuheji coastline — traced from tsuheji-map.png. Edit this to reshape
       the continent boundary, then re-run extract-map-geometry.py to regen
       the runtime data (or hand-port the path back). -->
  <path d="{d}" fill="#9ea800" fill-opacity="0.35" stroke="#5a6b00" stroke-width="2"/>
</svg>
"""
        with open(OUT_SVG, "w") as f:
            f.write(svg)

    print(f"  grid:      {GRID}×{GRID}  ({land_cells} land cells, {coverage*100:.1f}% coverage)")
    print(f"  loops:     {len(loops)}  (largest {len(loops[0]) if loops else 0} pts)")
    print(f"  coastline: {len(coastline)} pts after Douglas-Peucker (eps={DP_EPSILON})")
    print(f"  → {os.path.relpath(OUT_TS, REPO)}")
    print(f"  → {os.path.relpath(OUT_SVG, REPO)}")


if __name__ == "__main__":
    main()
