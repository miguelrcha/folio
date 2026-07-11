"use client";

import { useCvPreview } from "@/components/CvPreviewCoordinator";

// Reflows the whole page (header + main + footer) into the space to the
// left of the docked CvPreviewPanel while it's open, instead of letting a
// fixed-position panel just cover whatever happened to be underneath it.
// Padding on this outer wrapper narrows the containing block that <main>'s
// own max-w-4xl mx-auto centers within, so the profile naturally reflows
// to fill the remaining width — normal page scroll then reaches all of it,
// none of it hidden behind the panel.
//
// sm: only — matches CvPreviewPanel's own breakpoint (see
// CV_PREVIEW_PANEL_WIDTH there — keep the 640px value in sync if it
// changes). Below sm the panel already takes over the full viewport, so
// there's no "beside it" space to reflow into.
export function CvPreviewLayoutShell({ children }: { children: React.ReactNode }) {
  const { panelOpen } = useCvPreview();

  return (
    <div
      className={`relative z-10 min-h-screen transition-[padding-right] duration-200 ${panelOpen ? "sm:pr-[640px]" : ""}`}
    >
      {children}
    </div>
  );
}
