"use client";

import { useEffect, useRef, useState } from "react";

// Scales its child down (never up) so the whole page is visible with no
// scrolling, in either direction, no matter how small the surrounding pane
// is — re-measures on any container/content resize (e.g. toggling a
// section changes the page's height). This is the opposite tradeoff from
// CvPreviewCanvas (used by the full-screen CV Studio, which always has
// plenty of room and reads better at true size): a popup has a fixed,
// often mobile-constrained size, so guaranteeing the entire page fits
// matters more here than rendering at 1:1 scale.
export function CvPreviewCanvasAutoFit({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    const recalc = () => {
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      const nw = content.scrollWidth;
      const nh = content.scrollHeight;
      if (!nw || !nh) return;
      setScale(Math.min(cw / nw, ch / nh, 1));
    };

    recalc();
    const ro = new ResizeObserver(recalc);
    ro.observe(container);
    ro.observe(content);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="flex flex-1 items-center justify-center overflow-hidden bg-black/40 p-4 sm:p-8">
      {/* shrink-0: without it, this flex item's layout box (which the scale
          above is computed from and centered against) gets compressed to
          fit the container by ordinary flexbox shrinking, forcing the page
          to re-wrap narrower instead of staying at its true width and
          shrinking visually via transform — the measured/centered box and
          the painted (scaled) box fall out of sync, and the page renders
          off-center and wrong. */}
      <div ref={contentRef} className="shrink-0 shadow-2xl" style={{ transform: `scale(${scale})` }}>
        {children}
      </div>
    </div>
  );
}
