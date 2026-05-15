"use client";

export interface FrameTimingStats {
  readonly fps: number;
  readonly frameMsAvg: number;
  readonly frameMsP95: number;
  readonly slowFrames: number;
  readonly samples: number;
}

export interface RendererStats {
  readonly calls: number;
  readonly triangles: number;
  readonly points: number;
  readonly lines: number;
  readonly geometries: number;
  readonly textures: number;
  readonly pixelRatio: number;
  readonly canvasWidth: number;
  readonly canvasHeight: number;
  readonly observedFrames: number;
}

export interface SceneStats {
  readonly objects: number;
  readonly meshes: number;
  readonly instancedMeshes: number;
  readonly visibleMeshes: number;
  readonly transparentMeshes: number;
  readonly materials: number;
  readonly lights: number;
  readonly estimatedTriangles: number;
}

export interface MeshInspection {
  readonly name: string;
  readonly type: string;
  readonly transparent: boolean;
  readonly opacity: number;
  readonly y: number;
  readonly height: number;
  readonly distance: number;
}

export interface ZFightCandidate {
  readonly a: string;
  readonly b: string;
  readonly deltaYmm: number;
  readonly overlapX: number;
  readonly overlapZ: number;
}

export interface SortThrashCandidate {
  readonly name: string;
  readonly opacity: number;
  readonly distance: number;
}

export interface PointerInspection {
  readonly locked: boolean;
  readonly hitName: string | null;
  readonly hitPoint: readonly [number, number, number] | null;
  readonly nearbyMeshes: readonly MeshInspection[];
  readonly zFightCandidates: readonly ZFightCandidate[];
  readonly sortThrashCandidates: readonly SortThrashCandidate[];
}

export interface BattleV2ObservabilitySnapshot {
  readonly updatedAt: number;
  readonly frames: number;
  readonly frame: FrameTimingStats;
  readonly renderer: RendererStats;
  readonly scene: SceneStats;
  readonly pointer: PointerInspection;
}
