"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { GithubIcon } from "@/components/GithubIcon";
import { FeatureShowcase } from "@/components/FeatureShowcase";
import { CTASection } from "@/components/CTASection";
import { Footer } from "@/components/Footer";
import { createClient } from "@/lib/supabase/client";

// Aceita "@user", "github.com/user", "https://github.com/user" (com ou sem
// www./barra final) e extrai só o username.
function cleanGithubUsername(raw: string) {
  return raw
    .trim()
    .replace(/^@/, "")
    .replace(/^(https?:\/\/)?(www\.)?github\.com\//i, "")
    .split(/[/?#]/)[0]
    .trim();
}

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [checking, setChecking] = useState(false);
  const [notFoundUser, setNotFoundUser] = useState<string | null>(null);

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    window.scrollTo(0, 0);
  }, []);

  const handleViewProfile = async (e: FormEvent) => {
    e.preventDefault();
    const cleaned = cleanGithubUsername(username);
    if (!cleaned || checking) return;

    setChecking(true);
    setNotFoundUser(null);

    const supabase = createClient();
    const { data } = await supabase
      .from("public_profiles")
      .select("github_username")
      .ilike("github_username", cleaned)
      .maybeSingle();

    setChecking(false);

    if (!data) {
      setNotFoundUser(cleaned);
      return;
    }

    router.push(`/${data.github_username}`);
  };

  return (
    <>
      <Header />
      <main className="animate-fade-up relative z-10 min-h-screen overflow-x-hidden">
        <div className="hero-glow" />
        <div className="h-[60px] md:h-[58px]" />

      {/* Hero: fills the remaining viewport height so FeatureShowcase starts below the fold */}
      <section className="relative flex min-h-[calc(100vh-60px)] md:min-h-[calc(100vh-58px)] flex-col items-center justify-center text-center px-6 pb-16">
        <h1 className="font-sans tracking-tight text-5xl sm:text-6xl md:text-7xl leading-[1.05]">
          <span className="bg-gradient-to-b from-white to-gray-300 bg-clip-text text-transparent mb-2">
            Build your Github portfolio in minutes
          </span>
        </h1>

        <p className="mt-7 max-w-lg text-base md:text-lg text-[var(--color-text-muted)] leading-relaxed">
          Connect your Github. In less than a minute, get a professional
          <br className="hidden md:block" />
          resume, always up-to-date and ready to send.
        </p>

        {/* Composite CTA: real username input + button that navigates to the profile */}
        <form
          onSubmit={handleViewProfile}
          className="mt-10 flex w-full max-w-md flex-col sm:flex-row items-stretch gap-3"
        >
          <div className="flex-1 flex items-center gap-2.5 rounded-lg border border-[var(--color-border-bright)] bg-[var(--color-surface)] px-4 py-3.5 font-lato font-semibold text-sm focus-within:border-white/30 transition-colors">
            <GithubIcon className="h-4 w-4 shrink-0 text-[var(--color-text-faint)]" />
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (notFoundUser) setNotFoundUser(null);
              }}
              placeholder="github.com/miguelrcha"
              className="w-full bg-transparent text-[var(--color-text)] placeholder:text-[var(--color-text-faint)] outline-none truncate"
            />
          </div>
          <button
            type="submit"
            disabled={!username.trim() || checking}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--color-text)] px-6 py-3.5 font-lato text-sm font-semibold text-[var(--color-ink)] transition-opacity hover:opacity-85 disabled:opacity-40 whitespace-nowrap"
          >
            {checking ? "Checking…" : "View Profile on Folio"}
          </button>
        </form>

        {notFoundUser && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/[0.06] px-4 py-2.5 text-sm text-red-300/90 font-lato max-w-md w-full">
            <span className="shrink-0">⚠️</span>
            <span>
              <span className="font-semibold">@{notFoundUser}</span>  isn&apos;t registered on Folio yet.
            </span>
          </div>
        )}

        {/* Trust row, in place of client logos — honest instead of making up brands */}

      </section>
        <FeatureShowcase />
        <CTASection />
        <Footer />
      </main>
    </>
  );
}