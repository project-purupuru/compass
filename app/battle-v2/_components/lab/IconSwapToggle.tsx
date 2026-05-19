/**
 * IconSwapToggle · FR-S2.3
 *
 * Visible top-right toggle that flips IconProvider between Phosphor and Stub
 * live. Proves the substrate's swap capability per operator's stated need.
 */

"use client";

import { Icon } from "@/lib/ui/icons/Icon";
import { useIconProvider } from "@/lib/ui/icons/provider";

export function IconSwapToggle() {
  const { provider, setProvider } = useIconProvider();
  const next = provider === "phosphor" ? "stub" : "phosphor";

  return (
    <button
      type="button"
      onClick={() => setProvider(next)}
      title={`Icon provider: ${provider} · click to swap to ${next}`}
      style={{
        position: "fixed",
        top: 8,
        right: 8,
        zIndex: 40,
        padding: "6px 10px",
        background: "rgba(0, 0, 0, 0.55)",
        backdropFilter: "blur(6px)",
        border: "1px solid rgba(255, 255, 255, 0.15)",
        borderRadius: 4,
        color: "rgba(255, 255, 255, 0.85)",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 11,
        fontFamily: "ui-monospace, monospace",
      }}
      data-icon-swap-toggle
      data-active-provider={provider}
    >
      <Icon name="reset" size={12} />
      <span>{provider}</span>
    </button>
  );
}
