/**
 * IconRegistry · Stub provider
 *
 * Renders text fallback for every icon name. Used by the swap demo
 * (PRD FR-S2.3) to prove the registry abstraction works — flipping
 * provider="stub" makes every icon render as a labeled square.
 */

import type { ComponentType } from "react";
import { createElement } from "react";
import type { IconName } from "../names";
import type { IconComponent } from "./phosphor";

interface StubProps {
  size?: number;
  weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone";
  color?: string;
}

function makeStub(name: IconName): IconComponent {
  const Stub = (props: StubProps) => {
    const size = props.size ?? 16;
    return createElement(
      "span",
      {
        style: {
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: size,
          height: size,
          background: "rgba(255, 170, 0, 0.18)",
          border: "1px solid rgba(255, 170, 0, 0.55)",
          color: props.color ?? "#ffaa00",
          fontFamily: "ui-monospace, monospace",
          fontSize: Math.max(8, size / 2.2),
          lineHeight: 1,
          borderRadius: 2,
        },
        title: name,
      },
      name.slice(0, 1).toUpperCase(),
    );
  };
  Stub.displayName = `Stub(${name})`;
  return Stub as ComponentType<StubProps>;
}

import { ICON_NAMES } from "../names";

export const stubProvider: Record<IconName, IconComponent> = Object.fromEntries(
  ICON_NAMES.map((n) => [n, makeStub(n)]),
) as Record<IconName, IconComponent>;
