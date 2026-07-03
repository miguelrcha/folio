// Estrutura pensada para bater 1:1 com o que a API REST/GraphQL do GitHub
// devolve, para que trocar por dados reais seja só trocar a fonte, não a forma.

export type Repo = {
  id: string;
  name: string;
  description: string;
  stack: string[];
  stars: number;
  forks: number;
  commits: number;
  impactScore: number; // score interno do Folio (0-100) para ranquear "melhores projetos"
  isPrivate: boolean;
  selected: boolean;
};

export type ContributionDay = {
  date: string;
  count: number; // 0-4, intensidade
};

export type FolioUser = {
  githubUsername: string;
  name: string;
  avatarUrl: string;
  bio: string;
  location: string;
  followers: number;
  following: number;
  publicRepos: number;
  totalCommitsLastYear: number;
  totalPRs: number;
  totalReviews: number;
  topStack: { name: string; percentage: number }[];
  summary: string; // resumo profissional gerado automaticamente
  repos: Repo[];
  contributions: ContributionDay[];
};

export const mockUser: FolioUser = {
  githubUsername: "marinacosta",
  name: "Marina Costa",
  avatarUrl: "",
  bio: "Backend engineer. Distributed systems e APIs que aguentam tráfego real.",
  location: "Joinville, SC",
  followers: 312,
  following: 84,
  publicRepos: 47,
  totalCommitsLastYear: 1284,
  totalPRs: 96,
  totalReviews: 61,
  topStack: [
    { name: "TypeScript", percentage: 38 },
    { name: "Go", percentage: 24 },
    { name: "Python", percentage: 18 },
    { name: "SQL", percentage: 12 },
    { name: "Rust", percentage: 8 },
  ],
  summary:
    "Engenheira de software com foco em sistemas backend de alta concorrência. Nos últimos 12 meses, liderou 96 pull requests e manteve um ritmo consistente de contribuição em projetos open source de infraestrutura, com destaque para ferramentas de observabilidade escritas em Go.",
  repos: [
    {
      id: "r1",
      name: "flowqueue",
      description:
        "Fila de jobs distribuída com backpressure automático, escrita em Go. Usada em produção processando ~2M jobs/dia.",
      stack: ["Go", "Redis", "Docker"],
      stars: 842,
      forks: 61,
      commits: 312,
      impactScore: 94,
      isPrivate: false,
      selected: true,
    },
    {
      id: "r2",
      name: "api-gateway-lite",
      description:
        "Gateway HTTP minimalista com rate limiting e auth pluggable. Foco em baixa latência (p99 < 4ms).",
      stack: ["TypeScript", "Node.js"],
      stars: 401,
      forks: 33,
      commits: 178,
      impactScore: 81,
      isPrivate: false,
      selected: true,
    },
    {
      id: "r3",
      name: "obs-tracer",
      description: "SDK de tracing distribuído compatível com OpenTelemetry, com overhead menor que 1%.",
      stack: ["Go", "gRPC"],
      stars: 205,
      forks: 19,
      commits: 94,
      impactScore: 73,
      isPrivate: false,
      selected: true,
    },
    {
      id: "r4",
      name: "data-pipeline-sandbox",
      description: "Experimentos pessoais de ETL com Python e Airflow.",
      stack: ["Python", "SQL"],
      stars: 12,
      forks: 2,
      commits: 41,
      impactScore: 38,
      isPrivate: false,
      selected: false,
    },
    {
      id: "r5",
      name: "dotfiles",
      description: "Configurações pessoais de terminal e editor.",
      stack: ["Shell"],
      stars: 8,
      forks: 1,
      commits: 156,
      impactScore: 15,
      isPrivate: false,
      selected: false,
    },
  ],
  contributions: Array.from({ length: 371 }, (_, i) => ({
    date: new Date(2025, 6, 1 + i).toISOString().slice(0, 10),
    count: Math.floor(Math.random() * 5),
  })),
};
