/**
 * LabPortal — escape hatch for DOM UI that must NOT be reconciled by r3f.
 *
 * When called from inside a `<Canvas>`, `createPortal` from react-dom does
 * NOT fully escape r3f's custom reconciler — the JSX children still belong
 * to the same Fiber tree, so r3f tries to reconcile bare HTML tags (`img`,
 * `div`, `button`) against the THREE.* namespace and errors:
 *
 *   R3F: Img is not part of the THREE namespace! Did you forget to extend?
 *
 * Solution: mount an INDEPENDENT React root via `createRoot` from
 * react-dom/client at a div appended to document.body. The new root has
 * react-dom's reconciler, so HTML tags work normally. The r3f Canvas's
 * reconciler never sees the children.
 *
 * Trade-off: contexts from the r3f tree don't flow into the portal tree
 * (no theme provider, no React DnD, etc.). The card-lab doesn't rely on
 * any such context — global CSS vars cascade via document body, that's it.
 */

"use client";

import { useEffect, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";

interface LabPortalProps {
  readonly children: React.ReactNode;
}

export function LabPortal({ children }: LabPortalProps) {
  const rootRef = useRef<Root | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Mount once; unmount on tear-down. The independent React root lives
  // for as long as this component is mounted.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const container = document.createElement("div");
    container.dataset.labPortal = "card-lab";
    document.body.appendChild(container);
    const root = createRoot(container);
    rootRef.current = root;
    containerRef.current = container;
    return () => {
      // requestAnimationFrame defers unmount past the synchronous strict-
      // mode unmount/remount cycle that React 19 fires during HMR + dev.
      const r = root;
      const c = container;
      requestAnimationFrame(() => {
        r.unmount();
        c.remove();
      });
      rootRef.current = null;
      containerRef.current = null;
    };
  }, []);

  // Re-render the children whenever they change.
  useEffect(() => {
    if (!rootRef.current) return;
    rootRef.current.render(<>{children}</>);
  }, [children]);

  return null;
}
