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

// GitHub signals an exhausted quota either as a 429 or as a 403 with the
// x-ratelimit-remaining header at 0 (the classic REST behavior). Rate limits
// are routine, not exceptional, so they get their own status for the UI to
// offer a plain retry instead of a re-login.
function githubFetchError(res: Response, what: string): SyncError {
  const rateLimited =
    res.status === 429 ||
    (res.status === 403 && res.headers.get("x-ratelimit-remaining") === "0");
  return rateLimited
    ? new SyncError("github rate limit exceeded", 429)
    : new SyncError(`github ${what} fetch failed`, 502);
}

type StructureSignals = {
  hasReadme: boolean;
  hasTests: boolean;
  hasCi: boolean;
};

const NO_STRUCTURE_SIGNALS: StructureSignals = {
  hasReadme: false,
  hasTests: false,
  hasCi: false,
};

// Matches a root-level README (any extension), not nested ones — a README
// buried three folders deep isn't a signal that the project is documented.
const README_PATH_REGEX = /^readme(\.[a-z0-9]+)?$/i;
// Matches common test file/folder conventions across JS/TS, Python, Go, etc.
const TEST_PATH_REGEX = /(^|\/)(__tests__|tests?|spec)(\/|$)|\.(test|spec)\.[a-z]+$/i;
// Excludes vendored/third-party subtrees from the test-path match above —
// a dependency's bundled tests aren't a signal about the repo owner's work.
const VENDOR_PATH_REGEX = /(^|\/)(node_modules|vendor|third_party|\.venv|venv)\//i;

// Repos at or above this size (GitHub's `size` field, in KB) are skipped:
// their recursive tree is likely to hit GitHub's ~100k-entries/~7MB
// truncation limit anyway, which would make path-presence checks unreliable,
// and pulling a tree that large per sync just to answer 3 booleans is wasteful.
const MAX_REPO_SIZE_KB_FOR_STRUCTURE_SCAN = 200_000;

// Best-effort repo structure signals, used only to nudge impact_score — a
// fetch failure, an oversized repo, or a truncated tree all just yield no
// bonus, never fail the sync. Forks are skipped too: they already take a
// flat penalty in impactScore below and rarely compete for top repo, so the
// extra fetch isn't worth it. One fetch answers all three checks, instead of
// one lightweight call per check, to keep this to a single extra request per
// repo in the common case.
// GitHub REST "list repos" item, narrowed to the fields the sync reads —
// covers what fetchStructureSignals and impactScore need too.
type GithubRepo = {
  id: number;
  name: string;
  description: string | null;
  private: boolean;
  fork: boolean;
  size: number;
  stargazers_count: number;
  forks_count: number;
  pushed_at: string;
  languages_url: string;
  license: unknown;
  default_branch: string;
  owner: { login: string };
};

async function fetchStructureSignals(
  repo: {
    owner: { login: string };
    name: string;
    default_branch: string;
    fork: boolean;
    size: number;
  },
  headers: Record<string, string>
): Promise<StructureSignals> {
  if (repo.fork || repo.size >= MAX_REPO_SIZE_KB_FOR_STRUCTURE_SCAN) {
    return NO_STRUCTURE_SIGNALS;
  }

  try {
    const treeRes = await fetch(
      `https://api.github.com/repos/${repo.owner.login}/${repo.name}/git/trees/${repo.default_branch}?recursive=1`,
      { headers }
    );
    if (!treeRes.ok) return NO_STRUCTURE_SIGNALS;

    const treeJson = await treeRes.json();
    // A truncated tree is missing an unknown, non-deterministic subset of
    // paths — not reliable enough to trust an absence signal from, so treat
    // it the same as a failed fetch instead of scoring off partial data.
    if (treeJson.truncated || !Array.isArray(treeJson.tree)) return NO_STRUCTURE_SIGNALS;

    const paths: string[] = treeJson.tree.map((entry: { path: string }) => entry.path);
    return {
      hasReadme: paths.some((p) => README_PATH_REGEX.test(p)),
      hasTests: paths.some((p) => !VENDOR_PATH_REGEX.test(p) && TEST_PATH_REGEX.test(p)),
      hasCi: paths.some((p) => p.startsWith(".github/workflows/")),
    };
  } catch {
    return NO_STRUCTURE_SIGNALS;
  }
}

export function impactScore(
  repo: {
    stargazers_count: number;
    forks_count: number;
    fork: boolean;
    pushed_at: string;
    license: unknown;
  },
  signals: StructureSignals
) {
  const recencyBoost =
    Date.now() - new Date(repo.pushed_at).getTime() < 1000 * 60 * 60 * 24 * 90 ? 10 : 0;
  // Free, metadata-only signals of project structure/health — a cheaper
  // stand-in for the AI-based analysis tracked in issue #4, until that lands.
  // hasLicense comes straight off the repo object (already fetched, no extra
  // request), unlike the other three signals which need the tree fetch above.
  const structureBoost =
    (signals.hasReadme ? 5 : 0) +
    (signals.hasTests ? 8 : 0) +
    (signals.hasCi ? 8 : 0) +
    (repo.license ? 3 : 0);
  return (
    repo.stargazers_count * 3 +
    repo.forks_count * 2 +
    (repo.fork ? -20 : 10) +
    recencyBoost +
    structureBoost
  );
}

// Summary generated automatically from the real data (no AI behind it,
// just rules) — if you later want to swap this for a call to the Anthropic
// API to make it sound more natural, just replace this function.
//
// To avoid feeling like a mad-lib (same sentence, just swapping numbers),
// there are several template variations and the choice is deterministic per
// user (hash of the username) — so the text doesn't change on every sync,
// but different profiles tend to get different sentence structures.
function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash;
}

// Maps the short codes used by skillicons.dev (e.g. "?i=js,ts,react")
// to the technology's readable name.
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

// Maps the simple-icons slugs used in the `logo=` parameter of shields.io
// badges (e.g. https://img.shields.io/badge/Python-3776AB?logo=python)
// to the technology's readable name.
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

// Maps the folder slugs used by devicon (e.g.
// .../devicon/icons/java/java-original.svg) to the technology's readable
// name — this is the most common format in hand-crafted READMEs, usually via
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

// Extracts technology names from the icons/badges used in the profile
// README (github.com/username/username). Covers the most common formats:
// skillicons.dev (?i=js,ts,react), shields.io badges (?logo=python), and
// devicon/simple-icons icons embedded via <img src="...">, which is the
// most common pattern in hand-assembled READMEs. Always derives the name
// from the icon's slug/URL, never from the alt attribute — which in
// practice tends to come copy-pasted wrong from one icon to another.
export function extractReadmeStacks(markdown: string): string[] {
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

export function joinStack(names: string[]): string {
  if (names.length === 0) return "multiple technologies";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

export function buildSummary(opts: {
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
    `Developer focused on ${stack}, maintaining ${opts.publicRepos} public repositories on GitHub — ${opts.activeRepos} of them active in the last 90 days.`,

    `Works mainly with ${stack}.${
      hasStars
        ? ` On GitHub, has ${opts.totalStars} stars spread across ${opts.publicRepos} public repositories.`
        : ` Maintains ${opts.publicRepos} public repositories on GitHub, favoring quality over quantity.`
    }`,

    `${stack} form the main stack.${
      hasTopRepo
        ? ` The ${opts.topRepoName} project is the current highlight, out of ${opts.publicRepos} public repositories total.`
        : ` Maintains a base of ${opts.publicRepos} public repositories on GitHub.`
    }`,

    `Builds mainly in ${stack}.${
      hasStars
        ? ` Has accumulated ${opts.totalStars} stars across open source projects`
        : ` Maintains an active open source presence`
    }, with ${opts.activeRepos} repositories in development over the last 90 days.`,

    `Out of ${opts.publicRepos} public repositories on GitHub, ${opts.activeRepos} are still under active development — mainly in ${stack}${
      hasTopRepo ? `, with ${opts.topRepoName} standing out` : ""
    }.`,
  ];

  const index = hashSeed(opts.username) % variants.length;
  return variants[index];
}

// Sums the commits contributed by the account across its entire history.
// GitHub's GraphQL API only allows querying `contributionsCollection` in
// windows of up to 1 year at a time, so we walk year by year since the
// account was created. Querying as `viewer` (owner of the token itself),
// commits in private repos are included in the sum too — same as GitHub's
// own contributions graph.
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

  // 1. User data (bio, location, counters)
  const userRes = await fetch("https://api.github.com/user", { headers: githubHeaders });
  if (!userRes.ok) {
    throw githubFetchError(userRes, "user");
  }
  const githubUser = await userRes.json();

  // 2. Repositories. Private repos should never become cards/selections in
  // the public portfolio — visitors to the profile have no access to them
  // and the link to GitHub 404s. Contributions from those repos are already
  // counted separately in the total commits, via GraphQL (see
  // fetchTotalCommits), so we discard the private ones here without losing
  // that number.
  const reposRes = await fetch(
    "https://api.github.com/user/repos?per_page=100&sort=pushed&affiliation=owner",
    { headers: githubHeaders }
  );
  if (!reposRes.ok) {
    throw githubFetchError(reposRes, "repos");
  }
  const allRepos: GithubRepo[] = await reposRes.json();
  const repos = allRepos.filter((repo) => !repo.private);

  // 2.1 Selections already made by the profile's owner — a re-sync (e.g.
  // opening "edit projects" to pull in new repos) must not reset the
  // projects they had already chosen to show on the portfolio.
  const { data: existingRepos } = await supabase
    .from("repos")
    .select("github_repo_id, is_selected")
    .eq("profile_id", userId);

  const existingSelection = new Map(
    (existingRepos ?? []).map((r) => [r.github_repo_id, r.is_selected])
  );

  // 2.2 Removes from the table any repo that didn't come back in this public
  // batch (went private after already being synced, or was deleted on
  // GitHub) — without this, a repo selected before going private would keep
  // showing up with a broken link on the portfolio forever.
  const currentRepoIds = repos.map((repo) => repo.id);
  if (currentRepoIds.length > 0) {
    await supabase
      .from("repos")
      .delete()
      .eq("profile_id", userId)
      .not("github_repo_id", "in", `(${currentRepoIds.join(",")})`);
  } else {
    await supabase.from("repos").delete().eq("profile_id", userId);
  }

  // 3. Languages per repo (bytes), in parallel — used both for the repo's
  // card and for aggregating the profile's overall stack
  const languageBytesTotal: Record<string, number> = {};

  const enriched = await Promise.all(
    repos.map(async (repo) => {
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

  // 4. Aggregates the overall stack into percentages
  const totalBytes = Object.values(languageBytesTotal).reduce((a, b) => a + b, 0);
  const githubStack = Object.entries(languageBytesTotal)
    .map(([name, bytes]) => ({
      name,
      percentage: totalBytes > 0 ? Math.round((bytes / totalBytes) * 100) : 0,
    }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 5);

  // 4.1 Stack icons from the profile README (github.com/username/username) —
  // an optional repo, so a 404 here is expected for those who don't have one.
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
    // Failing to fetch/parse the README shouldn't block the rest of the sync.
  }

  const readmeStack = readmeStackNames
    .filter((name) => !githubStack.some((g) => g.name.toLowerCase() === name.toLowerCase()))
    .map((name) => ({ name, percentage: 0 }));

  // Stacks added manually by the profile's owner shouldn't be wiped on every
  // sync — preserves the ones that didn't come from GitHub or the README
  // this time.
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
    (r) => Date.now() - new Date(r.pushed_at).getTime() < 1000 * 60 * 60 * 24 * 90
  ).length;

  const totalStars = enriched.reduce((sum: number, r) => sum + r.stars, 0);
  const topRepoName =
    enriched.length > 0
      ? enriched.slice().sort((a, b) => b.impact_score - a.impact_score)[0].name
      : null;

  // 5. Total account commits (full history, including private repos)
  const totalCommits = await fetchTotalCommits(githubAccessToken, githubUser.created_at ?? null);

  // 6. Salva repos
  const { error: reposError } = await supabase
    .from("repos")
    .upsert(enriched, { onConflict: "profile_id,github_repo_id" });

  if (reposError) {
    throw new SyncError(reposError.message, 500);
  }

  // 7. Updates the profile with the aggregated data
  // The overview (summary) manually edited by the profile's owner shouldn't
  // be overwritten on every sync — same logic already applied to top_stack.
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

// Triggered on every visit/refresh of `folio.dev/{username}` (see
// app/[username]/page.tsx) to keep photo, name, bio, followers and commits
// current without depending on the person opening "edit projects". An
// anonymous visitor has no session or token of their own, so this runs with
// the admin client using the profile owner's token, saved during onboarding.
//
// Gated by `profiles.updated_at`: only resyncs if the last sync is more
// than 1h old, to avoid hitting GitHub's rate limit on heavily visited
// profiles. Before running the full sync (which makes several sequential
// calls to the GitHub API and can take a few seconds), it "reserves" the
// slot by updating updated_at with an optimistic lock — if two concurrent
// visits land in the same window, only the first wins the race and
// triggers the actual sync.
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
    // Token saved before encryption went into effect (plain text) — can't
    // sync in the background, the person needs to sign in again.
    return;
  }

  try {
    await syncGithubProfile(supabase, profile.id, accessToken);
  } catch {
    // Background sync: a failure here (rate limit, revoked token, etc.)
    // shouldn't break anything, just leaves it for the next visit/TTL to retry.
  }
}
