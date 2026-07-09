"use client";

import { useState } from "react";

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center size-5 rounded-[4px] bg-black/[0.16] text-[11px] font-medium text-[var(--color-ink)] border border-black/[0.12] tracking-[-0.01em]">
      {children}
    </kbd>
  );
}

export function ShareButton({
  username,
  name,
}: {
  username: string;
  name?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = `${window.location.origin}/${username}`;
    const shareData = {
      title: `${name ?? username} · folio`,
      text: `Check out ${name ?? username}'s professional profile on folio`,
      url,
    };

    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
      } catch {
        // usuário cancelou o share
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard indisponível
    }
  };

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-[var(--color-text)] text-[var(--color-ink)] hover:opacity-90 transition duration-200 text-sm h-9 px-4 font-semibold"
    >
      {copied ? (
        "Link copied ✓"
      ) : (
        <>
          Share
          <Kbd>S</Kbd>
        </>
      )}
    </button>
  );
}