"use client";

/**
 * `reveal` phase — the transcendence card returns.
 *
 * Pure presentation. The mutation already happened at the `ceremony →
 * reveal` transition (in `page.tsx`); this phase only *renders* its
 * result. Resonance shows as a FELT state via `resonance-voice.ts` —
 * "a quiet bond" / "the bond deepens" / "the bond is unbreakable". The
 * numeral NEVER appears (NFR-2).
 */

import { motion } from "motion/react";
import { findDef } from "@/lib/honeycomb/cards";
import type { Element } from "@/lib/honeycomb/wuxing";
import { bondState, revealWhisper } from "./resonance-voice";

interface RevealPhaseProps {
  readonly transcendenceDefId: string;
  readonly resonance: number;
  readonly isLevelUp: boolean;
  /** Player's element — keys the caretaker whisper voice. */
  readonly voiceElement: Element;
  readonly seed: number;
  readonly onContinue: () => void;
}

/** A glyph for each transcendence card — feel, not data. */
function transGlyph(defId: string): string {
  if (defId.includes("garden")) return "生";
  if (defId.includes("forge")) return "克";
  return "無";
}

export function RevealPhase({
  transcendenceDefId,
  resonance,
  isLevelUp,
  voiceElement,
  seed,
  onContinue,
}: RevealPhaseProps) {
  const def = findDef(transcendenceDefId);
  const whisperLine = revealWhisper(voiceElement, isLevelUp, seed);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, ease: "easeOut" }}
      className="flex min-h-[60vh] flex-col items-center justify-center"
    >
      <p className="mb-1 font-puru-body text-sm text-puru-ink-dim">
        {isLevelUp ? "the bond deepens" : "all rivers find the sea"}
      </p>
      {/* Resonance as FELT state — never a numeral (NFR-2). */}
      <p className="mb-6 font-puru-display text-base text-puru-honey-dim">
        {bondState(resonance)}
      </p>

      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        className="flex aspect-[5/7] w-48 flex-col items-center justify-center rounded-2xl border-2 border-puru-honey-base p-6 text-center"
        style={{
          background:
            "linear-gradient(160deg, var(--puru-ink-base), var(--puru-ink-rich))",
          filter: "drop-shadow(0 0 30px var(--puru-honey-base))",
        }}
      >
        <span className="mb-3 font-puru-cn text-5xl text-puru-honey-bright">
          {transGlyph(transcendenceDefId)}
        </span>
        <span className="font-puru-display text-lg text-puru-cloud-bright">
          {def?.name ?? "Unknown"}
        </span>
      </motion.div>

      {whisperLine && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="mt-6 max-w-xs text-center font-puru-body text-sm italic text-puru-ink-soft"
        >
          “{whisperLine}”
        </motion.p>
      )}

      <button
        type="button"
        onClick={onContinue}
        className="mt-9 rounded-full bg-puru-honey-base px-10 py-3 font-puru-body text-base text-puru-ink-rich transition-transform hover:scale-[1.03] active:scale-95 cursor-pointer"
      >
        continue
      </button>
    </motion.div>
  );
}
