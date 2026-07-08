"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { GithubIcon } from "@/components/GithubIcon";
import { FeatureShowcase } from "@/components/FeatureShowcase";
import { CTASection } from "@/components/CTASection";
import { Footer } from "@/components/Footer";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    window.scrollTo(0, 0);
  }, []);

  const handleViewProfile = (e: FormEvent) => {
    e.preventDefault();
    const cleaned = username.trim().replace(/^@/, "").replace(/^https?:\/\/github\.com\//, "");
    if (!cleaned) return;
    router.push(`/${cleaned}`);
  };

  return (
    <main className="animate-fade-up relative z-10 min-h-screen overflow-x-hidden">
      <div className="hero-glow" />
      <Header />

      <br /><br />
      {/* Hero */}
      <section className="relative flex flex-col items-center text-center px-6 pt-20 md:pt-32 pb-20">
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
              onChange={(e) => setUsername(e.target.value)}
              placeholder="github.com/miguelrcha"
              className="w-full bg-transparent text-[var(--color-text)] placeholder:text-[var(--color-text-faint)] outline-none truncate"
            />
          </div>
          <button
            type="submit"
            disabled={!username.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--color-text)] px-6 py-3.5 font-lato text-sm font-semibold text-[var(--color-ink)] transition-opacity hover:opacity-85 disabled:opacity-40 whitespace-nowrap"
          >
            View Profile on Folio
          </button>
        </form>
        {/* Trust row, in place of client logos — honest instead of making up brands */}
        
      </section>

      <FeatureShowcase />
      <CTASection />
      <Footer />
    </main>
  );
}