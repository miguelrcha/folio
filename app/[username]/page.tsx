import { notFound } from "next/navigation";
import { after } from "next/server";
import type { Metadata } from "next";
import { GithubIcon } from "@/components/GithubIcon";
import { ProfileHeader } from "@/components/ProfileHeader";
import { DownloadCvButton } from "@/components/DownloadCvButton";
import { SignOutButton } from "@/components/SignOutButton";
import { DeleteAccountButton } from "@/components/DeleteAccountButton";
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
import { ShareCardButton } from "@/components/ShareCardButton";
import { CvPrintFallback } from "@/components/CvPrintFallback";
import { CvPreviewCoordinator } from "@/components/CvPreviewCoordinator";
import { CvPreviewLayoutShell } from "@/components/CvPreviewLayoutShell";
import { resolveCvConfig } from "@/lib/cv/config";
import { formatExperienceRange } from "@/lib/experience";
import { formatCertificationRange } from "@/lib/certification";
import { formatLanguageEntry } from "@/lib/language";
import { ConnectLinkedInButton } from "@/components/ConnectLinkedInButton";
import { syncProfileIfStale } from "@/lib/github-sync";
import { getServerLanguage } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/translations";
import type { Repo } from "@/lib/profile";
import { buildProfileMetaDescription, profileDisplayName } from "@/lib/profile-metadata";
import { getPublicProfile } from "./profile-data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const profile = await getPublicProfile(username);

  // Unknown usernames get honest not-found metadata and stay out of the
  // index instead of advertising a page that 404s.
  if (!profile) {
    return {
      title: "Profile not found - Folio",
      description: "This GitHub username isn't on Folio yet.",
      robots: { index: false },
    };
  }

  const displayName = profileDisplayName(profile);
  const title = `${displayName} - Folio`;
  const description = buildProfileMetaDescription(profile);
  const path = `/${profile.github_username}`;

  // og:image and twitter:image come from the sibling opengraph-image.tsx
  // file convention; relative URLs resolve against metadataBase (root layout).
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "profile",
      username: profile.github_username,
      url: path,
      title,
      description,
      siteName: "Folio",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();
  const lang = await getServerLanguage();
  const t = (key: string, vars?: Record<string, string | number>) => translate(lang, key, vars);

  const profile = await getPublicProfile(username);

  if (!profile) notFound();

  // Keeps photo, name, bio, followers and commits current on every
  // visit/refresh of the profile, without blocking the page load or hitting
  // GitHub's rate limit — runs in the background after the response is
  // sent, and only actually syncs if the last sync is more than 1h old (see
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
  const savedCvConfig = resolveCvConfig(profile.cv_config);

  return (
    <CvPreviewCoordinator>
    <CvPreviewLayoutShell>
      <ProfileHeader>
        {isOwner && <SignOutButton />}
        <DownloadCvButton profile={profile} repos={selectedRepos} isOwner={isOwner} />
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
          <div className="flex-1 flex items-start justify-between gap-4">
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
            <ShareCardButton username={profile.github_username} />
          </div>
        </section>

        {/* Stats */}
        <section className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-px bg-[var(--color-border)] rounded-lg overflow-hidden">
          {[
            { label: t("profile.stats.followers"), value: profile.followers ?? 0 },
            { label: t("profile.stats.publicRepos"), value: profile.public_repos ?? 0 },
            { label: t("profile.stats.totalCommits"), value: profile.total_commits ?? 0 },
            { label: t("profile.stats.onGithubSince"), value: githubSinceYear ?? "—" },
          ].map((stat) => (
            <div key={stat.label} className="bg-[var(--color-ink)] px-5 py-4">
              <div className="font-mono text-2xl text-[var(--color-accent)]">{stat.value}</div>
              <div className="text-xs text-[var(--color-text-faint)] mt-1">{stat.label}</div>
            </div>
          ))}
        </section>

        {/* Auto-generated professional summary */}
        {(profile.summary || isOwner) && (
          <section className="mt-12">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs uppercase tracking-widest text-[var(--color-text-faint)]">
                {t("profile.section.overview")}
              </span>
              {isOwner && (
                <EditOverviewModal profileId={profile.id} initialSummary={profile.summary ?? ""} />
              )}
              <span className="flex-1 h-px bg-[var(--color-border)]" />
            </div>
            <p className="mt-3 text-[var(--color-text)] leading-relaxed max-w-3xl">
              {profile.summary || (
                <span className="text-[var(--color-text-faint)] font-mono text-sm">
                  {t("profile.empty.summary")}
                </span>
              )}
            </p>
          </section>
        )}

        {/* Experiences */}
        <section className="mt-12">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs uppercase tracking-widest text-[var(--color-text-faint)]">
              {t("profile.section.experiences")}
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
                      {formatExperienceRange(exp, lang)}
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
              {t("profile.empty.experiences")}
            </p>
          )}
        </section>

        {/* Real stack */}
        {((profile.top_stack && profile.top_stack.length > 0) || isOwner) && (
          <section className="mt-12">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs uppercase tracking-widest text-[var(--color-text-faint)]">
                {t("profile.section.stacks")}
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
                {t("profile.empty.stacks")}
              </p>
            )}
          </section>
        )}

        {/* Portfolio ordered by impact — unchanged from before */}
        <section className="mt-12">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs uppercase tracking-widest text-[var(--color-text-faint)]">
              {t("profile.section.projects")}
            </span>
            {isOwner && <EditProjectsModal profileId={profile.id} />}
            <span className="flex-1 h-px bg-[var(--color-border)]" />
          </div>
          {selectedRepos.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--color-text-faint)] font-mono">
              {t("profile.empty.projects")}
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
                          {repo.description || t("profile.noDescription")}
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
                        <div>{repo.forks} {t("profile.forks")}</div>
                      </div>
                    </div>
                  </a>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* Certifications */}
        <section className="mt-12">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs uppercase tracking-widest text-[var(--color-text-faint)]">
              {t("profile.section.certificates")}
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
                    {formatCertificationRange(cert, lang)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-[var(--color-text-faint)] font-mono text-sm">
              {t("profile.empty.certificates")}
            </p>
          )}
        </section>

        {/* Languages */}
        <section className="mt-12 mb-20">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs uppercase tracking-widest text-[var(--color-text-faint)]">
              {t("profile.section.languages")}
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
              {t("profile.empty.languages")}
            </p>
          )}
        </section>

        <footer className="pb-10 flex flex-col-reverse items-center gap-3 text-center text-xs font-mono text-[var(--color-text-faint)] md:flex-row md:justify-between md:text-left">
          <span>{t("profile.footer.generated")} · meufolio.dev/{profile.github_username}</span>
          <div className="flex items-center gap-4">
            {isOwner && <DeleteAccountButton profileId={profile.id} />}
            <a
              href={`https://github.com/${profile.github_username}`}
              className="inline-flex items-center gap-1.5 hover:text-[var(--color-text-muted)] transition-colors"
            >
              <GithubIcon className="h-3.5 w-3.5" />
              {t("profile.footer.github")}
            </a>
          </div>
        </footer>
      </main>

      {/* Always mounted (owner and visitor alike) so a plain Cmd/Ctrl+P works
          with no other action. Owners customizing the CV do so on the
          dedicated /[username]/cv-studio route instead of here. */}
      <CvPrintFallback profile={profile} repos={selectedRepos} config={savedCvConfig} />
    </CvPreviewLayoutShell>
    </CvPreviewCoordinator>
  );
}