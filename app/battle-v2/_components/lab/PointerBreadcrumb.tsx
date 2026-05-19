/**
 * PointerBreadcrumb · cycle-2 S2.1 rebuild on shadcn Breadcrumb
 *
 * Sticky top strip showing the full pointer chain for the active entity.
 * Reads chain from the LOCKED v1.0 pointer-chain schema.
 *
 * Visual: pantry/earth-jani › primitive:card-composition › consumers: [...]
 * Each segment is clickable (onSegmentClick).
 *
 * Cycle-2 rebuild swaps cycle-1's inline-style chrome for shadcn Breadcrumb
 * + brand tokens (--puru-* OKLCH composition + font-puru-mono) per
 * [[feedback_shadcn-for-kitchen-ui]] and the artisan v1 probe recommendation
 * (use brand mono stack, not generic ui-monospace).
 *
 * Element-accent (artisan probe FR-17) is a property of the Inspector's
 * selection-aware accent — for the breadcrumb this lands as a subtle
 * honey-accent on hover.
 *
 * API PRESERVED: same props · same data-pointer-breadcrumb attribute · same
 * onSegmentClick signature · cycle-1 callers work unchanged.
 */

"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Icon } from "@/lib/ui/icons/Icon";
import type { IconName } from "@/lib/ui/icons/names";
import {
  segmentLabel,
  type PointerChain,
  type PointerSegment,
} from "@/lib/lab/pointer-chain/schema";

interface PointerBreadcrumbProps {
  chain: PointerChain;
  className?: string;
  onSegmentClick?: (segment: PointerSegment, index: number) => void;
}

function iconNameForSegment(seg: PointerSegment): IconName {
  switch (seg._tag) {
    case "Pantry":
      return "pantry";
    case "Primitive":
      return "pointer-render";
    case "Consumer":
      return "pointer-consumer";
    case "Scene":
      return "layers";
  }
}

export function PointerBreadcrumb({
  chain,
  className,
  onSegmentClick,
}: PointerBreadcrumbProps) {
  if (chain.length === 0) {
    return (
      <div
        className={`flex items-center px-3 py-2 min-h-8 font-puru-mono text-xs text-puru-ink-dim bg-puru-cloud-deep/55 backdrop-blur-md sticky top-0 z-20 ${className ?? ""}`}
        data-pointer-breadcrumb
        data-segments="0"
      >
        <span>no active entity</span>
      </div>
    );
  }

  return (
    <Breadcrumb
      className={`flex items-center px-3 py-2 font-puru-mono text-xs text-puru-ink-base bg-puru-cloud-deep/55 backdrop-blur-md sticky top-0 z-20 border-b border-puru-surface-border/40 ${className ?? ""}`}
      data-pointer-breadcrumb
      data-segments={chain.length}
    >
      <BreadcrumbList className="flex-wrap gap-1.5">
        {chain.map((seg, i) => (
          <span
            key={`${seg._tag}-${i}`}
            className="inline-flex items-center gap-1.5"
          >
            {i > 0 && (
              <BreadcrumbSeparator className="opacity-40">
                <Icon name="breadcrumb-separator" size={12} />
              </BreadcrumbSeparator>
            )}
            <BreadcrumbItem>
              <button
                type="button"
                onClick={() => onSegmentClick?.(seg, i)}
                className={`inline-flex items-center gap-1 bg-transparent border-0 text-puru-ink-base hover:text-puru-honey-base transition-colors p-0 font-inherit text-inherit ${onSegmentClick ? "cursor-pointer" : "cursor-default"}`}
                data-segment-tag={seg._tag}
              >
                <Icon name={iconNameForSegment(seg)} size={12} />
                <span>{segmentLabel(seg)}</span>
              </button>
            </BreadcrumbItem>
          </span>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
