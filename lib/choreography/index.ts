/**
 * lib/choreography — substrate for card-to-map juice + game-text moments.
 *
 * Authored session 18 (2026-05-17) per operator direction toward STARDUST-
 * informed card-play choreography. Build doc:
 *   grimoires/loa/specs/enhance-card-to-map-choreography.md
 *
 * Modules:
 *   - spring       Mass/stiffness/damping solver for UI motion (NOT Bezier)
 *   - hitStop      Global frame-freeze on impact (combo-tier scaled duration)
 *   - trimPath     Dashed-line draw-in animation (AE Trim Paths-equivalent)
 *   - sequence     Keyframe stagger primitive + easing curves
 *   - typography   Taste-token table for big-text moments (HIT/COMBO/CHAIN/TIDE)
 *
 * All modules are framework-agnostic — they own TIMING and STATE math. The
 * consuming React/r3f components in app/battle-v2/_components/cardjuice/
 * drive these in useFrame loops and apply the resulting values to DOM/r3f.
 */

export * from "./spring";
export * from "./hitStop";
export * from "./trimPath";
export * from "./sequence";
export * from "./typography";
