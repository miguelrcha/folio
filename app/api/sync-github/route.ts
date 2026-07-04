import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { decrypt } from "@/lib/crypto";

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
//
// Pra não parecer um mad-lib (mesma frase, só trocando os números), existem
// várias variações de template e a escolha é determinística por usuário
// (hash do username) — assim o texto não muda a cada sync, mas dois perfis
// diferentes tendem a sair com estruturas de frase diferentes.
function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function joinStack(names: string[]): string {
  if (names.length === 0) return "múltiplas tecnologias";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} e ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} e ${names[names.length - 1]}`;
}

function buildSummary(opts: {
  username: string;
  topStack: { name: string; percentage: number }[];
  publicRepos: number;
  activeRepos: number;
  totalStars: number;
  topRepoName: string | null;
}) {
  const stackNames = opts.topStack.slice(0, 3).map((s) => s.name);
  const stack = joinStack(stackNames);
  const hasStars = opts.totalStars > 0;
  const hasTopRepo = Boolean(opts.topRepoName);

  const variants = [
    `Desenvolvedor(a) com foco em ${stack}, mantendo ${opts.publicRepos} repositórios públicos no GitHub — ${opts.activeRepos} deles com atividade nos últimos 90 dias.`,

    `Trabalha principalmente com ${stack}.${
      hasStars
        ? ` No GitHub, soma ${opts.totalStars} estrelas distribuídas entre ${opts.publicRepos} repositórios públicos.`
        : ` Mantém ${opts.publicRepos} repositórios públicos no GitHub, com foco em qualidade sobre quantidade.`
    }`,

    `${stack} formam a stack principal.${
      hasTopRepo
        ? ` O projeto ${opts.topRepoName} é o destaque atual, dentro de um total de ${opts.publicRepos} repositórios públicos.`
        : ` Mantém uma base de ${opts.publicRepos} repositórios públicos no GitHub.`
    }`,

    `Constrói principalmente em ${stack}.${
      hasStars
        ? ` Já acumulou ${opts.totalStars} estrelas em projetos open source`
        : ` Mantém presença ativa em código aberto`
    }, com ${opts.activeRepos} repositórios em desenvolvimento nos últimos 90 dias.`,

    `Entre ${opts.publicRepos} repositórios públicos no GitHub, ${opts.activeRepos} seguem em desenvolvimento ativo — principalmente em ${stack}${
      hasTopRepo ? `, com destaque para ${opts.topRepoName}` : ""
    }.`,
  ];

  const index = hashSeed(opts.username) % variants.length;
  return variants[index];
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

  let githubAccessToken: string;
  try {
    githubAccessToken = decrypt(profile.github_access_token);
  } catch {
    // Token salvo antes dessa criptografia entrar em vigor (texto puro).
    // Pede pra pessoa logar de novo pra ele ser salvo já criptografado.
    return NextResponse.json(
      { error: "token in legacy format, please sign in again" },
      { status: 401 }
    );
  }

  const githubHeaders = {
    Authorization: `Bearer ${githubAccessToken}`,
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

  const totalStars = enriched.reduce((sum, r) => sum + r.stars, 0);
  const topRepoName =
    enriched.length > 0
      ? enriched.slice().sort((a, b) => b.impact_score - a.impact_score)[0].name
      : null;

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
      summary: buildSummary({
        username: githubUser.login,
        topStack,
        publicRepos: githubUser.public_repos,
        activeRepos,
        totalStars,
        topRepoName,
      }),
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({ synced: enriched.length });
}