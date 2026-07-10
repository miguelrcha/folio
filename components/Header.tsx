"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { GithubIcon } from "@/components/GithubIcon";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/components/LanguageProvider";
import { createClient } from "@/lib/supabase/client";
import { useKeyboardShortcut } from "@/lib/useKeyboardShortcut";

type LoggedInUser = {
  github_username: string;
  avatar_url: string | null;
};

function Kbd({
  children,
  variant = "dark",
}: {
  children: React.ReactNode;
  variant?: "dark" | "light";
}) {
  if (variant === "light") {
    return (
      <kbd className="inline-flex items-center justify-center size-5 rounded-[4px] bg-black/[0.16] text-[11px] font-medium text-[var(--color-ink)] border border-black/[0.12] tracking-[-0.01em]">
        {children}
      </kbd>
    );
  }
  return (
    <kbd className="inline-flex items-center justify-center size-5 rounded-[4px] bg-white/[0.12] text-[11px] font-medium text-[#ababab] border border-white/[0.12] tracking-[-0.01em]">
      {children}
    </kbd>
  );
}

// Chip que mostra quem está logado — substitui o botão "Sign in with GitHub"
function LoggedInChip({
  user,
  fullWidth = false,
}: {
  user: LoggedInUser;
  fullWidth?: boolean;
}) {
  return (
    <Link
      href={`/${user.github_username}`}
      className={`inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] pl-1.5 pr-4 h-9 hover:bg-white/[0.08] transition-colors ${
        fullWidth ? "w-full justify-center" : ""
      }`}
    >
      {user.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={user.avatar_url}
          alt={user.github_username}
          className="h-6 w-6 rounded-full object-cover shrink-0"
        />
      ) : (
        <div className="h-6 w-6 rounded-full bg-white/10 shrink-0" />
      )}
      <span className="text-sm font-medium text-[var(--color-text)]">
        @{user.github_username}
      </span>
    </Link>
  );
}

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [profileCount, setProfileCount] = useState<number | null>(null);
  const [loggedInUser, setLoggedInUser] = useState<LoggedInUser | null>(null);
  const examplesLinkRef = useRef<HTMLAnchorElement>(null);

  useKeyboardShortcut("e", () => examplesLinkRef.current?.click());
  useKeyboardShortcut("g", () => {
    if (!loggedInUser) router.push("/loading");
  });

  // On the landing page itself, clicking the logo should smoothly scroll
  // back up to the hero instead of a no-op same-route navigation.
  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname !== "/") return;
    e.preventDefault();
    setMobileOpen(false);
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth";
    window.scrollTo({ top: 0, behavior });
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const supabase = createClient();

    const loadCount = async () => {
      try {
        const { data, error } = await supabase.rpc("get_total_profiles");
        if (error) {
          console.error("Header: erro ao buscar contagem de perfis:", error.message);
          return;
        }
        if (typeof data === "number") setProfileCount(data);
      } catch (err) {
        console.error("Header: falha inesperada ao buscar contagem de perfis:", err);
      }
    };

    loadCount();
  }, []);

  // Detecta sessão via onAuthStateChange, que dispara sozinho com o evento
  // INITIAL_SESSION assim que o client termina de restaurar a sessão salva
  // (cookies). Isso evita a race condition de chamar getUser() manualmente
  // antes do client terminar essa restauração — que era a causa do header
  // "esquecer" que você tava logado ao voltar no site.
  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    const loadProfile = async (userId: string) => {
      try {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("github_username, avatar_url")
          .eq("id", userId)
          .single();

        if (cancelled) return;

        if (error) {
          console.error("Header: erro ao buscar perfil:", error.message);
          return;
        }

        if (profile?.github_username) {
          setLoggedInUser(profile);
        }
      } catch (err) {
        if (!cancelled) console.error("Header: falha inesperada ao buscar perfil:", err);
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;
      if (!user) {
        setLoggedInUser(null);
        return;
      }
      loadProfile(user.id);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const NAV_LINKS = [
    { label: t("header.examples"), href: "#" },
    { label: t("header.docs"), href: "/docs" },
  ];

  const RESOURCE_LINKS = [
    { label: t("header.resources.publicProfile"), href: "/miguelrcha" },
    { label: t("header.resources.resumePdf"), href: "/#cta" },
    { label: t("header.resources.autoSelection"), href: "/#cta" },
  ];

  return (
    <header
      className={`fixed top-0 inset-x-0 z-40 border-b transition-all duration-200 ease-in-out ${
        scrolled
          ? "border-white/[0.06] bg-black/95 backdrop-blur-2xl backdrop-saturate-[1.8] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05),0_16px_40px_-12px_rgba(0,0,0,0.85)]"
          : "border-transparent"
      }`}
      aria-label="Main"
    >
      {scrolled && (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.02] via-transparent to-black/[0.2]" />
      )}
      <div className="mx-auto w-full max-w-7xl px-6 relative">
        {/* Mobile bar */}
        <div className="flex w-full items-center py-4 md:hidden">
          <div className="flex-auto">
            <Link href="/" onClick={handleLogoClick}>
              <Logo size="sm" />
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/miguelrcha/folio"
              className="flex items-center gap-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors duration-150"
            >
              <GithubIcon className="w-4.5 h-4.5" />
              <span className="text-md font-semibold">{profileCount ?? "—"}</span>
            </a>
            <button
              aria-label="menu"
              onClick={() => setMobileOpen((v) => !v)}
              className="inline-flex items-center justify-center rounded-md p-1 text-[var(--color-text)]/70 hover:bg-white/[0.04] hover:text-[var(--color-text)] transition"
            >
              {mobileOpen ? (
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <line x1="6" y1="6" x2="18" y2="18" />
                  <line x1="18" y1="6" x2="6" y2="18" />
                </svg>
              ) : (
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="6" x2="20" y2="6" />
                  <line x1="4" y1="18" x2="20" y2="18" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden pb-5 flex flex-col gap-1 font-mono text-sm bg-black/95 backdrop-blur-2xl -mx-6 px-6 rounded-b-2xl">

            {RESOURCE_LINKS.map((r) => (
              <Link
                key={r.label}
                href={r.href}
                className="rounded-md px-2 py-2.5 text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-white/[0.03]"
              >
                {r.label}
              </Link>
            ))}
            {NAV_LINKS.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="rounded-md px-2 py-2.5 text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-white/[0.03]"
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-2 flex items-center justify-between rounded-md px-2 py-1">
              <span className="text-[var(--color-text-muted)]">{t("header.language")}</span>
              <LanguageSwitcher />
            </div>
            {loggedInUser ? (
              <div className="mt-1">
                <LoggedInChip user={loggedInUser} fullWidth />
              </div>
            ) : (
              <Link
                href="/loading"
                className="mt-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-text)] px-4 py-2.5 text-[var(--color-ink)] font-medium"
              >
                {t("header.signIn")}
              </Link>
            )}
          </div>
        )}

        {/* Desktop bar */}
        <div className="mx-auto hidden h-[58px] w-full items-center md:flex">
          <div className="flex flex-1 items-center gap-4 lg:w-[320px]">
            <Link href="/" onClick={handleLogoClick}>
              <Logo size="md" />
            </Link>
            <a
              href="https://github.com/miguelrcha/folio"
              className="hidden lg:flex items-center gap-1.5 px-2 py-1 ml-6 hover:opacity-80 transition-opacity duration-200 group"
            >
              <GithubIcon className="w-5 h-5 text-[var(--color-text)] group-hover:text-[var(--color-text-muted)] transition-colors duration-200" />
              <span className="text-md font-semibold text-[var(--color-text)] group-hover:text-[var(--color-text-muted)] transition-colors duration-200">
                {profileCount ?? "—"}
              </span>
              <span className="text-[var(--color-accent)] text-xs"></span>
            </a>
            
          </div>

          <nav className="flex items-center">
            <ul className="flex items-center">
              <li
                className="relative"
                onMouseEnter={() => setResourcesOpen(true)}
                onMouseLeave={() => setResourcesOpen(false)}
              >
                <button className="h-[58px] flex items-center mx-2 py-1 text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)] lg:mx-5 group select-none gap-[2px] transition duration-150 ease-in-out">
                  {t("header.features")}
                  <svg
                    className={`opacity-70 -ml-0.5 transition-transform duration-200 ease-in ${
                      resourcesOpen ? "translate-y-0.5" : ""
                    }`}
                    fill="none"
                    height="20"
                    viewBox="0 0 24 24"
                    width="20"
                    aria-hidden="true"
                  >
                    <path
                      d="M15.25 10.75L12 14.25L8.75 10.75"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                    />
                  </svg>
                </button>
                <div
                  className={`absolute left-1/2 -translate-x-1/2 top-full pt-2 w-64 transition-all duration-200 ease-out ${
                    resourcesOpen
                      ? "opacity-100 translate-y-0 pointer-events-auto"
                      : "opacity-0 -translate-y-1 pointer-events-none"
                  }`}
                  aria-hidden={!resourcesOpen}
                >
                  <div className="relative overflow-hidden rounded-[20px] border border-white/[0.08] bg-black/70 p-2 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.85),inset_0_1px_0_0_rgba(255,255,255,0.06)] font-lato">
                    <div className="relative">
                      {RESOURCE_LINKS.map((r) => (
                        <Link
                          key={r.label}
                          href={r.href}
                          className="block rounded-xl px-3.5 py-3 text-lg font-medium text-[var(--color-text-muted)] hover:bg-white/[0.08] hover:text-[var(--color-text)] active:bg-white/[0.05] transition-colors duration-150"
                        >
                          {r.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </li>
              {NAV_LINKS.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="h-[58px] flex items-center px-3 py-1 text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)] lg:px-5 transition duration-150 ease-in-out"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex flex-1 justify-end items-center gap-4">
            <a
              ref={examplesLinkRef}
              href="#"
              className="hidden lg:inline-flex items-center gap-2.5 rounded-2xl px-4 h-10 text-sm font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition ease-in-out duration-200"
            >
              {t("header.showExamples")}
              <Kbd>E</Kbd>
            </a>
            <LanguageSwitcher />
            {loggedInUser ? (
              <LoggedInChip user={loggedInUser} />
            ) : (
              <Link
                href="/loading"
                className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-[var(--color-text)] text-[var(--color-ink)] hover:opacity-90 transition duration-200 text-sm h-9 px-4 font-semibold"
              >
                {t("header.signIn")}
                <Kbd variant="light">G</Kbd>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}