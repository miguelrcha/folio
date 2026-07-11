"use client";

import { createPortal } from "react-dom";
import { useLanguage } from "@/components/LanguageProvider";
import { CvPreviewCanvasAutoFit } from "@/components/cv/CvPreviewCanvasAutoFit";
import { CV_TEMPLATES } from "@/lib/cv/templates";
import type { CvConfig } from "@/lib/cv/config";
import type { PublicProfile, Repo } from "@/lib/profile";

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  );
}

// A read-only "here's what you're about to get" popup shown before the
// actual print/PDF-save dialog opens — for visitors clicking View CV
// (see DownloadCvButton, reflecting the owner's saved config) and for the
// owner's own Print button inside CV Studio (reflecting their live,
// possibly-unsaved config). Either way, this component never prints
// anything itself: Download CV just calls window.print(), and whichever
// print-eligible CvTemplate node the caller already has mounted
// (CvPrintFallback on the profile page, or CV Studio's own print-variant
// node) is what the browser actually renders to PDF.
//
// Portaled to document.body for the same reason CV Studio's controls live
// outside <header>: an ancestor's print:hidden (or, here, a caller that
// happens to render this from inside <header>) would hide descendants
// regardless of their own classes.
export function CvPreviewModal({
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
    <div className="fixed inset-0 z-[100] flex print:hidden">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative m-auto flex h-screen w-screen flex-col overflow-hidden border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl sm:h-[90vh] sm:w-[95vw] sm:max-w-4xl sm:rounded-xl sm:border">
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
          <h2 className="font-mono text-sm text-[var(--color-text)]">{t("cvPreview.title")}</h2>
          <button
            onClick={onClose}
            aria-label={t("modal.cancel")}
            className="text-[var(--color-text-faint)] hover:text-[var(--color-text)]"
          >
            <CloseIcon />
          </button>
        </div>

        <CvPreviewCanvasAutoFit>
          <CvTemplate profile={profile} repos={repos} config={config} variant="preview" />
        </CvPreviewCanvasAutoFit>

        <div className="flex shrink-0 justify-end gap-2 border-t border-[var(--color-border)] px-5 py-4">
          <button
            onClick={onClose}
            className="rounded-md border border-[var(--color-border)] px-4 py-2 font-mono text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          >
            {t("modal.cancel")}
          </button>
          <button
            onClick={() => window.print()}
            className="rounded-md bg-[var(--color-text)] px-5 py-2 font-mono text-sm text-[var(--color-ink)] hover:opacity-90"
          >
            {t("cvPreview.download")}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
