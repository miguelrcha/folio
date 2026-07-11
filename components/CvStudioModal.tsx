"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/components/LanguageProvider";
import { CV_TEMPLATES } from "@/lib/cv/templates";
import {
  resolveCvConfig,
  type CvConfig,
  type CvFont,
  type CvSectionKey,
  type CvTemplateKey,
} from "@/lib/cv/config";
import type { PublicProfile, Repo } from "@/lib/profile";

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  );
}

// Scales its child down (never up) so the whole page is visible inside
// whatever space is available, instead of rendering at natural print size
// and forcing a scrollbar — re-measures on any container/content resize
// (e.g. toggling a section changes the page's height).
function CvPreviewCanvas({ children }: { children: React.ReactNode }) {
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
    <div ref={containerRef} className="flex flex-1 items-center justify-center overflow-hidden bg-black/40 p-8">
      <div ref={contentRef} className="shadow-2xl" style={{ transform: `scale(${scale})` }}>
        {children}
      </div>
    </div>
  );
}

// Owner-only "Customize CV" editor: template/photo/bio/section controls on the
// left, a live preview of the selected template on the right (a plain React
// re-render — no PDF regeneration, no debounce needed). Also carries its own
// print-variant node (bottom of the portaled tree) reflecting the live,
// possibly-unsaved config — CvPrintFallback (rendered elsewhere on the page)
// steps aside while this modal is open, via CvExportCoordinator, so there's
// never two print-eligible CV nodes mounted at once.
//
// Portaled to document.body because ProfileHeader renders a real <header>,
// and globals.css hides it entirely on print
// (`header { display: none !important }`) — an ancestor display:none hides
// all descendants regardless of their own print:block, so this modal must
// live outside that subtree.
export function CvStudioModal({
  profile,
  repos,
  onClose,
}: {
  profile: PublicProfile;
  repos: Repo[];
  onClose: () => void;
}) {
  const router = useRouter();
  const { t } = useLanguage();
  const supabase = createClient();
  const [config, setConfig] = useState<CvConfig>(() => resolveCvConfig(profile.cv_config));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const TEMPLATE_LABELS: Record<CvTemplateKey, string> = {
    classic: t("cvStudio.template.classic"),
    modern: t("cvStudio.template.modern"),
  };

  const FONT_LABELS: Record<CvFont, string> = {
    sans: t("cvStudio.font.sans"),
    serif: t("cvStudio.font.serif"),
  };

  const SECTION_LABELS: Record<CvSectionKey, string> = {
    overview: t("cvStudio.section.overview"),
    experiences: t("cvStudio.section.experiences"),
    stacks: t("cvStudio.section.stacks"),
    projects: t("cvStudio.section.projects"),
    certifications: t("cvStudio.section.certifications"),
    languages: t("cvStudio.section.languages"),
  };

  const CvTemplate = CV_TEMPLATES[config.template].component;

  const toggleSection = (key: CvSectionKey) => {
    setConfig((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => (s.key === key ? { ...s, visible: !s.visible } : s)),
    }));
  };

  const handlePrint = () => window.print();

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ cv_config: config })
        .eq("id", profile.id);

      if (updateError) {
        console.error("CvStudioModal: error saving:", updateError.message);
        setError(updateError.message);
        return;
      }

      router.refresh();
    } catch (err) {
      console.error("CvStudioModal: unexpected failure while saving:", err);
      setError(err instanceof Error ? err.message : t("modal.unexpectedError"));
    } finally {
      setSaving(false);
    }
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[100] flex print:hidden">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
        <div className="relative m-auto flex h-[90vh] w-[95vw] max-w-6xl flex-col overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl">
          <div className="flex shrink-0 items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
            <h2 className="font-mono text-sm text-[var(--color-text)]">{t("cvStudio.title")}</h2>
            <button
              onClick={onClose}
              aria-label={t("modal.cancel")}
              className="text-[var(--color-text-faint)] hover:text-[var(--color-text)]"
            >
              <CloseIcon />
            </button>
          </div>

          <div className="flex flex-1 overflow-hidden">
            <div className="w-[300px] shrink-0 space-y-6 overflow-y-auto border-r border-[var(--color-border)] p-5">
              <div className="space-y-2">
                <p className="text-xs font-mono text-[var(--color-text-faint)] uppercase tracking-wide">
                  {t("cvStudio.template")}
                </p>
                <div className="flex gap-2">
                  {(Object.keys(CV_TEMPLATES) as CvTemplateKey[]).map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setConfig((prev) => ({ ...prev, template: key }))}
                      className={`flex-1 rounded-md border px-3 py-2 text-sm font-mono transition-colors ${
                        config.template === key
                          ? "border-transparent bg-[var(--color-text)] text-[var(--color-ink)]"
                          : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                      }`}
                    >
                      {TEMPLATE_LABELS[key]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-mono text-[var(--color-text-faint)] uppercase tracking-wide">
                  {t("cvStudio.font")}
                </p>
                <div className="flex gap-2">
                  {(Object.keys(FONT_LABELS) as CvFont[]).map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setConfig((prev) => ({ ...prev, font: key }))}
                      className={`flex-1 rounded-md border px-3 py-2 text-sm font-mono transition-colors ${
                        config.font === key
                          ? "border-transparent bg-[var(--color-text)] text-[var(--color-ink)]"
                          : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                      }`}
                    >
                      {FONT_LABELS[key]}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm font-mono text-[var(--color-text-muted)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showPhoto}
                  disabled={!CV_TEMPLATES[config.template].supportsPhoto}
                  onChange={(e) => setConfig((prev) => ({ ...prev, showPhoto: e.target.checked }))}
                />
                {t("cvStudio.showPhoto")}
              </label>

              <label className="flex items-center gap-2 text-sm font-mono text-[var(--color-text-muted)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.hideBio}
                  onChange={(e) => setConfig((prev) => ({ ...prev, hideBio: e.target.checked }))}
                />
                {t("cvStudio.hideBio")}
              </label>

              <div className="space-y-2">
                <p className="text-xs font-mono text-[var(--color-text-faint)] uppercase tracking-wide">
                  {t("cvStudio.sections")}
                </p>
                {config.sections.map((s) => (
                  <label
                    key={s.key}
                    className="flex items-center gap-2 text-sm font-mono text-[var(--color-text-muted)] cursor-pointer"
                  >
                    <input type="checkbox" checked={s.visible} onChange={() => toggleSection(s.key)} />
                    {SECTION_LABELS[s.key]}
                  </label>
                ))}
              </div>
            </div>

            <CvPreviewCanvas>
              <CvTemplate profile={profile} repos={repos} config={config} variant="preview" />
            </CvPreviewCanvas>
          </div>

          <div className="shrink-0 border-t border-[var(--color-border)] px-5 py-4">
            {error && (
              <p className="mb-3 text-xs font-mono text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={onClose}
                className="rounded-md border border-[var(--color-border)] px-4 py-2 font-mono text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              >
                {t("modal.cancel")}
              </button>
              <button
                onClick={handlePrint}
                className="rounded-md border border-[var(--color-border)] px-4 py-2 font-mono text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              >
                {t("cvStudio.print")}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-md bg-[var(--color-text)] px-5 py-2 font-mono text-sm text-[var(--color-ink)] hover:opacity-90 disabled:opacity-50"
              >
                {saving ? t("modal.saving") : t("modal.save")}
              </button>
            </div>
          </div>
        </div>
      </div>

      <CvTemplate profile={profile} repos={repos} config={config} variant="print" />
    </>,
    document.body
  );
}
