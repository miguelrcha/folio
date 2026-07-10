"use client";

import { useState } from "react";
import { useKeyboardShortcut } from "@/lib/useKeyboardShortcut";
import { generateResumePdf } from "@/lib/resume/generatePdf";
import { useLanguage } from "@/components/LanguageProvider";
import type { PublicProfile, Repo } from "@/lib/profile";

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center size-5 rounded-[4px] bg-black/[0.16] text-[11px] font-medium text-[var(--color-ink)] border border-black/[0.12] tracking-[-0.01em]">
      {children}
    </kbd>
  );
}

async function fetchAvatarDataUrl(avatarUrl: string | null): Promise<string | null> {
  if (!avatarUrl) return null;

  try {
    const res = await fetch(avatarUrl);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch {
    // Failing to download the avatar shouldn't block resume generation.
    return null;
  }
}

export function DownloadCvButton({
  profile,
  repos,
}: {
  profile: PublicProfile;
  repos: Repo[];
}) {
  const { t } = useLanguage();
  const [generating, setGenerating] = useState(false);

  const handleView = async () => {
    if (generating) return;
    setGenerating(true);
    // Opens the tab right at click time (within the user gesture) — if we
    // waited for the avatar/PDF to be ready before calling window.open, the
    // browser would treat it as a pop-up and block it.
    const previewWindow = window.open("", "_blank");
    try {
      const photoDataUrl = await fetchAvatarDataUrl(profile.avatar_url);
      const doc = generateResumePdf({
        name: profile.full_name || profile.github_username,
        githubUsername: profile.github_username,
        location: profile.location,
        email: profile.contact_email,
        bio: profile.bio,
        summary: profile.summary,
        topStack: profile.top_stack ?? [],
        experiences: Array.isArray(profile.experiences_json) ? profile.experiences_json : [],
        certifications: Array.isArray(profile.certifications_json)
          ? profile.certifications_json
          : [],
        languages: Array.isArray(profile.languages_json) ? profile.languages_json : [],
        repos: repos.map((r) => ({
          name: r.name,
          description: r.description,
          summary: r.summary,
          stack: r.stack,
        })),
        photoDataUrl,
      });
      // Chrome blocks top-level navigation (location.href) straight to a
      // data: URL — it only allows that inside an <iframe>. A top-level
      // blob URL doesn't work here either: it's tied to the browsing
      // context that created it, and Chrome partitions that, so opening the
      // same blob in a new tab hangs on about:blank with no error.
      // Workaround: write an iframe with the PDF inside the tab already open.
      const dataUri = doc.output("datauristring");
      if (previewWindow) {
        previewWindow.document.title = `${profile.github_username}-cv`;
        previewWindow.document.body.style.margin = "0";
        const iframe = previewWindow.document.createElement("iframe");
        iframe.src = dataUri;
        iframe.style.cssText = "position:fixed;inset:0;width:100%;height:100%;border:0;";
        previewWindow.document.body.appendChild(iframe);
      } else {
        // Pop-up still blocked (e.g. browser settings) — try again.
        window.open(dataUri, "_blank");
      }
    } finally {
      setGenerating(false);
    }
  };

  useKeyboardShortcut("d", handleView);

  return (
    <button
      onClick={handleView}
      disabled={generating}
      className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-[var(--color-text)] text-[var(--color-ink)] hover:opacity-90 transition duration-200 text-sm h-9 px-4 font-semibold cursor-pointer disabled:opacity-60"
      aria-label={`View ${profile.github_username}'s CV as PDF`}
    >
      {generating ? t("downloadCv.generating") : t("downloadCv.viewCv")}
      <Kbd>D</Kbd>
    </button>
  );
}
