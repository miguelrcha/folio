"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "@/components/LanguageProvider";
import { SITE_URL } from "@/lib/site";

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.6" y1="10.5" x2="15.4" y2="6.5" />
      <line x1="8.6" y1="13.5" x2="15.4" y2="17.5" />
    </svg>
  );
}

// Intentionally always English regardless of the site's pt/en toggle: this
// is outward-facing copy meant for an Instagram/X/LinkedIn post, not app UI
// text, so it stays in the language most likely to read well to a broad,
// professional audience.
function buildCaption(profileUrl: string): string {
  return `Check out my profile on Folio — a platform that turns your GitHub activity into an auto-generated resume. ${profileUrl}`;
}

// Preview-before-you-post popup for the share card image, opened from
// ShareCardButton. Same visual language as CvPreviewModal (centered dialog,
// dimmed backdrop). Offers the generated PNG (from
// app/api/share-card/[username]/route.tsx), a ready-to-paste English
// caption, and a native OS share button, so the image + caption pair can go
// straight into a post on whatever the user picks from the OS share sheet.
export function ShareCardModal({
  username,
  onClose,
}: {
  username: string;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [captionCopied, setCaptionCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Portal + full-screen-on-mobile layout keeps this modal off ModalDialog;
  // it carries the same dialog semantics inline.
  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const imageSrc = `/api/share-card/${username}`;
  const profileUrl = `${SITE_URL}/${username}`;
  const caption = buildCaption(profileUrl);
  // Only true in the browser and only on the (mostly mobile, some desktop
  // Chromium) browsers that implement the Web Share API at all — this is a
  // client-only component mounted after a click, so there's no SSR/hydration
  // mismatch to worry about by reading navigator directly during render.
  const supportsNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  const handleCopyCaption = async () => {
    try {
      await navigator.clipboard.writeText(caption);
      setCaptionCopied(true);
      setTimeout(() => setCaptionCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  };

  // Hands off to the OS's own share sheet (the picker with WhatsApp,
  // Instagram, Messages, etc. as icons) with the image attached as a file
  // and the caption as text — this is the only mechanism that lets the
  // target app receive the image itself, not just a link, since none of
  // these platforms' web intents accept a file upload via URL params.
  const handleNativeShare = async () => {
    setSharing(true);
    try {
      const res = await fetch(imageSrc);
      const blob = await res.blob();
      const file = new File([blob], `${username}-folio.png`, { type: blob.type || "image/png" });
      const shareData = { files: [file], text: caption };

      if (navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
      } else {
        // File sharing isn't supported here (e.g. some desktop browsers
        // implement navigator.share but not the files variant) — still
        // hand off text + link so the OS picker appears either way.
        await navigator.share({ text: caption, url: profileUrl });
      }
    } catch {
      // user cancelled the share, or the browser rejected it — the
      // download/copy fallbacks below still work
    } finally {
      setSharing(false);
    }
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex print:hidden">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={t("shareCard.title")}
        tabIndex={-1}
        className="relative m-auto flex h-screen w-screen flex-col overflow-hidden border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl outline-none sm:h-auto sm:max-h-[90vh] sm:w-[95vw] sm:max-w-2xl sm:rounded-xl sm:border"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
          <h2 className="font-mono text-sm text-[var(--color-text)]">{t("shareCard.title")}</h2>
          <button
            onClick={onClose}
            aria-label={t("modal.close")}
            className="text-[var(--color-text-faint)] hover:text-[var(--color-text)]"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="relative flex items-center justify-center overflow-hidden rounded-lg bg-black">
            {!imageLoaded && (
              <div className="aspect-[1200/630] w-full animate-pulse bg-white/5 flex items-center justify-center font-mono text-xs text-[var(--color-text-faint)]">
                {t("shareCard.generating")}
              </div>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageSrc}
              alt={t("shareCard.title")}
              onLoad={() => setImageLoaded(true)}
              className={`w-full ${imageLoaded ? "block" : "hidden"}`}
            />
          </div>

          <div className="flex items-start gap-2 rounded-lg border border-[var(--color-border)] bg-black/20 px-3 py-2.5">
            <p className="flex-1 text-sm text-[var(--color-text-muted)]">{caption}</p>
            <button
              onClick={handleCopyCaption}
              className="shrink-0 rounded-md border border-[var(--color-border)] px-3 py-1.5 font-mono text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            >
              {captionCopied ? t("shareCard.captionCopied") : t("shareCard.copyCaption")}
            </button>
          </div>

          {supportsNativeShare && (
            <button
              onClick={handleNativeShare}
              disabled={sharing}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-[var(--color-text)] py-2.5 font-mono text-sm text-[var(--color-ink)] hover:opacity-90 disabled:opacity-50"
            >
              <ShareIcon />
              {sharing ? t("shareCard.generating") : t("shareCard.share")}
            </button>
          )}
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-[var(--color-border)] px-5 py-4">
          <button
            onClick={onClose}
            className="rounded-md border border-[var(--color-border)] px-4 py-2 font-mono text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          >
            {t("modal.cancel")}
          </button>
          <a
            href={imageSrc}
            download={`${username}-folio.png`}
            className="rounded-md bg-[var(--color-text)] px-5 py-2 font-mono text-sm text-[var(--color-ink)] hover:opacity-90"
          >
            {t("shareCard.download")}
          </a>
        </div>
      </div>
    </div>,
    document.body
  );
}
