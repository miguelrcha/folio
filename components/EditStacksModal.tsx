"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/components/LanguageProvider";
import { ModalDialog } from "@/components/ModalDialog";

export type StackEntry = { name: string; percentage: number; manual?: boolean };

export function EditStacksModal({
  profileId,
  initialStacks,
}: {
  profileId: string;
  initialStacks: StackEntry[];
}) {
  const router = useRouter();
  const { t } = useLanguage();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [stacks, setStacks] = useState<StackEntry[]>(initialStacks);
  const [newStack, setNewStack] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpen = () => {
    setError(null);
    setNewStack("");
    setStacks(initialStacks);
    setOpen(true);
  };

  const addStack = () => {
    const name = newStack.trim();
    if (!name) return;
    if (stacks.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
      setNewStack("");
      return;
    }
    setStacks((prev) => [...prev, { name, percentage: 0, manual: true }]);
    setNewStack("");
  };

  const removeStack = (name: string) => {
    setStacks((prev) => prev.filter((s) => s.name !== name));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ top_stack: stacks })
        .eq("id", profileId);

      if (updateError) {
        console.error("EditStacksModal: error saving:", updateError.message);
        setError(updateError.message);
        return;
      }

      setOpen(false);
      router.refresh();
    } catch (err) {
      console.error("EditStacksModal: unexpected failure while saving:", err);
      setError(err instanceof Error ? err.message : t("modal.unexpectedError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        onClick={handleOpen}
        aria-label={t("modal.stacks.ariaEdit")}
        className="inline-flex items-center justify-center h-6 w-6 rounded-md text-[var(--color-text-faint)] hover:text-[var(--color-text)] hover:bg-white/[0.06] transition-colors"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
        </svg>
      </button>

      {open && (
        <ModalDialog
          label={t("modal.stacks.title")}
          onClose={() => setOpen(false)}
          panelClassName="relative w-full max-w-lg max-h-[80vh] flex flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl"
        >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
              <h2 className="font-mono text-sm text-[var(--color-text)]">{t("modal.stacks.title")}</h2>
              <button onClick={() => setOpen(false)} aria-label={t("modal.close")} className="text-[var(--color-text-faint)] hover:text-[var(--color-text)]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <line x1="6" y1="6" x2="18" y2="18" />
                  <line x1="18" y1="6" x2="6" y2="18" />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto px-5 py-4 space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newStack}
                  aria-label={t("modal.stacks.ariaInput")}
                  onChange={(e) => setNewStack(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addStack();
                    }
                  }}
                  placeholder={t("modal.stacks.placeholder")}
                  className="flex-1 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-faint)] outline-none focus:border-white/20"
                />
                <button
                  onClick={addStack}
                  className="rounded-md border border-dashed border-[var(--color-border-bright)] px-4 py-2 text-sm font-mono text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-white/30 transition-colors"
                >
                  {t("modal.stacks.add")}
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {stacks.length === 0 && (
                  <p className="text-sm text-[var(--color-text-faint)] font-mono py-2">
                    {t("modal.stacks.empty")}
                  </p>
                )}
                {stacks.map((s) => (
                  <span
                    key={s.name}
                    className="inline-flex items-center gap-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-raised)] pl-2.5 pr-1.5 py-1 font-mono text-xs text-[var(--color-text)]"
                  >
                    {s.name}
                    <button
                      onClick={() => removeStack(s.name)}
                      aria-label={t("modal.stacks.ariaRemove", { name: s.name })}
                      className="text-[var(--color-text-faint)] hover:text-red-400 transition-colors"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <line x1="6" y1="6" x2="18" y2="18" />
                        <line x1="18" y1="6" x2="6" y2="18" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
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
