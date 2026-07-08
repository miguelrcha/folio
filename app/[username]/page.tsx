import { notFound } from "next/navigation";
import { after } from "next/server";
import type { Metadata } from "next";
import { GithubIcon } from "@/components/GithubIcon";
import { ProfileHeader } from "@/components/ProfileHeader";
import { DownloadCvButton } from "@/components/DownloadCvButton";
import { SignOutButton } from "@/components/SignOutButton";
import { createClient } from "@/lib/supabase/server";
import { EditProjectsModal } from "@/components/EditProjectsModal";
import { EditOverviewModal } from "@/components/EditOverviewModal";
import { EditExperiencesModal } from "@/components/EditExperiencesModal";
import { EditStacksModal } from "@/components/EditStacksModal";
import { EditCertificationsModal } from "@/components/EditCertificationsModal";
import { EditLanguagesModal } from "@/components/EditLanguagesModal";
import { EditEmailModal } from "@/components/EditEmailModal";
import { MailIcon } from "@/components/MailIcon";
import { ProtectedEmailLink } from "@/components/ProtectedEmailLink";
import { ResumeDocument } from "@/components/ResumeDocument";
import { formatExperienceRange } from "@/lib/experience";
import { formatCertificationRange } from "@/lib/certification";
import { formatLanguageEntry } from "@/lib/language";
import { ConnectLinkedInButton } from "@/components/ConnectLinkedInButton";
import { syncProfileIfStale } from "@/lib/github-sync";
import type { PublicProfile, Repo } from "@/lib/profile";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  return { title: `Folio - ${username}` };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("public_profiles")
    .select("*")
    .eq("github_username", username)
    .single<PublicProfile>();

  if (!profile) notFound();

  // Mantém foto, nome, bio, followers e commits em dia a cada visita/refresh
  // do perfil, sem travar o carregamento da página nem estourar o rate
  // limit do GitHub — roda em background após a resposta ser enviada, e só
  // de fato sincroniza se o último sync tiver mais de 1h (ver
  // syncProfileIfStale).
  after(() => syncProfileIfStale(username));

  const { data: repos } = await supabase
    .from("repos")
    .select("id, name, description, summary, stack, stars, forks, impact_score")
    .eq("profile_id", profile.id)
    .eq("is_selected", true)
    .order("impact_score", { ascending: false })
    .returns<Repo[]>();

  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();
  const isOwner = currentUser?.id === profile.id;

  const selectedRepos = repos ?? [];
  const githubSinceYear = profile.github_created_at
    ? new Date(profile.github_created_at).getFullYear()
    : null;

  return (
    <div className="relative z-10 min-h-screen">
      <ProfileHeader>
        {isOwner && <SignOutButton />}
        <DownloadCvButton profile={profile} repos={selectedRepos} />
      </ProfileHeader>

      <main id="resume-content" className="max-w-4xl mx-auto px-6 py-14 print:hidden">
        {/* Hero */}
        <section className="flex flex-col md:flex-row md:items-center gap-6 md:gap-8">
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt={profile.github_username}
              className="h-24 w-24 rounded-xl border border-[var(--color-border-bright)] object-cover shrink-0"
            />
          ) : (
            <div className="h-24 w-24 rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border-bright)] shrink-0" />
          )}
          <div>
            <h1 className="text-3xl md:text-4xl font-mono text-[var(--color-text)] flex flex-wrap items-baseline gap-x-2.5">
              {profile.full_name && <span>{profile.full_name}</span>}
              <span className={profile.full_name ? "text-[var(--color-text-muted)] text-xl md:text-2xl" : ""}>
                @{profile.github_username}
              </span>
            </h1>
            {(profile.location || profile.contact_email || isOwner) && (
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[var(--color-text-muted)]">
                {profile.location && <span>{profile.location}</span>}
                {(profile.contact_email || isOwner) && (
                  <span className="inline-flex items-center gap-1.5">
                    {profile.contact_email && (
                      <ProtectedEmailLink
                        encodedEmail={Buffer.from(profile.contact_email).toString("base64")}
                        className="inline-flex items-center gap-1.5 hover:text-[var(--color-text)] transition-colors"
                      />
                    )}
                    {!profile.contact_email && isOwner && <MailIcon className="h-4 w-4" />}
                    {isOwner && (
                      <EditEmailModal
                        profileId={profile.id}
                        initialEmail={profile.contact_email ?? ""}
                        githubEmail={currentUser?.email ?? null}
                      />
                    )}
                  </span>
                )}
              </div>
            )}
            {profile.bio && (
              <p className="mt-3 max-w-xl text-[var(--color-text)] leading-relaxed">
                {profile.bio}
              </p>
            )}
          </div>
        </section>

        {/* Stats */}
        <section className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-px bg-[var(--color-border)] rounded-lg overflow-hidden">
          {[
            { label: "followers", value: profile.followers ?? 0 },
            { label: "public repositories", value: profile.public_repos ?? 0 },
            { label: "total commits", value: profile.total_commits ?? 0 },
            { label: "on github since", value: githubSinceYear ?? "—" },
          ].map((stat) => (
            <div key={stat.label} className="bg-[var(--color-ink)] px-5 py-4">
              <div className="font-mono text-2xl text-[var(--color-accent)]">{stat.value}</div>
              <div className="text-xs text-[var(--color-text-faint)] mt-1">{stat.label}</div>
            </div>
          ))}
        </section>

        {/* Resumo profissional gerado automaticamente */}
        {(profile.summary || isOwner) && (
          <section className="mt-12">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs uppercase tracking-widest text-[var(--color-text-faint)]">
                overview
              </span>
              {isOwner && (
                <EditOverviewModal profileId={profile.id} initialSummary={profile.summary ?? ""} />
              )}
              <span className="flex-1 h-px bg-[var(--color-border)]" />
            </div>
            <p className="mt-3 text-[var(--color-text)] leading-relaxed max-w-3xl">
              {profile.summary || (
                <span className="text-[var(--color-text-faint)] font-mono text-sm">
                  nenhum resumo ainda.
                </span>
              )}
            </p>
          </section>
        )}

        {/* Experiences */}
        <section className="mt-12">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs uppercase tracking-widest text-[var(--color-text-faint)]">
              experiences
            </span>
            {isOwner && (
              <>
                <EditExperiencesModal
                  profileId={profile.id}
                  initialEntries={Array.isArray(profile.experiences_json) ? profile.experiences_json : []}
                />
                <ConnectLinkedInButton />
              </>
            )}
            <span className="flex-1 h-px bg-[var(--color-border)]" />
          </div>
          {Array.isArray(profile.experiences_json) && profile.experiences_json.length > 0 ? (
            <div className="mt-4 space-y-4">
              {profile.experiences_json.map((exp, i) => (
                <div key={i}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-mono text-sm text-[var(--color-text)]">{exp?.title ?? ""}</p>
                      <p className="text-sm text-[var(--color-text-muted)]">{exp?.company ?? ""}</p>
                    </div>
                    <span className="shrink-0 text-xs font-mono text-[var(--color-text-faint)] whitespace-nowrap">
                      {formatExperienceRange(exp)}
                    </span>
                  </div>
                  {Array.isArray(exp?.bullets) && exp.bullets.length > 0 && (
                    <ul className="mt-2 space-y-1 pl-4">
                      {exp.bullets.map((bullet, bi) => (
                        <li key={bi} className="text-sm text-[var(--color-text-muted)] list-disc leading-relaxed">
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-[var(--color-text-faint)] font-mono text-sm">
              No professional experience added yet.
            </p>
          )}
        </section>

        {/* Stack real */}
        {((profile.top_stack && profile.top_stack.length > 0) || isOwner) && (
          <section className="mt-12">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs uppercase tracking-widest text-[var(--color-text-faint)]">
                stacks
              </span>
              {isOwner && (
                <EditStacksModal profileId={profile.id} initialStacks={profile.top_stack ?? []} />
              )}
              <span className="flex-1 h-px bg-[var(--color-border)]" />
            </div>
            {profile.top_stack && profile.top_stack.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {profile.top_stack.map((s) => (
                  <span
                    key={s.name}
                    className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-2.5 py-1 font-mono text-xs text-[var(--color-text)]"
                  >
                    {s.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-[var(--color-text-faint)] font-mono text-sm">
                No stacks added yet.
              </p>
            )}
          </section>
        )}

        {/* Portfólio ordenado por impacto — como já estava, sem mudanças */}
        <section className="mt-12">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs uppercase tracking-widest text-[var(--color-text-faint)]">
              projects, by impact
            </span>
            {isOwner && <EditProjectsModal profileId={profile.id} />}
            <span className="flex-1 h-px bg-[var(--color-border)]" />
          </div>
          {selectedRepos.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--color-text-faint)] font-mono">
              No projects selected yet.
            </p>
          ) : (
            <ol className="mt-4 space-y-4">
              {selectedRepos.map((repo, i) => (
                <li key={repo.id}>
                  <a
                    href={`https://github.com/${profile.github_username}/${repo.name}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4 transition-colors hover:border-[var(--color-border-bright)] hover:bg-[var(--color-surface-raised)]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="font-mono text-xs text-[var(--color-text-faint)]">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span className="font-mono text-[var(--color-text)] group-hover:underline underline-offset-2">
                            {repo.name}
                          </span>
                          <GithubIcon className="h-3 w-3 text-[var(--color-text-faint)] opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className="mt-1.5 text-sm text-[var(--color-text-muted)] max-w-xl">
                          {repo.description || "sem descrição"}
                        </p>
                        <div className="mt-2.5 flex flex-wrap gap-2">
                          {(repo.stack ?? []).slice(0, 6).map((s) => (
                            <span
                              key={s}
                              className="text-[11px] font-mono text-[var(--color-text-faint)] border border-[var(--color-border)] rounded px-1.5 py-0.5"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="shrink-0 text-right font-mono text-xs text-[var(--color-text-faint)] space-y-0.5">
                        <div>★ {repo.stars}</div>
                        <div>{repo.forks} forks</div>
                      </div>
                    </div>
                  </a>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* Certificados */}
        <section className="mt-12">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs uppercase tracking-widest text-[var(--color-text-faint)]">
              certificates
            </span>
            {isOwner && (
              <>
                <EditCertificationsModal
                  profileId={profile.id}
                  initialEntries={
                    Array.isArray(profile.certifications_json) ? profile.certifications_json : []
                  }
                />
                <ConnectLinkedInButton />
              </>
            )}
            <span className="flex-1 h-px bg-[var(--color-border)]" />
          </div>
          {Array.isArray(profile.certifications_json) && profile.certifications_json.length > 0 ? (
            <div className="mt-4 space-y-4">
              {profile.certifications_json.map((cert, i) => (
                <div key={i} className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-sm text-[var(--color-text)]">{cert?.name ?? ""}</p>
                    <p className="text-sm text-[var(--color-text-muted)]">{cert?.issuer ?? ""}</p>
                  </div>
                  <span className="shrink-0 text-xs font-mono text-[var(--color-text-faint)] whitespace-nowrap">
                    {formatCertificationRange(cert)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-[var(--color-text-faint)] font-mono text-sm">
              No certifications added yet.
            </p>
          )}
        </section>

        {/* Languages */}
        <section className="mt-12 mb-20">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs uppercase tracking-widest text-[var(--color-text-faint)]">
              languages
            </span>
            {isOwner && (
              <EditLanguagesModal
                profileId={profile.id}
                initialEntries={Array.isArray(profile.languages_json) ? profile.languages_json : []}
              />
            )}
            <span className="flex-1 h-px bg-[var(--color-border)]" />
          </div>
          {Array.isArray(profile.languages_json) && profile.languages_json.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {profile.languages_json.map((entry, i) => (
                <span
                  key={i}
                  className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-2.5 py-1 font-mono text-xs text-[var(--color-text)]"
                >
                  {formatLanguageEntry(entry)}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-[var(--color-text-faint)] font-mono text-sm">
              No languages added yet.
            </p>
          )}
        </section>

        <footer className="pb-10 flex items-center justify-between text-xs font-mono text-[var(--color-text-faint)]">
          <span>generated automatically from github · meufolio.dev/@{profile.github_username}</span>
          <a
            href={`https://github.com/${profile.github_username}`}
            className="inline-flex items-center gap-1.5 hover:text-[var(--color-text-muted)] transition-colors"
          >
            <GithubIcon className="h-3.5 w-3.5" />
            Github
          </a>
        </footer>
      </main>

      <ResumeDocument profile={profile} repos={selectedRepos} />
    </div>
  );
}