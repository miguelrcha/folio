"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type DbRepo = {
  id: string;
  name: string;
  description: string | null;
  stack: string[] | null;
  stars: number;
  impact_score: number;
  is_selected: boolean;
};

export function EditProjectsModal({ profileId }: { profileId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [syncError, setSyncError] = useState(false);
  const [repos, setRepos] = useState<DbRepo[]>([]);

  const handleOpen = () => {
    setLoading(true);
    setSyncError(false);
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const run = async () => {
      // Puxa repositórios novos/atualizados do GitHub antes de listar, pra
      // quem acabou de criar um repo não precisar esperar outro sync manual.
      const syncRes = await fetch("/api/sync-github", { method: "POST" });
      if (!syncRes.ok && !cancelled) setSyncError(true);

      const { data } = await supabase
        .from("repos")
        .select("id, name, description, stack, stars, impact_score, is_selected")
        .eq("profile_id", profileId)
        .order("impact_score", { ascending: false });

      if (cancelled) return;
      setRepos(data ?? []);
      setLoading(false);
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [open, profileId, supabase]);

  const toggleRepo = async (id: string) => {
    const target = repos.find((r) => r.id === id);
    if (!target) return;
    const nextSelected = !target.is_selected;

    setRepos((prev) => prev.map((r) => (r.id === id ? { ...r, is_selected: nextSelected } : r)));

    const { error } = await supabase.from("repos").update({ is_selected: nextSelected }).eq("id", id);
    if (error) {
      setRepos((prev) => prev.map((r) => (r.id === id ? { ...r, is_selected: !nextSelected } : r)));
    }
  };

  const handleClose = () => {
    setOpen(false);
    router.refresh();
  };

  return (
    <>
      <button
        onClick={handleOpen}
        aria-label="Edit projects"
        className="inline-flex items-center justify-center h-6 w-6 rounded-md text-[var(--color-text-faint)] hover:text-[var(--color-text)] hover:bg-white/[0.06] transition-colors"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />
          <div className="relative w-full max-w-lg max-h-[80vh] flex flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
              <h2 className="font-mono text-sm text-[var(--color-text)]">Edit projects</h2>
              <button onClick={handleClose} className="text-[var(--color-text-faint)] hover:text-[var(--color-text)]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <line x1="6" y1="6" x2="18" y2="18" />
                  <line x1="18" y1="6" x2="6" y2="18" />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto px-3 py-3 space-y-2">
              {loading && (
                <p className="text-center text-sm text-[var(--color-text-faint)] font-mono py-6">
                  syncing with github...
                </p>
              )}
              {!loading && syncError && (
                <p className="text-center text-xs text-[var(--color-text-faint)] font-mono pb-2">
                  couldn&apos;t refresh from github right now, showing the last saved version.
                </p>
              )}
              {!loading && repos.length === 0 && (
                <p className="text-center text-sm text-[var(--color-text-faint)] font-mono py-6">
                  no repositories found.
                </p>
              )}
              {repos.map((repo) => (
                <button
                  key={repo.id}
                  onClick={() => toggleRepo(repo.id)}
                  className={`w-full text-left rounded-lg border px-4 py-3 transition-colors ${
                    repo.is_selected
                      ? "border-[var(--color-accent-dim)] bg-[var(--color-surface-raised)]"
                      : "border-[var(--color-border)] bg-transparent opacity-60 hover:opacity-90"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="font-mono text-sm text-[var(--color-text)]">{repo.name}</span>
                      <p className="mt-1 text-xs text-[var(--color-text-muted)] line-clamp-1">
                        {repo.description || "no description"}
                      </p>
                    </div>
                    <div
                      className={`shrink-0 mt-0.5 h-5 w-5 rounded border flex items-center justify-center ${
                        repo.is_selected
                          ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-ink)]"
                          : "border-[var(--color-border-bright)]"
                      }`}
                    >
                      {repo.is_selected && "✓"}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="px-5 py-4 border-t border-[var(--color-border)] flex justify-end">
              <button
                onClick={handleClose}
                className="rounded-md bg-[var(--color-text)] px-5 py-2 font-mono text-sm text-[var(--color-ink)] hover:opacity-90"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}