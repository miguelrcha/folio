"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/components/LanguageProvider";
import { ProfileHeader } from "@/components/ProfileHeader";
import { SignOutButton } from "@/components/SignOutButton";
import { CV_TEMPLATES } from "@/lib/cv/templates";
import {
  resolveCvConfig,
  type CvConfig,
  type CvFont,
  type CvSectionKey,
  type CvTemplateKey,
} from "@/lib/cv/config";
import type { PublicProfile, Repo } from "@/lib/profile";

// Renders its child at natural (print) size, scrolling the surrounding
// canvas rather than shrinking the page to fit — a scaled-down preview read
// worse than a scrollable one at true size. Centering is done with margin
// auto on the child (not justify-center on the container): when the child
// is wider than the pane, a centered flex item overflows equally on both
// sides and the left edge becomes unreachable (scroll containers can't
// scroll to a negative offset) — margin auto instead collapses to 0 and
// left-aligns, so every letter stays scrollable into view.
//
// The gutter is padding on this inner wrapper, not on the scroll container:
// a scroll container's own leading-edge padding (left, when scrolled
// horizontally) collapses to 0 once its content overflows — only the
// trailing edge's padding survives — so a lopsided gutter would reappear.
// Padding that belongs to the wrapper being centered/scrolled has no such
// asymmetry, since it's baked into the wrapper's own box on every side.
function CvPreviewCanvas({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 overflow-auto bg-black/40">
      <div className="mx-auto h-fit w-fit p-8">
        <div className="shadow-2xl">{children}</div>
      </div>
    </div>
  );
}

// Owner-only "Customize CV" screen: a full page (not a modal) so the live
// preview gets the whole viewport instead of being squeezed into a dialog box.
// Template/photo/bio/section controls on the left, a live full-screen preview
// of the selected template on the right (a plain React re-render — no PDF
// regeneration, no debounce needed, so it tracks every keystroke/toggle in
// real time). Also renders its own print-variant node (a sibling of the
// on-screen layout, outside the h-screen/overflow-hidden wrapper so a
// multi-page CV never gets clipped) reflecting the live, possibly-unsaved
// config — this route is the only place that mounts a print-eligible CV
// node while it's open, so there's no coordination needed with
// CvPrintFallback on the main profile page.
export function CvStudioScreen({
  profile,
  repos,
}: {
  profile: PublicProfile;
  repos: Repo[];
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
        console.error("CvStudioScreen: error saving:", updateError.message);
        setError(updateError.message);
        return;
      }

      router.refresh();
    } catch (err) {
      console.error("CvStudioScreen: unexpected failure while saving:", err);
      setError(err instanceof Error ? err.message : t("modal.unexpectedError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex h-screen flex-col overflow-hidden print:hidden">
        <ProfileHeader>
          <SignOutButton />
          <Link
            href={`/${profile.github_username}`}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] transition-colors text-sm h-9 px-4 font-medium text-[var(--color-text)]"
          >
            {t("cvStudio.backToProfile")}
          </Link>
        </ProfileHeader>

        <div className="flex flex-1 min-h-0">
          <div className="w-[300px] shrink-0 flex flex-col overflow-y-auto border-r border-[var(--color-border)] p-5">
            <h1 className="mb-5 font-mono text-sm text-[var(--color-text)]">{t("cvStudio.title")}</h1>

            <div className="flex-1 space-y-6">
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

            <div className="shrink-0 pt-6">
              {error && (
                <p className="mb-3 text-xs font-mono text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
                  {error}
                </p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={handlePrint}
                  className="flex-1 rounded-md border border-[var(--color-border)] px-4 py-2 font-mono text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                >
                  {t("cvStudio.print")}
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 rounded-md bg-[var(--color-text)] px-5 py-2 font-mono text-sm text-[var(--color-ink)] hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? t("modal.saving") : t("modal.save")}
                </button>
              </div>
            </div>
          </div>

          <CvPreviewCanvas>
            <CvTemplate profile={profile} repos={repos} config={config} variant="preview" />
          </CvPreviewCanvas>
        </div>
      </div>

      <CvTemplate profile={profile} repos={repos} config={config} variant="print" />
    </>
  );
}
