"use client";
import { Effect } from "effect";
import { runtime } from "@/lib/runtime/runtime";
import { Invocation, type InvocationCommand } from "@/lib/world/invocation.port";

export function InvocationExample() {
  const trigger = (cmd: InvocationCommand) => {
    const program = Effect.gen(function* () {
      const i = yield* Invocation;
      yield* i.invoke(cmd);
    });
    runtime.runPromise(program).catch(console.error);
  };
  return (
    <div style={{ display: "flex", gap: 8, fontFamily: "monospace", fontSize: 11 }}>
      <button onClick={() => trigger({ _tag: "TriggerStoneClaim", element: "fire" })}>
        trigger fire claim
      </button>
      <button onClick={() => trigger({ _tag: "ResetPopulation" })}>reset population</button>
      <button onClick={() => trigger({ _tag: "ShiftWeather", toElement: "water" })}>
        shift weather → water
      </button>
    </div>
  );
}
