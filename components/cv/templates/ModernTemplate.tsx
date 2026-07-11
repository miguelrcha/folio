import { Fragment, type ReactNode } from "react";
import { GithubIcon } from "@/components/GithubIcon";
import { formatExperienceRange } from "@/lib/experience";
import { formatCertificationRange } from "@/lib/certification";
import { formatLanguageEntry } from "@/lib/language";
import type { CvSectionConfig, CvSectionKey } from "@/lib/cv/config";
import type { CvTemplateProps } from "@/lib/cv/types";

// Fixed brand accent — per-user color customization is out of scope until v2
// (see issue #29's notes).
const ACCENT = "#2dd4bf";
const SIDEBAR_BG = "#111827";

const SIDEBAR_SECTIONS: CvSectionKey[] = ["stacks", "languages"];
const MAIN_SECTIONS: CvSectionKey[] = ["overview", "experiences", "projects", "certifications"];

function visibleInOrder(sections: CvSectionConfig[], allowed: CvSectionKey[]): CvSectionKey[] {
  return sections.filter((s) => s.visible && allowed.includes(s.key)).map((s) => s.key);
}

function SidebarTitle({ children }: { children: ReactNode }) {
  return (
    <h2
      className="text-[8pt] font-bold uppercase tracking-[0.14em] pb-[3pt] mb-[6pt] border-b"
      style={{ color: ACCENT, borderColor: "rgba(255,255,255,0.15)" }}
    >
      {children}
    </h2>
  );
}

function MainTitle({ children }: { children: ReactNode }) {
  return (
    <h2
      className="text-[9pt] font-bold uppercase tracking-[0.1em] pb-[2pt] mb-[6pt] border-b"
      style={{ color: "#111827", borderColor: ACCENT }}
    >
      {children}
    </h2>
  );
}

// Two-column layout: a dark sidebar (photo, contact, stacks, languages) next
// to a white main column (name, overview, experiences, projects,
// certifications). Section *visibility* comes from `config.sections`, same
// as ClassicTemplate — but a two-column layout needs fixed slot assignment,
// so each column only honors the relative order of the sections that belong
// to it (SIDEBAR_SECTIONS / MAIN_SECTIONS) rather than one free-flowing list.
// Not exposed to any picker yet (see issue #29) — built and print-verified
// ahead of time so #29 only has to add selection UI.
export function ModernTemplate({ profile, repos, config }: CvTemplateProps) {
  const stacks = profile.top_stack ?? [];
  const experiences = Array.isArray(profile.experiences_json) ? profile.experiences_json : [];
  const certifications = Array.isArray(profile.certifications_json)
    ? profile.certifications_json
    : [];
  const languageEntries = Array.isArray(profile.languages_json) ? profile.languages_json : [];
  const showPhoto = config.showPhoto && !!profile.avatar_url;

  function renderSidebarSection(key: CvSectionKey): ReactNode {
    switch (key) {
      case "stacks":
        return (
          stacks.length > 0 && (
            <div className="break-inside-avoid">
              <SidebarTitle>Stacks</SidebarTitle>
              <div className="flex flex-wrap gap-[4pt]">
                {stacks.map((s) => (
                  <span
                    key={s.name}
                    className="text-[7.5pt] rounded-[3pt] px-[5pt] py-[2pt]"
                    style={{ background: "rgba(255,255,255,0.08)", color: "#e5e7eb" }}
                  >
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
          )
        );

      case "languages":
        return (
          languageEntries.length > 0 && (
            <div className="break-inside-avoid">
              <SidebarTitle>Languages</SidebarTitle>
              <ul className="space-y-[3pt]">
                {languageEntries.map((entry, i) => (
                  <li key={i} className="text-[7.5pt]" style={{ color: "#d1d5db" }}>
                    {formatLanguageEntry(entry)}
                  </li>
                ))}
              </ul>
            </div>
          )
        );

      default:
        return null;
    }
  }

  function renderMainSection(key: CvSectionKey): ReactNode {
    switch (key) {
      case "overview":
        return (
          profile.summary && (
            <div className="break-inside-avoid">
              <MainTitle>Overview</MainTitle>
              <p className="text-[8.5pt] text-[#374151] leading-relaxed">{profile.summary}</p>
            </div>
          )
        );

      case "experiences":
        return (
          experiences.length > 0 && (
            <div>
              <MainTitle>Experiences</MainTitle>
              <ul className="space-y-[5pt] pl-[10pt]">
                {experiences.map((exp, i) => {
                  const range = formatExperienceRange(exp);
                  const parts = [exp?.title ?? "", exp?.company ?? ""].filter(Boolean).join(" — ");
                  const headline = range ? `${parts} (${range})` : parts;
                  return (
                    <li
                      key={i}
                      className="text-[8.5pt] text-[#374151] leading-relaxed list-disc break-inside-avoid"
                    >
                      {headline}
                      {Array.isArray(exp?.bullets) && exp.bullets.length > 0 && (
                        <ul className="mt-[2pt] space-y-[1.5pt] pl-[10pt]">
                          {exp.bullets.map((bullet, bi) => (
                            <li
                              key={bi}
                              className="text-[7.5pt] text-[#6b7280] leading-snug list-disc"
                            >
                              {bullet}
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )
        );

      case "projects":
        return (
          repos.length > 0 && (
            <div>
              <MainTitle>Projects, by impact</MainTitle>
              <ul className="space-y-[5pt] pl-[10pt]">
                {repos.map((repo) => (
                  <li
                    key={repo.id}
                    className="text-[8.5pt] text-[#374151] leading-relaxed list-disc break-inside-avoid"
                  >
                    {repo.name}
                    {repo.description ? `  —  ${repo.description}` : ""}
                    {repo.summary && (
                      <ul className="mt-[2pt] space-y-[1.5pt] pl-[10pt]">
                        <li className="text-[7.5pt] text-[#6b7280] leading-snug list-disc">
                          {repo.summary}
                        </li>
                      </ul>
                    )}
                    {repo.stack && repo.stack.length > 0 && (
                      <div className="text-[7.5pt] text-[#6b7280]">
                        {repo.stack.slice(0, 6).join(", ")}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )
        );

      case "certifications":
        return (
          certifications.length > 0 && (
            <div className="break-inside-avoid">
              <MainTitle>Certificates</MainTitle>
              <ul className="space-y-[2pt] pl-[10pt]">
                {certifications.map((cert, i) => {
                  const range = formatCertificationRange(cert);
                  const parts = [cert?.name ?? "", cert?.issuer ?? ""].filter(Boolean).join(" — ");
                  return (
                    <li
                      key={i}
                      className="text-[8.5pt] text-[#374151] leading-relaxed list-disc break-inside-avoid"
                    >
                      {range ? `${parts} (${range})` : parts}
                    </li>
                  );
                })}
              </ul>
            </div>
          )
        );

      default:
        return null;
    }
  }

  return (
    <div className="hidden print:flex" style={{ fontFamily: "var(--font-sans)" }}>
      <div className="flex w-full max-w-[500pt] mx-auto">
        {/* Sidebar */}
        <div
          className="w-[150pt] shrink-0 flex flex-col gap-[12pt] px-[14pt] py-[16pt]"
          style={{
            background: SIDEBAR_BG,
            WebkitPrintColorAdjust: "exact",
            printColorAdjust: "exact",
          }}
        >
          {showPhoto && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url!}
              alt={profile.github_username}
              className="h-[56pt] w-[56pt] rounded-full object-cover self-center border-2"
              style={{ borderColor: ACCENT }}
            />
          )}
          <div className="flex flex-col gap-[2pt] text-[7.5pt]" style={{ color: "#d1d5db" }}>
            {profile.location && <span>{profile.location}</span>}
            {profile.contact_email && <span>{profile.contact_email}</span>}
            <span className="inline-flex items-center gap-[3pt]">
              <GithubIcon className="h-[8pt] w-[8pt]" />
              github.com/{profile.github_username}
            </span>
            <span>meufolio.dev/{profile.github_username}</span>
          </div>

          {visibleInOrder(config.sections, SIDEBAR_SECTIONS).map((key) => (
            <Fragment key={key}>{renderSidebarSection(key)}</Fragment>
          ))}
        </div>

        {/* Main column */}
        <div className="flex-1 bg-white px-[16pt] py-[16pt] flex flex-col gap-[10pt]">
          <div>
            <h1 className="text-[18pt] font-bold leading-tight text-[#0a0a0a]">
              {profile.full_name || `@${profile.github_username}`}
            </h1>
            {profile.bio && (
              <p className="mt-[2pt] text-[8.5pt] text-[#4b5563] leading-snug">{profile.bio}</p>
            )}
          </div>

          {visibleInOrder(config.sections, MAIN_SECTIONS).map((key) => (
            <Fragment key={key}>{renderMainSection(key)}</Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
