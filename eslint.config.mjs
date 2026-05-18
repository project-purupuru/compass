import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import noUnregisteredMutation from "./eslint-rules/no-unregistered-mutation.mjs";

// ─── Registry doctrine enforcement ─────────────────────────────────
// See grimoires/loa/proposals/registry-doctrine-2026-05-12.md
const registryDoctrineRules = {
  files: ["**/*.{ts,tsx,js,jsx,mjs}"],
  plugins: {
    purupuru: {
      rules: {
        "no-unregistered-mutation": noUnregisteredMutation,
      },
    },
  },
  rules: {
    "purupuru/no-unregistered-mutation": [
      "error",
      {
        forbiddenIdentifiers: [
          // activity stream (refactored to MutationGuard 2026-05-12)
          "extras",
          // VFX scheduler internal active list
          "active",
        ],
        // The registry's own files are allowed to mutate their closure-captured state
        allowedFiles: [
          "lib/registry/",
          "lib/activity/index.ts",
          "lib/vfx/scheduler.ts",
          "lib/audio/engine.ts",
          "lib/camera/parallax-engine.ts",
        ],
      },
    ],
  },
};

// ─── Substrate-purity boundary enforcement (S2-T7 · per SDD HIGH-1) ────
//
// peripheral-events is the L2 sealed substrate · MUST stay framework-pure.
// If it imports from next/react/@solana/* or any UI/framework code, the
// "substrate is reusable across mediums" promise breaks (the same Effect
// Schemas + canonical eventId hash + ClaimMessage encoder must work
// identically in a Next.js app, a CLI tool, an Edge function, or a Vite
// frontend · contaminating it with platform-specific imports forces every
// downstream consumer to ship those deps too).
//
// medium-blink composes substrate + voice into Blink-shaped responses.
// It MUST NOT bypass the API/world-event boundary by reading directly
// from world-sources · all data has to flow substrate → world-event →
// medium · this is the cmp-boundary the architecture rests on.
const substrateBoundaryRules = {
  files: ["packages/peripheral-events/**/*.{ts,tsx}"],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: ["next", "next/*", "next/**"],
            message:
              "Substrate purity (S2-T7 · SDD HIGH-1): peripheral-events MUST NOT import from next/* · same Effect Schemas must work cross-platform.",
          },
          {
            group: ["react", "react-dom", "react/*", "react-dom/*"],
            message:
              "Substrate purity (S2-T7 · SDD HIGH-1): peripheral-events MUST NOT import from react/* · substrate is framework-agnostic.",
          },
          {
            group: ["@solana/*"],
            message:
              "Substrate purity (S2-T7 · SDD HIGH-1): peripheral-events MUST NOT import from @solana/* · substrate is chain-agnostic at the type level (bs58 + tweetnacl are allowed primitives, but @solana/web3.js is platform-coupled).",
          },
          {
            group: ["@metaplex-foundation/*"],
            message:
              "Substrate purity (S2-T7 · SDD HIGH-1): peripheral-events MUST NOT import from @metaplex-foundation/* · substrate must compile without Solana SDKs.",
          },
        ],
      },
    ],
  },
};

const mediumBlinkBoundaryRules = {
  files: ["packages/medium-blink/**/*.{ts,tsx}"],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: [
              "@purupuru/world-sources",
              "@purupuru/world-sources/*",
              "../world-sources",
              "../world-sources/**",
              "../../world-sources",
              "../../world-sources/**",
            ],
            message:
              "cmp-boundary (S2-T7 · SDD HIGH-1): medium-blink MUST NOT reach into world-sources directly · imports go through @purupuru/peripheral-events (the WorldEvent boundary).",
          },
        ],
      },
    ],
  },
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Loa framework System Zone — never edit, never lint.
    ".claude/**",
    // evals/ holds intentional bug fixtures for Loa eval suite ·
    // require()-style imports + unused vars are part of the fixture design.
    "evals/**",
  ]),
  substrateBoundaryRules,
  mediumBlinkBoundaryRules,
  registryDoctrineRules,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
]);

export default eslintConfig;
