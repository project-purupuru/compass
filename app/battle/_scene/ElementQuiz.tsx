"use client";

/**
 * ElementQuiz — 1:1 port of world-purupuru ElementQuiz.svelte.
 * One screen: pick your element. CSS lives in app/battle/_styles/ElementQuiz.css.
 */

import { useEffect, useState } from "react";
import { ELEMENT_META, ELEMENT_ORDER, type Element } from "@/lib/honeycomb/wuxing";
import { matchCommand } from "@/lib/runtime/match.client";
import { updateMatchStorage } from "@/lib/honeycomb/storage";
import { WORLD_SCENES, WORLD_SCENE_LABELS, CARETAKER_FULL } from "@/lib/cdn";

interface SceneSpec {
  readonly element: Element;
  readonly scene: string;
  readonly puruhani: string;
  readonly sceneArt: string;
  readonly caretakerArt: string;
}

const PURUHANI_MOOD: Record<Element, string> = {
  wood: "hopeful",
  fire: "nefarious",
  earth: "exhausted",
  metal: "loving",
  water: "overwhelmed",
};

// Scenes use world-purupuru's canonical WORLD_SCENES (bus-stop atmosphere
// per element + time of day) and CARETAKER_FULL (transparent body art)
// from the shared S3 CDN — same source of truth the original game uses.
const SCENES: readonly SceneSpec[] = ELEMENT_ORDER.map((el) => ({
  element: el,
  scene: WORLD_SCENE_LABELS[el],
  sceneArt: WORLD_SCENES[el],
  caretakerArt: CARETAKER_FULL[el],
  puruhani: `/thumbs/puruhani/${PURUHANI_MOOD[el]}-puruhani.png`,
}));

export function ElementQuiz() {
  const [selected, setSelected] = useState<Element | null>(null);

  useEffect(() => {
    if (!selected) return;
    updateMatchStorage("playerElement", selected);
    const t = setTimeout(() => matchCommand.chooseElement(selected), 600);
    return () => clearTimeout(t);
  }, [selected]);

  return (
    <div
      className={`quiz${selected !== null ? " quiz-tinted" : ""}`}
      data-element={selected ?? undefined}
    >
      <header className="quiz-header">
        <span className="quiz-eyebrow">Observatory · Calibration</span>
        <h2 className="quiz-title">Choose your element.</h2>
      </header>

      <div className="scene-grid">
        {SCENES.map((s, i) => {
          const meta = ELEMENT_META[s.element];
          const isChosen = selected === s.element;
          const isFaded = selected !== null && selected !== s.element;
          return (
            <div
              key={s.element}
              className={[
                "scene-wrap",
                isChosen && "chosen",
                isFaded && "faded",
              ]
                .filter(Boolean)
                .join(" ")}
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <button
                type="button"
                className="scene-card"
                data-element={s.element}
                onClick={() => setSelected(s.element)}
                disabled={selected !== null}
                aria-label={`${meta.name} · ${s.scene}`}
              >
                <img
                  className="scene-art"
                  src={s.sceneArt}
                  alt={s.scene}
                  loading="lazy"
                />
                <div className="scene-tint" data-element={s.element} />
                <span className="scene-kanji">{meta.kanji}</span>
              </button>

              <img
                className="mural-caretaker"
                src={s.caretakerArt}
                alt={meta.caretaker}
                loading="lazy"
              />
              <img
                className="mural-puruhani"
                src={s.puruhani}
                alt={`${meta.caretaker}'s puruhani`}
                loading="lazy"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
