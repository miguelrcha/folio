import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { decrypt } from "@/lib/crypto";

export class SyncError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type StructureSignals = {
  hasReadme: boolean;
  hasTests: boolean;
  hasCi: boolean;
  hasLicense: boolean;
};

// Matches a root-level README (any extension), not nested ones — a README
// buried three folders deep isn't a signal that the project is documented.
const README_PATH_REGEX = /^readme(\.[a-z0-9]+)?$/i;
// Matches common test file/folder conventions across JS/TS, Python, Go, etc.
const TEST_PATH_REGEX = /(^|\/)(__tests__|tests?|spec)(\/|$)|\.(test|spec)\.[a-z]+$/i;

// Best-effort repo structure signals, used only to nudge impact_score — a
// fetch failure or a truncated tree (very large repos) just yields no bonus,
// it never fails the sync.
async function fetchStructureSignals(
  repo: { owner: { login: string }; name: string; default_branch: string; license: unknown },
  headers: Record<string, string>
): Promise<StructureSignals> {
  let hasReadme = false;
  let hasTests = false;
  let hasCi = false;

  try {
    const treeRes = await fetch(
      `https://api.github.com/repos/${repo.owner.login}/${repo.name}/git/trees/${repo.default_branch}?recursive=1`,
      { headers }
    );
    if (treeRes.ok) {
      const treeJson = await treeRes.json();
      const paths: string[] = Array.isArray(treeJson.tree)
        ? treeJson.tree.map((entry: { path: string }) => entry.path)
        : [];
      hasReadme = paths.some((p) => README_PATH_REGEX.test(p));
      hasTests = paths.some((p) => TEST_PATH_REGEX.test(p));
      hasCi = paths.some((p) => p.startsWith(".github/workflows/"));
    }
  } catch {
    // Network/parse failure — leave signals at their false defaults.
  }

  return { hasReadme, hasTests, hasCi, hasLicense: Boolean(repo.license) };
}

function impactScore(
  repo: {
    stargazers_count: number;
    forks_count: number;
    fork: boolean;
    pushed_at: string;
  },
  signals: StructureSignals
) {
  const recencyBoost =
    Date.now() - new Date(repo.pushed_at).getTime() < 1000 * 60 * 60 * 24 * 90 ? 10 : 0;
  // Free, metadata-only signals of project structure/health — a cheaper
  // stand-in for the AI-based analysis tracked in issue #4, until that lands.
  const structureBoost =
    (signals.hasReadme ? 5 : 0) +
    (signals.hasTests ? 8 : 0) +
    (signals.hasCi ? 8 : 0) +
    (signals.hasLicense ? 3 : 0);
  return (
    repo.stargazers_count * 3 +
    repo.forks_count * 2 +
    (repo.fork ? -20 : 10) +
    recencyBoost +
    structureBoost
  );
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

// Mapeia os códigos curtos usados pelo skillicons.dev (ex: "?i=js,ts,react")
// pro nome legível da tecnologia.
const SKILLICONS_NAMES: Record<string, string> = {
  js: "JavaScript",
  ts: "TypeScript",
  react: "React",
  nextjs: "Next.js",
  vue: "Vue.js",
  nuxtjs: "Nuxt.js",
  angular: "Angular",
  svelte: "Svelte",
  gatsby: "Gatsby",
  html: "HTML",
  css: "CSS",
  sass: "Sass",
  less: "Less",
  tailwind: "Tailwind CSS",
  bootstrap: "Bootstrap",
  bulma: "Bulma",
  materialui: "Material UI",
  nodejs: "Node.js",
  deno: "Deno",
  bun: "Bun",
  express: "Express",
  nestjs: "NestJS",
  php: "PHP",
  laravel: "Laravel",
  django: "Django",
  flask: "Flask",
  fastapi: "FastAPI",
  spring: "Spring",
  dotnet: ".NET",
  cs: "C#",
  cpp: "C++",
  c: "C",
  java: "Java",
  kotlin: "Kotlin",
  swift: "Swift",
  rust: "Rust",
  go: "Go",
  python: "Python",
  ruby: "Ruby",
  rails: "Ruby on Rails",
  scala: "Scala",
  haskell: "Haskell",
  elixir: "Elixir",
  erlang: "Erlang",
  perl: "Perl",
  r: "R",
  julia: "Julia",
  lua: "Lua",
  dart: "Dart",
  flutter: "Flutter",
  androidstudio: "Android Studio",
  xcode: "Xcode",
  unity: "Unity",
  unrealengine: "Unreal Engine",
  mysql: "MySQL",
  postgres: "PostgreSQL",
  mongodb: "MongoDB",
  redis: "Redis",
  sqlite: "SQLite",
  mariadb: "MariaDB",
  cassandra: "Cassandra",
  oracle: "Oracle",
  firebase: "Firebase",
  supabase: "Supabase",
  git: "Git",
  github: "GitHub",
  gitlab: "GitLab",
  bitbucket: "Bitbucket",
  docker: "Docker",
  kubernetes: "Kubernetes",
  aws: "AWS",
  gcp: "Google Cloud",
  azure: "Azure",
  heroku: "Heroku",
  vercel: "Vercel",
  netlify: "Netlify",
  digitalocean: "DigitalOcean",
  nginx: "Nginx",
  apache: "Apache",
  linux: "Linux",
  ubuntu: "Ubuntu",
  debian: "Debian",
  arch: "Arch Linux",
  windows: "Windows",
  apple: "Apple",
  bash: "Bash",
  vim: "Vim",
  vscode: "VS Code",
  figma: "Figma",
  blender: "Blender",
  threejs: "Three.js",
  webpack: "Webpack",
  vite: "Vite",
  babel: "Babel",
  eslint: "ESLint",
  jest: "Jest",
  cypress: "Cypress",
  selenium: "Selenium",
  postman: "Postman",
  graphql: "GraphQL",
  redux: "Redux",
  electron: "Electron",
  tensorflow: "TensorFlow",
  pytorch: "PyTorch",
  opencv: "OpenCV",
  numpy: "NumPy",
  pandas: "Pandas",
  matlab: "MATLAB",
  arduino: "Arduino",
  solidity: "Solidity",
};

// Mapeia os slugs do simple-icons usados no parâmetro `logo=` dos badges do
// shields.io (ex: https://img.shields.io/badge/Python-3776AB?logo=python)
// pro nome legível da tecnologia.
const SHIELDS_LOGO_NAMES: Record<string, string> = {
  javascript: "JavaScript",
  typescript: "TypeScript",
  react: "React",
  "next.js": "Next.js",
  nextdotjs: "Next.js",
  "vue.js": "Vue.js",
  vuedotjs: "Vue.js",
  nuxtdotjs: "Nuxt.js",
  angular: "Angular",
  svelte: "Svelte",
  gatsby: "Gatsby",
  html5: "HTML",
  css3: "CSS",
  sass: "Sass",
  less: "Less",
  tailwindcss: "Tailwind CSS",
  bootstrap: "Bootstrap",
  "node.js": "Node.js",
  nodedotjs: "Node.js",
  deno: "Deno",
  express: "Express",
  nestjs: "NestJS",
  php: "PHP",
  laravel: "Laravel",
  django: "Django",
  flask: "Flask",
  fastapi: "FastAPI",
  spring: "Spring",
  springboot: "Spring Boot",
  dotnet: ".NET",
  csharp: "C#",
  cplusplus: "C++",
  c: "C",
  java: "Java",
  kotlin: "Kotlin",
  swift: "Swift",
  rust: "Rust",
  go: "Go",
  python: "Python",
  ruby: "Ruby",
  rubyonrails: "Ruby on Rails",
  scala: "Scala",
  haskell: "Haskell",
  elixir: "Elixir",
  dart: "Dart",
  flutter: "Flutter",
  mysql: "MySQL",
  postgresql: "PostgreSQL",
  mongodb: "MongoDB",
  redis: "Redis",
  sqlite: "SQLite",
  mariadb: "MariaDB",
  firebase: "Firebase",
  supabase: "Supabase",
  git: "Git",
  github: "GitHub",
  gitlab: "GitLab",
  docker: "Docker",
  kubernetes: "Kubernetes",
  amazonaws: "AWS",
  googlecloud: "Google Cloud",
  microsoftazure: "Azure",
  heroku: "Heroku",
  vercel: "Vercel",
  netlify: "Netlify",
  digitalocean: "DigitalOcean",
  nginx: "Nginx",
  linux: "Linux",
  ubuntu: "Ubuntu",
  graphql: "GraphQL",
  redux: "Redux",
  electron: "Electron",
  tensorflow: "TensorFlow",
  pytorch: "PyTorch",
  numpy: "NumPy",
  pandas: "Pandas",
  solidity: "Solidity",
  figma: "Figma",
};

// Mapeia os slugs de pasta usados pelo devicon (ex:
// .../devicon/icons/java/java-original.svg) pro nome legível da tecnologia —
// esse é o formato mais comum em README gerado à mão, geralmente via
// <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/{slug}/...">.
const DEVICON_NAMES: Record<string, string> = {
  java: "Java",
  spring: "Spring",
  springboot: "Spring Boot",
  typescript: "TypeScript",
  javascript: "JavaScript",
  react: "React",
  go: "Go",
  golang: "Go",
  postgresql: "PostgreSQL",
  mysql: "MySQL",
  docker: "Docker",
  git: "Git",
  github: "GitHub",
  gitlab: "GitLab",
  bitbucket: "Bitbucket",
  python: "Python",
  html5: "HTML",
  css3: "CSS",
  nodejs: "Node.js",
  express: "Express",
  nestjs: "NestJS",
  mongodb: "MongoDB",
  kubernetes: "Kubernetes",
  amazonwebservices: "AWS",
  azure: "Azure",
  flutter: "Flutter",
  dart: "Dart",
  kotlin: "Kotlin",
  swift: "Swift",
  rust: "Rust",
  php: "PHP",
  laravel: "Laravel",
  django: "Django",
  flask: "Flask",
  csharp: "C#",
  cplusplus: "C++",
  c: "C",
  ruby: "Ruby",
  rails: "Ruby on Rails",
  scala: "Scala",
  haskell: "Haskell",
  elixir: "Elixir",
  graphql: "GraphQL",
  redux: "Redux",
  sass: "Sass",
  less: "Less",
  tailwindcss: "Tailwind CSS",
  bootstrap: "Bootstrap",
  vuejs: "Vue.js",
  angularjs: "Angular",
  nextjs: "Next.js",
  nuxtjs: "Nuxt.js",
  svelte: "Svelte",
  figma: "Figma",
  linux: "Linux",
  ubuntu: "Ubuntu",
  debian: "Debian",
  nginx: "Nginx",
  apache: "Apache",
  firebase: "Firebase",
  heroku: "Heroku",
  vercel: "Vercel",
  netlify: "Netlify",
  digitalocean: "DigitalOcean",
  jenkins: "Jenkins",
  vscode: "VS Code",
  vim: "Vim",
  bash: "Bash",
  googlecloud: "Google Cloud",
  materialui: "Material UI",
  electron: "Electron",
  webpack: "Webpack",
  babel: "Babel",
  jest: "Jest",
  eslint: "ESLint",
  npm: "npm",
  yarn: "Yarn",
  redis: "Redis",
  sqlite: "SQLite",
  mariadb: "MariaDB",
  oracle: "Oracle",
  cassandra: "Cassandra",
  unity: "Unity",
  unrealengine: "Unreal Engine",
  selenium: "Selenium",
  pandas: "Pandas",
  numpy: "NumPy",
  tensorflow: "TensorFlow",
  pytorch: "PyTorch",
  opencv: "OpenCV",
  arduino: "Arduino",
  raspberrypi: "Raspberry Pi",
  swagger: "Swagger",
  postman: "Postman",
  android: "Android",
};

// Extrai os nomes das tecnologias a partir dos ícones/badges usados no README
// de perfil (github.com/usuario/usuario). Cobre os formatos mais comuns:
// skillicons.dev (?i=js,ts,react), badges do shields.io (?logo=python) e
// ícones do devicon/simple-icons embutidos via <img src="...">, que é o
// padrão mais comum em README montado à mão. Sempre deriva o nome do
// slug/URL do ícone, nunca do atributo alt — que na prática costuma vir
// copiado e colado errado de um ícone pro outro.
function extractReadmeStacks(markdown: string): string[] {
  const names = new Set<string>();

  const skillIconsRegex = /skillicons\.dev\/icons\?i=([a-z0-9,+-]+)/gi;
  let match: RegExpExecArray | null;
  while ((match = skillIconsRegex.exec(markdown))) {
    for (const code of match[1].split(",")) {
      const name = SKILLICONS_NAMES[code.trim().toLowerCase()];
      if (name) names.add(name);
    }
  }

  const deviconRegex = /devicon(?:-[a-z]+)?\/icons\/([a-z0-9]+)\//gi;
  while ((match = deviconRegex.exec(markdown))) {
    const name = DEVICON_NAMES[match[1].toLowerCase()];
    if (name) names.add(name);
  }

  const simpleIconsRegex = /cdn\.simpleicons\.org\/([a-zA-Z0-9-]+)/gi;
  while ((match = simpleIconsRegex.exec(markdown))) {
    const name = SHIELDS_LOGO_NAMES[match[1].toLowerCase()];
    if (name) names.add(name);
  }

  const shieldsBadgeRegex = /https?:\/\/img\.shields\.io\/badge\/[^\s)"'\]]+/gi;
  const badges = markdown.match(shieldsBadgeRegex) ?? [];
  for (const badge of badges) {
    const logoMatch = badge.match(/logo=([a-zA-Z0-9._+-]+)/i);
    if (!logoMatch) continue;
    const slug = decodeURIComponent(logoMatch[1]).toLowerCase();
    const name = SHIELDS_LOGO_NAMES[slug];
    if (name) names.add(name);
  }

  return Array.from(names);
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

// Soma os commits contribuídos pela conta ao longo de toda a sua história.
// A GraphQL API do GitHub só permite consultar `contributionsCollection` em
// janelas de até 1 ano por vez, então percorremos ano a ano desde a criação
// da conta. Consultando como `viewer` (dono do próprio token), commits em
// repositórios privados também entram na soma — igual ao gráfico de
// contribuições do próprio GitHub.
async function fetchTotalCommits(accessToken: string, createdAt: string | null): Promise<number> {
  if (!createdAt) return 0;

  const startYear = new Date(createdAt).getFullYear();
  const currentYear = new Date().getFullYear();
  const now = new Date().toISOString();

  const years = Array.from(
    { length: Math.max(currentYear - startYear + 1, 1) },
    (_, i) => startYear + i
  );

  const totals = await Promise.all(
    years.map(async (year) => {
      const from = `${year}-01-01T00:00:00Z`;
      const to = year === currentYear ? now : `${year}-12-31T23:59:59Z`;

      try {
        const res = await fetch("https://api.github.com/graphql", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: `
              query($from: DateTime!, $to: DateTime!) {
                viewer {
                  contributionsCollection(from: $from, to: $to) {
                    totalCommitContributions
                  }
                }
              }
            `,
            variables: { from, to },
          }),
        });

        if (!res.ok) return 0;
        const json = await res.json();
        return json?.data?.viewer?.contributionsCollection?.totalCommitContributions ?? 0;
      } catch {
        return 0;
      }
    })
  );

  return totals.reduce((sum, n) => sum + n, 0);
}

export async function syncGithubProfile(
  supabase: SupabaseClient,
  userId: string,
  githubAccessToken: string
) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("top_stack, summary_manual")
    .eq("id", userId)
    .single();

  const githubHeaders = {
    Authorization: `Bearer ${githubAccessToken}`,
    Accept: "application/vnd.github+json",
  };

  // 1. Dados do usuário (bio, localização, contadores)
  const userRes = await fetch("https://api.github.com/user", { headers: githubHeaders });
  if (!userRes.ok) {
    throw new SyncError("github user fetch failed", 502);
  }
  const githubUser = await userRes.json();

  // 2. Repositórios. Repos privados nunca devem virar cards/seleções no
  // portfólio público — quem visitar o perfil não tem acesso a eles e o link
  // pro GitHub dá 404. As contribuições desses repos já entram no total de
  // commits separadamente, via GraphQL (ver fetchTotalCommits), então
  // descartamos os privados aqui sem perder esse número.
  const reposRes = await fetch(
    "https://api.github.com/user/repos?per_page=100&sort=pushed&affiliation=owner",
    { headers: githubHeaders }
  );
  const allRepos = await reposRes.json();
  const repos = allRepos.filter((repo: any) => !repo.private);

  // 2.1 Seleções já feitas pela pessoa dona do perfil — um re-sync (ex: ao
  // abrir "editar projetos" pra puxar repositórios novos) não pode resetar
  // os projetos que ela já tinha escolhido pra aparecer no portfólio.
  const { data: existingRepos } = await supabase
    .from("repos")
    .select("github_repo_id, is_selected")
    .eq("profile_id", userId);

  const existingSelection = new Map(
    (existingRepos ?? []).map((r) => [r.github_repo_id, r.is_selected])
  );

  // 2.2 Remove da tabela qualquer repo que não veio nessa leva pública (ficou
  // privado depois de já ter sido sincronizado, ou foi apagado no GitHub) —
  // sem isso, um repo selecionado antes de virar privado continuaria
  // aparecendo com link quebrado no portfólio pra sempre.
  const currentRepoIds = repos.map((repo: any) => repo.id);
  if (currentRepoIds.length > 0) {
    await supabase
      .from("repos")
      .delete()
      .eq("profile_id", userId)
      .not("github_repo_id", "in", `(${currentRepoIds.join(",")})`);
  } else {
    await supabase.from("repos").delete().eq("profile_id", userId);
  }

  // 3. Linguagens por repo (bytes), em paralelo — usadas tanto pro card do
  // repo quanto pra agregação da stack geral do perfil
  const languageBytesTotal: Record<string, number> = {};

  const enriched = await Promise.all(
    repos.map(async (repo: any) => {
      const [langRes, structureSignals] = await Promise.all([
        fetch(repo.languages_url, { headers: githubHeaders }),
        fetchStructureSignals(repo, githubHeaders),
      ]);
      const languages: Record<string, number> = await langRes.json();

      for (const [lang, bytes] of Object.entries(languages)) {
        languageBytesTotal[lang] = (languageBytesTotal[lang] ?? 0) + bytes;
      }

      return {
        profile_id: userId,
        github_repo_id: repo.id,
        name: repo.name,
        description: repo.description ?? "",
        stack: Object.keys(languages),
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        commits: 0,
        impact_score: impactScore(repo, structureSignals),
        is_selected: existingSelection.get(repo.id) ?? false,
      };
    })
  );

  // 4. Agrega a stack geral em percentuais
  const totalBytes = Object.values(languageBytesTotal).reduce((a, b) => a + b, 0);
  const githubStack = Object.entries(languageBytesTotal)
    .map(([name, bytes]) => ({
      name,
      percentage: totalBytes > 0 ? Math.round((bytes / totalBytes) * 100) : 0,
    }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 5);

  // 4.1 Ícones de stack do README de perfil (github.com/usuario/usuario) —
  // repo opcional, então um 404 aqui é esperado pra quem não tem um.
  let readmeStackNames: string[] = [];
  try {
    const readmeRes = await fetch(
      `https://api.github.com/repos/${githubUser.login}/${githubUser.login}/readme`,
      { headers: { ...githubHeaders, Accept: "application/vnd.github.raw+json" } }
    );
    if (readmeRes.ok) {
      const readmeContent = await readmeRes.text();
      readmeStackNames = extractReadmeStacks(readmeContent);
    }
  } catch {
    // Falha ao buscar/parsear o README não deve travar o resto do sync.
  }

  const readmeStack = readmeStackNames
    .filter((name) => !githubStack.some((g) => g.name.toLowerCase() === name.toLowerCase()))
    .map((name) => ({ name, percentage: 0 }));

  // Stacks adicionadas manualmente pela pessoa dona do perfil não devem ser
  // apagadas a cada sync — preserva as que não vieram do GitHub nem do README
  // dessa vez.
  const existingTopStack =
    (profile?.top_stack as { name: string; percentage: number; manual?: boolean }[] | null) ?? [];
  const manualStacks = existingTopStack.filter(
    (s) =>
      s.manual &&
      !githubStack.some((g) => g.name.toLowerCase() === s.name.toLowerCase()) &&
      !readmeStack.some((r) => r.name.toLowerCase() === s.name.toLowerCase())
  );

  const topStack = [...githubStack, ...readmeStack, ...manualStacks];

  const activeRepos = repos.filter(
    (r: any) => Date.now() - new Date(r.pushed_at).getTime() < 1000 * 60 * 60 * 24 * 90
  ).length;

  const totalStars = enriched.reduce((sum: number, r) => sum + r.stars, 0);
  const topRepoName =
    enriched.length > 0
      ? enriched.slice().sort((a, b) => b.impact_score - a.impact_score)[0].name
      : null;

  // 5. Total de commits da conta (todo o histórico, incluindo privados)
  const totalCommits = await fetchTotalCommits(githubAccessToken, githubUser.created_at ?? null);

  // 6. Salva repos
  const { error: reposError } = await supabase
    .from("repos")
    .upsert(enriched, { onConflict: "profile_id,github_repo_id" });

  if (reposError) {
    throw new SyncError(reposError.message, 500);
  }

  // 7. Atualiza o perfil com os dados agregados
  // O resumo (overview) editado manualmente pela pessoa dona do perfil não
  // deve ser sobrescrito a cada sync — mesma lógica já aplicada ao top_stack.
  const profileUpdate: Record<string, unknown> = {
    bio: githubUser.bio,
    full_name: githubUser.name ?? null,
    avatar_url: githubUser.avatar_url ?? null,
    location: githubUser.location,
    public_repos: githubUser.public_repos,
    followers: githubUser.followers,
    github_created_at: githubUser.created_at ?? null,
    top_stack: topStack,
    total_commits: totalCommits,
    updated_at: new Date().toISOString(),
  };

  if (!profile?.summary_manual) {
    profileUpdate.summary = buildSummary({
      username: githubUser.login,
      topStack,
      publicRepos: githubUser.public_repos,
      activeRepos,
      totalStars,
      topRepoName,
    });
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update(profileUpdate)
    .eq("id", userId);

  if (profileError) {
    throw new SyncError(profileError.message, 500);
  }

  return { synced: enriched.length, totalCommits };
}

const VISIT_SYNC_TTL_MS = 60 * 60 * 1000; // 1h

// Disparado a cada visita/refresh de `folio.dev/{username}` (ver
// app/[username]/page.tsx) pra manter foto, nome, bio, followers e commits
// em dia sem depender de a pessoa abrir "editar projetos". Um visitante
// anônimo não tem sessão nem token próprio, então isso roda com o client
// admin usando o token do dono do perfil, salvo no onboarding.
//
// Gated por `profiles.updated_at`: só resincroniza se o último sync tiver
// mais de 1h, pra não estourar o rate limit do GitHub em perfis muito
// visitados. Antes de rodar o sync completo (que faz várias chamadas
// sequenciais à API do GitHub e pode levar alguns segundos), "reserva" o
// slot atualizando updated_at com um optimistic lock — se duas visitas
// concorrentes caírem na mesma janela, só a primeira ganha a corrida e
// dispara o sync de verdade.
export async function syncProfileIfStale(githubUsername: string): Promise<void> {
  const supabase = createAdminClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, github_access_token, updated_at")
    .eq("github_username", githubUsername)
    .single();

  if (!profile?.github_access_token) return;

  const lastSyncedAt = profile.updated_at ? new Date(profile.updated_at).getTime() : 0;
  if (Date.now() - lastSyncedAt < VISIT_SYNC_TTL_MS) return;

  const { data: claimed } = await supabase
    .from("profiles")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", profile.id)
    .eq("updated_at", profile.updated_at)
    .select("id");

  if (!claimed || claimed.length === 0) return;

  let accessToken: string;
  try {
    accessToken = decrypt(profile.github_access_token as string);
  } catch {
    // Token salvo antes da criptografia entrar em vigor (texto puro) — não
    // dá pra sincronizar em background, a pessoa precisa logar de novo.
    return;
  }

  try {
    await syncGithubProfile(supabase, profile.id, accessToken);
  } catch {
    // Sync em background: uma falha aqui (rate limit, token revogado etc.)
    // não deve derrubar nada, só deixa pro próximo visit/TTL tentar de novo.
  }
}
