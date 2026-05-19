/**
 * PlayButton · cycle-2 S3.2 · F5 hot-jump to /play
 *
 * Header button (NOT a tab) that hot-jumps to /play with the current scene
 * state preserved per FR-25. Per FR-4 (the-arcade probe verdict): PLAY is
 * action-grammar, NOT workspace-grammar — it belongs as a button alongside
 * BUILD/LIBRARY tabs, not as a third tab.
 *
 * Serializes current scene state via lib/lab/state/hot-jump.schema.ts (S3.3)
 * into URL query · navigates to /play?state=<base64-canonical-JSON>. /play
 * reads the URL state on mount and seeds itself (S3.5).
 *
 * Visual: shadcn Button variant=default (resolves to honey-base via the S1
 * --primary composition) · honey background distinguishes it from the
 * BUILD/LIBRARY tabs · Tooltip showing F5 keyboard shortcut.
 *
 * Keyboard listener lives at /honeycomb page root (S3.4) · this component
 * just renders the button + handles click. Click and F5 share the same
 * onHotJump handler.
 */

"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Icon } from "@/lib/ui/icons/Icon";

interface PlayButtonProps {
  /**
   * Called when the operator clicks PLAY or hits F5. Implementation
   * serializes scene state to URL and navigates. S3.5 wires the real
   * handler · S3.3 provides the hot-jump schema serializer.
   */
  onHotJump: () => void;
  className?: string;
}

export function PlayButton({ onHotJump, className }: PlayButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="default"
          size="sm"
          onClick={onHotJump}
          className={`gap-1.5 font-puru-body font-semibold ${className ?? ""}`}
          data-play-button
          aria-label="Play (F5 · hot-jump to /play)"
        >
          <Icon name="play" size={14} />
          <span>Play</span>
          <span className="text-[9px] font-puru-mono opacity-70">F5</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p className="font-puru-mono text-xs">
          Hot-jump to /play with current scene state · F5
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
