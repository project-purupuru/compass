"use client";

/**
 * CardStack — DOM-stacked `<img>` layers per the kickoff brief's Pillar 1.
 *
 * Replaces flat single-image card rendering. Each resolved layer becomes
 * an absolutely-positioned `<img>` with proper z-index ordering. Mobile-first
 * (no canvas), hit-testable at the wrapper, motion-compatible (each layer
 * is a regular DOM node that motion/react can target).
 *
 * Pair with the registry at `lib/cards/layers/registry.json`. To override
 * (e.g., kit playground), pass `registry` prop with a custom LayerRegistry.
 */

import { useMemo } from "react";
import registryJson from "./registry.json";
import { resolve } from "./resolve";
import {
  cardTypeToRarity,
  type Face,
  type LayerElement,
  type LayerRarity,
  type LayerRegistry,
  type ResolveInput,
  type ResolvedLayer,
  type RevealStage,
} from "./types";
import type { CardType } from "@/lib/honeycomb/cards";

const DEFAULT_REGISTRY = registryJson as LayerRegistry;

export interface CardStackProps {
  readonly element: LayerElement;
  readonly cardType: CardType;
  /** If absent, derived from cardType. */
  readonly rarity?: LayerRarity;
  /** Defaults to 3 (full reveal). */
  readonly revealStage?: RevealStage;
  /** Defaults to "front". */
  readonly face?: Face;
  /** 0-100, drives behavioral layer. Defaults to 50. */
  readonly resonance?: number;
  /** Optional override for the registry. Used by the kit playground. */
  readonly registry?: LayerRegistry;
  /** Alt text. Applied to the top-most layer (others get aria-hidden). */
  readonly alt?: string;
  /** Optional class merged onto the wrapper. */
  readonly className?: string;
}

export function CardStack({
  element,
  cardType,
  rarity,
  revealStage = 3,
  face = "front",
  resonance = 50,
  registry = DEFAULT_REGISTRY,
  alt,
  className,
}: CardStackProps): React.ReactElement {
  const layers: readonly ResolvedLayer[] = useMemo(() => {
    const input: ResolveInput = {
      registry,
      element,
      cardType,
      rarity: rarity ?? cardTypeToRarity(cardType),
      revealStage,
      face,
      resonance,
    };
    return resolve(input);
  }, [registry, element, cardType, rarity, revealStage, face, resonance]);

  const topIndex = layers.length - 1;

  return (
    <div
      className={`card-stack${className ? ` ${className}` : ""}`}
      data-face={face}
      data-element={element}
      data-card-type={cardType}
      data-reveal={revealStage}
      style={{
        width: "100%",
        height: "100%",
        aspectRatio: `${registry.canvas.width} / ${registry.canvas.height}`,
      }}
    >
      {layers.map((layer, i) => (
        <img
          key={layer.layerName}
          className={`card-stack-layer card-stack-layer-${layer.layerName}`}
          data-layer={layer.layerName}
          data-source={layer.source}
          src={layer.url}
          alt={i === topIndex ? (alt ?? "") : ""}
          aria-hidden={i === topIndex ? undefined : true}
          loading="lazy"
          decoding="async"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            pointerEvents: "none",
            zIndex: layer.zIndex,
          }}
        />
      ))}
    </div>
  );
}
