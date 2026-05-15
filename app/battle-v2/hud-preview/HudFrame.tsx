/**
 * HudFrame — the 6-zone embedded-HUD layout study.
 *
 * Each zone is labelled with its source fence (F2/F4/F6/F8/F10/F12 from the
 * 2026-05-14 operator brief) so the mock reads as a zone map, not a finished
 * screen. Content is representative placeholder — the point is composition,
 * material, and the diegesis gradient, not the live data.
 *
 * Styled in battle-v2's own token vocabulary (warm chrome, element tints,
 * OKLCH wuxing palette) so the layout reads as native, not bolted-on.
 */

const ELEMENTS = [
  { id: "wood", kanji: "木", label: "wood", active: true },
  { id: "fire", kanji: "火", label: "fire", active: false },
  { id: "earth", kanji: "土", label: "earth", active: false },
  { id: "metal", kanji: "金", label: "metal", active: false },
  { id: "water", kanji: "水", label: "water", active: false },
] as const;

const HAND_CARDS = [
  { kanji: "木", name: "Wood Awakening", type: "ritual" },
  { kanji: "木", name: "Grove Tending", type: "action" },
  { kanji: "木", name: "Quiet Root", type: "support" },
  { kanji: "木", name: "First Sprout", type: "ritual" },
] as const;

function ZoneLabel({ fence, name }: { readonly fence: string; readonly name: string }) {
  return (
    <span className="hp-zone__label">
      <em className="hp-zone__fence">{fence}</em>
      {name}
    </span>
  );
}

export function HudFrame() {
  return (
    <div className="hp-root">
      <div className="hp-watermark">HUD ZONE-MAP · LAYOUT PREVIEW · not wired to game state</div>

      {/* ── center: the world ──────────────────────────────────── */}
      <div className="hp-world">
        <div className="hp-world__note">
          <span className="hp-world__glyph">塔</span>
          THE WORLD
          <small>the live 3D diorama renders here — see /battle-v2</small>
        </div>
      </div>

      {/* ── F2 · Ribbon (top HUD) ──────────────────────────────── */}
      <header className="hp-zone hp-ribbon">
        <ZoneLabel fence="F2" name="RIBBON · player + stats" />
        <div className="hp-ribbon__row">
          <div className="hp-crest" aria-hidden>
            <span className="hp-crest__glyph">花</span>
          </div>
          <div className="hp-ribbon__id">
            <strong>Operator</strong>
            <small>caretaker of the grove</small>
          </div>
          <div className="hp-ribbon__chips">
            <span className="hp-chip">⚡ 3 energy</span>
            <span className="hp-chip hp-chip--wood">木 wood tide</span>
            <span className="hp-chip">turn 1</span>
          </div>
        </div>
      </header>

      {/* ── F6 · Stones column (saved elements) ────────────────── */}
      <aside className="hp-zone hp-stones">
        <ZoneLabel fence="F6" name="SAVED ELEMENTS" />
        <div className="hp-stones__column">
          {ELEMENTS.map((el) => (
            <div
              key={el.id}
              className={`hp-stone hp-stone--${el.id}${el.active ? " is-active" : ""}`}
              title={el.active ? `${el.label} — active tide` : el.label}
            >
              <span className="hp-stone__kanji">{el.kanji}</span>
            </div>
          ))}
        </div>
      </aside>

      {/* ── F4 · Hovercard rail (world focus) ──────────────────── */}
      <aside className="hp-zone hp-rail">
        <ZoneLabel fence="F4" name="WORLD FOCUS" />
        <p className="hp-rail__intent">
          diegetic — what the world is showing you. hovered creatures, zones,
          element density.
        </p>
        <div className="hp-rail__card">
          <span className="hp-rail__card-icon">🐗</span>
          <div>
            <strong>Boar ×3</strong>
            <small>drawn toward the grove</small>
          </div>
        </div>
        <div className="hp-rail__card">
          <span className="hp-rail__card-icon">🌳</span>
          <div>
            <strong>Elder Grove · lv 2</strong>
            <small>4 wood gathered here</small>
          </div>
        </div>
        <div className="hp-rail__card hp-rail__card--muted">
          <span className="hp-rail__card-icon">🐦</span>
          <div>
            <strong>Sora finch</strong>
            <small>passing through</small>
          </div>
        </div>
      </aside>

      {/* ── F8 · Bottom bar (back plate) ───────────────────────── */}
      <div className="hp-zone hp-bottombar">
        <ZoneLabel fence="F8" name="BACK PLATE — the card shelf" />
        <div className="hp-bottombar__ornament" aria-hidden>
          ❧ ⸻ ❧ ⸻ ❧ ⸻ ❧ ⸻ ❧ ⸻ ❧ ⸻ ❧
        </div>
      </div>

      {/* ── F12 · Caretaker (trainer + companion) ──────────────── */}
      <aside className="hp-zone hp-caretaker">
        <ZoneLabel fence="F12" name="CARETAKER + COMPANION" />
        <div className="hp-caretaker__pair">
          <div className="hp-portrait hp-portrait--trainer">
            <span>Caretaker</span>
            <small>the trainer</small>
          </div>
          <div className="hp-portrait hp-portrait--companion">
            <span>Puruhani</span>
            <small>the companion</small>
          </div>
        </div>
        <div className="hp-caretaker__bubble">
          “The grove stirs. Plant with intent — the world is listening.”
        </div>
      </aside>

      {/* ── F10 · Cards zone (the hand) ────────────────────────── */}
      <div className="hp-zone hp-cards">
        <ZoneLabel fence="F10" name="HAND — cards in a row" />
        <div className="hp-cards__row">
          {HAND_CARDS.map((c, i) => (
            <div key={i} className="hp-card">
              <span className="hp-card__kanji">{c.kanji}</span>
              <span className="hp-card__name">{c.name}</span>
              <span className="hp-card__type">{c.type}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
