"use client";

import { useKeyboardShortcut } from "@/lib/useKeyboardShortcut";
import { useLanguage } from "@/components/LanguageProvider";
import type { PublicProfile } from "@/lib/profile";

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center size-5 rounded-[4px] bg-black/[0.16] text-[11px] font-medium text-[var(--color-ink)] border border-black/[0.12] tracking-[-0.01em]">
      {children}
    </kbd>
  );
}

export function DownloadCvButton({ profile }: { profile: PublicProfile }) {
  const { t } = useLanguage();
  const handlePrint = () => window.print();

  useKeyboardShortcut("d", handlePrint);

  return (
    <button
      onClick={handlePrint}
      className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-[var(--color-text)] text-[var(--color-ink)] hover:opacity-90 transition duration-200 text-sm h-9 px-4 font-semibold cursor-pointer"
      aria-label={`View ${profile.github_username}'s CV as PDF`}
    >
      {t("downloadCv.viewCv")}
      <Kbd>D</Kbd>
    </button>
  );
}
