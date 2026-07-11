"use client";

// Renders its child at natural (print) size, scrolling the surrounding
// canvas rather than shrinking the page to fit — a scaled-down preview read
// worse than a scrollable one at true size. Flush white background (no
// gutter, no drop shadow), matching the docked CvPreviewPanel visitors see:
// the studio's live preview and the visitor's read-only one should look
// like the same surface. Centering is done with margin auto on the child
// (not justify-center on the container): when the child is wider than the
// pane, a centered flex item overflows equally on both sides and the left
// edge becomes unreachable (scroll containers can't scroll to a negative
// offset) — margin auto instead collapses to 0 and left-aligns, so every
// letter stays scrollable into view.
//
// The gutter is padding on this inner wrapper, not on the scroll container:
// a scroll container's own leading-edge padding (left, when scrolled
// horizontally) collapses to 0 once its content overflows — only the
// trailing edge's padding survives — so a lopsided gutter would reappear.
// Padding that belongs to the wrapper being centered/scrolled has no such
// asymmetry, since it's baked into the wrapper's own box on every side.
// overscroll-contain: at typical widths the page has no horizontal overflow
// at all (scrollWidth === clientWidth), so a trackpad left/right swipe here
// has nothing to scroll — without this, the browser reads that as "swipe to
// navigate back," and a screenshot mid-slide looks exactly like the page
// getting sliced. Containing overscroll stops that chain without touching
// the panel's own (vertical) scrolling.
export function CvPreviewCanvas({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 overflow-auto overscroll-contain bg-white">
      <div className="mx-auto h-fit w-fit px-2 pb-10">{children}</div>
    </div>
  );
}
