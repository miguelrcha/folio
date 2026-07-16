"use client";

import { useEffect, useState } from "react";
import { GithubIcon } from "@/components/GithubIcon";
import { useLanguage } from "@/components/LanguageProvider";

function StarIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

export function GithubStarsBadge({ className = "" }: { className?: string }) {
  const { t } = useLanguage();
  const [stars, setStars] = useState<number | null>(null);

  useEffect(() => {
    fetch("https://api.github.com/repos/miguelrcha/folio")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (typeof data?.stargazers_count === "number") setStars(data.stargazers_count);
      })
      .catch(() => {});
  }, []);

  return (
    <a
      href="https://github.com/miguelrcha/folio"
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white hover:bg-white/[0.08] transition-colors ${className}`}
    >
      <GithubIcon className="h-4 w-4 text-white" />
      <span>{t("badge.tryOpenSource")}</span>
      <span className="inline-flex items-center gap-1 text-amber-400">
        <StarIcon className="h-3.5 w-3.5" />
        <span className="font-lato text-xs text-neutral-400">{stars ?? "—"}</span>
      </span>
    </a>
  );
}
