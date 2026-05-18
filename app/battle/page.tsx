import type { Metadata } from "next";
import { Suspense } from "react";
import { BattleScene } from "./_scene/BattleScene";
import { DevConsole } from "./_inspect/DevConsole";

export const metadata: Metadata = {
  title: "Battle · Purupuru",
  description: "Arrange your lineup. Discover the chain. Lock in.",
};

export default function BattlePage() {
  return (
    <>
      <BattleScene />
      <Suspense fallback={null}>
        <DevConsole />
      </Suspense>
    </>
  );
}
