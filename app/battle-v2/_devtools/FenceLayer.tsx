/**
 * FenceLayer — the dev overlay for fencing + annotating battle-v2 regions.
 *
 * Workflow: open with `?fence=1` (or ⌥F), drag a box over any region, label it
 * and write a refinement note. Each fence resolves the DOM beneath its centre
 * (see dom-resolve.ts), so "Copy brief" produces an agent-ready markdown
 * payload that names the actual component, not just pixels.
 *
 * Isolation contract: this overlay never participates in the game flow. When
 * `?fence=1` is absent it is never mounted (see FenceLayerMount). When mounted
 * but inactive it is a single launcher button. The root carries
 * `pointer-events: none`; only the toolbar, draw surface, fence tags, and
 * editor opt back in — so the game underneath stays fully interactive.
 */

"use client";

import {
  useCallback,
  useEffect,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";

import { resolveDomHint, type RectPct } from "./dom-resolve";
import { downloadText, toAgentBrief, toJSON } from "./fence-export";
import "./fences.css";
import { matchMedia } from "./media-match";
import { DUPLICATE_IOU, iou } from "./rect-utils";
import { useFences, type Fence } from "./useFences";

type Mode = "draw" | "select";
type CssVars = CSSProperties & Record<`--${string}`, string | number>;

interface DragState {
  readonly startX: number;
  readonly startY: number;
  readonly curX: number;
  readonly curY: number;
}

function pxRectToPct(d: DragState): RectPct {
  const vw = window.innerWidth || 1;
  const vh = window.innerHeight || 1;
  const x = Math.min(d.startX, d.curX);
  const y = Math.min(d.startY, d.curY);
  const w = Math.abs(d.curX - d.startX);
  const h = Math.abs(d.curY - d.startY);
  return { xPct: (x / vw) * 100, yPct: (y / vh) * 100, wPct: (w / vw) * 100, hPct: (h / vh) * 100 };
}

export function FenceLayer() {
  const { fences, addFence, updateFence, deleteFence, clearAll, dedupeFences } = useFences();
  const [active, setActive] = useState(false);
  const [mode, setMode] = useState<Mode>("draw");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === "f" || e.key === "F")) {
        e.preventDefault();
        setActive((a) => !a);
      } else if (e.key === "Escape") {
        setSelectedId(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (mode !== "draw") return;
      e.currentTarget.setPointerCapture(e.pointerId);
      setDrag({ startX: e.clientX, startY: e.clientY, curX: e.clientX, curY: e.clientY });
    },
    [mode],
  );

  const onPointerMove = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    setDrag((d) => (d ? { ...d, curX: e.clientX, curY: e.clientY } : d));
  }, []);

  const onPointerUp = useCallback(() => {
    setDrag((d) => {
      if (!d) return null;
      const rect = pxRectToPct(d);
      if (rect.wPct >= 2 && rect.hPct >= 2) {
        // Drew over a region that's already fenced? Select it — don't double up.
        const existing = fences.find((f) => iou(f.rect, rect) > DUPLICATE_IOU);
        if (existing) {
          setSelectedId(existing.id);
          setMode("select");
          return null;
        }
        const cx = (d.startX + d.curX) / 2;
        const cy = (d.startY + d.curY) / 2;
        const dom = resolveDomHint(cx, cy);
        const id = addFence(rect, dom);
        setSelectedId(id);
        setMode("select");
      }
      return null;
    });
  }, [addFence, fences]);

  const handleCopy = useCallback(async () => {
    const brief = toAgentBrief(fences);
    try {
      await navigator.clipboard.writeText(brief);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      downloadText("battle-v2-fences.md", brief, "text/markdown");
    }
  }, [fences]);

  const handleExport = useCallback(() => {
    downloadText("battle-v2-fences.json", toJSON(fences), "application/json");
  }, [fences]);

  if (!active) {
    return (
      <div data-fence-layer className="fnc-root">
        <button type="button" className="fnc-launcher" onClick={() => setActive(true)}>
          ⊹ fences ({fences.length}) · ⌥F
        </button>
      </div>
    );
  }

  const selected = fences.find((f) => f.id === selectedId) ?? null;
  const dragPreview = drag ? pxRectToPct(drag) : null;

  return (
    <div data-fence-layer className="fnc-root fnc-root--active">
      <div className="fnc-toolbar">
        <span className="fnc-toolbar__title">⊹ FENCE</span>
        <div className="fnc-seg">
          <button
            type="button"
            className={`fnc-seg__btn ${mode === "draw" ? "is-on" : ""}`}
            onClick={() => setMode("draw")}
          >
            draw
          </button>
          <button
            type="button"
            className={`fnc-seg__btn ${mode === "select" ? "is-on" : ""}`}
            onClick={() => setMode("select")}
          >
            select
          </button>
        </div>
        <span className="fnc-toolbar__count">
          {fences.length} region{fences.length === 1 ? "" : "s"}
        </span>
        <button type="button" className="fnc-btn" onClick={handleCopy}>
          {copied ? "copied ✓" : "copy brief"}
        </button>
        <button type="button" className="fnc-btn" onClick={handleExport}>
          export json
        </button>
        <button
          type="button"
          className="fnc-btn"
          onClick={() => {
            const removed = dedupeFences();
            if (removed > 0) setSelectedId(null);
          }}
          title="Collapse fences that cover the same region"
        >
          dedupe
        </button>
        <button
          type="button"
          className="fnc-btn fnc-btn--warn"
          onClick={() => {
            clearAll();
            setSelectedId(null);
          }}
        >
          clear
        </button>
        <button
          type="button"
          className="fnc-btn fnc-btn--close"
          onClick={() => setActive(false)}
          aria-label="Close fence tool"
        >
          ×
        </button>
      </div>

      {mode === "draw" && (
        <div
          className="fnc-draw-surface"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          {dragPreview && (
            <div
              className="fnc-drag-preview"
              style={{
                left: `${dragPreview.xPct}%`,
                top: `${dragPreview.yPct}%`,
                width: `${dragPreview.wPct}%`,
                height: `${dragPreview.hPct}%`,
              }}
            />
          )}
        </div>
      )}

      {fences.length === 0 && mode === "draw" && !drag && (
        <div className="fnc-empty-hint">drag a box over any region to fence it</div>
      )}

      {fences.map((f, i) => {
        const isSel = f.id === selectedId;
        const boxStyle: CssVars = {
          left: `${f.rect.xPct}%`,
          top: `${f.rect.yPct}%`,
          width: `${f.rect.wPct}%`,
          height: `${f.rect.hPct}%`,
          "--fnc-hue": (i * 47) % 360,
        };
        return (
          <div key={f.id} className={`fnc-box ${isSel ? "is-selected" : ""}`} style={boxStyle}>
            <button
              type="button"
              className="fnc-box__tag"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedId(f.id);
                setMode("select");
              }}
            >
              {i + 1}. {f.label.trim() || "(unlabelled)"}
              {f.dom?.componentHint ? (
                <em className="fnc-box__hint"> · {f.dom.componentHint}</em>
              ) : null}
            </button>
          </div>
        );
      })}

      {selected && (
        <FenceEditor
          key={selected.id}
          fence={selected}
          onChange={(patch) => updateFence(selected.id, patch)}
          onDelete={() => {
            deleteFence(selected.id);
            setSelectedId(null);
          }}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}

interface FenceEditorProps {
  readonly fence: Fence;
  readonly onChange: (patch: Partial<Pick<Fence, "label" | "note">>) => void;
  readonly onDelete: () => void;
  readonly onClose: () => void;
}

function FenceEditor({ fence, onChange, onDelete, onClose }: FenceEditorProps) {
  const media = matchMedia(fence.dom);
  const inCompass = media.entries.filter((m) => m.inCompass);
  const needsCopy = media.entries.filter((m) => !m.inCompass);
  const below = fence.rect.yPct + fence.rect.hPct < 58;
  const style: CSSProperties = {
    left: `${Math.min(Math.max(fence.rect.xPct, 2), 68)}%`,
    ...(below
      ? { top: `${fence.rect.yPct + fence.rect.hPct + 1}%` }
      : { bottom: `${100 - fence.rect.yPct + 1}%` }),
  };

  return (
    <div className="fnc-editor" style={style}>
      <div className="fnc-editor__head">
        <input
          className="fnc-editor__label"
          placeholder="label this region…"
          value={fence.label}
          autoFocus
          onChange={(e) => onChange({ label: e.target.value })}
        />
        <button
          type="button"
          className="fnc-btn fnc-btn--close"
          onClick={onClose}
          aria-label="Close editor"
        >
          ×
        </button>
      </div>
      <textarea
        className="fnc-editor__note"
        placeholder="what should an agent refine here?"
        value={fence.note}
        rows={3}
        onChange={(e) => onChange({ note: e.target.value })}
      />
      {fence.dom && (
        <div className="fnc-editor__dom">
          <code>{fence.dom.selector}</code>
          {fence.dom.componentHint && (
            <span className="fnc-editor__cmp">{fence.dom.componentHint}</span>
          )}
        </div>
      )}
      {media.entries.length > 0 && (
        <div className="fnc-editor__media">
          <span className="fnc-editor__media-head">
            media for this region · {media.entries.length}
            {media.element ? ` · ${media.element}` : ""}
          </span>
          {inCompass.length > 0 && (
            <div className="fnc-media-strip">
              {inCompass.slice(0, 8).map((m) => (
                <img
                  key={m.id}
                  className="fnc-media-thumb"
                  src={m.publicUrl ?? ""}
                  alt={m.id}
                  title={`${m.id} · ${m.category}`}
                  loading="lazy"
                />
              ))}
            </div>
          )}
          {needsCopy.length > 0 && (
            <span className="fnc-media-more">
              + {needsCopy.length} in world-purupuru (needs copy) — see brief
            </span>
          )}
        </div>
      )}
      <button
        type="button"
        className="fnc-btn fnc-btn--warn fnc-editor__delete"
        onClick={onDelete}
      >
        delete fence
      </button>
    </div>
  );
}
