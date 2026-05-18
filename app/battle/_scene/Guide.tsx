"use client";

/**
 * Guide — progressive-disclosure help/tutorial. FR-9+10 merged per Q-SDD-8.
 *
 * First-match: teach-by-doing tutorial overlay (4 steps).
 * Subsequent matches: hint-mode (small "?" affordance, swipeable card on tap).
 * Dismissal persisted via lib/honeycomb/storage.ts.
 */

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { readMatchStorage, updateMatchStorage } from "@/lib/honeycomb/storage";

interface GuideStep {
  readonly title: string;
  readonly body: string;
}

const TUTORIAL_STEPS: readonly GuideStep[] = [
  {
    title: "Five cards, five clashes.",
    body: "Pick five from your collection. Arrange them in the order you want to fight.",
  },
  {
    title: "Order matters.",
    body: "Cards next to each other in the Shēng cycle (Water→Wood→Fire→Earth→Metal) form chains. Longer chain, bigger bonus.",
  },
  {
    title: "Setup Strike.",
    body: "A Caretaker before a same-element Jani gives +30% — but breaks the chain. Tradeoff lives in the arrangement.",
  },
  {
    title: "Lock in. Watch the tide.",
    body: "Pairs clash simultaneously. Losers get 敗 stamped. Rearrange survivors between rounds.",
  },
];

const HINTS: readonly string[] = [
  "Press backtick (`) to toggle the dev console.",
  "Your home element gives +15% to matching cards in your lineup.",
  "Garden grace: if Garden survives the round, your chain bonus stays even if other cards die.",
  "Forge auto-counters: it becomes whatever element overcomes your opponent.",
  "Void mirrors: copies opponent's type + adds a small bonus.",
  "R3 transcendence cards (Resonance ≥ 3) are immune to numbers-advantage tiebreaks.",
];

export function Guide() {
  const [storage, setStorage] = useState(() => readMatchStorage());
  const [stepIdx, setStepIdx] = useState(0);
  const [hintIdx, setHintIdx] = useState(0);
  const [hintOpen, setHintOpen] = useState(false);

  // Tutorial active if not yet seen
  const tutorialActive = !storage.hasSeenTutorial;

  useEffect(() => {
    // Refresh storage on mount
    setStorage(readMatchStorage());
  }, []);

  const completeTutorial = () => {
    updateMatchStorage("hasSeenTutorial", true);
    setStorage((s) => ({ ...s, hasSeenTutorial: true }));
  };

  if (tutorialActive) {
    const step = TUTORIAL_STEPS[stepIdx];
    if (!step) return null;
    return (
      <AnimatePresence>
        <motion.div
          key={stepIdx}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.36, ease: [0.32, 0.72, 0.32, 1] }}
          className="fixed inset-x-0 bottom-24 z-40 mx-auto max-w-md px-6"
        >
          <div className="rounded-3xl bg-puru-cloud-bright shadow-puru-tile p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="font-puru-display text-base text-puru-ink-rich">{step.title}</h3>
              <button
                type="button"
                onClick={completeTutorial}
                className="text-2xs font-puru-mono text-puru-ink-ghost hover:text-puru-ink-dim transition-colors"
              >
                skip
              </button>
            </div>
            <p className="font-puru-body text-sm leading-puru-relaxed text-puru-ink-base">
              {step.body}
            </p>
            <div className="flex items-center justify-between mt-2">
              <div className="flex gap-1.5">
                {TUTORIAL_STEPS.map((_, i) => (
                  <span
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full ${
                      i <= stepIdx ? "bg-puru-honey-base" : "bg-puru-cloud-deep/40"
                    }`}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  if (stepIdx < TUTORIAL_STEPS.length - 1) setStepIdx(stepIdx + 1);
                  else completeTutorial();
                }}
                className="px-3 py-1 rounded-full bg-puru-honey-base text-puru-ink-rich text-xs font-puru-display shadow-puru-tile hover:shadow-puru-tile-hover transition-shadow"
              >
                {stepIdx < TUTORIAL_STEPS.length - 1 ? "next" : "begin"}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Hint mode: small "?" toggle in corner; tapped opens a swipeable hint card
  return (
    <>
      <button
        type="button"
        aria-label="Show hints"
        onClick={() => setHintOpen(!hintOpen)}
        className="fixed bottom-6 right-6 z-40 w-10 h-10 rounded-full bg-puru-cloud-bright shadow-puru-tile font-puru-display text-puru-ink-rich hover:shadow-puru-tile-hover transition-shadow grid place-items-center"
      >
        ?
      </button>
      <AnimatePresence>
        {hintOpen && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.32, ease: [0.32, 0.72, 0.32, 1] }}
            className="fixed bottom-20 right-6 z-40 max-w-xs"
          >
            <div className="rounded-3xl bg-puru-cloud-bright shadow-puru-tile p-4 flex flex-col gap-2">
              <p className="font-puru-body text-sm text-puru-ink-base">
                {HINTS[hintIdx % HINTS.length]}
              </p>
              <button
                type="button"
                onClick={() => setHintIdx((i) => i + 1)}
                className="self-end text-2xs font-puru-mono text-puru-ink-ghost hover:text-puru-ink-dim transition-colors"
              >
                next →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
