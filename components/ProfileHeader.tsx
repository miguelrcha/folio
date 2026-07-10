"use client";

import { useEffect, useRef, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/components/LanguageProvider";
import { createClient } from "@/lib/supabase/client";

type UserResult = {
  github_username: string;
  avatar_url: string | null;
};

function SearchUsers({ className = "" }: { className?: string }) {
  const router = useRouter();
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search while typing
  useEffect(() => {
    const term = query.trim().replace(/^@/, "");
    if (term.length < 2) return;

    const id = setTimeout(async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("public_profiles")
        .select("github_username, avatar_url")
        .ilike("github_username", `%${term}%`)
        .limit(5);
      setResults(data ?? []);
      setOpen(true);
    }, 250);

    return () => clearTimeout(id);
  }, [query]);

  // Closes the dropdown on outside click
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (value.trim().replace(/^@/, "").length < 2) setResults([]);
  };

  const goToUser = (username: string) => {
    setOpen(false);
    setQuery("");
    setResults([]);
    router.push(`/${username}`);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const username = query.trim().replace(/^@/, "");
    if (!username) return;
    goToUser(username);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 h-9 w-full focus-within:border-white/20 transition-colors"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-3.5 w-3.5 text-[var(--color-text-faint)] shrink-0"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={t("search.placeholder")}
          className="w-full sm:w-40 bg-transparent text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-faint)] outline-none"
        />
      </form>

      {open && results.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-2 rounded-xl border border-white/[0.08] bg-neutral-900/95 backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden z-50">
          {results.map((user) => (
            <button
              key={user.github_username}
              onClick={() => goToUser(user.github_username)}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/[0.06] transition-colors text-left"
            >
              {user.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatar_url}
                  alt={user.github_username}
                  className="h-7 w-7 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="h-7 w-7 rounded-full bg-white/10 shrink-0" />
              )}
              <span className="text-sm font-mono text-[var(--color-text)] truncate">
                @{user.github_username}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

type LoggedInUser = {
  github_username: string;
  avatar_url: string | null;
};

// Chip that shows who's currently signed in — appears regardless of
// whose profile is being visited.
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
      className={`inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] pl-1.5 pr-4 h-9 hover:bg-white/[0.08] transition-colors shrink-0 ${
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

function useLoggedInUser() {
  const [loggedInUser, setLoggedInUser] = useState<LoggedInUser | null>(null);

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

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => loadSession());

    return () => subscription.unsubscribe();
  }, []);

  return loggedInUser;
}

export function ProfileHeader({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const loggedInUser = useLoggedInUser();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-colors duration-200 ease-in-out ${
        scrolled || mobileOpen
          ? "border-white/[0.08] bg-black/80 backdrop-blur-xl backdrop-saturate-150"
          : "border-transparent"
      }`}
      aria-label="Main"
    >
      <div className="mx-auto w-full max-w-7xl px-6 relative">
        {/* Mobile: logo + hamburger */}
        <div className="flex w-full items-center justify-between py-4 md:hidden">
          <Logo size="sm" />
          <button
            aria-label="menu"
            onClick={() => setMobileOpen((v) => !v)}
            className="inline-flex items-center justify-center rounded-md p-1 text-[var(--color-text)]/70 hover:bg-white/[0.04] hover:text-[var(--color-text)] transition"
          >
            {mobileOpen ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="18" y1="6" x2="6" y2="18" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="4" y1="18" x2="20" y2="18" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile: search always visible, it's the heart of the thing */}
        <div className="pb-3 md:hidden ">
          <SearchUsers />
        </div>

        {/* Mobile: identity + actions hidden behind the hamburger, stacked */}
        {mobileOpen && (
          <div className="md:hidden pb-4 flex flex-col gap-2 [&>*]:w-full [&>*]:justify-center">
            <div className="flex items-center justify-center">
              <LanguageSwitcher />
            </div>
            {loggedInUser && <LoggedInChip user={loggedInUser} fullWidth />}
            {children}
          </div>
        )}

        {/* Desktop bar — mesma estrutura de colunas da landing, pra manter o logo no mesmo X */}
        <div className="mx-auto hidden h-[58px] w-full items-center md:flex">
          <div className="flex flex-1 items-center gap-4 lg:w-[320px]">
            <Link href="/">
              <Logo size="md" />
            </Link>
            <SearchUsers className="w-56 ml-5" />
          </div>

          <div className="flex flex-1 justify-end items-center gap-3">
            <LanguageSwitcher />
            {loggedInUser && <LoggedInChip user={loggedInUser} />}
            {children}
          </div>
        </div>
      </div>
    </header>
  )
}