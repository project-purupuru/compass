/**
 * dom-resolve — turns a screen point into a code-addressable DOM hint.
 *
 * This is the bridge that makes a fence "agentable": instead of "refine the
 * region at pixels 200-400", a fence carries `[data-zone-id="wood_grove"]` +
 * a component-name guess + the element's own bounds. An agent reading the
 * exported brief can address the actual component, not just a rectangle.
 */

export interface RectPct {
  /** All four values are 0..100, expressed as a percentage of the viewport. */
  readonly xPct: number;
  readonly yPct: number;
  readonly wPct: number;
  readonly hPct: number;
}

export interface FenceDomHint {
  /** Best-effort CSS selector for the resolved element. */
  readonly selector: string;
  readonly tag: string;
  readonly classes: readonly string[];
  readonly dataAttributes: Readonly<Record<string, string>>;
  /** Heuristic guess at the React component that owns this element. */
  readonly componentHint: string | null;
  /** The resolved element's own bounding box (viewport %). */
  readonly elementRect: RectPct | null;
}

/** Class-substring → component-name heuristics, checked in order. */
const CLASS_COMPONENT_HINTS: ReadonlyArray<readonly [substring: string, component: string]> = [
  ["zone-token", "ZoneToken"],
  ["world-map", "WorldMap"],
  ["card-hand", "CardHandFan"],
  ["card-face", "CardFace"],
  ["entity-panel", "EntityPanel"],
  ["tide-indicator", "TideIndicator"],
  ["sora-tower", "WorldMap · Sora Tower"],
  ["kaori-chibi", "WorldMap · Chibi Kaori"],
  ["vfx", "VfxLayer"],
  ["ui-screen", "UiScreen"],
  ["focus-banner", "BattleV2 · focusBanner"],
  ["title-cartouche", "BattleV2 · titleCartouche"],
  ["deck-counter", "BattleV2 · deckCounter"],
  ["end-turn", "BattleV2 · endTurnButton"],
  ["event-log", "BattleV2 · event log"],
];

function guessComponent(el: Element): string | null {
  if (el.hasAttribute("data-zone-id")) return "ZoneToken";
  const className = typeof el.className === "string" ? el.className : "";
  for (const [substring, component] of CLASS_COMPONENT_HINTS) {
    if (className.includes(substring)) return component;
  }
  return null;
}

function collectDataAttributes(el: Element): Record<string, string> {
  const out: Record<string, string> = {};
  for (const attr of Array.from(el.attributes)) {
    if (attr.name.startsWith("data-")) out[attr.name] = attr.value;
  }
  return out;
}

function buildSelector(el: Element): string {
  if (el.id) return `#${el.id}`;
  const zoneId = el.getAttribute("data-zone-id");
  if (zoneId) return `[data-zone-id="${zoneId}"]`;
  const element = el.getAttribute("data-element");
  const dataAttrEntry = Array.from(el.attributes).find(
    (a) => a.name.startsWith("data-") && a.name !== "data-element",
  );
  if (dataAttrEntry) return `[${dataAttrEntry.name}="${dataAttrEntry.value}"]`;
  if (element) return `${el.tagName.toLowerCase()}[data-element="${element}"]`;
  const firstClass =
    typeof el.className === "string" && el.className.trim()
      ? `.${el.className.trim().split(/\s+/)[0]}`
      : "";
  return `${el.tagName.toLowerCase()}${firstClass}`;
}

function rectToPct(rect: DOMRect): RectPct {
  const vw = window.innerWidth || 1;
  const vh = window.innerHeight || 1;
  return {
    xPct: (rect.left / vw) * 100,
    yPct: (rect.top / vh) * 100,
    wPct: (rect.width / vw) * 100,
    hPct: (rect.height / vh) * 100,
  };
}

/**
 * Walk up from `start` to the first element that carries meaningful identity
 * (a data-* attribute, an id, or a known component class). Falls back to the
 * start element if nothing better is found within `maxDepth` hops.
 */
function findMeaningfulAncestor(start: Element, maxDepth = 6): Element {
  let cur: Element | null = start;
  let depth = 0;
  while (cur && depth < maxDepth) {
    const hasData = Array.from(cur.attributes).some((a) => a.name.startsWith("data-"));
    if (hasData || cur.id || guessComponent(cur)) return cur;
    cur = cur.parentElement;
    depth += 1;
  }
  return start;
}

/**
 * Resolve the element under a viewport point, ignoring anything inside the
 * fence-layer overlay itself. Returns null if the point hits only the overlay
 * or empty space.
 */
export function resolveDomHint(clientX: number, clientY: number): FenceDomHint | null {
  if (typeof document === "undefined") return null;
  const stack = document.elementsFromPoint(clientX, clientY);
  const underlying = stack.find((el) => !el.closest("[data-fence-layer]"));
  if (!underlying) return null;

  const target = findMeaningfulAncestor(underlying);
  return {
    selector: buildSelector(target),
    tag: target.tagName.toLowerCase(),
    classes:
      typeof target.className === "string" && target.className.trim()
        ? target.className.trim().split(/\s+/)
        : [],
    dataAttributes: collectDataAttributes(target),
    componentHint: guessComponent(target),
    elementRect: rectToPct(target.getBoundingClientRect()),
  };
}

/** Human-readable region label, e.g. "top-left", "center", "bottom-right". */
export function describeRegion(rect: RectPct): string {
  const cx = rect.xPct + rect.wPct / 2;
  const cy = rect.yPct + rect.hPct / 2;
  const h = cx < 38 ? "left" : cx > 62 ? "right" : "center";
  const v = cy < 38 ? "top" : cy > 62 ? "bottom" : "middle";
  if (h === "center" && v === "middle") return "center";
  return `${v}-${h}`;
}
