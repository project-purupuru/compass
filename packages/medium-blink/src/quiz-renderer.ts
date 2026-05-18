// Quiz renderer · driven by quiz-config.ts (single source of truth for shape)
// SDD r2 §4.1 · per BLINK_DESCRIPTOR
//
// Default config: 8 questions × 3 buttons (Gumi feedback · 5 looks ugly).
// Buttons emit `type: "post"` so Dialect renderer treats them as chain links
// (POST returns next action inline) NOT transaction buttons (would require wallet).
//
// Composition flow (Codex §5):
//   peripheral-events BaziQuizState shape
//     → quiz-renderer composes ActionGetResponse
//     → apps/web route returns to client

import {
  QUIZ_COMPLETED_STEP,
  signQuizState,
  type Answer,
  type Element,
} from "@purupuru/peripheral-events";

import { QUIZ_CONFIG, selectAnswers, shouldButtonsPost } from "./quiz-config";
import type { ActionGetResponse, LinkedAction } from "./solana-actions-types";
import { BLINK_DESCRIPTOR } from "./solana-actions-types";
import { ARCHETYPE_REVEALS, QUIZ_CORPUS, QUIZ_STEP_TITLES } from "./voice-corpus";

// Base URL configuration · injected by app-level wrapper.
// Default to localhost:3000 for tests · prod sets env at runtime.
//
// `hmacKey` is optional · when omitted the renderer falls back to
// process.env.QUIZ_HMAC_KEY (production path). Tests inject `hmacKey`
// directly to avoid env coupling.
export interface RendererConfig {
  baseUrl: string; // e.g. "https://purupuru-blinks.vercel.app"
  iconBaseUrl?: string; // optional CDN · defaults to baseUrl/api/og
  hmacKey?: Buffer; // optional · for test injection · falls back to env
}

const defaultConfig: RendererConfig = {
  baseUrl: "http://localhost:3000",
};

// Build the icon URL for a given step · serves the per-step quiz illustration
// from `/public/art/quiz/q{step}.png` (operator-curated atmospheric scenes ·
// 8 stages of the same setting at different times/weather). Falls back to the
// generated SVG via `/api/og?step=N` for any out-of-range value.
const iconUrlForStep = (step: number, config: RendererConfig): string => {
  if (step >= 1 && step <= 8) {
    return `${config.baseUrl}/art/quiz/q${step}.png`;
  }
  const base = config.iconBaseUrl ?? `${config.baseUrl}/api/og`;
  return `${base}?step=${step}`;
};

const iconUrlForArchetype = (archetype: Element, config: RendererConfig): string => {
  // Reveal card · serve the ACTUAL stone PNG from /public/art/stones/.
  // This is the same artifact the user is about to mint · visual continuity
  // from "You are Wood." reveal → claim button → wallet receives
  // exactly what's shown. Bypasses /api/og's SVG generator (which is for
  // mid-quiz step icons that should stay element-agnostic per operator's
  // design intent · the stones DO carry element identity by construction
  // since they're the artifact of a specific element claim).
  return `${config.baseUrl}/art/stones/${archetype.toLowerCase()}.png`;
};

// Render the start of the quiz · Q1 with N element-leaning answers (N = config.buttonsPerStep).
//
// Pure function · no I/O · returns a valid ActionGetResponse per Solana Actions spec.
//
// Title vs description: per Dialect's UI hierarchy the TITLE is the visually
// prominent element (bold white) and the DESCRIPTION is the dim subhead.
// We use title=question (the prompt the user actually answers) so the quiz
// content gets the prominent slot · the step indicator becomes the soft
// atmospheric subhead.
export const renderQuizStart = (config: RendererConfig = defaultConfig): ActionGetResponse => {
  const q = QUIZ_CORPUS[0];
  if (!q) {
    throw new Error(`Quiz corpus empty · expected ${QUIZ_CONFIG.totalSteps} questions`);
  }

  const buttons = buildAnswerButtons(q.step, [], q.answers, config);

  return {
    icon: iconUrlForStep(q.step, config),
    title: q.prompt, // question is the visually prominent element
    description: QUIZ_STEP_TITLES[q.step] ?? `Question ${q.step}`, // step indicator as subhead
    label: "answer",
    links: { actions: buttons },
  };
};

// Render a mid-quiz step · steps 2..QUIZ_CONFIG.totalSteps · prior answers in URL state.
//
// Server-side caller validates HMAC over (step, priorAnswers) before rendering.
// S2-T2 implements proper HMAC-SHA256 · this renderer just passes through the mac.
export const renderQuizStep = (params: {
  step: number; // 1..QUIZ_CONFIG.totalSteps · the step we're rendering
  priorAnswers: ReadonlyArray<0 | 1 | 2 | 3 | 4>;
  mac: string;
  config?: RendererConfig;
}): ActionGetResponse => {
  const config = params.config ?? defaultConfig;

  if (params.step < 1 || params.step > QUIZ_CONFIG.totalSteps) {
    return {
      icon: iconUrlForStep(1, config),
      title: "Something's off",
      description: "We lost your place · start again to read you fresh.",
      label: "begin",
      links: {
        actions: [
          { type: "post", label: "Begin Again", href: `${config.baseUrl}/api/actions/quiz/start` },
        ],
      },
      error: { message: `Invalid step: ${params.step}` },
    };
  }

  const q = QUIZ_CORPUS[params.step - 1];
  if (!q) throw new Error(`Quiz step ${params.step} not in corpus`);

  // Verify answer count matches step (length = step - 1).
  if (params.priorAnswers.length !== params.step - 1) {
    return {
      icon: iconUrlForStep(params.step, config),
      title: "Something's off",
      description: "Your answers got out of sync · start over to read you fresh.",
      label: "begin",
      links: {
        actions: [
          { type: "post", label: "Begin Again", href: `${config.baseUrl}/api/actions/quiz/start` },
        ],
      },
      error: {
        message: `Answer count mismatch: expected ${params.step - 1}, got ${params.priorAnswers.length}`,
      },
    };
  }

  const buttons = buildAnswerButtons(q.step, params.priorAnswers, q.answers, config);

  return {
    icon: iconUrlForStep(q.step, config),
    title: q.prompt, // question gets the prominent slot
    description: QUIZ_STEP_TITLES[q.step] ?? `Question ${q.step}`, // step indicator → subhead
    label: "answer",
    links: { actions: buttons },
  };
};

// Render the result step · archetype reveal + mint button.
//
// Element is RECOMPUTED server-side from validated answers (per HIGH-1 fix · client
// element supply is ignored). Caller passes derived element here.
//
// `answers` is threaded into the claim button URL so the mint POST route can
// recompute archetype + weather + quiz_state_hash from validated state. Without
// it, the mint route receives an empty URL and rejects with 400.
//
// `mac` is the validated HMAC the result endpoint received · re-attached to
// the claim URL so the mint route verifies the same canonical state without
// the result endpoint needing to re-sign.
export const renderQuizResult = (params: {
  archetype: Element;
  answers?: ReadonlyArray<0 | 1 | 2 | 3 | 4>;
  mac?: string;
  config?: RendererConfig;
}): ActionGetResponse => {
  const config = params.config ?? defaultConfig;
  const reveal =
    ARCHETYPE_REVEALS[params.archetype] ?? "Claim the stone that's been reading you back.";

  // Title-case the element name · "Wood" · "Fire" · etc · for the
  // identity-locating phrase. Title Case for CTAs throughout.
  const elementName = params.archetype.charAt(0) + params.archetype.slice(1).toLowerCase();

  // Build claim URL with answers + mac threaded as ?a1=...&a8=...&mac=... .
  // Mint route parses these to recompute archetype + quiz_state_hash AND
  // verify the HMAC over (step=9, answers).
  const claimParams = new URLSearchParams();
  if (params.answers) {
    params.answers.forEach((ans, i) => claimParams.set(`a${i + 1}`, String(ans)));
  }
  if (params.mac) {
    claimParams.set("mac", params.mac);
  }
  const claimQuery = claimParams.toString();
  const claimHref = `${config.baseUrl}/api/actions/mint/genesis-stone${claimQuery ? "?" + claimQuery : ""}`;

  return {
    icon: iconUrlForArchetype(params.archetype, config),
    title: `You are ${elementName}.`,
    description: reveal,
    label: "Claim Your Stone",
    links: {
      actions: [
        // SINGLE-DECISION moment (Eileen proof #3 · trust crossing).
        // Secondary "See Today's World" CTA was dropped 2026-05-11 per
        // R4 WEAVER+ROSENZU audit · the world-bridge lives AFTER the mint
        // via the POST response's links.next (mint route) · ritual first,
        // world second is the correct sequencing.
        {
          type: "transaction",
          label: "Claim Your Stone",
          href: claimHref,
        },
      ],
    },
  };
};

// Render the ambient `/api/actions/today` Blink · the on-ramp card that
// previews zerker's observatory and pulls users into the quiz.
//
// Vocabulary aligned with observatory canon (zerker's main branch):
//   - Surface name: "Observatory" (was "the world" · 40+ commits use observatory)
//   - KPI shape: "dominant element" + "stones claimed" (matches KpiStrip.tsx +
//     ActivityRail mint counter on origin/main · NOT a fabricated per-element
//     delta · prior `fireSurgeDelta` had no substrate referent)
//
// Title rhythm matches renderQuizResult (`"You are Wood."`) — title is a
// stable identity-locating phrase · description carries the live data subhead.
export const renderAmbient = (params: {
  todayElement: Element;
  mintCount: number;
  config?: RendererConfig;
}): ActionGetResponse => {
  const config = params.config ?? defaultConfig;

  // Title-case the dominant element · "Wood" · matches result-reveal convention.
  const elementName = params.todayElement.charAt(0) + params.todayElement.slice(1).toLowerCase();

  return {
    icon: iconUrlForArchetype(params.todayElement, config),
    // Cold-audience entry surface · question-as-hook (ARTISAN R2 Variant A).
    // Internal canon ("Observatory") moves to label; title carries the
    // user-shaped question that pulls cold scrollers in. KPI moves to
    // description as social proof rather than vocabulary lesson.
    title: "What Element Are You Today?",
    description: `${elementName} leads today · ${params.mintCount} have read themselves in. Take 90 seconds.`,
    label: "Observatory",
    links: {
      actions: [
        {
          // chain into the quiz · POST returns Q1 inline so user starts the quiz
          // without leaving the ambient card
          type: "post",
          label: "What's My Element?",
          href: `${config.baseUrl}/api/actions/quiz/start`,
        },
      ],
    },
  };
};

// Build answer buttons for a quiz step · count + selection driven by QUIZ_CONFIG.
//
// State encoded as URL query params: ?step=N&a1=...&aN-1=...&mac=...
// Each button signs an HMAC over (nextStep, priorAnswers + thisAnswer) so the
// receiving route can verify the URL state hasn't been tampered with. The
// "completed" state (final question's button) signs over (step=9, all 8
// answers) and routes the user to /result.
const buildAnswerButtons = (
  step: number,
  priorAnswers: ReadonlyArray<0 | 1 | 2 | 3 | 4>,
  answers: ReadonlyArray<{ label: string; element: Element }>,
  config: RendererConfig,
): LinkedAction[] => {
  // Apply selection strategy · slice corpus to QUIZ_CONFIG.buttonsPerStep
  const selected = selectAnswers(answers, step - 1);

  const buttonType = shouldButtonsPost() ? "post" : "external-link";

  return selected.map(({ originalIndex, answer }) => {
    const newAnswers = [...priorAnswers, originalIndex as 0 | 1 | 2 | 3 | 4];
    const nextStep = step + 1;
    const isCompletedNext = nextStep > QUIZ_CONFIG.totalSteps;

    // Final step → links go to /result with step=9 (completed sentinel) ·
    // earlier steps → /step with the next step number.
    const path = isCompletedNext ? "/api/actions/quiz/result" : "/api/actions/quiz/step";

    // The `step` field in the signed HMAC state is the NEXT step number ·
    // for completed (after Q8 answered) the canonical step is 9.
    const macStep = isCompletedNext ? QUIZ_COMPLETED_STEP : nextStep;
    const signed = signQuizState(
      { step: macStep, answers: newAnswers as ReadonlyArray<Answer> },
      config.hmacKey ? { key: config.hmacKey } : undefined,
    );

    const params = new URLSearchParams();
    if (!isCompletedNext) {
      params.set("step", String(nextStep));
    }
    newAnswers.forEach((ans, i) => params.set(`a${i + 1}`, String(ans)));
    params.set("mac", signed.mac);

    const queryString = params.toString();
    const href = `${config.baseUrl}${path}${queryString ? "?" + queryString : ""}`;

    return { type: buttonType, label: answer.label, href };
  });
};

// Validate that a rendered ActionGetResponse fits within BLINK_DESCRIPTOR limits.
// Useful in tests · NOT enforced at runtime (defensive · not coercive).
export const validateActionResponse = (
  response: ActionGetResponse,
): { valid: boolean; violations: string[] } => {
  const violations: string[] = [];

  if (response.title.length > BLINK_DESCRIPTOR.titleMaxChars) {
    violations.push(
      `title exceeds ${BLINK_DESCRIPTOR.titleMaxChars} chars: ${response.title.length}`,
    );
  }
  if (response.description.length > BLINK_DESCRIPTOR.descriptionMaxChars) {
    violations.push(
      `description exceeds ${BLINK_DESCRIPTOR.descriptionMaxChars} chars: ${response.description.length}`,
    );
  }
  const buttonCount = response.links?.actions.length ?? 0;
  if (buttonCount > BLINK_DESCRIPTOR.buttonsMax) {
    violations.push(`button count ${buttonCount} exceeds max ${BLINK_DESCRIPTOR.buttonsMax}`);
  }

  return { valid: violations.length === 0, violations };
};
