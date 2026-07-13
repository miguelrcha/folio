"use client";

import Link from "next/link";
import { Logo } from "@/components/Logo";
import { GithubStarsBadge } from "@/components/GithubStarsBadge";
import { useLanguage } from "@/components/LanguageProvider";

export function Footer() {
  const { t } = useLanguage();

  const PRODUCT_LINKS = [
    { label: t("features.publicProfile.title"), href: "/docs/public-profile" },
    { label: t("features.pdfResume.title"), href: "/docs/pdf-resume" },
    { label: t("features.autoSelection.title"), href: "/docs/auto-selection" },
  ];

  const COMPANY_LINKS = [
    { label: t("header.examples"), href: "/miguelrcha" },
    { label: t("header.signIn"), href: "/loading" },
    { label: t("footer.openSource"), href: "https://github.com/miguelrcha/folio" },
  ];

  return (
    <footer className="relative z-10 border-t border-white/[0.08]">
      <div className="mx-auto max-w-7xl px-6 pt-14 pb-8">
        <div className="flex flex-col sm:flex-row gap-10 sm:gap-6 sm:justify-between">
          <div className="flex flex-col gap-4">
            <Logo size="sm" />

            <GithubStarsBadge className="w-fit" />
          </div>

          <div className="grid grid-cols-2 gap-10 sm:flex sm:gap-16">
            <div className="flex flex-col gap-3">
              <span className="text-sm font-medium text-[var(--color-text)]">{t("footer.product")}</span>
              {PRODUCT_LINKS.map((l) => (
                <Link
                  key={l.label}
                  href={l.href}
                  className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                >
                  {l.label}
                </Link>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              <span className="text-sm font-medium text-[var(--color-text)]">{t("footer.company")}</span>
              {COMPANY_LINKS.map((l) =>
                l.href.startsWith("http") ? (
                  <a
                    key={l.label}
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                  >
                    {l.label}
                  </a>
                ) : (
                  <Link
                    key={l.label}
                    href={l.href}
                    className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                  >
                    {l.label}
                  </Link>
                )
              )}
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-md text-[var(--color-text-faint)] font-lato">
            © {new Date().getFullYear()} Folio. {t("footer.rights")}
          </p>
          
        </div>
      </div>
    </footer>
  );
}
