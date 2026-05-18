"use client";

import { AnimatePresence, motion } from "motion/react";
import { ELEMENT_META, type Element } from "@/lib/honeycomb/wuxing";
import { ELEMENT_TINT_BG } from "./_element-classes";

interface WhisperBubbleProps {
  readonly line: string | null;
  readonly element: Element;
}

export function WhisperBubble({ line, element }: WhisperBubbleProps) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
      <AnimatePresence mode="wait">
        {line && (
          <motion.div
            key={line}
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.42, ease: [0.32, 0.72, 0.32, 1] }}
            className={`rounded-full px-4 py-2 ${ELEMENT_TINT_BG[element]} text-puru-ink-rich text-sm font-puru-body shadow-puru-tile`}
          >
            <span className="font-puru-display text-2xs uppercase tracking-wide text-puru-ink-soft mr-2">
              {ELEMENT_META[element].caretaker}
            </span>
            {line}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
