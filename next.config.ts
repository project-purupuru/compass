import type { NextConfig } from "next";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Playwright and local dev sessions may reach the same dev server through
  // either loopback hostname. Next 16 blocks dev-only endpoints cross-origin
  // unless both are explicitly accepted.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  turbopack: {
    root: projectRoot,
  },
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
