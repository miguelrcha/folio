import { GithubIcon } from "@/components/GithubIcon";
import { formatExperienceRange } from "@/lib/experience";
import type { PublicProfile, Repo } from "@/lib/profile";

function ResumeSectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[8.5pt] font-bold uppercase tracking-[0.12em] text-[#111827] border-b border-[#d1d5db] pb-[2pt] mb-[6pt]">
      {children}
    </h2>
  );
}

function ResumeTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block rounded-[3pt] border border-[#d1d5db] px-[5pt] py-[1.5pt] text-[7.5pt] text-[#374151] leading-none">
      {children}
    </span>
  );
}

// Layout dedicado de 1 página A4 pra impressão/PDF do CV — renderizado só em
// @media print (ver .resume-print no globals.css + hidden print:block aqui).
// Independente da UI escura interativa do resto do site: tipografia clara,
// compacta, pensada pra caber numa página só com os dados reais do GitHub.
export function ResumeDocument({
  profile,
  repos,
  totalStars,
  githubSinceYear,
}: {
  profile: PublicProfile;
  repos: Repo[];
  totalStars: number;
  githubSinceYear: number | null;
}) {
  const languageLines = (profile.languages ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const stacks = profile.top_stack ?? [];
  const experiences = Array.isArray(profile.experiences_json) ? profile.experiences_json : [];

  return (
    <div className="hidden print:block bg-white text-[#111827]" style={{ fontFamily: "var(--font-sans)" }}>
      {/* Header */}
      <div className="flex items-start gap-[12pt]">
        {profile.avatar_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
            alt={profile.github_username}
            className="h-[46pt] w-[46pt] rounded-full object-cover shrink-0 border border-[#d1d5db]"
          />
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-[19pt] font-bold leading-tight text-[#0a0a0a]">
            {profile.full_name || `@${profile.github_username}`}
          </h1>
          {profile.bio && (
            <p className="mt-[2pt] text-[9pt] text-[#4b5563] leading-snug">{profile.bio}</p>
          )}
          <div className="mt-[5pt] flex flex-wrap gap-x-[10pt] gap-y-[2pt] text-[8pt] text-[#4b5563]">
            {profile.location && <span>{profile.location}</span>}
            <span className="inline-flex items-center gap-[3pt]">
              <GithubIcon className="h-[8pt] w-[8pt]" />
              github.com/{profile.github_username}
            </span>
            <span>folio.dev/@{profile.github_username}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-[10pt] flex gap-[16pt] text-[8pt] text-[#4b5563] border-y border-[#e5e7eb] py-[6pt]">
        <span>
          <strong className="text-[#0a0a0a]">{profile.followers ?? 0}</strong> followers
        </span>
        <span>
          <strong className="text-[#0a0a0a]">{profile.public_repos ?? 0}</strong> public repos
        </span>
        <span>
          <strong className="text-[#0a0a0a]">{totalStars}</strong> stars
        </span>
        {githubSinceYear && (
          <span>
            on GitHub since <strong className="text-[#0a0a0a]">{githubSinceYear}</strong>
          </span>
        )}
      </div>

      {/* Body: two columns */}
      <div className="mt-[12pt] grid grid-cols-[1fr_2.1fr] gap-[18pt]">
        {/* Left column */}
        <div className="space-y-[12pt]">
          {stacks.length > 0 && (
            <div>
              <ResumeSectionTitle>Stack</ResumeSectionTitle>
              <div className="flex flex-wrap gap-[4pt]">
                {stacks.map((s) => (
                  <ResumeTag key={s.name}>{s.name}</ResumeTag>
                ))}
              </div>
            </div>
          )}

          {languageLines.length > 0 && (
            <div>
              <ResumeSectionTitle>Languages</ResumeSectionTitle>
              <ul className="space-y-[2pt] text-[8.5pt] text-[#374151]">
                {languageLines.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </div>
          )}

          {profile.certifications && (
            <div>
              <ResumeSectionTitle>Certifications</ResumeSectionTitle>
              <p className="text-[8.5pt] text-[#374151] leading-snug whitespace-pre-line">
                {profile.certifications}
              </p>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-[12pt]">
          {profile.summary && (
            <div>
              <ResumeSectionTitle>Overview</ResumeSectionTitle>
              <p className="text-[8.5pt] text-[#374151] leading-relaxed">{profile.summary}</p>
            </div>
          )}

          {experiences.length > 0 && (
            <div>
              <ResumeSectionTitle>Experience</ResumeSectionTitle>
              <div className="space-y-[6pt]">
                {experiences.map((exp, i) => (
                  <div key={i} className="flex items-baseline justify-between gap-[8pt]">
                    <div>
                      <p className="text-[9pt] font-semibold text-[#0a0a0a]">{exp?.title ?? ""}</p>
                      <p className="text-[8.5pt] text-[#4b5563]">{exp?.company ?? ""}</p>
                    </div>
                    <span className="shrink-0 text-[7.5pt] text-[#6b7280] whitespace-nowrap">
                      {formatExperienceRange(exp)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {repos.length > 0 && (
            <div>
              <ResumeSectionTitle>Projects, by impact</ResumeSectionTitle>
              <div className="space-y-[7pt]">
                {repos.map((repo) => (
                  <div key={repo.id}>
                    <div className="flex items-baseline justify-between gap-[8pt]">
                      <span className="text-[9pt] font-semibold text-[#0a0a0a]">{repo.name}</span>
                      <span className="shrink-0 text-[7.5pt] text-[#6b7280] whitespace-nowrap">
                        ★ {repo.stars} · {repo.forks} forks
                      </span>
                    </div>
                    {repo.description && (
                      <p className="text-[8.5pt] text-[#4b5563] leading-snug">{repo.description}</p>
                    )}
                    {repo.stack && repo.stack.length > 0 && (
                      <div className="mt-[3pt] flex flex-wrap gap-[3pt]">
                        {repo.stack.slice(0, 6).map((s) => (
                          <ResumeTag key={s}>{s}</ResumeTag>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-[14pt] pt-[6pt] border-t border-[#e5e7eb] text-[7.5pt] text-[#9ca3af]">
        generated automatically from github · folio.dev/@{profile.github_username}
      </div>
    </div>
  );
}
