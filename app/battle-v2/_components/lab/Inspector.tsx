/**
 * Inspector · cycle-2 S2.2 rebuild on shadcn Tabs + brand tokens
 *
 * Right-rail Inspector showing selected entity's pointer chain · data ·
 * render summary · edit affordances across 4 tabs (cycle-1 shape · S6
 * collapses to 3 tabs PointerChain/Knobs/Data per FR-14).
 *
 * S2 decision (sprint plan: "Sheet OR persistent Resizable · decision inline"):
 *   - Sheet rejected: shadcn Sheet hardcodes a black/50 overlay that dims
 *     the rest of the surface (modal pattern). Cycle-1 behavior is non-
 *     modal coexistence with the main viewport — overlay would break the
 *     operator's mental model and conflict with the Three.js Canvas below.
 *   - Resizable rejected: shadcn Resizable requires parent ResizablePanelGroup
 *     which is S4 dock-shell work (FR-7). Adding it standalone in S2 would
 *     introduce a panel group with one child — wasted scaffolding.
 *   - DECISION: keep cycle-1's fixed-position aside + FAB-toggle behavior ·
 *     rebuild internal tabs on shadcn Tabs · style with --puru-* tokens ·
 *     defer Sheet/Resizable wrap to S4 dock-shell when the parent
 *     ResizablePanelGroup lands and the cross-pane layout question
 *     resolves naturally.
 *
 * Element-accent (artisan probe FR-17): 1px left-edge accent in the
 * inspected adapter's wuxing element color. S6 wires this to the live
 * selection state; S2 sets the visual primitive (default honey accent
 * when no element-aware context yet).
 *
 * API PRESERVED: same props (selectedNode · pointerChain · onClose) ·
 * sessionStorage key (lab.inspector.collapsed) · data-inspector attribute ·
 * cycle-1 callers work unchanged.
 */

"use client";

import { useEffect, useState } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Icon } from "@/lib/ui/icons/Icon";
import type { InspectableNode } from "@/lib/lab/adapter-registry/types";
import {
  segmentLabel,
  type PointerChain,
} from "@/lib/lab/pointer-chain/schema";

const STORAGE_KEY = "lab.inspector.collapsed";

type Tab = "pointer-chain" | "data" | "render" | "edit";

interface InspectorProps {
  selectedNode: InspectableNode | null;
  pointerChain: PointerChain | null;
  onClose?: () => void;
}

export function Inspector({
  selectedNode,
  pointerChain,
  onClose,
}: InspectorProps) {
  // Default collapsed so the Inspector doesn't overlap existing rails on first mount;
  // operator opens via the side FAB.
  const [collapsed, setCollapsed] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("pointer-chain");

  // Hydrate collapse state from sessionStorage (cycle-1 persistence preserved)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const v = window.sessionStorage.getItem(STORAGE_KEY);
      if (v === "0") setCollapsed(false);
    } catch {
      // silent
    }
  }, []);

  // Persist collapse state
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.sessionStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
    } catch {
      // silent
    }
  }, [collapsed]);

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        className="fixed right-0 top-1/2 -translate-y-1/2 bg-puru-cloud-deep/60 border border-puru-surface-border/40 border-r-0 rounded-l-md px-1.5 py-2 text-puru-ink-base hover:text-puru-honey-base transition-colors z-30 cursor-pointer"
        title="Open Inspector"
        data-inspector-collapsed
      >
        <Icon name="inspect" size={16} />
      </button>
    );
  }

  return (
    <aside
      className="fixed right-0 top-0 bottom-0 w-80 bg-puru-cloud-deep/92 backdrop-blur-md border-l-2 border-l-puru-honey-base/50 text-puru-ink-base font-puru-body text-xs flex flex-col z-25"
      data-inspector
      data-inspector-tab={activeTab}
    >
      {/* Header — element-accent edge per artisan FR-17 (the 1px left edge above
          on the <aside> is the element-aware accent · honey default · S6 wires
          to live selection element) */}
      <header className="flex items-center gap-2 px-3 py-2.5 border-b border-puru-surface-border/30">
        <Icon name="inspect" size={14} />
        <span className="flex-1 font-semibold">Inspector</span>
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          className="bg-transparent border-0 text-inherit cursor-pointer p-1 inline-flex hover:text-puru-honey-base transition-colors"
          title="Collapse"
        >
          <Icon name="visibility-off" size={12} />
        </button>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="bg-transparent border-0 text-inherit cursor-pointer p-1 inline-flex hover:text-puru-terra-base transition-colors"
            title="Close"
          >
            <Icon name="discard" size={12} />
          </button>
        )}
      </header>

      {/* Tabs — shadcn primitive · brand-token styling overrides */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as Tab)}
        className="flex-1 flex flex-col overflow-hidden gap-0"
      >
        <TabsList className="w-full justify-stretch rounded-none bg-transparent border-b border-puru-surface-border/30 p-0 h-auto">
          {(["pointer-chain", "data", "render", "edit"] as const).map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-puru-honey-base data-[state=active]:bg-puru-honey-base/10 data-[state=active]:text-puru-honey-base data-[state=active]:shadow-none text-puru-ink-soft hover:text-puru-ink-base text-xs py-2 capitalize"
            >
              {tab.replace("-", " ")}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="flex-1 overflow-auto p-3">
          {!selectedNode && (
            <div className="text-puru-ink-dim text-center py-6">
              <p>Click an entity in the viewport to inspect.</p>
            </div>
          )}

          {selectedNode && (
            <>
              <TabsContent value="pointer-chain" className="m-0">
                <div className="mb-3">
                  <div className="text-sm font-semibold text-puru-ink-rich">
                    {selectedNode.label}
                  </div>
                  <div className="text-[11px] text-puru-ink-dim">
                    {selectedNode.kind}
                  </div>
                </div>
                {pointerChain && pointerChain.length > 0 ? (
                  <ol className="list-none m-0 p-0 flex flex-col gap-2">
                    {pointerChain.map((seg, i) => (
                      <li
                        key={i}
                        className="px-2.5 py-2 bg-puru-cloud-base/8 border-l-2 border-puru-honey-base/60 rounded-sm font-puru-mono"
                      >
                        <div className="text-[10px] text-puru-ink-dim mb-0.5">
                          {seg._tag}
                        </div>
                        <div className="text-puru-ink-base">
                          {segmentLabel(seg)}
                        </div>
                        {"path" in seg && (
                          <div className="text-[10px] text-puru-ink-dim mt-0.5 break-words">
                            {seg.path}
                          </div>
                        )}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <div className="text-puru-ink-dim">No chain available.</div>
                )}
              </TabsContent>

              <TabsContent value="data" className="m-0">
                <pre className="text-[11px] font-puru-mono text-puru-ink-base whitespace-pre-wrap break-words">
                  {JSON.stringify(selectedNode.metadata, null, 2)}
                </pre>
              </TabsContent>

              <TabsContent value="render" className="m-0 text-puru-ink-soft">
                <p>Render summary (V0 stub — S6 lands the live Data tab per FR-16).</p>
                <pre className="text-[11px] font-puru-mono">id: {selectedNode.id}</pre>
                <pre className="text-[11px] font-puru-mono">
                  kind: {selectedNode.kind}
                </pre>
                <pre className="text-[11px] font-puru-mono">
                  inspectable: {String(selectedNode.inspectable)}
                </pre>
              </TabsContent>

              <TabsContent value="edit" className="m-0">
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        typeof navigator !== "undefined" &&
                        navigator.clipboard
                      ) {
                        navigator.clipboard.writeText(
                          JSON.stringify(pointerChain ?? [], null, 2),
                        );
                      }
                    }}
                    className="px-3 py-2 bg-puru-honey-base/12 border border-puru-honey-base/40 rounded text-puru-honey-base cursor-pointer inline-flex items-center gap-1.5 text-xs hover:bg-puru-honey-base/20 transition-colors font-puru-body"
                  >
                    <Icon name="copy" size={12} /> Copy pointer chain
                  </button>
                  <div className="text-[11px] text-puru-ink-dim">
                    Edit affordances · V0 stub · S6 lands the live Knobs tab per FR-14.
                  </div>
                </div>
              </TabsContent>
            </>
          )}
        </div>
      </Tabs>
    </aside>
  );
}
