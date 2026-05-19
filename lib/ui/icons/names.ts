/**
 * IconRegistry · semantic icon vocabulary V0
 *
 * Per PRD FR-S2.2: ~30 semantic names covering lab + game UI surfaces.
 * Type-safe IconName union — consumers MUST use one of these strings.
 *
 * Adding a name: add here, then add mapping to each provider (Phosphor, Stub, Lucide).
 * Removing a name: requires ESLint sweep first.
 */

export const ICON_NAMES = [
  // Pantry / codex
  "pantry",
  "codex-card",
  "ingredient",

  // Kitchen / lab chrome
  "kitchen",
  "effect",
  "compose",
  "preview",
  "export",

  // Pointer chain glyphs
  "pointer-source",
  "pointer-render",
  "pointer-consumer",
  "breadcrumb-separator",

  // Inspector surface
  "inspect",
  "select",
  "data",
  "raw",
  "edit",
  "copy",
  "reset",

  // Workspaces
  "workspace-compose",
  "workspace-preview",
  "workspace-export",

  // Composability panel
  "layers",
  "visibility-on",
  "visibility-off",
  "lock",
  "unlock",

  // Game UI · battle
  "play",
  "draw",
  "discard",
  "wuxing-wood",
  "wuxing-fire",
  "wuxing-earth",
  "wuxing-metal",
  "wuxing-water",

  // Status
  "success",
  "warning",
  "error",
  "info",
] as const;

export type IconName = (typeof ICON_NAMES)[number];

export function isIconName(name: string): name is IconName {
  return (ICON_NAMES as readonly string[]).includes(name);
}
