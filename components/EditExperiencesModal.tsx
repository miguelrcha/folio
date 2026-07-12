"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/components/LanguageProvider";
import { ModalDialog } from "@/components/ModalDialog";
import {
  getMonths,
  emptyExperienceEntry as emptyEntry,
  type ExperienceEntry,
} from "@/lib/experience";

export function EditExperiencesModal({
  profileId,
  initialEntries,
}: {
  profileId: string;
  initialEntries: ExperienceEntry[];
}) {
  const router = useRouter();
  const { t, lang } = useLanguage();
  const supabase = createClient();
  const months = getMonths(lang);
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<ExperienceEntry[]>(initialEntries);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpen = () => {
    setError(null);
    setEntries(initialEntries.length > 0 ? initialEntries : [emptyEntry()]);
    setOpen(true);
  };

  const updateEntry = (index: number, patch: Partial<ExperienceEntry>) => {
    setEntries((prev) => prev.map((e, i) => (i === index ? { ...e, ...patch } : e)));
  };

  const addEntry = () => setEntries((prev) => [...prev, emptyEntry()]);
  const removeEntry = (index: number) => setEntries((prev) => prev.filter((_, i) => i !== index));

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const cleaned = entries
      .filter((e) => e.title.trim() || e.company.trim())
      .map((e) => ({
        ...e,
        bullets: (e.bullets ?? []).map((b) => b.trim()).filter(Boolean),
      }));

    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ experiences_json: cleaned })
        .eq("id", profileId);

      if (updateError) {
        console.error("EditExperiencesModal: error saving:", updateError.message);
        setError(updateError.message);
        return;
      }

      setOpen(false);
      router.refresh();
    } catch (err) {
      console.error("EditExperiencesModal: unexpected failure while saving:", err);
      setError(err instanceof Error ? err.message : t("modal.unexpectedError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        onClick={handleOpen}
        aria-label={t("modal.experiences.ariaEdit")}
        className="inline-flex items-center justify-center h-6 w-6 rounded-md text-[var(--color-text-faint)] hover:text-[var(--color-text)] hover:bg-white/[0.06] transition-colors"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
        </svg>
      </button>

      {open && (
        <ModalDialog
          label={t("modal.experiences.title")}
          onClose={() => setOpen(false)}
          panelClassName="relative w-full max-w-xl max-h-[85vh] flex flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl"
        >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
              <h2 className="font-mono text-sm text-[var(--color-text)]">{t("modal.experiences.title")}</h2>
              <button onClick={() => setOpen(false)} aria-label={t("modal.close")} className="text-[var(--color-text-faint)] hover:text-[var(--color-text)]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <line x1="6" y1="6" x2="18" y2="18" />
                  <line x1="18" y1="6" x2="6" y2="18" />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto px-5 py-4 space-y-5">
              {entries.map((entry, i) => (
                <div key={i} className="rounded-lg border border-[var(--color-border)] p-4 space-y-3 relative">
                  {entries.length > 1 && (
                    <button
                      onClick={() => removeEntry(i)}
                      className="absolute top-3 right-3 text-[var(--color-text-faint)] hover:text-red-400 transition-colors"
                      aria-label={t("modal.experiences.ariaRemove")}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <line x1="6" y1="6" x2="18" y2="18" />
                        <line x1="18" y1="6" x2="6" y2="18" />
                      </svg>
                    </button>
                  )}

                  <div>
                    <label htmlFor={`exp-${i}-title`} className="text-xs font-mono text-[var(--color-text-faint)]">{t("modal.experiences.jobTitle")}</label>
                    <input
                      id={`exp-${i}-title`}
                      type="text"
                      value={entry.title}
                      onChange={(e) => updateEntry(i, { title: e.target.value })}
                      placeholder={t("modal.experiences.jobTitlePlaceholder")}
                      className="mt-1 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-faint)] outline-none focus:border-white/20"
                    />
                  </div>

                  <div>
                    <label htmlFor={`exp-${i}-company`} className="text-xs font-mono text-[var(--color-text-faint)]">{t("modal.experiences.company")}</label>
                    <input
                      id={`exp-${i}-company`}
                      type="text"
                      value={entry.company}
                      onChange={(e) => updateEntry(i, { company: e.target.value })}
                      placeholder={t("modal.experiences.companyPlaceholder")}
                      className="mt-1 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-faint)] outline-none focus:border-white/20"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-mono text-[var(--color-text-faint)]">{t("modal.experiences.start")}</label>
                      <div className="mt-1 flex gap-2">
                        <select
                          value={entry.startMonth}
                          aria-label={t("modal.experiences.start")}
                          onChange={(e) => updateEntry(i, { startMonth: Number(e.target.value) })}
                          className="w-1/2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-2 py-2 text-sm text-[var(--color-text)] outline-none focus:border-white/20"
                        >
                          {months.map((m, idx) => (
                            <option key={m} value={idx + 1}>{m}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          value={entry.startYear}
                          onChange={(e) => updateEntry(i, { startYear: Number(e.target.value) })}
                          aria-label={t("modal.experiences.year")}
                          placeholder={t("modal.experiences.year")}
                          className="w-1/2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-2 py-2 text-sm text-[var(--color-text)] outline-none focus:border-white/20"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-mono text-[var(--color-text-faint)]">{t("modal.experiences.end")}</label>
                      <div className="mt-1 flex gap-2">
                        <select
                          value={entry.endMonth ?? ""}
                          disabled={entry.current}
                          aria-label={t("modal.experiences.end")}
                          onChange={(e) => updateEntry(i, { endMonth: Number(e.target.value) })}
                          className="w-1/2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-2 py-2 text-sm text-[var(--color-text)] outline-none focus:border-white/20 disabled:opacity-40"
                        >
                          <option value="">--</option>
                          {months.map((m, idx) => (
                            <option key={m} value={idx + 1}>{m}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          value={entry.endYear ?? ""}
                          disabled={entry.current}
                          onChange={(e) => updateEntry(i, { endYear: Number(e.target.value) })}
                          aria-label={t("modal.experiences.year")}
                          placeholder={t("modal.experiences.year")}
                          className="w-1/2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-2 py-2 text-sm text-[var(--color-text)] outline-none focus:border-white/20 disabled:opacity-40"
                        />
                      </div>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-xs font-mono text-[var(--color-text-muted)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={entry.current}
                      onChange={(e) =>
                        updateEntry(i, {
                          current: e.target.checked,
                          endMonth: e.target.checked ? null : entry.endMonth,
                          endYear: e.target.checked ? null : entry.endYear,
                        })
                      }
                    />
                    {t("modal.experiences.current")}
                  </label>

                  <div>
                    <label htmlFor={`exp-${i}-bullets`} className="text-xs font-mono text-[var(--color-text-faint)]">
                      {t("modal.experiences.whatYouDid")}
                    </label>
                    <textarea
                      id={`exp-${i}-bullets`}
                      value={(entry.bullets ?? []).join("\n")}
                      onChange={(e) => updateEntry(i, { bullets: e.target.value.split("\n") })}
                      rows={5}
                      placeholder={t("modal.experiences.bulletsPlaceholder")}
                      className="mt-1 w-full resize-none rounded-md border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-faint)] outline-none focus:border-white/20"
                    />
                  </div>
                </div>
              ))}

              <button
                onClick={addEntry}
                className="w-full rounded-md border border-dashed border-[var(--color-border-bright)] py-2.5 text-sm font-mono text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-white/30 transition-colors"
              >
                {t("modal.experiences.addEntry")}
              </button>
            </div>

            <div className="px-5 py-4 border-t border-[var(--color-border)]">
              {error && (
                <p className="mb-3 text-xs font-mono text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
                  {error}
                </p>
              )}
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-md border border-[var(--color-border)] px-4 py-2 font-mono text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                >
                  {t("modal.cancel")}
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
        </ModalDialog>
      )}
    </>
  );
}