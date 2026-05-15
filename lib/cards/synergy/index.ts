/**
 * Synergy System — barrel. Gumi's canonical combo engine, ported from the
 * game repo. Element relationships (Wuxing) + the 4 position-driven synergies.
 */

export {
  ELEMENT_ORDER,
  KE,
  SHENG,
  getInteraction,
  getKeCounter,
  getShengSource,
  type Element,
  type ElementInteraction,
  type InteractionType,
} from "./wuxing";

export {
  detectCombos,
  getPositionMultiplier,
  type Combo,
  type ComboCard,
  type ComboCardType,
} from "./combos";
