import Link from "next/link";
import { Header } from "@/components/Header";
import { GithubIcon } from "@/components/GithubIcon";

export default function LoginPage() {
  return (
    <main className="animate-fade-up relative z-10 min-h-screen overflow-hidden">
      <div className="hero-glow" />
      <Header />

      <br /><br />
      {/* Hero */}
      <section className="relative flex flex-col items-center text-center px-6 pt-20 md:pt-32 pb-20">
        <h1 className="font-sans tracking-tight text-5xl sm:text-6xl md:text-7xl leading-[1.05]">
          <span className="bg-gradient-to-b from-white to-gray-300 bg-clip-text text-transparent">
            Build your Github portfolio in minutes
          </span>
        </h1>

        <p className="mt-7 max-w-lg text-base md:text-lg text-[var(--color-text-muted)] leading-relaxed">
          Connect your Github. In less than a minute, get a professional
          <br className="hidden md:block" />
          resume, always up-to-date and ready to send.
        </p>

        {/* CTA composta: campo informativo + botão real, ecoando a referência */}
        <div className="mt-10 flex w-full max-w-md flex-col sm:flex-row items-stretch gap-3">
          <div className="flex-1 flex items-center gap-2.5 rounded-lg border border-[var(--color-border-bright)] bg-[var(--color-surface)] px-4 py-3.5 font-lato font-semibold text-sm text-[var(--color-text-faint)]">
            <GithubIcon className="h-4 w-4 shrink-0" />
            <span className="truncate">github.com/@username</span>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--color-text)] px-6 py-3.5 font-lato text-sm font-semibold text-[var(--color-ink)] transition-opacity hover:opacity-85 whitespace-nowrap"
          >
            View Profile on Folio
          </Link>
        </div>

        <p className="mt-5 text-xs text-[var(--color-text-faint)] font-mono">
          read-only · no write access to your repositories
        </p>

        {/* Trust row, no lugar dos logos de clientes — honesto em vez de inventar marcas */}
        <div className="mt-10 flex flex-wrap justify-center gap-4 text-[var(--color-text-faint)] text-sm font-mono">
          <span>built with ❤️ by</span>
          <a
            href="https://github.com/miguelrcha"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-[var(--color-text)] transition-colors"
          >
          miguelrcha
          </a>
        </div>
      </section>
    </main>
  );
}
