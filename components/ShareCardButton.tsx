"use client";

import { useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { ShareCardModal } from "@/components/ShareCardModal";

function ShareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
      <path d="M16 6l-4-4-4 4" />
      <path d="M12 2v13" />
    </svg>
  );
}

// Small icon-only trigger next to the profile name that opens ShareCardModal
// — a downloadable image card + caption for posting the profile to
// Instagram/X/LinkedIn. Distinct from ShareButton (native share sheet /
// copy-link), which shares the raw profile URL, not an image.
export function ShareCardButton({ username }: { username: string }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("shareCard.button")}
        title={t("shareCard.button")}
        className="inline-flex items-center justify-center rounded-md p-1.5 text-[var(--color-text-faint)] hover:bg-white/[0.06] hover:text-[var(--color-text)] transition-colors"
      >
        <ShareIcon />
      </button>
      {open && <ShareCardModal username={username} onClose={() => setOpen(false)} />}
    </>
  );
}
