"use client";

import { useState } from "react";
import { useKeyboardShortcut } from "@/lib/useKeyboardShortcut";
import { generateResumePdf } from "@/lib/resume/generatePdf";
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
    // Falha ao baixar o avatar não deve impedir a geração do currículo.
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
  const [generating, setGenerating] = useState(false);

  const handleView = async () => {
    if (generating) return;
    setGenerating(true);
    // Abre a aba já na hora do clique (dentro do gesto do usuário) — se
    // esperarmos o avatar/PDF ficarem prontos pra só então chamar
    // window.open, o navegador trata como pop-up e bloqueia.
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
      // O Chrome bloqueia navegação de nível superior (location.href) direto
      // pra uma data: URL — só permite dentro de um <iframe>. Uma bloburl
      // top-level também não funciona aqui: ela fica amarrada ao contexto
      // que a criou e o Chrome particiona isso por browsing context, então
      // abrir a mesma blob numa aba nova trava em about:blank sem erro.
      // Solução: escreve um iframe com o PDF dentro da aba já aberta.
      const dataUri = doc.output("datauristring");
      if (previewWindow) {
        previewWindow.document.title = `${profile.github_username}-cv`;
        previewWindow.document.body.style.margin = "0";
        const iframe = previewWindow.document.createElement("iframe");
        iframe.src = dataUri;
        iframe.style.cssText = "position:fixed;inset:0;width:100%;height:100%;border:0;";
        previewWindow.document.body.appendChild(iframe);
      } else {
        // Pop-up bloqueado mesmo assim (ex: config do navegador) — tenta de novo.
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
      {generating ? "Generating…" : "View CV"}
      <Kbd>D</Kbd>
    </button>
  );
}
