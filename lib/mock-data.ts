// Structure designed to match 1:1 what the GitHub REST/GraphQL API
// returns, so that swapping in real data is just changing the source, not the shape.

export type Repo = {
  id: string;
  name: string;
  description: string;
  stack: string[];
  stars: number;
  forks: number;
  commits: number;
  impactScore: number; // Folio's internal score (0-100) for ranking "best projects"
  isPrivate: boolean;
  selected: boolean;
};

export type ContributionDay = {
  date: string;
  count: number; // 0-4, intensity
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
  summary: string; // auto-generated professional summary
  repos: Repo[];
  contributions: ContributionDay[];
};

export const mockUser: FolioUser = {
  githubUsername: "marinacosta",
  name: "Marina Costa",
  avatarUrl: "",
  bio: "Backend engineer. Distributed systems and APIs that hold up under real traffic.",
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
    "Software engineer focused on high-concurrency backend systems. Over the last 12 months, led 96 pull requests and kept a consistent pace of contribution to open source infrastructure projects, with a focus on observability tooling written in Go.",
  repos: [
    {
      id: "r1",
      name: "flowqueue",
      description:
        "Distributed job queue with automatic backpressure, written in Go. Used in production processing ~2M jobs/day.",
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
        "Minimalist HTTP gateway with rate limiting and pluggable auth. Focused on low latency (p99 < 4ms).",
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
      description: "Distributed tracing SDK compatible with OpenTelemetry, with less than 1% overhead.",
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
      description: "Personal ETL experiments with Python and Airflow.",
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
      description: "Personal terminal and editor configuration.",
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
