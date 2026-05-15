"use client";

import { useEffect, useState, type ComponentType } from "react";

import dynamic from "next/dynamic";

const AgentationPanel = dynamic<Record<string, never>>(
  () =>
    import("agentation").then(
      (mod) => mod.Agentation as unknown as ComponentType<Record<string, never>>,
    ),
  { ssr: false },
);

export function AgentationMount() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setEnabled(
      params.get("agentation") === "1" ||
        window.localStorage.getItem("agentation") === "1",
    );
  }, []);

  return enabled ? <AgentationPanel /> : null;
}
