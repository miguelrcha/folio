import { GithubIcon } from "@/components/GithubIcon";
import { formatExperienceRange } from "@/lib/experience";
import { formatCertificationRange } from "@/lib/certification";
import { formatLanguageEntry } from "@/lib/language";
import type { PublicProfile, Repo } from "@/lib/profile";

function ResumeSectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[8.5pt] font-bold uppercase tracking-[0.12em] text-[#111827] border-b border-[#d1d5db] pb-[2pt] mb-[6pt]">
      {children}
    </h2>
  );
}

function ResumeBulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-[2pt] pl-[10pt]">
      {items.map((item, i) => (
        <li key={i} className="text-[8.5pt] text-[#374151] leading-relaxed list-disc">
          {item}
        </li>
      ))}
    </ul>
  );
}

// Layout dedicado de 1 página A4 pra impressão/PDF do CV — renderizado só em
// @media print (ver .resume-print no globals.css + hidden print:block aqui).
// Independente da UI escura interativa do resto do site: tipografia clara,
// compacta, pensada pra caber numa página só com os dados reais do GitHub.
// De propósito, texto e bullets em todas as seções — sem tags/cards — e sem
// nenhum cargo/título fixo abaixo do nome, só o que vem do GitHub.
export function ResumeDocument({
  profile,
  repos,
  totalCommits,
  githubSinceYear,
}: {
  profile: PublicProfile;
  repos: Repo[];
  totalCommits: number;
  githubSinceYear: number | null;
}) {
  const stacks = profile.top_stack ?? [];
  const experiences = Array.isArray(profile.experiences_json) ? profile.experiences_json : [];
  const certifications = Array.isArray(profile.certifications_json)
    ? profile.certifications_json
    : [];
  const languageEntries = Array.isArray(profile.languages_json) ? profile.languages_json : [];

  return (
    <div
      className="hidden print:flex flex-col items-center bg-white text-[#111827]"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      <div className="w-full max-w-[440pt]">
        {/* Header */}
        <div className="flex flex-col items-center text-center">
          {profile.avatar_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt={profile.github_username}
              className="h-[46pt] w-[46pt] rounded-full object-cover border border-[#d1d5db]"
            />
          )}
          <h1 className="mt-[6pt] text-[19pt] font-bold leading-tight text-[#0a0a0a]">
            {profile.full_name || `@${profile.github_username}`}
          </h1>
          {profile.bio && (
            <p className="mt-[2pt] text-[9pt] text-[#4b5563] leading-snug">{profile.bio}</p>
          )}
          <div className="mt-[5pt] flex flex-wrap justify-center gap-x-[10pt] gap-y-[2pt] text-[8pt] text-[#4b5563]">
            {profile.location && <span>{profile.location}</span>}
            <span className="inline-flex items-center gap-[3pt]">
              <GithubIcon className="h-[8pt] w-[8pt]" />
              github.com/{profile.github_username}
            </span>
            <span>meufolio.dev/@{profile.github_username}</span>
          </div>
        </div>

        {/* Body: one column, sections stacked */}
        <div className="mt-[12pt] space-y-[9pt]">
          {profile.summary && (
            <div>
              <ResumeSectionTitle>Overview</ResumeSectionTitle>
              <p className="text-[8.5pt] text-[#374151] leading-relaxed">{profile.summary}</p>
            </div>
          )}

          {experiences.length > 0 && (
            <div>
              <ResumeSectionTitle>Experiences</ResumeSectionTitle>
              <ResumeBulletList
                items={experiences.map((exp) => {
                  const range = formatExperienceRange(exp);
                  const parts = [exp?.title ?? "", exp?.company ?? ""].filter(Boolean).join(" — ");
                  return range ? `${parts} (${range})` : parts;
                })}
              />
            </div>
          )}

          {stacks.length > 0 && (
            <div>
              <ResumeSectionTitle>Stacks</ResumeSectionTitle>
              <p className="text-[8.5pt] text-[#374151] leading-relaxed">
                {stacks.map((s) => s.name).join("  ·  ")}
              </p>
            </div>
          )}

          {repos.length > 0 && (
            <div>
              <ResumeSectionTitle>Projects, by impact</ResumeSectionTitle>
              <ul className="space-y-[5pt] pl-[10pt]">
                {repos.map((repo) => (
                  <li key={repo.id} className="text-[8.5pt] text-[#374151] leading-relaxed list-disc">
                    <span className="font-semibold text-[#0a0a0a]">{repo.name}</span>
                    {repo.description ? `  —  ${repo.description}` : ""}
                    {repo.stack && repo.stack.length > 0 && (
                      <div className="text-[7.5pt] text-[#6b7280]">
                        {repo.stack.slice(0, 6).join(", ")}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {certifications.length > 0 && (
            <div>
              <ResumeSectionTitle>Certificates</ResumeSectionTitle>
              <ResumeBulletList
                items={certifications.map((cert) => {
                  const range = formatCertificationRange(cert);
                  const parts = [cert?.name ?? "", cert?.issuer ?? ""].filter(Boolean).join(" — ");
                  return range ? `${parts} (${range})` : parts;
                })}
              />
            </div>
          )}

          {languageEntries.length > 0 && (
            <div>
              <ResumeSectionTitle>Languages</ResumeSectionTitle>
              <ResumeBulletList items={languageEntries.map((entry) => formatLanguageEntry(entry))} />
            </div>
          )}

          <div>
            <ResumeSectionTitle>GitHub</ResumeSectionTitle>
            <ResumeBulletList
              items={[
                `${profile.public_repos ?? 0} repositórios públicos`,
                `${totalCommits} commits totais`,
                ...(githubSinceYear ? [`no github desde ${githubSinceYear}`] : []),
                `${profile.followers ?? 0} followers`,
              ]}
            />
          </div>
        </div>

        <div className="mt-[14pt] pt-[6pt] border-t border-[#e5e7eb] text-[7.5pt] text-[#9ca3af] text-center">
          generated automatically from github · meufolio.dev/@{profile.github_username}
        </div>
      </div>
    </div>
  );
}
