"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useKeyboardShortcut } from "@/lib/useKeyboardShortcut";
import { useLanguage } from "@/components/LanguageProvider";
import { CvPreviewPanel } from "@/components/CvPreviewPanel";
import { resolveCvConfig } from "@/lib/cv/config";
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
  const router = useRouter();
  const { t } = useLanguage();
  const [previewOpen, setPreviewOpen] = useState(false);

  // Owners get the full-screen customization studio; everyone else gets a
  // docked preview panel of the owner's saved config, with the actual
  // print/save triggered from inside it.
  const handleClick = () =>
    isOwner ? router.push(`/${profile.github_username}/cv-studio`) : setPreviewOpen((v) => !v);

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
      {previewOpen && (
        <CvPreviewPanel
          profile={profile}
          repos={repos}
          config={resolveCvConfig(profile.cv_config)}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </>
  );
}
