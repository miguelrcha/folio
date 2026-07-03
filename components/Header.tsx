"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { GithubIcon } from "@/components/GithubIcon";
import { createClient } from "@/lib/supabase/client";

const NAV_LINKS = [
  { label: "Examples", href: "#" },
  { label: "Pricing", href: "#" },
];

const RESOURCE_LINKS = [
  { label: "Public Profile", desc: "folio.dev/@your-username" },
  { label: "Resume in PDF", desc: "ready to send to companies" },
  { label: "Automatic Selection", desc: "best projects, by impact" },
];

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

function BetaBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-mono text-[var(--color-text-muted)] ${className}`}
    >
      🚀 Free during beta
    </span>
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
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [profileCount, setProfileCount] = useState<number | null>(null);
  const [loggedInUser, setLoggedInUser] = useState<LoggedInUser | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.rpc("get_total_profiles").then(({ data, error }) => {
      if (!error && typeof data === "number") setProfileCount(data);
    });
  }, []);

  // Checa se tem sessão ativa e, se sim, busca avatar + username pra mostrar no header
  useEffect(() => {
    const supabase = createClient();

    const loadSession = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoggedInUser(null);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("github_username, avatar_url")
        .eq("id", user.id)
        .single();

      if (profile?.github_username) {
        setLoggedInUser(profile);
      }
    };

    loadSession();

    // Atualiza automaticamente se o usuário logar/deslogar em outra aba/ação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => loadSession());

    return () => subscription.unsubscribe();
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-colors duration-200 ease-in-out ${
        scrolled
          ? "border-white/[0.08] bg-neutral-900/70 backdrop-blur-xl backdrop-saturate-150"
          : "border-transparent"
      }`}
      aria-label="Main"
    >
      <div className="mx-auto w-full max-w-7xl px-6 relative">
        {/* Mobile bar */}
        <div className="flex w-full items-center py-4 md:hidden">
          <div className="flex-auto">
            <Logo size="sm" />
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://github.com"
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
          <div className="md:hidden pb-5 flex flex-col gap-1 font-mono text-sm">
            <BetaBadge className="self-start mb-2" />
            {RESOURCE_LINKS.map((r) => (
              <a
                key={r.label}
                href="#"
                className="rounded-md px-2 py-2.5 text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-white/[0.03]"
              >
                {r.label}
              </a>
            ))}
            {NAV_LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="rounded-md px-2 py-2.5 text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-white/[0.03]"
              >
                {l.label}
              </a>
            ))}
            {loggedInUser ? (
              <div className="mt-3">
                <LoggedInChip user={loggedInUser} fullWidth />
              </div>
            ) : (
              <Link
                href="/loading"
                className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-text)] px-4 py-2.5 text-[var(--color-ink)] font-medium"
              >
                Sign in with GitHub
              </Link>
            )}
          </div>
        )}

        {/* Desktop bar */}
        <div className="mx-auto hidden h-[58px] w-full items-center md:flex">
          <div className="flex flex-1 items-center gap-4 lg:w-[320px]">
            <Logo size="md" />
            <a
              href="https://github.com"
              className="hidden lg:flex items-center gap-1.5 px-2 py-1 ml-6 hover:opacity-80 transition-opacity duration-200 group"
            >
              <GithubIcon className="w-5 h-5 text-[var(--color-text)] group-hover:text-[var(--color-text-muted)] transition-colors duration-200" />
              <span className="text-md font-semibold text-[var(--color-text)] group-hover:text-[var(--color-text-muted)] transition-colors duration-200">
                {profileCount ?? "—"}
              </span>
              <span className="text-[var(--color-accent)] text-xs"></span>
            </a>
            <BetaBadge className="hidden lg:inline-flex" />
          </div>

          <nav className="flex items-center">
            <ul className="flex items-center">
              <li
                className="relative"
                onMouseEnter={() => setResourcesOpen(true)}
                onMouseLeave={() => setResourcesOpen(false)}
              >
                <button className="h-[58px] flex items-center mx-2 py-1 text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)] lg:mx-5 group select-none gap-[2px] transition duration-150 ease-in-out">
                  Features
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
                {resourcesOpen && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-full pt-2 w-72">
                    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-2xl shadow-black/50">
                      {RESOURCE_LINKS.map((r) => (
                        <a
                          key={r.label}
                          href="#"
                          className="block rounded-lg px-3 py-2.5 hover:bg-white/[0.04] transition-colors"
                        >
                          <div className="text-sm text-[var(--color-text)] font-mono">{r.label}</div>
                          <div className="text-xs text-[var(--color-text-faint)] mt-0.5">{r.desc}</div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </li>
              {NAV_LINKS.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    className="h-[58px] flex items-center px-3 py-1 text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)] lg:px-5 transition duration-150 ease-in-out"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex flex-1 justify-end gap-4">
            <a
              href="#"
              className="hidden lg:inline-flex items-center gap-2.5 rounded-2xl px-4 h-10 text-sm font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition ease-in-out duration-200"
            >
              Show examples
              <Kbd>E</Kbd>
            </a>
            {loggedInUser ? (
              <LoggedInChip user={loggedInUser} />
            ) : (
              <Link
                href="/loading"
                className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-[var(--color-text)] text-[var(--color-ink)] hover:opacity-90 transition duration-200 text-sm h-9 px-4 font-semibold"
              >
                Sign in with GitHub
                <Kbd variant="light">G</Kbd>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}