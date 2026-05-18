import type { Metadata } from "next";
import { BurnCeremony } from "./_ceremony/BurnCeremony";

/**
 * The `/burn` route — the burn-rite ceremony (burn-rite cycle S5).
 *
 * A feel-first ritual: a player gives back a complete element-set and
 * receives a transcendence card. Ports the FLOW and INTENT of
 * purupuru-game's `routes/burn/+page.svelte` — reimplemented in React +
 * `motion` (SDD §8). Server component shell; the 5-phase state machine
 * and the single Effect-runtime touch live in the `BurnCeremony` client
 * component.
 */

export const metadata: Metadata = {
  title: "The Burn · Purupuru",
  description: "Give back a complete set. Something whole returns.",
};

export default function BurnPage() {
  return <BurnCeremony />;
}
