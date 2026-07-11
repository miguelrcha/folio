"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type CvExportContextValue = {
  studioOpen: boolean;
  setStudioOpen: (open: boolean) => void;
};

const CvExportContext = createContext<CvExportContextValue | null>(null);

// Shared between DownloadCvButton (inside <header>, opens the Studio) and
// CvPrintFallback (a page-level sibling outside <header>) so exactly one
// print-eligible CV node is ever mounted: the fallback while the Studio is
// closed, the Studio's own live-config node while it's open. Never both —
// that would print two CV pages back to back.
export function CvExportCoordinator({ children }: { children: ReactNode }) {
  const [studioOpen, setStudioOpen] = useState(false);
  return (
    <CvExportContext.Provider value={{ studioOpen, setStudioOpen }}>
      {children}
    </CvExportContext.Provider>
  );
}

export function useCvExport() {
  const ctx = useContext(CvExportContext);
  if (!ctx) throw new Error("useCvExport must be used within a CvExportCoordinator");
  return ctx;
}
