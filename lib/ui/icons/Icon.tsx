/**
 * IconRegistry · public consumer surface
 *
 * Usage:
 *   <Icon name="pantry" size={16} />
 *   <Icon name="workspace-compose" size={20} weight="bold" />
 *
 * Per PRD G5 + Operator: "should not take this much effort to change things."
 * Lab + game UI route ALL icons through this component. No direct
 * `@phosphor-icons/react` or `lucide-react` imports outside lib/ui/icons/providers/.
 */

"use client";

import type { CSSProperties } from "react";
import type { IconName } from "./names";
import { getIconComponent } from "./registry";
import { useIconProvider } from "./provider";

interface IconProps {
  name: IconName;
  size?: number;
  weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone";
  color?: string;
  className?: string;
  style?: CSSProperties;
  "aria-label"?: string;
  "aria-hidden"?: boolean;
}

export function Icon({
  name,
  size = 16,
  weight = "regular",
  color,
  className,
  style,
  ...aria
}: IconProps) {
  const { provider } = useIconProvider();
  const Component = getIconComponent(provider, name);
  return (
    <span
      className={className}
      style={{ display: "inline-flex", alignItems: "center", ...style }}
      data-icon={name}
      data-icon-provider={provider}
      {...aria}
    >
      <Component size={size} weight={weight} color={color} />
    </span>
  );
}
