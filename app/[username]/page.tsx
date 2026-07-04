import { notFound } from "next/navigation";
import { GithubIcon } from "@/components/GithubIcon";
import { ProfileHeader } from "@/components/ProfileHeader";
import { DownloadCvButton } from "@/components/DownloadCvButton";
import { SignOutButton } from "@/components/SignOutButton";
import { createClient } from "@/lib/supabase/server";
import { EditProjectsModal } from "@/components/EditProjectsModal";

type PublicProfile = {
  id: string;
  github_username: string;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  summary: string | null;
  public_repos: number | null;
  followers: number | null;
  top_stack: { name: string; percentage: number }[] | null;
};

type Repo = {
  id: string;
  name: string;
  description: string | null;
  stack: string[] | null;
  stars: number;
  forks: number;
  impact_score: number;
};

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

  const { data: repos } = await supabase
    .from("repos")
    .select("id, name, description, stack, stars, forks, impact_score")
    .eq("profile_id", profile.id)
    .eq("is_selected", true)
    .order("impact_score", { ascending: false })
    .returns<Repo[]>();

  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();
  const isOwner = currentUser?.id === profile.id;

  const selectedRepos = repos ?? [];
  const totalStars = selectedRepos.reduce((sum, r) => sum + r.stars, 0);

  return (
    <div className="relative z-10 min-h-screen">
      <ProfileHeader>
        {isOwner && <SignOutButton />}
        <DownloadCvButton username={profile.github_username} />
      </ProfileHeader>

      <main id="resume-content" className="max-w-4xl mx-auto px-6 py-14">
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
            <h1 className="text-3xl md:text-4xl font-mono text-[var(--color-text)]">
              @{profile.github_username}
            </h1>
            {profile.location && (
              <p className="mt-1 text-[var(--color-text-muted)]">{profile.location}</p>
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
            { label: "seguidores", value: profile.followers ?? 0 },
            { label: "repositórios públicos", value: profile.public_repos ?? 0 },
            { label: "projetos no folio", value: selectedRepos.length },
            { label: "estrelas nos projetos", value: totalStars },
          ].map((stat) => (
            <div key={stat.label} className="bg-[var(--color-ink)] px-5 py-4">
              <div className="font-mono text-2xl text-[var(--color-accent)]">{stat.value}</div>
              <div className="text-xs text-[var(--color-text-faint)] mt-1">{stat.label}</div>
            </div>
          ))}
        </section>

        {/* Resumo profissional gerado automaticamente */}
        {profile.summary && (
          <section className="mt-12">
            <SectionLabel>overview</SectionLabel>
            <p className="mt-3 text-[var(--color-text)] leading-relaxed max-w-3xl">
              {profile.summary}
            </p>
          </section>
        )}

        {/* Stack real */}
        {profile.top_stack && profile.top_stack.length > 0 && (
          <section className="mt-12">
            <SectionLabel>stacks</SectionLabel>
            <div className="mt-4 space-y-2.5 max-w-xl">
              {profile.top_stack.map((s) => (
                <div key={s.name} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 font-mono text-sm text-[var(--color-text-muted)]">
                    {s.name}
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-[var(--color-surface-raised)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--color-accent)]"
                      style={{ width: `${s.percentage}%` }}
                    />
                  </div>
                  <span className="w-10 text-right font-mono text-xs text-[var(--color-text-faint)]">
                    {s.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Portfólio ordenado por impacto */}
        <section className="mt-12 mb-20">
          <div className="flex items-center gap-3">
            <span className="font-lato text-xs uppercase tracking-widest text-[var(--color-text-faint)]">
              projects, by impact
            </span>
            {isOwner && <EditProjectsModal profileId={profile.id} />}
            <span className="flex-1 h-px bg-[var(--color-border)]" />
          </div>
          {selectedRepos.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--color-text-faint)] font-mono">
              nenhum projeto selecionado ainda.
            </p>
          ) : (
            <ol className="mt-4 space-y-4">
              {selectedRepos.map((repo, i) => (
                <li
                  key={repo.id}
                  className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="font-mono text-xs text-[var(--color-text-faint)]">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="font-mono text-[var(--color-text)]">{repo.name}</span>
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
                </li>
              ))}
            </ol>
          )}
        </section>

        <footer className="pb-10 flex items-center justify-between text-xs font-mono text-[var(--color-text-faint)]">
          <span>gerado automaticamente a partir do github · folio.dev/@{profile.github_username}</span>
          <a
            href={`https://github.com/${profile.github_username}`}
            className="inline-flex items-center gap-1.5 hover:text-[var(--color-text-muted)] transition-colors"
          >
            <GithubIcon className="h-3.5 w-3.5" />
            Github
          </a>
        </footer>
      </main>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="font-mono text-xs uppercase tracking-widest text-[var(--color-text-faint)]">
        {children}
      </span>
      <span className="flex-1 h-px bg-[var(--color-border)]" />
    </div>
  );
}