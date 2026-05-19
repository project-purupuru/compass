/**
 * PointerBreadcrumb · Thread A (per ADR-2 + ADR-13)
 *
 * Sticky top strip showing the full pointer chain for the active entity.
 * Reads chain from S1b's pointer-chain schema (currently @version draft-S1).
 *
 * Visual: pantry/earth-jani › primitive:card-composition › consumers: [card-lab · battle · showcase]
 * Each segment is clickable (TODO in S3: wire to navigation).
 */

"use client";

import { Icon } from "@/lib/ui/icons/Icon";
import type { IconName } from "@/lib/ui/icons/names";
import { segmentLabel, type PointerChain, type PointerSegment } from "@/lib/lab/pointer-chain/schema";

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

export function PointerBreadcrumb({ chain, className, onSegmentClick }: PointerBreadcrumbProps) {
  if (chain.length === 0) {
    return (
      <div
        className={className}
        style={{
          display: "flex",
          alignItems: "center",
          padding: "8px 12px",
          background: "rgba(0, 0, 0, 0.4)",
          color: "rgba(255, 255, 255, 0.4)",
          fontSize: 12,
          fontFamily: "ui-monospace, monospace",
          minHeight: 32,
        }}
        data-pointer-breadcrumb
      >
        <span>no active entity</span>
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "8px 12px",
        background: "rgba(0, 0, 0, 0.55)",
        backdropFilter: "blur(8px)",
        color: "rgba(255, 255, 255, 0.85)",
        fontSize: 12,
        fontFamily: "ui-monospace, monospace",
        position: "sticky",
        top: 0,
        zIndex: 20,
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        flexWrap: "wrap",
      }}
      data-pointer-breadcrumb
      data-segments={chain.length}
    >
      {chain.map((seg, i) => (
        <span key={`${seg._tag}-${i}`} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          {i > 0 && (
            <span style={{ opacity: 0.4, display: "inline-flex", alignItems: "center" }} aria-hidden>
              <Icon name="breadcrumb-separator" size={12} />
            </span>
          )}
          <button
            type="button"
            onClick={() => onSegmentClick?.(seg, i)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              background: "transparent",
              border: "none",
              color: "inherit",
              cursor: onSegmentClick ? "pointer" : "default",
              padding: 0,
              fontFamily: "inherit",
              fontSize: "inherit",
            }}
            data-segment-tag={seg._tag}
          >
            <Icon name={iconNameForSegment(seg)} size={12} />
            <span>{segmentLabel(seg)}</span>
          </button>
        </span>
      ))}
    </div>
  );
}
