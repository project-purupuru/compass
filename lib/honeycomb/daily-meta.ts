/**
 * Daily meta — what shifts in the world each day.
 *
 * The Wuxing rotates by date. Today is wood-day; tomorrow is fire-day.
 * The opponent element is deterministic from the same date seed but
 * uses a different phase so it's not always equal to weather.
 *
 * This is the substrate for "the meta moves with the world." Hackathon
 * version uses date-only seeding; production reads from the Five
 * Oracles (TREMOR / CORONA / BREATH).
 *
 * Pure module. No side effects, no I/O.
 */

import { CONDITIONS, type BattleCondition } from "./conditions";
import { ELEMENT_META, ELEMENT_ORDER, type Element } from "./wuxing";

export interface DailyMeta {
  /** YYYY-MM-DD in local time. */
  readonly dateKey: string;
  /** Today's weather element (Shichen rotation). */
  readonly weather: Element;
  /** The default opponent caretaker the world fields today. */
  readonly opponentElement: Element;
  /** Battle condition derived from opponent element. */
  readonly condition: BattleCondition;
  /** Combo bonus generators today: weather → generated element. */
  readonly favoredElement: Element;
  /** Short phrase suitable for an EntryScreen ticker. */
  readonly label: string;
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** Stable YYYY-MM-DD in the local timezone. */
function localDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Pick an opponent element from the same daily seed but with a +2 phase
 * so it doesn't match weather every day. */
function pickOpponent(dayIndex: number): Element {
  return ELEMENT_ORDER[(dayIndex + 2) % 5]!;
}

/** Pick the favored element — the one weather generates (Shēng). */
function pickFavored(weather: Element): Element {
  // Use the canonical SHENG lookup inline (avoid circular import).
  const SHENG: Record<Element, Element> = {
    wood: "fire",
    fire: "earth",
    earth: "metal",
    metal: "water",
    water: "wood",
  };
  return SHENG[weather];
}

/**
 * Compute the daily meta for a given date. Pure-given-date.
 */
export function getDailyMeta(date: Date = new Date()): DailyMeta {
  const dayIndex = Math.floor(date.getTime() / MS_PER_DAY) % 5;
  const weather = ELEMENT_ORDER[dayIndex]!;
  const opponentElement = pickOpponent(dayIndex);
  const condition = CONDITIONS[opponentElement];
  const favoredElement = pickFavored(weather);

  const label = `${ELEMENT_META[weather].kanji} weather · ${ELEMENT_META[opponentElement].caretaker}'s challenge · ${condition.name.toLowerCase()}`;

  return {
    dateKey: localDateKey(date),
    weather,
    opponentElement,
    condition,
    favoredElement,
    label,
  };
}

/** Same as getDailyMeta but for `date - n` days. n=1 returns yesterday. */
export function getDailyMetaOffset(daysBack: number, date: Date = new Date()): DailyMeta {
  return getDailyMeta(new Date(date.getTime() - daysBack * MS_PER_DAY));
}

/**
 * Did the world shift between yesterday and today? Returns the diff —
 * useful for "the tide turned overnight" UI hint.
 */
export interface DailyShift {
  readonly weatherChanged: boolean;
  readonly opponentChanged: boolean;
  readonly conditionChanged: boolean;
  readonly any: boolean;
}

export function getDailyShift(date: Date = new Date()): DailyShift {
  const today = getDailyMeta(date);
  const yesterday = getDailyMetaOffset(1, date);
  const weatherChanged = today.weather !== yesterday.weather;
  const opponentChanged = today.opponentElement !== yesterday.opponentElement;
  const conditionChanged = today.condition.id !== yesterday.condition.id;
  return {
    weatherChanged,
    opponentChanged,
    conditionChanged,
    any: weatherChanged || opponentChanged || conditionChanged,
  };
}
