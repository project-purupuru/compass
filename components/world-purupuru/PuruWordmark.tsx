"use client";

// React port of project-purupuru/world-purupuru
// sites/world/src/lib/PuruWordmark.svelte. Same SVG path data, same
// golden-ratio-detuned zubora wobble per glyph, same animated
// feTurbulence noise filter.

import { useEffect, useId, useMemo, useRef } from "react";

const PHI = 1.618033988749895;

const T_OUTER = "matrix(1,0,0,1,-7014,-15079)";
const T_MIDDLE = "matrix(1.17378,0,0,1.16563,-1391.53,-2497.71)";
const T_LETTER = "matrix(0.871777,0.233592,-0.226855,0.846635,7215.18,14870.5)";

const FILL: string[] = [
  "M189.379,343.074C205.305,369.276 228.429,379.762 260.87,371.271C265.292,370.113 269.725,373.124 270.116,377.68C271.24,390.817 272.585,403.299 272.501,415.772C272.187,462.216 260.748,506.324 242.884,549.006C239.417,557.287 230.705,562.155 221.858,560.635C212.887,559.095 203.808,557.757 194.732,557.302C182.557,556.691 180.168,551.396 181.653,539.561C186.431,501.421 189.925,463.121 193.488,424.84C194.048,418.857 193.3,412.748 192.737,405.065C192.548,402.479 189.891,400.814 187.492,401.794C177.723,405.789 169.385,409.081 161.216,412.74C133.483,425.147 105.68,437.414 78.246,450.451C68.539,455.064 63.384,453.12 59.543,443.396C54.895,431.632 48.755,420.408 44.76,408.452C43.488,404.659 45.692,396.294 48.53,395.034L179.644,339.959C183.211,338.461 187.372,339.771 189.379,343.074Z",
  "M367.576,485.582C364.524,491.082 358.757,494.559 352.521,495.378C337.83,497.312 324.907,499.186 311.925,499.81C308.826,499.957 302.742,493.433 302.516,489.718C300.566,457.379 299.188,424.99 298.933,392.604C298.895,387.97 305.034,380.335 309.603,379.182C325.195,375.232 341.366,373.524 357.325,371.022C367.249,369.465 373.056,374.571 372.879,383.841C372.257,416.088 371.128,448.346 369.228,480.539C369.127,482.264 368.475,483.958 367.576,485.582Z",
  "M288.961,301.58C281.318,277.928 255.279,264.598 231.791,272.313C208.143,280.082 194.957,305.956 202.605,329.585C210.268,353.248 236.002,366.372 259.815,358.754C283.531,351.163 296.664,325.411 288.961,301.58ZM249.764,329.378C240.116,331.964 235.479,328.638 232.893,318.985C230.306,309.332 232.869,304.918 242.517,302.332C252.166,299.747 257.552,302.026 260.14,311.684C262.728,321.342 259.413,326.793 249.764,329.378Z",
  "M713.377,182.693C705.41,158.037 678.267,144.141 653.776,152.184C629.122,160.282 615.381,187.26 623.352,211.893C631.338,236.56 658.171,250.247 682.996,242.298C707.722,234.387 721.411,207.537 713.382,182.691L713.377,182.693ZM672.514,211.676C662.456,214.371 657.62,210.909 654.922,200.841C652.224,190.772 654.901,186.176 664.959,183.481C675.018,180.786 680.635,183.16 683.333,193.228C686.03,203.296 682.573,208.981 672.514,211.676Z",
  "M611.668,213.76C625.343,247.558 649.587,263.154 687.69,256.438C691.396,255.787 694.764,258.687 694.707,262.457C694.476,276.907 694.665,290.599 693.228,304.129C688.118,352.276 671.704,396.854 648.776,439.288C644.326,447.522 634.781,451.669 625.762,449.181C616.614,446.657 607.337,444.336 597.966,442.925C585.399,441.03 583.466,435.292 586.223,423.171C595.109,384.098 602.679,344.727 610.322,305.386C611.777,297.889 611.246,290.001 611.781,279.273C598.874,283.171 588.388,286.073 578.088,289.506C548.039,299.516 517.932,309.374 488.123,320.062C477.575,323.844 472.433,321.299 469.445,310.815C465.833,298.127 460.622,285.857 457.708,273.042C456.78,268.972 459.931,260.522 463.003,259.508C511.591,243.494 560.464,228.364 609.288,213.069C609.683,212.946 610.246,213.327 611.668,213.76Z",
  "M463.226,360.348C465.159,364.588 470.562,365.902 474.249,363.053C483.926,355.577 492.103,349.317 500.114,342.847C507.132,337.179 513.53,336.377 520.816,342.655C526.677,347.698 533.391,351.736 539.654,356.319C559.228,370.649 559.709,372.685 545.712,391.751C522.253,423.688 493.35,450.014 460.699,472.185C451.307,478.559 439.451,475.274 434.5,465.05C409.453,413.325 384.862,361.38 359.395,309.866C353.006,296.967 353.783,289.104 368.067,283.307C379.946,278.486 391.493,272.912 402.524,266.381C412.975,260.195 418.802,262.139 423.35,272.536C434.757,298.624 446.84,324.418 458.665,350.324L463.23,360.342L463.226,360.348Z",
  "M785.9,362.387C782.848,367.887 777.08,371.364 770.845,372.183C756.154,374.117 743.23,375.99 730.249,376.615C727.15,376.762 721.065,370.238 720.839,366.522C718.89,334.183 717.512,301.794 717.257,269.408C717.219,264.775 723.358,257.14 727.927,255.986C743.519,252.036 759.69,250.329 775.649,247.827C785.573,246.269 791.38,251.375 791.203,260.646C790.58,292.893 789.451,325.151 787.552,357.344C787.45,359.069 786.798,360.763 785.9,362.387Z",
  "M880.192,232.086C882.125,236.327 887.528,237.64 891.215,234.791C900.892,227.316 909.068,221.056 917.08,214.585C924.098,208.918 930.496,208.115 937.782,214.393C943.643,219.436 950.357,223.475 956.62,228.057C976.194,242.387 976.675,244.423 962.678,263.489C939.218,295.426 910.315,321.752 877.665,343.923C868.272,350.297 856.416,347.013 851.466,336.789C826.419,285.064 801.828,233.119 776.36,181.604C769.972,168.705 770.749,160.842 785.033,155.045C796.912,150.224 808.459,144.65 819.49,138.119C829.941,131.934 835.768,133.877 840.316,144.274C851.723,170.363 863.805,196.156 875.63,222.062L880.195,232.08L880.192,232.086Z",
];

type Variant = "ink" | "honey" | "cloud";

interface Props {
  variant?: Variant;
  width?: number;
  className?: string;
  /** Override the gradient stops (only used when variant is honey/cloud). */
  gradient?: readonly [string, string, string];
}

const HONEY: readonly [string, string, string] = ["#F2C94C", "#E8B830", "#D4A616"];
const CLOUD: readonly [string, string, string] = ["#F5F2ED", "#E8E4DD", "#DBD6CE"];

function zuboraVars(i: number): React.CSSProperties {
  return {
    // CSS custom property names — typed loosely to satisfy React's CSSProperties.
    ["--li" as never]: String(i),
    ["--wx" as never]: `${(Math.sin(i * PHI * 2.4) * 2.5).toFixed(3)}px`,
    ["--wy" as never]: `${(5 + Math.cos(i * PHI * 1.7) * 3).toFixed(3)}px`,
    ["--wr" as never]: `${(Math.sin(i * PHI * 0.9 + 1.2) * 1.5).toFixed(3)}deg`,
    ["--dur" as never]: `${(3.2 + Math.sin(i * PHI) * 0.5).toFixed(3)}s`,
  };
}

export function PuruWordmark({ variant = "honey", width = 240, className, gradient }: Props) {
  const reactId = useId();
  const fid = `wm-${reactId.replace(/[^a-z0-9-]/gi, "")}-${variant}`;
  const turbRef = useRef<SVGFETurbulenceElement | null>(null);

  const isGradient = variant === "honey" || variant === "cloud";
  const isCloud = variant === "cloud";
  const g = useMemo(() => gradient ?? (isCloud ? CLOUD : HONEY), [gradient, isCloud]);

  // Animate baseFrequency on the noise filter — the same gentle sine wobble
  // the Svelte original runs.
  useEffect(() => {
    let frame = 0;
    let t = 0;
    const tick = () => {
      t += 0.003;
      const freq = 0.012 + Math.sin(t) * 0.004;
      turbRef.current?.setAttribute(
        "baseFrequency",
        `${freq.toFixed(4)} ${(freq * 0.7).toFixed(4)}`,
      );
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <svg
      viewBox="0 0 994 374"
      width={width}
      className={className}
      style={{
        overflow: "visible",
        fillRule: "evenodd",
        clipRule: "evenodd",
        strokeLinejoin: "round",
        strokeMiterlimit: 2,
      }}
      aria-label="purupuru"
    >
      <defs>
        {isGradient && (
          <linearGradient id={`${fid}-fill`} x1="0" y1="0" x2="1" y2="0.5">
            <stop offset="0%" stopColor={g[0]} />
            <stop offset="40%" stopColor={g[1]} />
            <stop offset="100%" stopColor={g[2]} />
          </linearGradient>
        )}
        <filter id={fid} x="-5%" y="-5%" width="110%" height="120%">
          <feTurbulence
            ref={turbRef}
            type="fractalNoise"
            baseFrequency="0.012 0.009"
            numOctaves={3}
            seed={42}
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale={isGradient ? 3 : 2}
            xChannelSelector="R"
            yChannelSelector="G"
            result="displaced"
          />
          <feGaussianBlur in="displaced" stdDeviation={isGradient ? 2.5 : 0.3} result="blur" />
          {isGradient && (
            <>
              <feColorMatrix
                in="blur"
                type="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9"
                result="goo"
              />
              <feComposite in="displaced" in2="goo" operator="atop" />
            </>
          )}
        </filter>
      </defs>
      <g transform={T_OUTER}>
        <g transform={T_MIDDLE}>
          <g filter={`url(#${fid})`}>
            {FILL.map((d, i) => (
              <g key={i} transform={T_LETTER}>
                <g className="puru-zubora-letter" style={zuboraVars(i)}>
                  <path
                    d={d}
                    fill={isGradient ? `url(#${fid}-fill)` : "currentColor"}
                    fillRule="nonzero"
                  />
                </g>
              </g>
            ))}
          </g>
        </g>
      </g>
    </svg>
  );
}
