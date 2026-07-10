"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { TrashIcon } from "@/components/TrashIcon";
import { useLanguage } from "@/components/LanguageProvider";

export function DeleteAccountButton({ profileId }: { profileId: string }) {
  const router = useRouter();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    if (deleting) return;
    setOpen(false);
    setError(null);
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    const supabase = createClient();

    const { error: reposError } = await supabase.from("repos").delete().eq("profile_id", profileId);
    if (reposError) {
      setError(reposError.message);
      setDeleting(false);
      return;
    }

    const { error: profileError } = await supabase.from("profiles").delete().eq("id", profileId);
    if (profileError) {
      setError(profileError.message);
      setDeleting(false);
      return;
    }

    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 hover:text-red-400 transition-colors cursor-pointer"
      >
        <TrashIcon className="h-3.5 w-3.5" />
        {t("deleteAccount.button")}
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />
          <div className="relative w-full max-w-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-2xl">
            <h2 className="font-mono text-sm text-[var(--color-text)]">{t("deleteAccount.title")}</h2>
            <p className="mt-2 text-sm text-[var(--color-text-muted)] leading-relaxed">
              {t("deleteAccount.description")}
            </p>

            {error && (
              <p className="mt-3 text-xs font-mono text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
                {error}
              </p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={handleClose}
                disabled={deleting}
                className="rounded-md border border-[var(--color-border)] px-4 py-2 font-mono text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] disabled:opacity-50 cursor-pointer transition-colors"
              >
                {t("modal.cancel")}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-md bg-red-500/90 px-4 py-2 font-mono text-sm text-white hover:bg-red-500 disabled:opacity-50 cursor-pointer transition-colors"
              >
                {deleting ? t("deleteAccount.deleting") : t("deleteAccount.button")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
