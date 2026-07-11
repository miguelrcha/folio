import { Fragment, type ReactNode } from "react";
import { GithubIcon } from "@/components/GithubIcon";
import { formatExperienceRange } from "@/lib/experience";
import { formatCertificationRange } from "@/lib/certification";
import { formatLanguageEntry } from "@/lib/language";
import { CV_FONT_STACKS, CV_SECTION_LIMITS, type CvSectionKey } from "@/lib/cv/config";
import type { CvTemplateProps } from "@/lib/cv/types";

const LIMITS = CV_SECTION_LIMITS.classic;

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-[8.5pt] font-bold uppercase tracking-[0.12em] text-[#111827] border-b border-[#d1d5db] pb-[2pt] mb-[6pt]">
      {children}
    </h2>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-[2pt] pl-[10pt]">
      {items.map((item, i) => (
        <li
          key={i}
          className="text-[8.5pt] text-[#374151] leading-relaxed list-disc break-inside-avoid"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

// Single-page-friendly A4 layout, ATS-friendly: one column, plain text and
// bullets, no photo by default, no tags/cards. Rendered `hidden print:block`
// — only appears when the page is printed/exported (see the export button
// which calls window.print(), and the @page rule in app/globals.css).
export function ClassicTemplate({ profile, repos, config, variant = "print" }: CvTemplateProps) {
  const stacks = profile.top_stack ?? [];
  const experiences = Array.isArray(profile.experiences_json) ? profile.experiences_json : [];
  const certifications = Array.isArray(profile.certifications_json)
    ? profile.certifications_json
    : [];
  const languageEntries = Array.isArray(profile.languages_json) ? profile.languages_json : [];
  const showPhoto = config.showPhoto && !!profile.avatar_url;

  function renderSection(key: CvSectionKey): ReactNode {
    switch (key) {
      case "overview":
        return (
          profile.summary && (
            <div className="break-inside-avoid">
              <SectionTitle>Overview</SectionTitle>
              <p className="text-[8.5pt] text-[#374151] leading-relaxed">{profile.summary}</p>
            </div>
          )
        );

      case "experiences":
        return (
          experiences.length > 0 && (
            <div>
              <SectionTitle>Experiences</SectionTitle>
              <ul className="space-y-[5pt] pl-[10pt]">
                {experiences.slice(0, LIMITS.experiences).map((exp, i) => {
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
                          {exp.bullets.slice(0, LIMITS.bulletsPerExperience).map((bullet, bi) => (
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

      case "stacks":
        return (
          stacks.length > 0 && (
            <div className="break-inside-avoid">
              <SectionTitle>Stacks</SectionTitle>
              <p className="text-[8.5pt] text-[#374151] leading-relaxed">
                {stacks.map((s) => s.name).join("  ·  ")}
              </p>
            </div>
          )
        );

      case "projects":
        return (
          repos.length > 0 && (
            <div>
              <SectionTitle>Projects, by impact</SectionTitle>
              <ul className="space-y-[5pt] pl-[10pt]">
                {repos.slice(0, LIMITS.projects).map((repo) => (
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
              <SectionTitle>Certificates</SectionTitle>
              <BulletList
                items={certifications.slice(0, LIMITS.certifications).map((cert) => {
                  const range = formatCertificationRange(cert);
                  const parts = [cert?.name ?? "", cert?.issuer ?? ""].filter(Boolean).join(" — ");
                  return range ? `${parts} (${range})` : parts;
                })}
              />
            </div>
          )
        );

      case "languages":
        return (
          languageEntries.length > 0 && (
            <div className="break-inside-avoid">
              <SectionTitle>Languages</SectionTitle>
              <BulletList
                items={languageEntries.map((entry) =>
                  formatLanguageEntry(entry, { showFlag: config.showLanguageFlags })
                )}
              />
            </div>
          )
        );

      default:
        return null;
    }
  }

  return (
    <div
      className={
        variant === "print"
          ? "hidden print:flex flex-col items-center bg-white text-[#111827]"
          : "flex flex-col items-center bg-white text-[#111827]"
      }
      style={{ fontFamily: CV_FONT_STACKS[config.font] }}
    >
      <div className="w-full max-w-[440pt]">
        {/* Header */}
        <div className="flex flex-col items-center text-center">
          {showPhoto && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url!}
              alt={profile.github_username}
              className="h-[46pt] w-[46pt] rounded-full object-cover border border-[#d1d5db]"
            />
          )}
          <h1 className="mt-[6pt] text-[19pt] font-bold leading-tight text-[#0a0a0a]">
            {profile.full_name || `@${profile.github_username}`}
          </h1>
          {profile.bio && !config.hideBio && (
            <p className="mt-[2pt] text-[9pt] text-[#4b5563] leading-snug">{profile.bio}</p>
          )}
          <div className="mt-[5pt] flex flex-wrap justify-center gap-x-[10pt] gap-y-[2pt] text-[8pt] text-[#4b5563]">
            {profile.location && <span>{profile.location}</span>}
            {profile.contact_email && <span>{profile.contact_email}</span>}
            <span className="inline-flex items-center gap-[3pt]">
              <GithubIcon className="h-[8pt] w-[8pt]" />
              github.com/{profile.github_username}
            </span>
            <span>meufolio.dev/{profile.github_username}</span>
          </div>
        </div>

        {/* Body: one column, sections stacked in the configured order */}
        <div className="mt-[12pt] space-y-[9pt]">
          {config.sections
            .filter((s) => s.visible)
            .map((s) => (
              <Fragment key={s.key}>{renderSection(s.key)}</Fragment>
            ))}
        </div>

        <div className="mt-[14pt] pt-[6pt] border-t border-[#e5e7eb] text-[7.5pt] text-[#9ca3af] text-center">
          generated automatically from github · meufolio.dev/{profile.github_username}
        </div>
      </div>
    </div>
  );
}
