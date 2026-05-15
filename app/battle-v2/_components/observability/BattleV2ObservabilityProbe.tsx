"use client";

import { useEffect, useMemo, useRef } from "react";

import { useFrame, useThree } from "@react-three/fiber";
import {
  Box3,
  Material,
  Mesh,
  Object3D,
  Raycaster,
  Vector3,
  type InstancedMesh,
} from "three";

import type {
  BattleV2ObservabilitySnapshot,
  MeshInspection,
  PointerInspection,
  SceneStats,
  SortThrashCandidate,
  ZFightCandidate,
} from "./types";

interface BattleV2ObservabilityProbeProps {
  readonly enabled: boolean;
  readonly locked: boolean;
  readonly onSnapshot: (snapshot: BattleV2ObservabilitySnapshot) => void;
}

type BattleV2ObservabilityWindow = Window & {
  __BATTLE_V2_OBSERVABILITY__?: BattleV2ObservabilitySnapshot;
};

interface MeshRecord {
  readonly object: Object3D;
  readonly name: string;
  readonly type: string;
  readonly geometryType: string;
  readonly transparent: boolean;
  readonly opacity: number;
  readonly box: Box3;
  readonly y: number;
  readonly height: number;
}

function isFlatSurface(record: MeshRecord): boolean {
  return (
    record.geometryType === "PlaneGeometry" ||
    record.geometryType === "CircleGeometry" ||
    record.geometryType === "ShapeGeometry"
  );
}

const FRAME_SAMPLE_LIMIT = 180;
const PUBLISH_INTERVAL_MS = 250;
const SCENE_SCAN_INTERVAL_MS = 700;
const INSPECTION_RADIUS = 3;
const COPLANAR_THRESHOLD_M = 0.005;
const MAX_NEARBY_MESHES = 14;
const MAX_CANDIDATES = 10;

const scratchBox = new Box3();
const scratchPoint = new Vector3();

function isMeshLike(object: Object3D): object is Mesh | InstancedMesh {
  return object.type === "Mesh" || object.type === "InstancedMesh";
}

function materialList(object: Object3D): Material[] {
  const maybeMesh = object as Mesh;
  const material = maybeMesh.material;
  if (!material) return [];
  return Array.isArray(material) ? material : [material];
}

function meshLabel(object: Object3D): string {
  const path: string[] = [];
  let current: Object3D | null = object;
  while (current && current.type !== "Scene") {
    const base = current.name || current.type;
    const siblings =
      current.parent?.children.filter(
        (child) => child.type === current?.type && child.name === current?.name,
      ) ?? [];
    const index =
      siblings.length > 1 ? `[${Math.max(0, siblings.indexOf(current))}]` : "";
    path.unshift(`${base}${index}`);
    current = current.parent;
  }
  const geometry = (object as Mesh).geometry;
  const geometryType = geometry?.type ? `:${geometry.type}` : "";
  return `${path.slice(-4).join("/")}${geometryType}`;
}

function opacityFor(object: Object3D): number {
  const materials = materialList(object);
  if (materials.length === 0) return 1;
  return Math.min(...materials.map((material) => material.opacity ?? 1));
}

function isTransparent(object: Object3D): boolean {
  return materialList(object).some(
    (material) => material.transparent || (material.opacity ?? 1) < 1,
  );
}

function xzOverlap(a: Box3, b: Box3): { overlapX: number; overlapZ: number } | null {
  const overlapX = Math.min(a.max.x, b.max.x) - Math.max(a.min.x, b.min.x);
  const overlapZ = Math.min(a.max.z, b.max.z) - Math.max(a.min.z, b.min.z);
  if (overlapX <= 0 || overlapZ <= 0) return null;
  return { overlapX, overlapZ };
}

function scanScene(scene: Object3D): { sceneStats: SceneStats; meshes: MeshRecord[] } {
  let objects = 0;
  let meshes = 0;
  let instancedMeshes = 0;
  let visibleMeshes = 0;
  let transparentMeshes = 0;
  let lights = 0;
  let estimatedTriangles = 0;
  const materials = new Set<string>();
  const meshRecords: MeshRecord[] = [];

  scene.updateMatrixWorld();
  scene.traverse((object) => {
    objects += 1;
    if (object.type.endsWith("Light")) lights += 1;
    if (!isMeshLike(object)) return;

    meshes += 1;
    if (object.type === "InstancedMesh") instancedMeshes += 1;
    if (object.visible) visibleMeshes += 1;
    const transparent = isTransparent(object);
    if (transparent) transparentMeshes += 1;
    for (const material of materialList(object)) materials.add(material.uuid);
    const geometry = (object as Mesh).geometry;
    const triangleCount = geometry?.index
      ? Math.floor(geometry.index.count / 3)
      : Math.floor((geometry?.attributes.position?.count ?? 0) / 3);
    const instanceCount =
      object.type === "InstancedMesh"
        ? ((object as InstancedMesh).count ?? 1)
        : 1;
    estimatedTriangles += triangleCount * instanceCount;

    scratchBox.setFromObject(object);
    if (scratchBox.isEmpty()) return;
    const box = scratchBox.clone();
    meshRecords.push({
      object,
      name: meshLabel(object),
      type: object.type,
      geometryType: ((object as Mesh).geometry?.type as string | undefined) ?? "",
      transparent,
      opacity: opacityFor(object),
      box,
      y: box.min.y,
      height: box.max.y - box.min.y,
    });
  });

  return {
    sceneStats: {
      objects,
      meshes,
      instancedMeshes,
      visibleMeshes,
      transparentMeshes,
      materials: materials.size,
      lights,
      estimatedTriangles,
    },
    meshes: meshRecords,
  };
}

function inspectPointer(
  raycaster: Raycaster,
  scene: Object3D,
  meshes: readonly MeshRecord[],
): PointerInspection {
  const hits = raycaster
    .intersectObjects(scene.children, true)
    .filter((hit) => isMeshLike(hit.object));
  const hit = hits[0];
  if (!hit) {
    return {
      locked: false,
      hitName: null,
      hitPoint: null,
      nearbyMeshes: [],
      zFightCandidates: [],
      sortThrashCandidates: [],
    };
  }

  scratchPoint.copy(hit.point);
  const nearby = meshes
    .map((record) => ({
      record,
      distance: record.box.distanceToPoint(scratchPoint),
    }))
    .filter((entry) => entry.distance <= INSPECTION_RADIUS)
    .sort((a, b) => a.distance - b.distance);

  const nearbyMeshes: MeshInspection[] = nearby.slice(0, MAX_NEARBY_MESHES).map(
    ({ record, distance }) => ({
      name: record.name,
      type: record.type,
      transparent: record.transparent,
      opacity: record.opacity,
      y: record.y,
      height: record.height,
      distance,
    }),
  );

  const zFightCandidates: ZFightCandidate[] = [];
  for (let i = 0; i < nearby.length; i++) {
    for (let j = i + 1; j < nearby.length; j++) {
      const a = nearby[i].record;
      const b = nearby[j].record;
      if (!isFlatSurface(a) || !isFlatSurface(b)) continue;
      const overlap = xzOverlap(a.box, b.box);
      if (!overlap) continue;
      const deltaY = Math.abs(a.y - b.y);
      if (deltaY > COPLANAR_THRESHOLD_M) continue;
      zFightCandidates.push({
        a: a.name,
        b: b.name,
        deltaYmm: deltaY * 1000,
        overlapX: overlap.overlapX,
        overlapZ: overlap.overlapZ,
      });
    }
  }

  const sortThrashCandidates: SortThrashCandidate[] = nearby
    .filter(({ record }) => record.transparent)
    .slice(0, MAX_CANDIDATES)
    .map(({ record, distance }) => ({
      name: record.name,
      opacity: record.opacity,
      distance,
    }));

  return {
    locked: false,
    hitName: meshLabel(hit.object),
    hitPoint: [hit.point.x, hit.point.y, hit.point.z],
    nearbyMeshes,
    zFightCandidates: zFightCandidates.slice(0, MAX_CANDIDATES),
    sortThrashCandidates,
  };
}

function percentile(values: readonly number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.floor(sorted.length * p));
  return sorted[index];
}

function finite(value: number | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function deltaPerFrame(current: number, previous: number, frames: number): number {
  const delta = current - previous;
  return Number.isFinite(delta) ? Math.max(0, Math.round(delta / frames)) : 0;
}

export function BattleV2ObservabilityProbe({
  enabled,
  locked,
  onSnapshot,
}: BattleV2ObservabilityProbeProps) {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);
  const pointer = useThree((state) => state.pointer);
  const size = useThree((state) => state.size);
  const raycaster = useMemo(() => new Raycaster(), []);
  const frameSamples = useRef<number[]>([]);
  const frameCount = useRef(0);
  const lastPublish = useRef(0);
  const lastSceneScan = useRef(0);
  const sceneStats = useRef<SceneStats>({
    objects: 0,
    meshes: 0,
    instancedMeshes: 0,
    visibleMeshes: 0,
    transparentMeshes: 0,
    materials: 0,
    lights: 0,
    estimatedTriangles: 0,
  });
  const meshRecords = useRef<MeshRecord[]>([]);
  const pointerInspection = useRef<PointerInspection>({
    locked: false,
    hitName: null,
    hitPoint: null,
    nearbyMeshes: [],
    zFightCandidates: [],
    sortThrashCandidates: [],
  });
  const lastRenderInfo = useRef({
    calls: 0,
    triangles: 0,
    points: 0,
    lines: 0,
    frames: 0,
  });

  useEffect(() => {
    if (!enabled) return;
    const previousAutoReset = gl.info.autoReset;
    gl.info.autoReset = false;
    gl.info.reset();
    lastRenderInfo.current = {
      calls: 0,
      triangles: 0,
      points: 0,
      lines: 0,
      frames: frameCount.current,
    };
    return () => {
      gl.info.autoReset = previousAutoReset;
      gl.info.reset();
    };
  }, [enabled, gl]);

  useFrame((_, delta) => {
    if (!enabled) return;

    const now = performance.now();
    frameCount.current += 1;
    frameSamples.current.push(delta * 1000);
    if (frameSamples.current.length > FRAME_SAMPLE_LIMIT) frameSamples.current.shift();

    if (now - lastSceneScan.current >= SCENE_SCAN_INTERVAL_MS) {
      const scan = scanScene(scene);
      sceneStats.current = scan.sceneStats;
      meshRecords.current = scan.meshes;
      lastSceneScan.current = now;
    }

    if (!locked) {
      raycaster.setFromCamera(pointer, camera);
      pointerInspection.current = inspectPointer(
        raycaster,
        scene,
        meshRecords.current,
      );
    } else {
      pointerInspection.current = {
        ...pointerInspection.current,
        locked: true,
      };
    }

    if (now - lastPublish.current < PUBLISH_INTERVAL_MS) return;
    lastPublish.current = now;

    const samples = frameSamples.current;
    const avg = samples.reduce((sum, ms) => sum + ms, 0) / Math.max(1, samples.length);
    const p95 = percentile(samples, 0.95);
    const observedFrames = Math.max(1, frameCount.current - lastRenderInfo.current.frames);
    const currentCalls = finite(gl.info.render.calls);
    const currentTriangles = finite(gl.info.render.triangles);
    const currentPoints = finite(gl.info.render.points);
    const currentLines = finite(gl.info.render.lines);
    const calls = deltaPerFrame(
      currentCalls,
      lastRenderInfo.current.calls,
      observedFrames,
    );
    let triangles = deltaPerFrame(
      currentTriangles,
      lastRenderInfo.current.triangles,
      observedFrames,
    );
    if (triangles === 0 && sceneStats.current.estimatedTriangles > 0) {
      triangles = sceneStats.current.estimatedTriangles;
    }
    const points = deltaPerFrame(
      currentPoints,
      lastRenderInfo.current.points,
      observedFrames,
    );
    const lines = deltaPerFrame(
      currentLines,
      lastRenderInfo.current.lines,
      observedFrames,
    );
    lastRenderInfo.current = {
      calls: currentCalls,
      triangles: currentTriangles,
      points: currentPoints,
      lines: currentLines,
      frames: frameCount.current,
    };
    const snapshot: BattleV2ObservabilitySnapshot = {
      updatedAt: now,
      frames: frameCount.current,
      frame: {
        fps: avg > 0 ? 1000 / avg : 0,
        frameMsAvg: avg,
        frameMsP95: p95,
        slowFrames: samples.filter((ms) => ms > 24).length,
        samples: samples.length,
      },
      renderer: {
        calls,
        triangles,
        points,
        lines,
        geometries: gl.info.memory.geometries,
        textures: gl.info.memory.textures,
        pixelRatio: gl.getPixelRatio(),
        canvasWidth: size.width,
        canvasHeight: size.height,
        observedFrames,
      },
      scene: sceneStats.current,
      pointer: pointerInspection.current,
    };
    (window as BattleV2ObservabilityWindow).__BATTLE_V2_OBSERVABILITY__ = snapshot;
    onSnapshot(snapshot);
  });

  return null;
}
