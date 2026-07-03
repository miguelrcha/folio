import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function impactScore(repo: {
  stargazers_count: number;
  forks_count: number;
  fork: boolean;
  pushed_at: string;
}) {
  const recencyBoost =
    Date.now() - new Date(repo.pushed_at).getTime() < 1000 * 60 * 60 * 24 * 90 ? 10 : 0;
  return repo.stargazers_count * 3 + repo.forks_count * 2 + (repo.fork ? -20 : 10) + recencyBoost;
}

// Resumo gerado automaticamente a partir dos dados reais (sem IA por trás,
// só regras) — se depois vocês quiserem trocar por uma chamada à API da
// Anthropic pra deixar mais natural, é só substituir essa função.
function buildSummary(opts: {
  topStack: { name: string; percentage: number }[];
  publicRepos: number;
  activeRepos: number;
}) {
  const [first, second] = opts.topStack;
  const stackPhrase = second
    ? `${first?.name ?? "código"} e ${second.name}`
    : first?.name ?? "múltiplas tecnologias";

  return `Desenvolvedor(a) com foco em ${stackPhrase}, mantendo ${opts.publicRepos} repositórios públicos no GitHub — ${opts.activeRepos} deles com atividade nos últimos 90 dias.`;
}

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("github_access_token")
    .eq("id", user.id)
    .single();

  if (!profile?.github_access_token) {
    return NextResponse.json({ error: "no github token stored" }, { status: 400 });
  }

  const githubHeaders = {
    Authorization: `Bearer ${profile.github_access_token}`,
    Accept: "application/vnd.github+json",
  };

  // 1. Dados do usuário (bio, localização, contadores)
  const userRes = await fetch("https://api.github.com/user", { headers: githubHeaders });
  if (!userRes.ok) {
    return NextResponse.json({ error: "github user fetch failed" }, { status: 502 });
  }
  const githubUser = await userRes.json();

  // 2. Repositórios
  const reposRes = await fetch(
    "https://api.github.com/user/repos?per_page=100&sort=pushed&affiliation=owner",
    { headers: githubHeaders }
  );
  const repos = await reposRes.json();

  // 3. Linguagens por repo (bytes), em paralelo — usadas tanto pro card do
  // repo quanto pra agregação da stack geral do perfil
  const languageBytesTotal: Record<string, number> = {};

  const enriched = await Promise.all(
    repos.map(async (repo: any) => {
      const langRes = await fetch(repo.languages_url, { headers: githubHeaders });
      const languages: Record<string, number> = await langRes.json();

      for (const [lang, bytes] of Object.entries(languages)) {
        languageBytesTotal[lang] = (languageBytesTotal[lang] ?? 0) + bytes;
      }

      return {
        profile_id: user.id,
        github_repo_id: repo.id,
        name: repo.name,
        description: repo.description ?? "",
        stack: Object.keys(languages),
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        commits: 0,
        impact_score: impactScore(repo),
        is_selected: false,
      };
    })
  );

  // 4. Agrega a stack geral em percentuais
  const totalBytes = Object.values(languageBytesTotal).reduce((a, b) => a + b, 0);
  const topStack = Object.entries(languageBytesTotal)
    .map(([name, bytes]) => ({
      name,
      percentage: totalBytes > 0 ? Math.round((bytes / totalBytes) * 100) : 0,
    }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 5);

  const activeRepos = repos.filter(
    (r: any) => Date.now() - new Date(r.pushed_at).getTime() < 1000 * 60 * 60 * 24 * 90
  ).length;

  // 5. Salva repos
  const { error: reposError } = await supabase
    .from("repos")
    .upsert(enriched, { onConflict: "profile_id,github_repo_id" });

  if (reposError) {
    return NextResponse.json({ error: reposError.message }, { status: 500 });
  }

  // 6. Atualiza o perfil com os dados agregados
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      bio: githubUser.bio,
      location: githubUser.location,
      public_repos: githubUser.public_repos,
      followers: githubUser.followers,
      top_stack: topStack,
      summary: buildSummary({ topStack, publicRepos: githubUser.public_repos, activeRepos }),
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({ synced: enriched.length });
}