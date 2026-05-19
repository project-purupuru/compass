# S0 Calibration Spike + S1a Baseline-Capture Image
#
# Pinned Playwright base ensures reproducible baselines across operator/CI.
# Per ADR-8 (locked in SDD): baselines authored INSIDE this image only.
#
# Image is consumed by:
#   - scripts/spikes/s0-calibration.ts (S0)
#   - pnpm regression:approve <primitive> (S1a)
#
# Build:
#   docker build -t lab-snapshot-baseline -f tests/snapshots/Dockerfile .
#
# Run:
#   docker run --rm -v "$(pwd):/work" -w /work lab-snapshot-baseline \
#     pnpm exec tsx scripts/spikes/s0-calibration.ts --mode docker

FROM mcr.microsoft.com/playwright:v1.60.0-noble

WORKDIR /work

# Install playwright package globally so spike scripts can `import 'playwright'`
# without needing the host's arch-specific node_modules mounted in.
# Browsers are already cached at /ms-playwright/ by the base image.
RUN npm install -g playwright@1.60.0
# Make globally-installed packages resolvable from /work
ENV NODE_PATH=/usr/lib/node_modules

# Enable pnpm via corepack (matches repo packageManager pin)
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

# Default command — overridden by caller
CMD ["node", "scripts/spikes/s0-calibration-docker.mjs"]
