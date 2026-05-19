"use client";

import { type ComponentType } from "react";

import dynamic from "next/dynamic";

const AgentationPanel = dynamic<Record<string, never>>(
  () =>
    import("agentation").then(
      (mod) => mod.Agentation as unknown as ComponentType<Record<string, never>>,
    ),
  { ssr: false },
);

export function AgentationMount() {
  return <AgentationPanel />;
}
