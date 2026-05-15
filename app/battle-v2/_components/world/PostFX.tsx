/**
 * PostFX — the Ghibli-warm post-processing pass.
 *
 * Per build doc Session 12 follow-up + the lighting/post dig (2026-05-14).
 *
 * The dig anchored on Genshin, but Tsuheji's soul is Ghibli — painterly, warm,
 * soft-hazed, gouache. Same R3F pipeline (`@react-three/postprocessing`),
 * dialed the other way: restraint over gloss. The emergence from the dig is
 * the governing idea — *stylized rendering composites palettes, it doesn't
 * simulate light*. So this pass takes the colour decisions away from the
 * renderer and makes them on purpose:
 *
 *   ToneMapping (Neutral) — Khronos PBR-Neutral. The dig's core finding: ACES
 *       washes saturated colour toward white under a strong key. Neutral holds
 *       the hue + saturation — the warm OKLCH palette stays a painting.
 *   Bloom (soft, targeted) — a high luminanceThreshold so ONLY genuinely
 *       bright/emissive things bleed: the weather motes, zone glow, the
 *       seedling bloom. Wide mipmap blur, low intensity — atmospheric haze,
 *       not anime glare. "Only the magical things glow."
 *   HueSaturation — a small saturation lift. Gouache richness in the mids.
 *   BrightnessContrast — a whisper of contrast. Ghibli shadows stay soft;
 *       never crush.
 *   Vignette — barely there. Frames the painting; not a gamer vignette.
 *   Noise — faint grain. The "painted, not digital" texture, in the midtones.
 *
 * A LUT slot is left wired but empty — author a `.cube` and drop it in when
 * the grade wants to be hand-tuned rather than parametric.
 *
 * Tunable: every dial lives in `FX` below. The renderer's tone mapping is set
 * to NoToneMapping in WorldView so the ToneMapping EFFECT owns it (no double
 * application). Escape hatch: `?fx=0` on the route mounts the scene raw.
 */

"use client";

import {
  Bloom,
  BrightnessContrast,
  EffectComposer,
  HueSaturation,
  Noise,
  ToneMapping,
  Vignette,
} from "@react-three/postprocessing";
import { BlendFunction, ToneMappingMode } from "postprocessing";

/**
 * Every dial in one place. v1 was tuned too shy ("no visible changes" feedback
 * 2026-05-14) — v2 keeps the Ghibli restraint but ALL effects are now
 * actually felt: bloom threshold drops so atmospheric haze blooms around the
 * map's bright spots, saturation/contrast lift the painting, vignette + grain
 * are present without going gamer.
 */
const FX = {
  bloom: {
    intensity: 0.95,
    luminanceThreshold: 0.55, // most lit mid-tones contribute a soft haze
    luminanceSmoothing: 0.42,
    radius: 1.0,
  },
  saturation: 0.2, // gouache lift
  brightness: 0.04,
  contrast: 0.08,
  vignette: { offset: 0.3, darkness: 0.45 },
  grain: 0.045, // painted-texture noise
} as const;

export function PostFX() {
  return (
    <EffectComposer multisampling={4} enableNormalPass={false}>
      {/* Tone mapping FIRST — it owns the renderer's job (gl set to NoToneMapping). */}
      <ToneMapping mode={ToneMappingMode.NEUTRAL} />
      <Bloom
        mipmapBlur
        intensity={FX.bloom.intensity}
        luminanceThreshold={FX.bloom.luminanceThreshold}
        luminanceSmoothing={FX.bloom.luminanceSmoothing}
        radius={FX.bloom.radius}
      />
      <HueSaturation saturation={FX.saturation} />
      <BrightnessContrast brightness={FX.brightness} contrast={FX.contrast} />
      <Vignette
        offset={FX.vignette.offset}
        darkness={FX.vignette.darkness}
        blendFunction={BlendFunction.NORMAL}
      />
      {/* Faint grain — premultiplied so it sits in the midtones, not the darks. */}
      <Noise premultiply opacity={FX.grain} blendFunction={BlendFunction.SOFT_LIGHT} />
      {/*
        LUT slot — author a .cube grade and uncomment:
        import { LUT } from "@react-three/postprocessing";
        import { LUTCubeLoader } from "postprocessing";
        const lut = useLoader(LUTCubeLoader, "/luts/tsuheji-warm.cube");
        <LUT lut={lut} />
      */}
    </EffectComposer>
  );
}
