"use client";

import { GithubStarsBadge } from "@/components/GithubStarsBadge";
import { ScrollReveal } from "@/components/ScrollReveal";
import { useLanguage } from "@/components/LanguageProvider";

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex flex-col rounded-3xl border border-b-0 border-white/[0.08]">
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 h-px w-[150px] max-w-full"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute -left-0.5 -top-0.5 h-[calc(100%+4px)] w-[calc(100%+4px)] rounded-3xl"
        style={{
          background: "linear-gradient(transparent 0%, black 60%, black 100%)",
        }}
      />
      {children}
    </div>
  );
}

function PreviewPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative z-10 h-[280px] overflow-hidden rounded-t-3xl px-5 pt-5">
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[var(--color-ink)] to-transparent pointer-events-none z-20" />
      {children}
    </div>
  );
}

function IconGlobe() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.7 4 6 4 9s-1.5 6.3-4 9c-2.5-2.7-4-6-4-9s1.5-6.3 4-9Z" />
    </svg>
  );
}

function IconFile() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </svg>
  );
}

function IconDownload() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
      <path d="M12 3v12m0 0 4-4m-4 4-4-4" />
      <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
      <path d="M4 12l5 5L20 6" />
    </svg>
  );
}

function IconStar({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

const PROFILE_ROWS = [
  { name: "flowqueue", impact: 94, stars: 842 },
  { name: "api-gateway-lite", impact: 81, stars: 401 },
  { name: "obs-tracer", impact: 73, stars: 205 },
];

const SELECTION_ROWS = [
  { name: "flowqueue", impact: 94, selected: true },
  { name: "api-gateway-lite", impact: 81, selected: true },
  { name: "dotfiles", impact: 15, selected: false },
];

export function FeatureShowcase() {
  const { t } = useLanguage();

  return (
    <>
      <div className="flex justify-center mb-8 md:mb-10 relative z-10">
        <GithubStarsBadge />
      </div>

      <section
        className="relative mx-3 sm:mx-6 md:mx-10 mt-16 sm:mt-24 rounded-t-[2rem] md:rounded-t-[3rem] glow-border-top px-4 md:px-6 pt-14 sm:pt-24 pb-8 sm:pb-24 z-10"
        style={{
          background:
            "radial-gradient(ellipse 50% 50% at 50% 0%, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.04) 35%, transparent 70%)",
        }}
      >
      <div className="mx-auto max-w-5xl md:max-w-7xl">
      <ScrollReveal className="text-center mb-10 md:mb-14">
        <h2 className="text-[2.25rem] md:text-[4rem] tracking-tighter leading-[120%] mb-2 font-normal">
          <span className="bg-gradient-to-b from-white to-gray-300 bg-clip-text text-transparent">
            {t("features.title")}
          </span>
        </h2>
        <p className="text-sm md:text-lg text-neutral-400 font-normal max-w-2xl mx-auto">
          {t("features.subtitle")}
        </p>
      </ScrollReveal>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Card 1 — Public Profile */}
        <ScrollReveal delay={0}>
        <CardShell>
          <PreviewPanel>
            <div className="w-full overflow-hidden">
              <div className="grid grid-cols-[1fr_60px_50px] items-center py-2 border-b border-white/10 text-[10px] text-white/60 uppercase tracking-wider">
                <span>{t("features.table.repository")}</span>
                <span>{t("features.table.impact")}</span>
                <span className="text-right">★</span>
              </div>
              {PROFILE_ROWS.map((r) => (
                <div
                  key={r.name}
                  className="grid grid-cols-[1fr_60px_50px] items-center py-2.5 border-b border-white/5"
                >
                  <span className="text-[11px] font-mono text-white truncate pr-2">{r.name}</span>
                  <span className="text-[11px] text-amber-300/90 font-mono">{r.impact}</span>
                  <span className="text-right text-[11px] text-white/50 font-mono">{r.stars}</span>
                </div>
              ))}
            </div>
          </PreviewPanel>
          <div className="z-10 flex flex-col gap-3 px-6 pb-8">
            <h3 className="text-[1.7rem] font-normal text-white/90">{t("features.publicProfile.title")}</h3>
            <p className="text-sm leading-[1.6] text-neutral-400">
              {t("features.publicProfile.description")}
            </p>
            <div className="flex items-center gap-3 mt-2 text-white/70">
              <IconGlobe />
              <IconStar />
            </div>
          </div>
        </CardShell>
        </ScrollReveal>

        {/* Card 2 — PDF Resume */}
        <ScrollReveal delay={120}>
        <CardShell>
          <PreviewPanel>
            <div className="rounded-md border border-white/10 bg-black/30 p-4">
              <p className="text-[13px] font-semibold text-white">Marina Costa</p>
              <p className="text-[10px] text-white/40 mt-0.5">github.com/marinacosta · meufolio.dev/marinacosta</p>
              <div className="mt-3 border-t border-white/10 pt-2">
                <p className="text-[9px] uppercase tracking-wider text-white/50">{t("cvStudio.section.overview")}</p>
                <div className="mt-1.5 space-y-1.5">
                  <div className="h-1.5 w-full rounded bg-white/10" />
                  <div className="h-1.5 w-4/5 rounded bg-white/10" />
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-white/10">
                <p className="text-[9px] uppercase tracking-wider text-white/50">{t("cvStudio.section.projects")}</p>
                <div className="mt-1.5 space-y-1.5">
                  <div className="h-1.5 w-full rounded bg-white/10" />
                  <div className="h-1.5 w-3/5 rounded bg-white/10" />
                </div>
              </div>
            </div>
          </PreviewPanel>
          <div className="z-10 flex flex-col gap-3 px-6 pb-8">
            <h3 className="text-[1.7rem] font-normal text-white/90">{t("features.pdfResume.title")}</h3>
            <p className="text-sm leading-[1.6] text-neutral-400">
              {t("features.pdfResume.description")}
            </p>
            <div className="flex items-center gap-3 mt-2 text-white/70">
              <IconFile />
              <IconDownload />
            </div>
          </div>
        </CardShell>
        </ScrollReveal>

        {/* Card 3 — Automatic Selection */}
        <ScrollReveal delay={240}>
        <CardShell>
          <PreviewPanel>
            <div className="w-full overflow-hidden">
              <div className="py-2 border-b border-white/10 text-[10px] text-white/60 uppercase tracking-wider">
                {t("features.table.selectProjects")}
              </div>
              {SELECTION_ROWS.map((r) => (
                <div
                  key={r.name}
                  className="flex items-center justify-between py-2.5 border-b border-white/5"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-4 w-4 rounded border flex items-center justify-center ${
                        r.selected ? "bg-white border-white" : "border-white/25"
                      }`}
                    >
                      {r.selected && <span className="text-[9px] text-black">✓</span>}
                    </div>
                    <span className="text-[11px] font-mono text-white">{r.name}</span>
                  </div>
                  <span className="text-[10px] text-amber-300/80 font-mono">impact {r.impact}</span>
                </div>
              ))}
            </div>
          </PreviewPanel>
          <div className="z-10 flex flex-col gap-3 px-6 pb-8">
            <h3 className="text-[1.7rem] font-normal text-white/90">{t("features.autoSelection.title")}</h3>
            <p className="text-sm leading-[1.6] text-neutral-400">
              {t("features.autoSelection.description")}
            </p>
            <div className="flex items-center gap-3 mt-2 text-white/70">
              <IconCheck />
            </div>
          </div>
        </CardShell>
        </ScrollReveal>
      </div>
      </div>
      </section>
    </>
  );
}