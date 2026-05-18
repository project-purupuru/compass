/**
 * AudioEngine — single audio engine for Purupuru.
 *
 * Composes two patterns from prior repos:
 *   - henlo-interface use-sound-effects.ts   → file-based player
 *     (lazy load, cache, clone-on-play, fade-in/out music, soundEnabled toggle)
 *   - world-purupuru workshop/audio-service.ts → synthesis-based player
 *     (AudioContext singleton, oscillator presets, polyphony cap, throttle)
 *
 * Hexagon shape:
 *   - Engine is the contract.
 *   - SFX/music can be FILE-backed (when MP3s exist in /public/sounds/...)
 *     OR PROCEDURAL (oscillator-built — works today without any assets).
 *   - Adding a new sound = adding a typed entry to the registry, never
 *     touching engine internals.
 *
 * The engine is a singleton because:
 *   1. AudioContext is expensive — create once, share globally.
 *   2. localStorage soundEnabled / volume settings are global anyway.
 *   3. Music is mutually-exclusive (one track at a time across the app).
 *
 * Browser autoplay policy: AudioContext starts SUSPENDED until first user
 * gesture. The engine resumes on first call. Until then, calls are no-ops.
 */

const STORAGE_ENABLED_KEY = "puru-audio-enabled";
const STORAGE_MASTER_KEY = "puru-audio-master-volume";
const STORAGE_SFX_KEY = "puru-audio-sfx-volume";
const STORAGE_MUSIC_KEY = "puru-audio-music-volume";

const POLYPHONY_PER_NAMESPACE = 4;
const PROCEDURAL_THROTTLE_MS = 60;

export type AudioNamespace =
  | "ui" // hover, click, tap
  | "card" // deal, swap, lift
  | "match" // lock-in, clash, win, lose
  | "discovery" // combo discovery ceremony
  | "music"; // background tracks (single-channel)

export type SoundKind = "file" | "procedural";

/** A registered sound — file path OR procedural builder. Engine routes
 * by kind. Volume is per-sound default (0..1); per-call options can
 * override at play time. */
export interface RegisteredSound {
  readonly id: string;
  readonly namespace: AudioNamespace;
  readonly kind: SoundKind;
  readonly volume: number;
  /** File path under /public; required when kind === "file". */
  readonly path?: string;
  /** Procedural builder; required when kind === "procedural".
   * Returns a stop() that the engine calls on overflow / cleanup. */
  readonly build?: (ctx: AudioContext, output: AudioNode) => { stop: () => void };
  /** Loop the file? Used by music tracks. */
  readonly loop?: boolean;
}

export interface PlayOptions {
  readonly volumeOverride?: number;
  readonly playbackRate?: number;
  /** For music only: fade between tracks. */
  readonly fadeInMs?: number;
  readonly fadeOutMs?: number;
}

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;

  private readonly registry = new Map<string, RegisteredSound>();
  private readonly fileCache = new Map<string, HTMLAudioElement>();
  private readonly fileLoading = new Map<string, Promise<HTMLAudioElement>>();

  // Polyphony tracking per namespace (for procedural voices).
  private readonly activeVoices = new Map<AudioNamespace, Array<{ stop: () => void }>>();
  private readonly lastPlayedAt = new Map<string, number>();

  // Music state
  private currentMusicId: string | null = null;
  private currentMusicEl: HTMLAudioElement | null = null;
  private musicFadeRaf: number | null = null;

  // Settings (mirrored from localStorage)
  private enabled = true;
  private masterVolume = 0.8;
  private sfxVolume = 0.7;
  private musicVolume = 0.5;

  // Ducking — music auto-attenuates when high-priority SFX plays
  private duckActive = false;
  private duckDepth = 0.3; // 0..1, music multiplied by this when ducking
  private duckAttackMs = 100;
  private duckReleaseMs = 400;
  private duckReleaseTimer: number | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.enabled = window.localStorage.getItem(STORAGE_ENABLED_KEY) !== "false";
      this.masterVolume = parseFloat(
        window.localStorage.getItem(STORAGE_MASTER_KEY) ?? String(this.masterVolume),
      );
      this.sfxVolume = parseFloat(
        window.localStorage.getItem(STORAGE_SFX_KEY) ?? String(this.sfxVolume),
      );
      this.musicVolume = parseFloat(
        window.localStorage.getItem(STORAGE_MUSIC_KEY) ?? String(this.musicVolume),
      );
    }
  }

  // ── Lifecycle ──────────────────────────────────────────────────

  private getCtx(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const Ctor = (window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext) as typeof AudioContext | undefined;
      if (!Ctor) return null;
      this.ctx = new Ctor();
      this.masterGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();
      this.sfxGain.connect(this.masterGain);
      this.musicGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
      this.applyVolumes();
    }
    return this.ctx;
  }

  /** Resume the AudioContext if suspended (browser autoplay policy).
   * Call this on first user gesture (click, keydown, etc.). */
  async unlock(): Promise<void> {
    const ctx = this.getCtx();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      try {
        await ctx.resume();
      } catch {
        /* ignore */
      }
    }
  }

  // ── Settings ───────────────────────────────────────────────────

  setEnabled(on: boolean): void {
    this.enabled = on;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_ENABLED_KEY, String(on));
    }
    if (!on) this.stopMusic();
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setMasterVolume(v: number): void {
    this.masterVolume = clamp01(v);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_MASTER_KEY, String(this.masterVolume));
    }
    this.applyVolumes();
  }

  setSfxVolume(v: number): void {
    this.sfxVolume = clamp01(v);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_SFX_KEY, String(this.sfxVolume));
    }
    this.applyVolumes();
  }

  setMusicVolume(v: number): void {
    this.musicVolume = clamp01(v);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_MUSIC_KEY, String(this.musicVolume));
    }
    this.applyVolumes();
    if (this.currentMusicEl) {
      this.currentMusicEl.volume = this.computedMusicElVolume();
    }
  }

  getVolumes(): { master: number; sfx: number; music: number } {
    return { master: this.masterVolume, sfx: this.sfxVolume, music: this.musicVolume };
  }

  // ── Ducking ────────────────────────────────────────────────────

  setDuckConfig(depth: number, attackMs: number, releaseMs: number): void {
    this.duckDepth = clamp01(depth);
    this.duckAttackMs = Math.max(0, attackMs);
    this.duckReleaseMs = Math.max(0, releaseMs);
  }

  /** Pull music gain down to duckDepth × musicVolume. Auto-releases. */
  duck(holdMs = 200): void {
    const ctx = this.ctx;
    if (!ctx || !this.musicGain) return;
    this.duckActive = true;
    const target = this.musicVolume * this.duckDepth;
    const t = ctx.currentTime;
    this.musicGain.gain.cancelScheduledValues(t);
    this.musicGain.gain.setTargetAtTime(target, t, this.duckAttackMs / 1000 / 3);
    if (this.duckReleaseTimer !== null) window.clearTimeout(this.duckReleaseTimer);
    this.duckReleaseTimer = window.setTimeout(() => {
      this.releaseDuck();
    }, holdMs);
  }

  releaseDuck(): void {
    if (!this.duckActive) return;
    const ctx = this.ctx;
    if (!ctx || !this.musicGain) return;
    this.duckActive = false;
    this.musicGain.gain.setTargetAtTime(
      this.musicVolume,
      ctx.currentTime,
      this.duckReleaseMs / 1000 / 3,
    );
    if (this.duckReleaseTimer !== null) {
      window.clearTimeout(this.duckReleaseTimer);
      this.duckReleaseTimer = null;
    }
  }

  isDucking(): boolean {
    return this.duckActive;
  }

  // ── Snapshot system (named bus presets) ────────────────────────

  applySnapshot(snap: AudioSnapshot): void {
    this.setMasterVolume(snap.master);
    this.setSfxVolume(snap.sfx);
    this.setMusicVolume(snap.music);
    if (snap.duckDepth !== undefined) this.duckDepth = clamp01(snap.duckDepth);
  }

  /** Read-only snapshot of current voice activity (for tweakpane monitor). */
  getActiveVoiceCounts(): Record<AudioNamespace, number> {
    const out: Record<AudioNamespace, number> = {
      ui: 0, card: 0, match: 0, discovery: 0, music: 0,
    };
    for (const [ns, voices] of this.activeVoices) out[ns] = voices.length;
    if (this.currentMusicEl) out.music = 1;
    return out;
  }

  private applyVolumes(): void {
    const ctx = this.ctx;
    if (!ctx || !this.masterGain || !this.sfxGain || !this.musicGain) return;
    const t = ctx.currentTime;
    this.masterGain.gain.setTargetAtTime(this.masterVolume, t, 0.05);
    this.sfxGain.gain.setTargetAtTime(this.sfxVolume, t, 0.05);
    this.musicGain.gain.setTargetAtTime(this.musicVolume, t, 0.05);
  }

  private computedMusicElVolume(): number {
    // For HTMLAudioElement music, master + music multiply (sfx isn't routed
    // through HTMLAudio elements — only through GainNode for procedural).
    const sound = this.registry.get(this.currentMusicId ?? "");
    const baseline = sound?.volume ?? 1;
    return clamp01(this.masterVolume * this.musicVolume * baseline);
  }

  // ── Registry ───────────────────────────────────────────────────

  register(sound: RegisteredSound): void {
    this.registry.set(sound.id, sound);
  }

  registerMany(sounds: readonly RegisteredSound[]): void {
    for (const s of sounds) this.register(s);
  }

  has(id: string): boolean {
    return this.registry.has(id);
  }

  list(): readonly string[] {
    return Array.from(this.registry.keys());
  }

  // ── Playback ───────────────────────────────────────────────────

  /** Play a registered SFX. Music routes through playMusic instead. */
  play(id: string, options?: PlayOptions): void {
    if (!this.enabled) return;
    const sound = this.registry.get(id);
    if (!sound) {
      console.warn(`[audio] unknown sound: ${id}`);
      return;
    }
    if (sound.namespace === "music") {
      this.playMusic(id, options);
      return;
    }

    // Throttle
    const now = Date.now();
    const last = this.lastPlayedAt.get(id) ?? 0;
    if (now - last < PROCEDURAL_THROTTLE_MS) return;
    this.lastPlayedAt.set(id, now);

    if (sound.kind === "file") {
      this.playFile(sound, options);
    } else {
      this.playProcedural(sound, options);
    }
  }

  private playFile(sound: RegisteredSound, options?: PlayOptions): void {
    if (!sound.path) return;
    this.loadFile(sound.path).then(
      (template) => {
        const clone = template.cloneNode() as HTMLAudioElement;
        clone.volume = clamp01(
          (options?.volumeOverride ?? sound.volume) * this.masterVolume * this.sfxVolume,
        );
        if (options?.playbackRate) clone.playbackRate = options.playbackRate;
        clone.play().catch(() => {
          /* user-gesture required — silent */
        });
        clone.addEventListener("ended", () => clone.remove(), { once: true });
      },
      () => {
        /* file missing — silent (graceful degradation) */
      },
    );
  }

  /**
   * FAGAN C4: per-voice cleanup timer. Each procedural voice gets a
   * 2s timer that removes it from `activeVoices` AND cancels its
   * underlying oscillator. Eviction (`voices.shift()?.stop()`) clears
   * the timer so a forcefully-stopped voice doesn't leave a stray
   * setTimeout pinning a closure for 2s.
   */
  private cancelVoiceTimer(voice: { _timer?: number }): void {
    if (voice._timer !== undefined) {
      window.clearTimeout(voice._timer);
      voice._timer = undefined;
    }
  }

  private playProcedural(sound: RegisteredSound, options?: PlayOptions): void {
    const ctx = this.getCtx();
    if (!ctx || !sound.build || !this.sfxGain) return;

    // Output node — apply per-call volume override at the connect point.
    let outNode: AudioNode = this.sfxGain;
    if (options?.volumeOverride !== undefined) {
      const gain = ctx.createGain();
      gain.gain.value = clamp01(options.volumeOverride * sound.volume);
      gain.connect(this.sfxGain);
      outNode = gain;
    } else {
      // Wrap in a per-sound gain so the registered volume applies.
      const gain = ctx.createGain();
      gain.gain.value = clamp01(sound.volume);
      gain.connect(this.sfxGain);
      outNode = gain;
    }

    // Polyphony cap per namespace — evict oldest, cancel its cleanup timer
    const voices = this.activeVoices.get(sound.namespace) ?? [];
    if (voices.length >= POLYPHONY_PER_NAMESPACE) {
      const evicted = voices.shift();
      if (evicted) {
        this.cancelVoiceTimer(evicted as { _timer?: number });
        evicted.stop();
      }
    }
    const voice = sound.build(ctx, outNode) as { stop: () => void; _timer?: number };
    voices.push(voice);
    this.activeVoices.set(sound.namespace, voices);

    // Auto-cleanup after a generous lifetime. Timer ID is stored ON the
    // voice so eviction can cancel it. The cleanup also calls stop() so
    // procedural sounds that overrun their natural duration are silenced.
    voice._timer = window.setTimeout(() => {
      const list = this.activeVoices.get(sound.namespace);
      if (list) {
        const idx = list.indexOf(voice);
        if (idx !== -1) {
          list[idx].stop();
          list.splice(idx, 1);
        }
      }
    }, 2000);
  }

  // ── Music ──────────────────────────────────────────────────────

  /** Play a music track (single-channel). If the same track is already
   * playing, this is a no-op. Otherwise: cross-fade if fadeInMs is set;
   * abrupt swap otherwise. */
  playMusic(id: string, options?: PlayOptions): void {
    if (!this.enabled) {
      this.stopMusic();
      return;
    }
    const sound = this.registry.get(id);
    if (!sound || sound.namespace !== "music" || !sound.path) return;

    if (this.currentMusicId === id && this.currentMusicEl && !this.currentMusicEl.paused) {
      return; // already playing
    }

    const startNew = (volume: number) => {
      this.loadFile(sound.path!).then((template) => {
        const el = template.cloneNode() as HTMLAudioElement;
        el.loop = sound.loop ?? true;
        el.volume = volume;
        this.currentMusicEl = el;
        this.currentMusicId = id;
        el.play().catch(() => {
          /* user-gesture required */
        });
        if (options?.fadeInMs) this.fadeMusic(el, this.computedMusicElVolume(), options.fadeInMs);
      }, () => {
        /* music missing — silent */
      });
    };

    if (this.currentMusicEl) {
      const prev = this.currentMusicEl;
      const targetMs = options?.fadeOutMs ?? options?.fadeInMs ?? 0;
      if (targetMs > 0) {
        this.fadeMusic(prev, 0, targetMs, () => {
          prev.pause();
          prev.remove();
          startNew(0);
        });
        this.currentMusicEl = null;
        this.currentMusicId = null;
      } else {
        prev.pause();
        prev.remove();
        this.currentMusicEl = null;
        this.currentMusicId = null;
        startNew(this.computedMusicElVolume());
      }
    } else {
      startNew(options?.fadeInMs ? 0 : this.computedMusicElVolume());
    }
  }

  stopMusic(fadeOutMs = 0): void {
    if (!this.currentMusicEl) return;
    const el = this.currentMusicEl;
    if (fadeOutMs > 0) {
      this.fadeMusic(el, 0, fadeOutMs, () => {
        el.pause();
        el.currentTime = 0;
        el.remove();
      });
    } else {
      el.pause();
      el.currentTime = 0;
      el.remove();
    }
    this.currentMusicEl = null;
    this.currentMusicId = null;
  }

  private fadeMusic(
    el: HTMLAudioElement,
    target: number,
    durationMs: number,
    onDone?: () => void,
  ): void {
    if (this.musicFadeRaf !== null) {
      cancelAnimationFrame(this.musicFadeRaf);
      this.musicFadeRaf = null;
    }
    const startVol = el.volume;
    const startAt = performance.now();
    const step = () => {
      const t = (performance.now() - startAt) / durationMs;
      if (t >= 1) {
        el.volume = clamp01(target);
        this.musicFadeRaf = null;
        onDone?.();
        return;
      }
      el.volume = clamp01(startVol + (target - startVol) * t);
      this.musicFadeRaf = requestAnimationFrame(step);
    };
    this.musicFadeRaf = requestAnimationFrame(step);
  }

  // ── File loader (lazy + cached) ────────────────────────────────

  private loadFile(path: string): Promise<HTMLAudioElement> {
    const cached = this.fileCache.get(path);
    if (cached) return Promise.resolve(cached);
    const inflight = this.fileLoading.get(path);
    if (inflight) return inflight;

    const p = new Promise<HTMLAudioElement>((resolve, reject) => {
      const audio = new Audio(path);
      audio.preload = "auto";
      // FAGAN M7: timeout the load so a hung CDN doesn't pin the
      // promise indefinitely. 5s is generous for SFX, ample for music.
      const failTimer = window.setTimeout(() => {
        this.fileLoading.delete(path);
        reject(new Error(`audio load timeout: ${path}`));
      }, 5000);
      audio.addEventListener(
        "canplaythrough",
        () => {
          window.clearTimeout(failTimer);
          this.fileCache.set(path, audio);
          this.fileLoading.delete(path);
          resolve(audio);
        },
        { once: true },
      );
      audio.addEventListener(
        "error",
        () => {
          window.clearTimeout(failTimer);
          this.fileLoading.delete(path);
          reject(new Error(`audio load failed: ${path}`));
        },
        { once: true },
      );
      audio.load();
    });
    this.fileLoading.set(path, p);
    return p;
  }

  /**
   * Tear down — stop music, kill all voices + their cleanup timers,
   * cancel music fade RAF, release the duck timer.
   * NOTE: AudioContext itself is NOT closed (browser autoplay policy
   * makes recreating one painful + we want the bus graph to survive
   * HMR). Singleton outlives most page lifecycles.
   */
  dispose(): void {
    this.stopMusic();
    if (this.musicFadeRaf !== null) {
      cancelAnimationFrame(this.musicFadeRaf);
      this.musicFadeRaf = null;
    }
    if (this.duckReleaseTimer !== null) {
      window.clearTimeout(this.duckReleaseTimer);
      this.duckReleaseTimer = null;
    }
    for (const [, voices] of this.activeVoices) {
      for (const v of voices) {
        this.cancelVoiceTimer(v as { _timer?: number });
        try {
          v.stop();
        } catch {
          /* ignore */
        }
      }
    }
    this.activeVoices.clear();
  }
}

/** Named bus preset — applied atomically via applySnapshot. */
export interface AudioSnapshot {
  readonly name: string;
  readonly master: number;
  readonly sfx: number;
  readonly music: number;
  readonly duckDepth?: number;
}

export const SNAPSHOTS: Record<string, AudioSnapshot> = {
  combat: { name: "combat", master: 0.85, sfx: 0.85, music: 0.35, duckDepth: 0.25 },
  menu: { name: "menu", master: 0.7, sfx: 0.55, music: 0.55, duckDepth: 0.5 },
  victory: { name: "victory", master: 1.0, sfx: 0.9, music: 0.7, duckDepth: 0.4 },
  silent: { name: "silent", master: 0, sfx: 0, music: 0 },
};

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

// ── Singleton ────────────────────────────────────────────────────

let _instance: AudioEngine | null = null;

export function audioEngine(): AudioEngine {
  if (!_instance) _instance = new AudioEngine();
  return _instance;
}
