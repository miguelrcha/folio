"use client";

import { useEffect } from "react";
import { useLanguage } from "@/components/LanguageProvider";

// Branded error boundary for anything that throws during render. Must be a
// client component per the Next.js error-file convention.
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useLanguage();

  useEffect(() => {
    console.error("Unhandled route error:", error);
  }, [error]);

  return (
    <main className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <span className="font-lato text-5xl md:text-6xl tracking-tight text-[var(--color-text)]">
        folio
      </span>
      <p className="mt-6 max-w-md text-[var(--color-text-muted)]">{t("error.title")}</p>
      <button
        onClick={reset}
        className="mt-6 rounded-md bg-[var(--color-text)] px-5 py-2.5 font-lato text-sm text-[var(--color-ink)]"
      >
        {t("error.retry")}
      </button>
    </main>
  );
}
