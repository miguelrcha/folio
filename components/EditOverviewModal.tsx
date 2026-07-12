"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/components/LanguageProvider";
import { ModalDialog } from "@/components/ModalDialog";

export function EditOverviewModal({
  profileId,
  initialSummary,
}: {
  profileId: string;
  initialSummary: string;
}) {
  const router = useRouter();
  const { t } = useLanguage();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(initialSummary);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpen = () => {
    setText(initialSummary);
    setError(null);
    setOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ summary: text.trim(), summary_manual: true })
      .eq("id", profileId);
    setSaving(false);

    if (updateError) {
      setError(t("modal.unexpectedError"));
      return;
    }

    setOpen(false);
    router.refresh();
  };

  return (
    <>
      <button
        onClick={handleOpen}
        aria-label={t("modal.overview.ariaEdit")}
        className="inline-flex items-center justify-center h-6 w-6 rounded-md text-[var(--color-text-faint)] hover:text-[var(--color-text)] hover:bg-white/[0.06] transition-colors"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-3.5 w-3.5"
        >
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
        </svg>
      </button>

      {open && (
        <ModalDialog
          label={t("modal.overview.title")}
          onClose={() => setOpen(false)}
          panelClassName="relative w-full max-w-lg flex flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl"
        >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
              <h2 className="font-mono text-sm text-[var(--color-text)]">{t("modal.overview.title")}</h2>
              <button
                onClick={() => setOpen(false)}
                aria-label={t("modal.close")}
                className="text-[var(--color-text-faint)] hover:text-[var(--color-text)]"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <line x1="6" y1="6" x2="18" y2="18" />
                  <line x1="18" y1="6" x2="6" y2="18" />
                </svg>
              </button>
            </div>

            <div className="px-5 py-4">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={6}
                aria-label={t("modal.overview.ariaSummary")}
                placeholder={t("modal.overview.placeholder")}
                className="w-full resize-none rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3.5 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-faint)] outline-none focus:border-white/20 transition-colors"
              />
              <p className="mt-2 text-xs text-[var(--color-text-faint)] font-mono">
                {t("modal.overview.characters", { n: text.length })}
              </p>
              {error && <p className="mt-2 text-xs text-red-400 font-mono">{error}</p>}
            </div>

            <div className="px-5 py-4 border-t border-[var(--color-border)] flex justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                className="rounded-md border border-[var(--color-border)] px-4 py-2 font-mono text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] cursor-pointer transition-colors"
              >
                {t("modal.cancel")}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-md bg-[var(--color-text)] px-5 py-2 font-mono text-sm text-[var(--color-ink)] hover:opacity-90 disabled:opacity-50 cursor-pointer transition-colors"
              >
                {saving ? t("modal.saving") : t("modal.save")}
              </button>
            </div>
        </ModalDialog>
      )}
    </>
  );
}