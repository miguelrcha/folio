import Link from "next/link";
import { Logo } from "@/components/Logo";
import { GithubStarsBadge } from "@/components/GithubStarsBadge";

const PRODUCT_LINKS = [
  { label: "Public Profile", href: "#" },
  { label: "PDF Resume", href: "#" },
  { label: "Automatic Selection", href: "#" },
];

const COMPANY_LINKS = [
  { label: "Examples", href: "/miguelrcha" },
  { label: "Sign in with GitHub", href: "/loading" },
  { label: "Open Source", href: "https://github.com/miguelrcha/folio" },
];

export function Footer() {
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
              <span className="text-sm font-medium text-[var(--color-text)]">Product</span>
              {PRODUCT_LINKS.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                >
                  {l.label}
                </a>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              <span className="text-sm font-medium text-[var(--color-text)]">Company</span>
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
          <p className="text-xs text-[var(--color-text-faint)] font-lato">
            © {new Date().getFullYear()} Folio. All rights reserved.
          </p>
          
        </div>
      </div>
    </footer>
  );
}
