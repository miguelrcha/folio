"use client";

import { createPortal } from "react-dom";
import { useLanguage } from "@/components/LanguageProvider";
import { CV_TEMPLATES } from "@/lib/cv/templates";
import type { CvConfig } from "@/lib/cv/config";
import type { PublicProfile, Repo } from "@/lib/profile";

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v12" />
      <path d="M7 10l5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
}

// The read-only "here's what you're about to get" view for visitors
// clicking View CV, reflecting the owner's saved config — a docked side
// panel next to the (still fully visible and interactive) profile page,
// not a dialog over a dimmed backdrop. Renders the CV at natural size, no
// scale-to-fit: the panel is wide enough on its own to never need it.
// Never prints anything itself: Download CV just calls window.print(),
// and CvPrintFallback (already mounted on the profile page) is what the
// browser actually renders to PDF.
//
// Portaled to document.body for the same reason CV Studio's controls live
// outside <header>: this is triggered from DownloadCvButton, which renders
// inside <header>, and an ancestor's print:hidden would hide descendants
// regardless of their own classes.
export function CvPreviewPanel({
  profile,
  repos,
  config,
  onClose,
}: {
  profile: PublicProfile;
  repos: Repo[];
  config: CvConfig;
  onClose: () => void;
}) {
  const { t } = useLanguage();

  const CvTemplate = CV_TEMPLATES[config.template].component;

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-y-0 right-0 z-[100] w-full overflow-y-auto bg-white shadow-2xl print:hidden sm:w-[640px]">
      <div className="sticky top-0 z-10 flex justify-end gap-2 bg-white/95 px-4 py-3 backdrop-blur-sm">
        <button
          onClick={() => window.print()}
          aria-label={t("cvPreview.download")}
          className="inline-flex items-center gap-1.5 rounded-md bg-[#111827] px-3 py-1.5 font-mono text-xs text-white hover:opacity-90"
        >
          <DownloadIcon />
          {t("cvPreview.download")}
        </button>
        <button
          onClick={onClose}
          aria-label={t("modal.cancel")}
          className="inline-flex items-center justify-center rounded-md p-1.5 text-[#6b7280] hover:bg-black/[0.04] hover:text-[#111827]"
        >
          <CloseIcon />
        </button>
      </div>

      <div className="px-2 pb-10">
        <CvTemplate profile={profile} repos={repos} config={config} variant="preview" />
      </div>
    </div>,
    document.body
  );
}
