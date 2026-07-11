"use client";

import { useState } from "react";
import { useKeyboardShortcut } from "@/lib/useKeyboardShortcut";
import { useLanguage } from "@/components/LanguageProvider";
import { CvStudioModal } from "@/components/CvStudioModal";
import type { PublicProfile, Repo } from "@/lib/profile";

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center size-5 rounded-[4px] bg-black/[0.16] text-[11px] font-medium text-[var(--color-ink)] border border-black/[0.12] tracking-[-0.01em]">
      {children}
    </kbd>
  );
}

export function DownloadCvButton({
  profile,
  repos,
  isOwner,
}: {
  profile: PublicProfile;
  repos: Repo[];
  isOwner: boolean;
}) {
  const { t } = useLanguage();
  const [studioOpen, setStudioOpen] = useState(false);

  // Owners get the customization studio; everyone else prints straight away.
  const handleClick = () => (isOwner ? setStudioOpen(true) : window.print());

  useKeyboardShortcut("d", handleClick);

  return (
    <>
      <button
        onClick={handleClick}
        className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-[var(--color-text)] text-[var(--color-ink)] hover:opacity-90 transition duration-200 text-sm h-9 px-4 font-semibold cursor-pointer"
        aria-label={`View ${profile.github_username}'s CV as PDF`}
      >
        {t("downloadCv.viewCv")}
        <Kbd>D</Kbd>
      </button>
      {isOwner && studioOpen && (
        <CvStudioModal profile={profile} repos={repos} onClose={() => setStudioOpen(false)} />
      )}
    </>
  );
}
