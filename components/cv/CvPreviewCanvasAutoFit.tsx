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
  // null until the first measurement: rendering at an implicit scale of 1
  // in the meantime would flash the page at full (unscaled) size for a
  // frame, before recalc() has a chance to run.
  const [scale, setScale] = useState<number | null>(null);

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
    // No overflow-hidden here: the scale above already guarantees the page
    // itself fits, so clipping was only ever catching the shadow below —
    // box-shadow isn't part of any element's layout box (scrollWidth/Height
    // ignore it), so at scale 1 (a roomy desktop pane, little or no
    // shrinking needed) its blur routinely reached past the padding and
    // got sliced off in a hard rectangle instead of fading out, reading as
    // a chewed-looking edge on both sides of the page.
    <div ref={containerRef} className="flex flex-1 items-center justify-center bg-black/40 p-4 sm:p-8">
      {/* shrink-0: without it, this flex item's layout box (which the scale
          above is computed from and centered against) gets compressed to
          fit the container by ordinary flexbox shrinking, forcing the page
          to re-wrap narrower instead of staying at its true width and
          shrinking visually via transform — the measured/centered box and
          the painted (scaled) box fall out of sync, and the page renders
          off-center and wrong. */}
      <div
        ref={contentRef}
        className={`shrink-0 shadow-2xl ${scale === null ? "invisible" : ""}`}
        style={{ transform: `scale(${scale ?? 1})` }}
      >
        {children}
      </div>
    </div>
  );
}
