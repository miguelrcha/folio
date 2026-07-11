"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type CvPreviewContextValue = {
  panelOpen: boolean;
  setPanelOpen: (open: boolean) => void;
};

const CvPreviewContext = createContext<CvPreviewContextValue | null>(null);

// Shared between DownloadCvButton (toggles the docked CvPreviewPanel open)
// and the page layout shell (reflows the profile into the remaining space
// so the panel docks beside it instead of covering it) — the panel is a
// sibling of <header>, portaled to document.body, so this state can't just
// live locally in DownloadCvButton if anything outside it needs to react
// to open/closed.
export function CvPreviewCoordinator({ children }: { children: ReactNode }) {
  const [panelOpen, setPanelOpen] = useState(false);
  return (
    <CvPreviewContext.Provider value={{ panelOpen, setPanelOpen }}>
      {children}
    </CvPreviewContext.Provider>
  );
}

export function useCvPreview() {
  const ctx = useContext(CvPreviewContext);
  if (!ctx) throw new Error("useCvPreview must be used within a CvPreviewCoordinator");
  return ctx;
}
