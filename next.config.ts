import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Transpile workspace packages so Next.js can resolve TypeScript source
  // (Sprint-1 · S1-T5..T8 · routes import from packages/* directly).
  transpilePackages: [
    "@purupuru/peripheral-events",
    "@purupuru/world-sources",
    "@purupuru/medium-blink",
  ],
  experimental: {
    // Next already optimizes lucide-react and effect by default. These are
    // the remaining named-export packages on the battle/burn client surfaces.
    optimizePackageImports: ["motion", "@phosphor-icons/react"],
  },
};

export default nextConfig;
