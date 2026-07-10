"use client";

import { useEffect, useRef, useState } from "react";
import { GlobeIcon } from "@/components/GlobeIcon";
import { useLanguage } from "@/components/LanguageProvider";
import type { Language } from "@/lib/i18n/translations";

const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
  { value: "en", label: "English" },
  { value: "pt", label: "Português" },
];

export function LanguageSwitcher() {
  const { lang, setLang, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label={t("header.language")}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center justify-center h-9 w-9 rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-white/[0.06] transition-colors"
      >
        <GlobeIcon className="h-4.5 w-4.5" />
      </button>

      <div
        className={`absolute right-0 top-full pt-2 w-40 transition-all duration-150 ease-out z-50 ${
          open
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 -translate-y-1 pointer-events-none"
        }`}
        aria-hidden={!open}
      >
        <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-black/80 p-1 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.85),inset_0_1px_0_0_rgba(255,255,255,0.06)]">
          {LANGUAGE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                setLang(option.value);
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                lang === option.value
                  ? "text-[var(--color-text)] bg-white/[0.06]"
                  : "text-[var(--color-text-muted)] hover:bg-white/[0.06] hover:text-[var(--color-text)]"
              }`}
            >
              {option.label}
              {lang === option.value && <span aria-hidden="true">✓</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
