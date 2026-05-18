/**
 * Puruhani avatar — procedural honey-blob with personality.
 *
 * Single source of truth for both the React rail (SVG) and the Pixi
 * canvas (rasterized texture). Body is a slightly-squished honey blob
 * tinted by primary element, with seeded eyes + mouth + brow + droplet.
 *
 * Color reads: SVG uses CSS vars (theme-tracking); canvas uses hex
 * literals (canvas does not resolve CSS vars).
 */

import type { Element } from "@/lib/score";
import type { AvatarSeed } from "./types";

// Hex equivalents of --puru-{element}-vivid (OKLCH brand spec).
// Used by canvas/Pixi only; SVG path uses var(--puru-{element}-vivid).
const ELEMENT_VIVID_HEX: Record<Element, string> = {
  wood: "#B8C940",
  fire: "#D14A3A",
  earth: "#DCB245",
  water: "#3A4EC5",
  metal: "#7E5CA7",
};

const HONEY_HEX = "#D4AD42"; // ~--puru-honey-base
const INK_HEX = "rgba(28, 22, 36, 0.78)"; // soft ink for face features
const HIGHLIGHT_HEX = "rgba(255, 255, 255, 0.20)";

// Geometry in 64-unit viewport (drawing coordinates) — both SVG & canvas
// scale up/down from this baseline.
const VB = 64;
const CX = VB / 2;
const CY = VB / 2 + 1; // body sits 1px below center for "weight"
const RX = 26; // body half-width
const RY = 24; // body half-height (squished)

interface FacePos {
  leftEye: { x: number; y: number };
  rightEye: { x: number; y: number };
  mouth: { x: number; y: number };
}

const FACE: FacePos = {
  leftEye: { x: CX - 7, y: CY - 3 },
  rightEye: { x: CX + 7, y: CY - 3 },
  mouth: { x: CX, y: CY + 6 },
};

function dropletXY(kind: number): { x: number; y: number } {
  // tr / br / bl / tl corners of the body, just outside the blob
  switch (kind & 3) {
    case 0:
      return { x: CX + 18, y: CY - 14 }; // top-right
    case 1:
      return { x: CX + 16, y: CY + 16 }; // bottom-right
    case 2:
      return { x: CX - 18, y: CY + 14 }; // bottom-left
    default:
      return { x: CX - 16, y: CY - 16 }; // top-left
  }
}

// ─── SVG path builders (return inline path-data fragments) ───────────────────

function eyesSVG(kind: number, tilt: number): string {
  const { leftEye: L, rightEye: R } = FACE;
  switch (kind & 7) {
    case 0: // open round
      return (
        `<circle cx="${L.x}" cy="${L.y}" r="2.2" fill="${INK_HEX}"/>` +
        `<circle cx="${R.x}" cy="${R.y}" r="2.2" fill="${INK_HEX}"/>`
      );
    case 1: // narrow happy ⌣ (upward arcs)
      return (
        `<path d="M ${L.x - 2.5} ${L.y + 1} Q ${L.x} ${L.y - 2} ${L.x + 2.5} ${L.y + 1}" stroke="${INK_HEX}" stroke-width="1.6" stroke-linecap="round" fill="none"/>` +
        `<path d="M ${R.x - 2.5} ${R.y + 1} Q ${R.x} ${R.y - 2} ${R.x + 2.5} ${R.y + 1}" stroke="${INK_HEX}" stroke-width="1.6" stroke-linecap="round" fill="none"/>`
      );
    case 2: // sleepy (lines + tiny dots)
      return (
        `<line x1="${L.x - 2.5}" y1="${L.y}" x2="${L.x + 2.5}" y2="${L.y}" stroke="${INK_HEX}" stroke-width="1.4" stroke-linecap="round"/>` +
        `<line x1="${R.x - 2.5}" y1="${R.y}" x2="${R.x + 2.5}" y2="${R.y}" stroke="${INK_HEX}" stroke-width="1.4" stroke-linecap="round"/>`
      );
    case 3: // surprised
      return (
        `<circle cx="${L.x}" cy="${L.y}" r="2.8" fill="none" stroke="${INK_HEX}" stroke-width="1.2"/>` +
        `<circle cx="${L.x}" cy="${L.y}" r="1.2" fill="${INK_HEX}"/>` +
        `<circle cx="${R.x}" cy="${R.y}" r="2.8" fill="none" stroke="${INK_HEX}" stroke-width="1.2"/>` +
        `<circle cx="${R.x}" cy="${R.y}" r="1.2" fill="${INK_HEX}"/>`
      );
    default: {
      // half-closed (downward arcs)
      void tilt;
      return (
        `<path d="M ${L.x - 2.5} ${L.y - 1} Q ${L.x} ${L.y + 1.5} ${L.x + 2.5} ${L.y - 1}" stroke="${INK_HEX}" stroke-width="1.6" stroke-linecap="round" fill="none"/>` +
        `<path d="M ${R.x - 2.5} ${R.y - 1} Q ${R.x} ${R.y + 1.5} ${R.x + 2.5} ${R.y - 1}" stroke="${INK_HEX}" stroke-width="1.6" stroke-linecap="round" fill="none"/>`
      );
    }
  }
}

function mouthSVG(kind: number): string {
  const { mouth: M } = FACE;
  switch (kind & 7) {
    case 0: // smile (downward arc)
      return `<path d="M ${M.x - 4} ${M.y - 1} Q ${M.x} ${M.y + 3} ${M.x + 4} ${M.y - 1}" stroke="${INK_HEX}" stroke-width="1.5" stroke-linecap="round" fill="none"/>`;
    case 1: // neutral
      return `<line x1="${M.x - 3}" y1="${M.y}" x2="${M.x + 3}" y2="${M.y}" stroke="${INK_HEX}" stroke-width="1.5" stroke-linecap="round"/>`;
    case 2: // wavy
      return `<path d="M ${M.x - 4} ${M.y} Q ${M.x - 2} ${M.y - 2} ${M.x} ${M.y} T ${M.x + 4} ${M.y}" stroke="${INK_HEX}" stroke-width="1.4" stroke-linecap="round" fill="none"/>`;
    case 3: // surprised o
      return `<ellipse cx="${M.x}" cy="${M.y + 0.5}" rx="2" ry="2.4" fill="${INK_HEX}"/>`;
    default: // drool / open
      return (
        `<path d="M ${M.x - 3.5} ${M.y} Q ${M.x} ${M.y + 3} ${M.x + 3.5} ${M.y}" stroke="${INK_HEX}" stroke-width="1.5" stroke-linecap="round" fill="none"/>` +
        `<circle cx="${M.x + 3}" cy="${M.y + 4.5}" r="1.2" fill="${HONEY_HEX}"/>`
      );
  }
}

function browSVG(tilt: -1 | 0 | 1): string {
  if (tilt === 0) return "";
  const { leftEye: L, rightEye: R } = FACE;
  const dy = tilt > 0 ? -1.5 : 1.2; // hopeful: up | naughty: down
  return (
    `<line x1="${L.x - 3}" y1="${L.y - 5 + dy}" x2="${L.x + 2}" y2="${L.y - 5 - dy}" stroke="${INK_HEX}" stroke-width="1.3" stroke-linecap="round"/>` +
    `<line x1="${R.x - 2}" y1="${R.y - 5 - dy}" x2="${R.x + 3}" y2="${R.y - 5 + dy}" stroke="${INK_HEX}" stroke-width="1.3" stroke-linecap="round"/>`
  );
}

function dropletSVG(kind: number): string {
  const p = dropletXY(kind);
  // teardrop: circle bottom + triangle pointing up
  return (
    `<path d="M ${p.x} ${p.y - 3} Q ${p.x - 2} ${p.y} ${p.x} ${p.y + 2} Q ${p.x + 2} ${p.y} ${p.x} ${p.y - 3} Z" fill="${HONEY_HEX}" opacity="0.9"/>` +
    `<circle cx="${p.x - 0.6}" cy="${p.y - 0.6}" r="0.6" fill="rgba(255,255,255,0.55)"/>`
  );
}

/**
 * Build a single inline SVG string for the avatar. Safe to use with
 * dangerouslySetInnerHTML — no caller input is interpolated; element
 * names are statically validated against the Element type at build.
 */
export function avatarSVG(
  seed: AvatarSeed,
  primary: Element,
  affinity: Element,
  size: number,
): string {
  const bodyFill = `var(--puru-${primary}-vivid)`;
  const accentFill = `var(--puru-${affinity}-vivid)`;
  const tilt = seed.bodyTilt;
  const transform = `rotate(${tilt} ${CX} ${CY})`;

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${VB} ${VB}" aria-hidden="true">` +
    `<g transform="${transform}">` +
    // body
    `<ellipse cx="${CX}" cy="${CY}" rx="${RX}" ry="${RY}" fill="${bodyFill}"/>` +
    // affinity accent — small dot lower-right inside body
    `<circle cx="${CX + 12}" cy="${CY + 10}" r="3.2" fill="${accentFill}" opacity="0.85"/>` +
    // top-left highlight
    `<ellipse cx="${CX - 8}" cy="${CY - 12}" rx="9" ry="5" fill="${HIGHLIGHT_HEX}"/>` +
    // face
    browSVG(seed.browTilt) +
    eyesSVG(seed.eyeKind, tilt) +
    mouthSVG(seed.mouthKind) +
    // honey droplet
    dropletSVG(seed.dropletPos) +
    // soft outline
    `<ellipse cx="${CX}" cy="${CY}" rx="${RX}" ry="${RY}" fill="none" stroke="rgba(0,0,0,0.10)" stroke-width="0.8"/>` +
    `</g>` +
    `</svg>`
  );
}

// ─── Canvas/Pixi-side renderer ───────────────────────────────────────────────

function setStrokeBase(ctx: CanvasRenderingContext2D, w = 1.5): void {
  ctx.strokeStyle = INK_HEX;
  ctx.lineWidth = w;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
}

function drawEyes(ctx: CanvasRenderingContext2D, kind: number): void {
  const { leftEye: L, rightEye: R } = FACE;
  ctx.fillStyle = INK_HEX;
  switch (kind & 7) {
    case 0:
      ctx.beginPath();
      ctx.arc(L.x, L.y, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(R.x, R.y, 2.2, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 1:
      setStrokeBase(ctx, 1.6);
      ctx.beginPath();
      ctx.moveTo(L.x - 2.5, L.y + 1);
      ctx.quadraticCurveTo(L.x, L.y - 2, L.x + 2.5, L.y + 1);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(R.x - 2.5, R.y + 1);
      ctx.quadraticCurveTo(R.x, R.y - 2, R.x + 2.5, R.y + 1);
      ctx.stroke();
      break;
    case 2:
      setStrokeBase(ctx, 1.4);
      ctx.beginPath();
      ctx.moveTo(L.x - 2.5, L.y);
      ctx.lineTo(L.x + 2.5, L.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(R.x - 2.5, R.y);
      ctx.lineTo(R.x + 2.5, R.y);
      ctx.stroke();
      break;
    case 3:
      setStrokeBase(ctx, 1.2);
      ctx.beginPath();
      ctx.arc(L.x, L.y, 2.8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(R.x, R.y, 2.8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = INK_HEX;
      ctx.beginPath();
      ctx.arc(L.x, L.y, 1.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(R.x, R.y, 1.2, 0, Math.PI * 2);
      ctx.fill();
      break;
    default:
      setStrokeBase(ctx, 1.6);
      ctx.beginPath();
      ctx.moveTo(L.x - 2.5, L.y - 1);
      ctx.quadraticCurveTo(L.x, L.y + 1.5, L.x + 2.5, L.y - 1);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(R.x - 2.5, R.y - 1);
      ctx.quadraticCurveTo(R.x, R.y + 1.5, R.x + 2.5, R.y - 1);
      ctx.stroke();
  }
}

function drawMouth(ctx: CanvasRenderingContext2D, kind: number): void {
  const { mouth: M } = FACE;
  setStrokeBase(ctx, 1.5);
  switch (kind & 7) {
    case 0:
      ctx.beginPath();
      ctx.moveTo(M.x - 4, M.y - 1);
      ctx.quadraticCurveTo(M.x, M.y + 3, M.x + 4, M.y - 1);
      ctx.stroke();
      break;
    case 1:
      ctx.beginPath();
      ctx.moveTo(M.x - 3, M.y);
      ctx.lineTo(M.x + 3, M.y);
      ctx.stroke();
      break;
    case 2:
      ctx.beginPath();
      ctx.moveTo(M.x - 4, M.y);
      ctx.quadraticCurveTo(M.x - 2, M.y - 2, M.x, M.y);
      ctx.quadraticCurveTo(M.x + 2, M.y + 2, M.x + 4, M.y);
      ctx.stroke();
      break;
    case 3:
      ctx.fillStyle = INK_HEX;
      ctx.beginPath();
      ctx.ellipse(M.x, M.y + 0.5, 2, 2.4, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    default:
      ctx.beginPath();
      ctx.moveTo(M.x - 3.5, M.y);
      ctx.quadraticCurveTo(M.x, M.y + 3, M.x + 3.5, M.y);
      ctx.stroke();
      ctx.fillStyle = HONEY_HEX;
      ctx.beginPath();
      ctx.arc(M.x + 3, M.y + 4.5, 1.2, 0, Math.PI * 2);
      ctx.fill();
  }
}

function drawBrows(ctx: CanvasRenderingContext2D, tilt: -1 | 0 | 1): void {
  if (tilt === 0) return;
  const { leftEye: L, rightEye: R } = FACE;
  const dy = tilt > 0 ? -1.5 : 1.2;
  setStrokeBase(ctx, 1.3);
  ctx.beginPath();
  ctx.moveTo(L.x - 3, L.y - 5 + dy);
  ctx.lineTo(L.x + 2, L.y - 5 - dy);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(R.x - 2, R.y - 5 - dy);
  ctx.lineTo(R.x + 3, R.y - 5 + dy);
  ctx.stroke();
}

function drawDroplet(ctx: CanvasRenderingContext2D, kind: number): void {
  const p = dropletXY(kind);
  ctx.fillStyle = HONEY_HEX;
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.moveTo(p.x, p.y - 3);
  ctx.quadraticCurveTo(p.x - 2, p.y, p.x, p.y + 2);
  ctx.quadraticCurveTo(p.x + 2, p.y, p.x, p.y - 3);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.beginPath();
  ctx.arc(p.x - 0.6, p.y - 0.6, 0.6, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Draw avatar into a square HTMLCanvasElement at the given pixel size.
 * Returns the canvas (caller can hand to Pixi `Texture.from`).
 */
export function avatarToCanvas(
  seed: AvatarSeed,
  primary: Element,
  affinity: Element,
  size: number,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const k = size / VB;
  ctx.scale(k, k);

  // tilt
  ctx.translate(CX, CY);
  ctx.rotate((seed.bodyTilt * Math.PI) / 180);
  ctx.translate(-CX, -CY);

  // body
  ctx.fillStyle = ELEMENT_VIVID_HEX[primary];
  ctx.beginPath();
  ctx.ellipse(CX, CY, RX, RY, 0, 0, Math.PI * 2);
  ctx.fill();

  // affinity accent dot
  ctx.fillStyle = ELEMENT_VIVID_HEX[affinity];
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.arc(CX + 12, CY + 10, 3.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // top-left highlight
  ctx.fillStyle = "rgba(255,255,255,0.20)";
  ctx.beginPath();
  ctx.ellipse(CX - 8, CY - 12, 9, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  drawBrows(ctx, seed.browTilt);
  drawEyes(ctx, seed.eyeKind);
  drawMouth(ctx, seed.mouthKind);
  drawDroplet(ctx, seed.dropletPos);

  // outline
  ctx.strokeStyle = "rgba(0,0,0,0.10)";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.ellipse(CX, CY, RX, RY, 0, 0, Math.PI * 2);
  ctx.stroke();

  return canvas;
}
