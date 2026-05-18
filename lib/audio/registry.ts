/**
 * Audio registry — typed SFX + music vocabulary for Purupuru.
 *
 * Every sound has a stable id and a kind. File-backed sounds reference a
 * /public/sounds/... path; procedural sounds carry an oscillator builder.
 *
 * Procedural defaults ship now so audio works without any MP3 assets.
 * When the operator drops MP3s under public/sounds/{sfx,music}/, flip
 * the kind to "file" + add the path. The id stays the same — every
 * caller keeps working.
 *
 * Adding a new sound = one entry in SOUND_REGISTRY (or call
 * audioEngine().register({...}) at runtime). No engine edits.
 */

import { audioEngine, type RegisteredSound } from "./engine";

// ─────────────────────────────────────────────────────────────────
// Procedural oscillator builders
// Each returns { stop } — the engine calls stop() on polyphony overflow.
// ─────────────────────────────────────────────────────────────────

function shortBlip(freq: number, durationMs = 80, type: OscillatorType = "sine") {
  return (ctx: AudioContext, output: AudioNode) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    const t = ctx.currentTime;
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.exponentialRampToValueAtTime(1, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, t + durationMs / 1000);
    osc.connect(gain);
    gain.connect(output);
    osc.start(t);
    osc.stop(t + durationMs / 1000 + 0.05);
    return { stop: () => osc.stop() };
  };
}

function downChirp(startFreq: number, endFreq: number, durationMs = 220) {
  return (ctx: AudioContext, output: AudioNode) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + durationMs / 1000);
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);
    osc.connect(gain);
    gain.connect(output);
    osc.start();
    osc.stop(ctx.currentTime + durationMs / 1000 + 0.05);
    return { stop: () => osc.stop() };
  };
}

function upChirp(startFreq: number, endFreq: number, durationMs = 220) {
  return (ctx: AudioContext, output: AudioNode) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + durationMs / 1000);
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);
    osc.connect(gain);
    gain.connect(output);
    osc.start();
    osc.stop(ctx.currentTime + durationMs / 1000 + 0.05);
    return { stop: () => osc.stop() };
  };
}

/** Three-note major arpeggio — celebratory chord for combo discovery. */
function majorChord(rootHz = 523.25 /* C5 */) {
  return (ctx: AudioContext, output: AudioNode) => {
    const tones: OscillatorNode[] = [];
    const ratios = [1, 5 / 4, 3 / 2]; // major triad
    const t = ctx.currentTime;
    ratios.forEach((r, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = rootHz * r;
      gain.gain.setValueAtTime(0.001, t + i * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.4, t + i * 0.04 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.04 + 0.7);
      osc.connect(gain);
      gain.connect(output);
      osc.start(t + i * 0.04);
      osc.stop(t + i * 0.04 + 0.75);
      tones.push(osc);
    });
    return { stop: () => tones.forEach((o) => o.stop()) };
  };
}

/** Filtered noise burst — for clash impact thunk. */
function noiseThunk(freq = 200, durationMs = 180) {
  return (ctx: AudioContext, output: AudioNode) => {
    const buf = ctx.createBuffer(1, ctx.sampleRate * (durationMs / 1000), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = freq;
    lp.Q.value = 4;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.7, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);
    src.connect(lp);
    lp.connect(gain);
    gain.connect(output);
    src.start();
    src.stop(ctx.currentTime + durationMs / 1000 + 0.02);
    return { stop: () => src.stop() };
  };
}

/** Per-element clash signature — different timbre per element so the
 * audio matches the visual VFX (fire = bright, water = wet, etc.). */
const clashTimbres: Record<string, (ctx: AudioContext, output: AudioNode) => { stop: () => void }> = {
  fire: noiseThunk(800, 180),     // bright filtered noise
  earth: noiseThunk(180, 320),    // deep, longer
  wood: shortBlip(330, 220, "triangle"),
  metal: shortBlip(880, 90, "square"),
  water: noiseThunk(450, 260),
};

// ─────────────────────────────────────────────────────────────────
// SOUND_REGISTRY — every sound the game can play
//
// File paths are declared but the kind defaults to "procedural" so
// the engine uses the oscillator builder until an MP3 lands. Once you
// drop a file at the declared path, change `kind: "procedural"` →
// `kind: "file"` and the same id starts playing the recording.
// ─────────────────────────────────────────────────────────────────

export const SOUND_REGISTRY: readonly RegisteredSound[] = [
  // ── UI ──────────────────────────────────────────────────────────
  {
    id: "ui.hover",
    namespace: "ui",
    kind: "procedural",
    volume: 0.25,
    path: "/sounds/sfx/ui-hover.mp3",
    build: shortBlip(1200, 40, "sine"),
  },
  {
    id: "ui.tap",
    namespace: "ui",
    kind: "procedural",
    volume: 0.35,
    path: "/sounds/sfx/ui-tap.mp3",
    build: shortBlip(900, 80, "triangle"),
  },
  {
    id: "ui.toggle",
    namespace: "ui",
    kind: "procedural",
    volume: 0.3,
    path: "/sounds/sfx/ui-toggle.mp3",
    build: shortBlip(660, 90, "square"),
  },

  // ── Card ────────────────────────────────────────────────────────
  {
    id: "card.deal",
    namespace: "card",
    kind: "procedural",
    volume: 0.35,
    path: "/sounds/sfx/card-deal.mp3",
    build: downChirp(1400, 600, 280),
  },
  {
    id: "card.swap",
    namespace: "card",
    kind: "procedural",
    volume: 0.3,
    path: "/sounds/sfx/card-swap.mp3",
    build: shortBlip(720, 70, "triangle"),
  },
  {
    id: "card.lift",
    namespace: "card",
    kind: "procedural",
    volume: 0.2,
    path: "/sounds/sfx/card-lift.mp3",
    build: upChirp(660, 990, 120),
  },

  // ── Match ───────────────────────────────────────────────────────
  {
    id: "match.lock-in",
    namespace: "match",
    kind: "procedural",
    volume: 0.5,
    path: "/sounds/sfx/lock-in.mp3",
    build: (ctx, output) => {
      // Two-tone rising chime — anchor + commit
      const t = ctx.currentTime;
      const oscs: OscillatorNode[] = [];
      [523.25, 783.99].forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = f;
        gain.gain.setValueAtTime(0.001, t + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.5, t + i * 0.06 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.5);
        osc.connect(gain);
        gain.connect(output);
        osc.start(t + i * 0.06);
        osc.stop(t + i * 0.06 + 0.55);
        oscs.push(osc);
      });
      return { stop: () => oscs.forEach((o) => o.stop()) };
    },
  },
  {
    id: "match.win",
    namespace: "match",
    kind: "procedural",
    volume: 0.55,
    path: "/sounds/sfx/match-win.mp3",
    build: majorChord(523.25),
  },
  {
    id: "match.lose",
    namespace: "match",
    kind: "procedural",
    volume: 0.45,
    path: "/sounds/sfx/match-lose.mp3",
    build: downChirp(440, 165, 600),
  },
  {
    id: "match.draw",
    namespace: "match",
    kind: "procedural",
    volume: 0.4,
    path: "/sounds/sfx/match-draw.mp3",
    build: shortBlip(523.25, 500, "sine"),
  },

  // ── Per-element clash impacts ──────────────────────────────────
  ...(["wood", "fire", "earth", "metal", "water"] as const).map((el) => ({
    id: `match.clash-impact.${el}`,
    namespace: "match" as const,
    kind: "procedural" as const,
    volume: 0.55,
    path: `/sounds/sfx/clash-${el}.mp3`,
    build: clashTimbres[el]!,
  })),

  // ── Discovery ─────────────────────────────────────────────────
  {
    id: "discovery.combo",
    namespace: "discovery",
    kind: "procedural",
    volume: 0.6,
    path: "/sounds/sfx/discovery-combo.mp3",
    build: majorChord(659.25 /* E5 */),
  },

  // ── Music ─────────────────────────────────────────────────────
  // Music tracks need files. We declare the slots; until MP3s land they
  // are no-ops (the engine silently skips file loads that 404).
  {
    id: "music.entry-ambient",
    namespace: "music",
    kind: "file",
    volume: 0.6,
    path: "/sounds/music/entry-ambient.mp3",
    loop: true,
  },
  {
    id: "music.arrange-tension",
    namespace: "music",
    kind: "file",
    volume: 0.5,
    path: "/sounds/music/arrange-tension.mp3",
    loop: true,
  },
  {
    id: "music.clash",
    namespace: "music",
    kind: "file",
    volume: 0.55,
    path: "/sounds/music/clash.mp3",
    loop: true,
  },
  {
    id: "music.result",
    namespace: "music",
    kind: "file",
    volume: 0.5,
    path: "/sounds/music/result.mp3",
    loop: true,
  },
  {
    id: "music.idle",
    namespace: "music",
    kind: "file",
    volume: 0.35,
    path: "/sounds/music/idle.mp3",
    loop: true,
  },
];

let _registered = false;
export function ensureRegistered(): void {
  if (_registered) return;
  audioEngine().registerMany(SOUND_REGISTRY);
  _registered = true;
}
