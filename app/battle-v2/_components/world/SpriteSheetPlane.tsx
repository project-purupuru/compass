"use client";

import { useEffect, useMemo, useRef } from "react";

import { useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import {
  ClampToEdgeWrapping,
  LinearFilter,
  NearestFilter,
  SRGBColorSpace,
  type Texture,
} from "three";

export interface SpriteSheetDefinition {
  readonly src: string;
  readonly columns: number;
  readonly rows: number;
  readonly frameCount: number;
  readonly frameWidth: number;
  readonly frameHeight: number;
}

export function spriteSheetAspect(sheet: SpriteSheetDefinition): number {
  return sheet.frameWidth / sheet.frameHeight;
}

function frameToUv(sheet: SpriteSheetDefinition, frame: number) {
  const safeFrame =
    ((Math.floor(frame) % sheet.frameCount) + sheet.frameCount) % sheet.frameCount;
  const column = safeFrame % sheet.columns;
  const row = Math.floor(safeFrame / sheet.columns);

  return {
    repeatX: 1 / sheet.columns,
    repeatY: 1 / sheet.rows,
    offsetX: column / sheet.columns,
    offsetY: 1 - (row + 1) / sheet.rows,
  };
}

function applyFrame(texture: Texture, sheet: SpriteSheetDefinition, frame: number) {
  const uv = frameToUv(sheet, frame);
  texture.repeat.set(uv.repeatX, uv.repeatY);
  texture.offset.set(uv.offsetX, uv.offsetY);
}

interface SpriteSheetPlaneProps {
  readonly sheet: SpriteSheetDefinition;
  readonly height: number;
  readonly width?: number;
  readonly fps?: number;
  readonly frame?: number;
  readonly frameOffset?: number;
  readonly phase?: number;
  readonly playing?: boolean;
  readonly alphaTest?: number;
  readonly pixelated?: boolean;
  readonly name?: string;
}

export function SpriteSheetPlane({
  sheet,
  height,
  width = height * spriteSheetAspect(sheet),
  fps = 8,
  frame,
  frameOffset = 0,
  phase = 0,
  playing = true,
  alphaTest = 0.35,
  pixelated = false,
  name = "sprite-sheet-plane",
}: SpriteSheetPlaneProps) {
  const sourceTexture = useTexture(sheet.src) as Texture;
  const lastFrameRef = useRef<number | null>(null);

  const texture = useMemo(() => {
    const next = sourceTexture.clone();
    next.colorSpace = SRGBColorSpace;
    next.wrapS = ClampToEdgeWrapping;
    next.wrapT = ClampToEdgeWrapping;
    next.magFilter = pixelated ? NearestFilter : LinearFilter;
    next.minFilter = pixelated ? NearestFilter : LinearFilter;
    next.matrixAutoUpdate = true;
    applyFrame(next, sheet, frame ?? frameOffset);
    return next;
  }, [frame, frameOffset, pixelated, sheet, sourceTexture]);

  useEffect(() => () => texture.dispose(), [texture]);

  useFrame((state) => {
    const nextFrame =
      frame ??
      (playing
        ? Math.floor((state.clock.getElapsedTime() + phase) * fps + frameOffset)
        : frameOffset);
    const normalizedFrame = ((nextFrame % sheet.frameCount) + sheet.frameCount) % sheet.frameCount;
    if (lastFrameRef.current === normalizedFrame) return;
    lastFrameRef.current = normalizedFrame;
    applyFrame(texture, sheet, normalizedFrame);
  });

  return (
    <mesh name={name}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial
        name={`${name}.material`}
        map={texture}
        transparent
        alphaTest={alphaTest}
        toneMapped={false}
      />
    </mesh>
  );
}
