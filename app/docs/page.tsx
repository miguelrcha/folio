import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Folio | Docs",
};

export default function DocsPage() {
  return (
    <>
      <Header />
      <main className="animate-fade-up relative z-10 min-h-screen overflow-x-hidden">
        <div className="hero-glow" />
        <div className="h-[60px] md:h-[58px]" />

        {/* Hero */}
        <section className="relative flex flex-col items-center text-center px-6 pt-24 md:pt-36 pb-24 sm:pb-32">
          <h1 className="font-sans tracking-tight text-5xl sm:text-6xl md:text-7xl leading-[1.05] text-neutral-300">
            Documentation
          </h1>
          <p className="mt-7 max-w-lg text-base md:text-lg text-[var(--color-text-muted)] leading-relaxed">
            Everything you need to know about how Folio turns your GitHub
            <br className="hidden md:block" />
            into a portfolio and resume.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/docs/getting-started"
              className="inline-flex items-center justify-center h-12 px-7 bg-[var(--color-text)] text-[var(--color-ink)] text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
            >
              Read the docs
            </Link>
            <a
              href="https://github.com/miguelrcha/folio"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center h-12 px-7 text-sm font-semibold text-neutral-400 hover:text-white transition-colors"
            >
              View on GitHub
            </a>
          </div>
        </section>
        <Footer />
      </main>
    </>
  );
}
