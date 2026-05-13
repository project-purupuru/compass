import Image from "next/image";
import { ELEMENTS, type Element } from "@/lib/score";

const ELEMENT_LABEL: Record<Element, { jp: string; en: string }> = {
  wood: { jp: "木", en: "Wood" },
  fire: { jp: "火", en: "Fire" },
  earth: { jp: "土", en: "Earth" },
  water: { jp: "水", en: "Water" },
  metal: { jp: "金", en: "Metal" },
};

export default function Home() {
  return (
    <main className="h-dvh w-full overflow-y-auto bg-puru-cloud-base text-puru-ink-base">
      <div className="mx-auto flex max-w-5xl flex-col gap-12 px-8 py-12">
        <header className="flex flex-col gap-4">
          <Image
            src="/brand/purupuru-wordmark.svg"
            alt="purupuru"
            width={240}
            height={90}
            priority
          />
          <p className="font-puru-mono text-xs uppercase tracking-[0.2em] text-puru-ink-soft">
            kit baseline · solana frontier · ship 2026-05-11
          </p>
          <h1 className="font-puru-display text-3xl font-semibold leading-puru-tight tracking-tight text-puru-ink-rich">
            observatory
          </h1>
          <a
            href="/battle-v2"
            className="inline-block self-start rounded border border-puru-wood-vivid px-4 py-2 font-puru-mono text-xs uppercase tracking-[0.2em] text-puru-wood-vivid hover:bg-puru-wood-vivid hover:text-puru-cloud-bright transition-colors"
          >
            → /battle-v2 · cycle-1 wood vertical slice
          </a>
          <p className="max-w-xl text-base leading-puru-normal text-puru-ink-soft">
            A live awareness layer fusing on-chain, IRL weather, and wuxing state. This page renders
            the design tokens, brand fonts, and puruhani art that ground the kit. The simulation
            surface lands in the next sprint.
          </p>
        </header>

        <section className="flex flex-col gap-4">
          <h2 className="font-puru-mono text-xs uppercase tracking-[0.2em] text-puru-ink-soft">
            五行 · Wuxing roster
          </h2>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {ELEMENTS.map((el) => (
              <li
                key={el}
                className="flex flex-col items-center gap-3 rounded-puru-md border border-puru-cloud-dim bg-puru-cloud-bright p-4"
              >
                <div
                  className="relative aspect-square w-full overflow-hidden rounded-puru-md"
                  style={{ backgroundColor: `var(--puru-${el}-tint)` }}
                >
                  <Image
                    src={`/art/puruhani/puruhani-${el}.png`}
                    alt={`puruhani-${el}`}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
                    className="object-contain"
                    priority
                  />
                </div>
                <div className="flex w-full items-center justify-between">
                  <span className="font-puru-card text-2xl text-puru-ink-rich">
                    {ELEMENT_LABEL[el].jp}
                  </span>
                  <span className="font-puru-mono text-xs uppercase tracking-wider text-puru-ink-soft">
                    {ELEMENT_LABEL[el].en}
                  </span>
                  <span
                    aria-hidden
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: `var(--puru-${el}-vivid)` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="font-puru-mono text-xs uppercase tracking-[0.2em] text-puru-ink-soft">
            Typography scale
          </h2>
          <div className="rounded-puru-md border border-puru-cloud-dim bg-puru-cloud-bright p-6">
            <p className="font-puru-display text-3xl leading-puru-tight text-puru-ink-rich">
              text-3xl · display · the daemon remembers
            </p>
            <p className="font-puru-display text-2xl leading-puru-tight text-puru-ink-rich">
              text-2xl · display
            </p>
            <p className="text-xl leading-puru-normal text-puru-ink-base">text-xl · body</p>
            <p className="text-base leading-puru-normal text-puru-ink-base">
              text-base · body — Inter via next/font
            </p>
            <p className="font-puru-card text-base leading-puru-relaxed text-puru-ink-base">
              text-base · card · 余白の中で星が呼吸する
            </p>
            <p className="font-puru-cn text-base leading-puru-relaxed text-puru-ink-base">
              text-base · cn · 五行循环 · 木火土金水
            </p>
            <p className="font-puru-mono text-sm text-puru-ink-soft">
              text-sm · mono · ELEMENT_AFFINITY[fire] = 0.62
            </p>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="font-puru-mono text-xs uppercase tracking-[0.2em] text-puru-ink-soft">
            Sister roster · Jani
          </h2>
          <ul className="grid grid-cols-5 gap-3">
            {ELEMENTS.map((el) => (
              <li
                key={el}
                className="flex flex-col items-center gap-2 rounded-puru-md bg-puru-cloud-bright p-2"
                style={{ borderTop: `2px solid var(--puru-${el}-vivid)` }}
              >
                <div
                  className="relative aspect-square w-full overflow-hidden rounded-puru-sm"
                  style={{ backgroundColor: `var(--puru-${el}-tint)` }}
                >
                  <Image
                    src={`/art/jani/jani-${el}.png`}
                    alt={`jani-${el}`}
                    fill
                    sizes="20vw"
                    className="object-contain"
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="flex flex-col gap-3 text-xs text-puru-ink-soft">
          <h2 className="font-puru-mono text-xs uppercase tracking-[0.2em]">Kit contents</h2>
          <ul className="grid gap-1 leading-puru-relaxed">
            <li>· OKLCH wuxing palette × 4 shades, light + Old Horai dark</li>
            <li>· Per-element breathing rhythms, motion vocabulary keyframes</li>
            <li>· Fluid typography scale (text-2xs..text-3xl) + line-height system</li>
            <li>· 5 brand font stacks: body / display / card / cn / mono</li>
            <li>· FOT-Yuruka Std + ZCOOL KuaiLe local woff2 (1MB)</li>
            <li>· Inter + Geist Mono via next/font/google</li>
            <li>· purupuru wordmark SVG (color + white variants)</li>
            <li>· 5 puruhani PNGs + 5 jani PNGs (sister characters)</li>
            <li>· 6 element-glow SVGs + harmony glow</li>
            <li>
              · Card-system layers: 4 frames × 4 rarities, 6 backgrounds, 14 behavioral states
            </li>
            <li>
              · tsuheji world map · grain pattern · 18 caretaker/jani/transcendence material configs
            </li>
            <li>· Score read-adapter contract + deterministic mock at @/lib/score</li>
            <li>· Pixi.js v8, motion, lucide-react, clsx, tailwind-merge installed</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
