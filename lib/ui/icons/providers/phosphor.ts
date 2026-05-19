/**
 * IconRegistry · Phosphor provider (first concrete provider)
 *
 * Per PRD FR-S2.1: maps semantic IconName → Phosphor component.
 * Add icons here as needed; type-safety enforced via IconName union.
 *
 * Phosphor docs: https://phosphoricons.com/
 */

import {
  ArrowsClockwise,
  Browser,
  Cards,
  CaretRight,
  ChartLine,
  CheckCircle,
  Code,
  Copy,
  Cube,
  CursorClick,
  Database,
  Drop,
  Eye,
  EyeSlash,
  FilmStrip,
  Fire,
  Hand,
  Hash,
  Info,
  Layout,
  Lock,
  LockOpen,
  MagnifyingGlass,
  Mountains,
  Package,
  PaintBrush,
  PencilSimple,
  Play,
  Plus,
  Question,
  ShareNetwork,
  SquaresFour,
  Stack,
  Sword,
  Tree,
  Warning,
  WaveTriangle,
  WaveSquare,
  X,
  XCircle,
} from "@phosphor-icons/react";
import type { ComponentType } from "react";
import type { IconName } from "../names";

interface PhosphorProps {
  size?: number;
  weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone";
  color?: string;
}

export type IconComponent = ComponentType<PhosphorProps>;

export const phosphorProvider: Record<IconName, IconComponent> = {
  // Pantry / codex
  "pantry": Package,
  "codex-card": Cards,
  "ingredient": Cube,

  // Kitchen / lab chrome
  "kitchen": PaintBrush,
  "effect": WaveSquare,
  "compose": PaintBrush,
  "preview": Eye,
  "export": ShareNetwork,

  // Pointer chain glyphs
  "pointer-source": Database,
  "pointer-render": FilmStrip,
  "pointer-consumer": Hand,
  "breadcrumb-separator": CaretRight,

  // Inspector surface
  "inspect": MagnifyingGlass,
  "select": CursorClick,
  "data": Code,
  "raw": Hash,
  "edit": PencilSimple,
  "copy": Copy,
  "reset": ArrowsClockwise,

  // Workspaces
  "workspace-compose": PaintBrush,
  "workspace-preview": Eye,
  "workspace-export": ShareNetwork,

  // Composability panel
  "layers": Stack,
  "visibility-on": Eye,
  "visibility-off": EyeSlash,
  "lock": Lock,
  "unlock": LockOpen,

  // Game UI · battle
  "play": Play,
  "draw": Plus,
  "discard": X,
  "wuxing-wood": Tree,
  "wuxing-fire": Fire,
  "wuxing-earth": Mountains,
  "wuxing-metal": Sword,
  "wuxing-water": Drop,

  // Status
  "success": CheckCircle,
  "warning": Warning,
  "error": XCircle,
  "info": Info,
};
