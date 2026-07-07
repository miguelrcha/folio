"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export type ExperienceEntry = {
  title: string;
  company: string;
  startMonth: number; // 1-12
  startYear: number;
  endMonth: number | null; // null se "atual"
  endYear: number | null;
  current: boolean;
};

const MONTHS = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

export function formatExperienceRange(exp: ExperienceEntry): string {
  const hasValidStart =
    typeof exp?.startMonth === "number" &&
    exp.startMonth >= 1 &&
    exp.startMonth <= 12 &&
    typeof exp?.startYear === "number";

  if (!hasValidStart) return "";

  const start = `${MONTHS[exp.startMonth - 1]}/${exp.startYear}`;

  if (exp.current) return `${start} – atual`;

  const hasValidEnd =
    typeof exp.endMonth === "number" &&
    exp.endMonth >= 1 &&
    exp.endMonth <= 12 &&
    typeof exp.endYear === "number";

  const end = hasValidEnd ? `${MONTHS[exp.endMonth! - 1]}/${exp.endYear}` : "?";
  return `${start} – ${end}`;
}

function emptyEntry(): ExperienceEntry {
  const now = new Date();
  return {
    title: "",
    company: "",
    startMonth: now.getMonth() + 1,
    startYear: now.getFullYear(),
    endMonth: null,
    endYear: null,
    current: true,
  };
}

export function EditExperiencesModal({
  profileId,
  initialEntries,
}: {
  profileId: string;
  initialEntries: ExperienceEntry[];
}) {
  const router = useRouter();
  const supabase = createClient();
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
    const cleaned = entries.filter((e) => e.title.trim() || e.company.trim());

    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ experiences_json: cleaned })
        .eq("id", profileId);

      if (updateError) {
        console.error("EditExperiencesModal: erro ao salvar:", updateError.message);
        setError(updateError.message);
        return;
      }

      setOpen(false);
      router.refresh();
    } catch (err) {
      console.error("EditExperiencesModal: falha inesperada ao salvar:", err);
      setError(err instanceof Error ? err.message : "Erro inesperado ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        onClick={handleOpen}
        aria-label="Editar experiências"
        className="inline-flex items-center justify-center h-6 w-6 rounded-md text-[var(--color-text-faint)] hover:text-[var(--color-text)] hover:bg-white/[0.06] transition-colors"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-xl max-h-[85vh] flex flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
              <h2 className="font-mono text-sm text-[var(--color-text)]">Editar experiências</h2>
              <button onClick={() => setOpen(false)} className="text-[var(--color-text-faint)] hover:text-[var(--color-text)]">
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
                      aria-label="Remover experiência"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <line x1="6" y1="6" x2="18" y2="18" />
                        <line x1="18" y1="6" x2="6" y2="18" />
                      </svg>
                    </button>
                  )}

                  <div>
                    <label className="text-xs font-mono text-[var(--color-text-faint)]">Cargo / profissão</label>
                    <input
                      type="text"
                      value={entry.title}
                      onChange={(e) => updateEntry(i, { title: e.target.value })}
                      placeholder="Ex: Estagiário de Desenvolvimento"
                      className="mt-1 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-faint)] outline-none focus:border-white/20"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-mono text-[var(--color-text-faint)]">Empresa</label>
                    <input
                      type="text"
                      value={entry.company}
                      onChange={(e) => updateEntry(i, { company: e.target.value })}
                      placeholder="Ex: Empresa X"
                      className="mt-1 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-faint)] outline-none focus:border-white/20"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-mono text-[var(--color-text-faint)]">Início</label>
                      <div className="mt-1 flex gap-2">
                        <select
                          value={entry.startMonth}
                          onChange={(e) => updateEntry(i, { startMonth: Number(e.target.value) })}
                          className="w-1/2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-2 py-2 text-sm text-[var(--color-text)] outline-none focus:border-white/20"
                        >
                          {MONTHS.map((m, idx) => (
                            <option key={m} value={idx + 1}>{m}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          value={entry.startYear}
                          onChange={(e) => updateEntry(i, { startYear: Number(e.target.value) })}
                          placeholder="Ano"
                          className="w-1/2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-2 py-2 text-sm text-[var(--color-text)] outline-none focus:border-white/20"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-mono text-[var(--color-text-faint)]">Fim</label>
                      <div className="mt-1 flex gap-2">
                        <select
                          value={entry.endMonth ?? ""}
                          disabled={entry.current}
                          onChange={(e) => updateEntry(i, { endMonth: Number(e.target.value) })}
                          className="w-1/2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-2 py-2 text-sm text-[var(--color-text)] outline-none focus:border-white/20 disabled:opacity-40"
                        >
                          <option value="">--</option>
                          {MONTHS.map((m, idx) => (
                            <option key={m} value={idx + 1}>{m}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          value={entry.endYear ?? ""}
                          disabled={entry.current}
                          onChange={(e) => updateEntry(i, { endYear: Number(e.target.value) })}
                          placeholder="Ano"
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
                    No momento (trabalho atual)
                  </label>
                </div>
              ))}

              <button
                onClick={addEntry}
                className="w-full rounded-md border border-dashed border-[var(--color-border-bright)] py-2.5 text-sm font-mono text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-white/30 transition-colors"
              >
                + adicionar experiência
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
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-md bg-[var(--color-text)] px-5 py-2 font-mono text-sm text-[var(--color-ink)] hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}