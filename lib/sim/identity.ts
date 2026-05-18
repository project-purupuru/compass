/**
 * Deterministic puruhani identity generator.
 *
 * `identityFor(seedIndex, primaryElement)` returns a stable identity
 * (username + displayName + archetype + avatar seed) for any non-zero
 * integer index. Same seed → same identity, every call.
 *
 * The seed convention matches lib/sim/entities.ts: sprite at index `i`
 * uses seed `i + 1`. The activity stream uses the same convention so
 * `wallet → identity` round-trips without storing a map.
 */

import type { Element, Wallet } from "@/lib/score";
import type { AvatarSeed, HenloArchetype, PuruhaniIdentity } from "./types";
import { syntheticAddress } from "./entities";

export const ARCHETYPE_FOR_ELEMENT: Record<Element, HenloArchetype> = {
  wood: "hopeful",
  earth: "empty",
  fire: "naughty",
  metal: "loyal",
  water: "overstimulated",
};

const NAMES: readonly string[] = [
  "Kaori",
  "Akane",
  "Ren",
  "Ruan",
  "Nemu",
  "Hana",
  "Yumi",
  "Sora",
  "Aki",
  "Mei",
  "Yuki",
  "Haru",
  "Kaze",
  "Iko",
  "Nori",
  "Jun",
  "Tako",
  "Mochi",
  "Honi",
  "Komi",
  "Suki",
  "Maki",
  "Riku",
  "Tora",
  "Niko",
  "Kumo",
  "Hoshi",
  "Tsuki",
  "Kiri",
  "Ame",
];

const ELEMENT_WORDS: Record<Element, readonly string[]> = {
  wood: ["leaf", "sprout", "fern", "moss", "bark"],
  fire: ["ember", "cinder", "ash", "blaze", "kindle"],
  earth: ["clay", "loam", "stone", "dust", "hearth"],
  metal: ["shine", "blade", "frost", "silver", "alloy"],
  water: ["tide", "mist", "rain", "drop", "river"],
};

const EPITHETS: Record<Element, readonly string[]> = {
  wood: ["the Hopeful", "of Sprouts", "the Patient", "of Pines"],
  earth: ["the Quiet", "of Hearth", "the Empty", "of Soil"],
  fire: ["the Bold", "of Embers", "the Wild", "the Bright"],
  metal: ["the Loyal", "of Frost", "the Sharp", "of Silver"],
  water: ["of Tides", "the Deep", "of Rain", "the Dreaming"],
};

const ARCHETYPE_PREFIX: Record<HenloArchetype, string> = {
  hopeful: "Hopeful",
  empty: "Drifting",
  naughty: "Naughty",
  loyal: "Loyal",
  overstimulated: "Wandering",
};

// Independent multiplicative-hash pickers — all derived from the same
// seed but with different large primes, so each "axis" of the identity
// (name, suffix-style, etc.) varies independently.
function pickN(seed: number, prime: number, n: number): number {
  return ((Math.abs(seed) * prime) >>> 0) % n;
}

function toUsername(displayName: string): string {
  return displayName
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_.]/g, "");
}

interface NameStyleOut {
  displayName: string;
  username: string;
}

function buildName(seed: number, primary: Element, archetype: HenloArchetype): NameStyleOut {
  const baseName = NAMES[pickN(seed, 2654435761, NAMES.length)];
  const styleIdx = pickN(seed, 1597334677, 100);

  // 5 patterns, weighted: bare 30% / numbered 30% / dotted 18% / epithet 12% / archetype 10%
  let displayName: string;
  let username: string;

  if (styleIdx < 30) {
    displayName = baseName;
    username = toUsername(baseName);
  } else if (styleIdx < 60) {
    const num = (pickN(seed, 3266489917, 89) + 10).toString(); // 10..98
    displayName = `${baseName}_${num}`;
    username = `${baseName.toLowerCase()}_${num}`;
  } else if (styleIdx < 78) {
    const word = ELEMENT_WORDS[primary][pickN(seed, 374761393, ELEMENT_WORDS[primary].length)];
    displayName = `${baseName}.${word}`;
    username = `${baseName.toLowerCase()}.${word}`;
  } else if (styleIdx < 90) {
    const epithet = EPITHETS[primary][pickN(seed, 668265263, EPITHETS[primary].length)];
    displayName = `${baseName} ${epithet}`;
    username = toUsername(displayName);
  } else {
    const prefix = ARCHETYPE_PREFIX[archetype];
    displayName = `${prefix} ${baseName}`;
    username = toUsername(displayName);
  }

  return { displayName, username };
}

function buildAvatarSeed(seed: number, archetype: HenloArchetype): AvatarSeed {
  // Default uniform picks
  let mouthKind = pickN(seed, 715225739, 5) as 0 | 1 | 2 | 3 | 4;
  let browTilt: -1 | 0 | 1 = ([-1, 0, 1] as const)[pickN(seed, 1131718501, 3)];
  const eyeKind = pickN(seed, 1815976943, 5) as 0 | 1 | 2 | 3 | 4;
  const dropletPos = pickN(seed, 2147483587, 4) as 0 | 1 | 2 | 3;
  const bodyTilt = pickN(seed, 433494437, 17) - 8; // -8..+8

  // Archetype bias (~70% of identities express their archetype face)
  const expressArchetype = pickN(seed, 982451653, 10) < 7;
  if (expressArchetype) {
    switch (archetype) {
      case "hopeful":
        mouthKind = 0; // smile
        browTilt = 1;
        break;
      case "empty":
        mouthKind = (pickN(seed, 982451653, 2) + 1) as 1 | 2; // neutral or wavy
        browTilt = 0;
        break;
      case "naughty":
        mouthKind = (pickN(seed, 287739693, 2) === 0 ? 2 : 3) as 2 | 3; // wavy or surprised
        browTilt = -1;
        break;
      case "loyal":
        mouthKind = (pickN(seed, 314159269, 2) === 0 ? 0 : 1) as 0 | 1; // smile or neutral
        browTilt = 0;
        break;
      case "overstimulated":
        mouthKind = (pickN(seed, 271828183, 2) === 0 ? 3 : 4) as 3 | 4; // surprised or drool
        browTilt = 1;
        break;
    }
  }

  return { eyeKind, mouthKind, browTilt, dropletPos, bodyTilt };
}

export function identityFor(seedIndex: number, primary: Element): PuruhaniIdentity {
  const trader: Wallet = syntheticAddress(seedIndex);
  const archetype = ARCHETYPE_FOR_ELEMENT[primary];
  const { displayName, username } = buildName(seedIndex, primary, archetype);
  const pfp = buildAvatarSeed(seedIndex, archetype);
  return { trader, username, displayName, archetype, pfp };
}
