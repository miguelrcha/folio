"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ContributionGraph } from "@/components/ContributionGraph";
import { useLanguage } from "@/components/LanguageProvider";
import { mockUser } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/client";
import { syncFailureKind, type SyncFailureKind } from "@/lib/sync-error";

const ANALYSIS_STEP_KEYS = [
  "connect.step.connecting",
  "connect.step.reading",
  "connect.step.analyzing",
  "connect.step.calculating",
];

type DbRepo = {
  id: string;
  github_repo_id: number;
  name: string;
  description: string | null;
  stack: string[] | null;
  stars: number;
  forks: number;
  commits: number;
  impact_score: number;
  is_selected: boolean;
};

function FolioWordmark({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "text-2xl", md: "text-2xl", lg: "text-5xl md:text-6xl" };
  return (
    <span className={`font-lato ${sizes[size]} text-5xl md:text-6xl tracking-tight text-[var(--color-text)]`}>
      folio
    </span>
  );
}

export default function ConnectPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const supabase = createClient();

  const [phase, setPhase] = useState<"loading" | "select" | "error">("loading");
  const [errorKind, setErrorKind] = useState<SyncFailureKind>("transient");
  const [stepIndex, setStepIndex] = useState(0);
  const [repos, setRepos] = useState<DbRepo[]>([]);
  const [githubUsername, setGithubUsername] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const startedRef = useRef(false);

  // Animates the "terminal" steps while the real sync happens in parallel.
  // It doesn't represent actual per-step progress — it's just visual feedback while waiting.
  useEffect(() => {
    if (phase !== "loading") return;
    const id = setInterval(() => {
      setStepIndex((i) => (i < ANALYSIS_STEP_KEYS.length - 1 ? i + 1 : i));
    }, 700);
    return () => clearInterval(id);
  }, [phase]);

  // Runs the real GitHub sync (server-side route). Failures land on the
  // error phase with a kind that decides the recovery action: only an auth
  // failure forces a re-login; everything else is retryable in place.
  const runSync = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    const res = await fetch("/api/sync-github", { method: "POST" });
    if (!res.ok) {
      setErrorKind(syncFailureKind(res.status));
      setPhase("error");
      return;
    }

    const [{ data: profile }, { data: dbRepos }] = await Promise.all([
      supabase.from("profiles").select("github_username").eq("id", user.id).single(),
      supabase
        .from("repos")
        .select("*")
        .eq("profile_id", user.id)
        .order("impact_score", { ascending: false }),
    ]);

    setGithubUsername(profile?.github_username ?? null);
    setRepos((dbRepos as DbRepo[]) ?? []);
    setPhase("select");
  }, [supabase, router]);

  const startSync = useCallback(() => {
    runSync().catch(() => {
      setErrorKind("transient");
      setPhase("error");
    });
  }, [runSync]);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    startSync();
  }, [startSync]);

  const retrySync = () => {
    setStepIndex(0);
    setPhase("loading");
    startSync();
  };

  const toggleRepo = async (id: string) => {
    const target = repos.find((r) => r.id === id);
    if (!target) return;
    const nextSelected = !target.is_selected;

    // optimistically updates the UI
    setRepos((prev) => prev.map((r) => (r.id === id ? { ...r, is_selected: nextSelected } : r)));

    const { error } = await supabase.from("repos").update({ is_selected: nextSelected }).eq("id", id);
    if (error) {
      // reverts if saving fails
      setRepos((prev) => prev.map((r) => (r.id === id ? { ...r, is_selected: !nextSelected } : r)));
    }
  };

  const selectedCount = repos.filter((r) => r.is_selected).length;

  const handleGenerate = async () => {
    if (!githubUsername) return;
    setGenerating(true);
    setSaveError(false);

    // Marks that this person already went through onboarding, regardless of
    // whether they selected any project — so a returning login doesn't get
    // stuck going back to /connect when they have no repositories.
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { error } = await supabase
        .from("profiles")
        .update({ onboarding_completed: true })
        .eq("id", user.id);

      // A silent failure here would send every future login back through
      // /connect — surface it and let the person try again instead.
      if (error) {
        setSaveError(true);
        setGenerating(false);
        return;
      }
    }

    router.push(`/${githubUsername}`);
  };

  if (phase === "error") {
    const errorTitleKey =
      errorKind === "auth"
        ? "connect.error.auth"
        : errorKind === "rateLimit"
          ? "connect.error.rateLimit"
          : "connect.error.title";

    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <FolioWordmark size="lg" />
        <p className="mt-6 max-w-md text-[var(--color-text-muted)]">{t(errorTitleKey)}</p>
        {errorKind === "auth" ? (
          <button
            onClick={() => router.replace("/login")}
            className="mt-6 rounded-md bg-[var(--color-text)] px-5 py-2.5 font-lato text-sm text-[var(--color-ink)]"
          >
            {t("connect.error.backToLogin")}
          </button>
        ) : (
          <>
            <button
              onClick={retrySync}
              className="mt-6 rounded-md bg-[var(--color-text)] px-5 py-2.5 font-lato text-sm text-[var(--color-ink)]"
            >
              {t("connect.error.tryAgain")}
            </button>
            <button
              onClick={() => router.replace("/login")}
              className="mt-3 text-sm text-[var(--color-text-faint)] hover:text-[var(--color-text)] transition-colors"
            >
              {t("connect.error.backToLogin")}
            </button>
          </>
        )}
      </main>
    );
  }

  if (phase === "loading") {
    return (
      <main className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6">
        <FolioWordmark size="md" />
        <div className="mt-10 w-full max-w-md">
          <ContributionGraph data={mockUser.contributions} mode="building" cell={8} gap={3} />
        </div>
        <div className="mt-10 w-full max-w-sm font-mono text-sm space-y-2">
          {ANALYSIS_STEP_KEYS.map((stepKey, i) => {
            const done = i < stepIndex;
            const active = i === stepIndex;
            if (i > stepIndex) return null;
            return (
              <div key={stepKey} className="flex items-center gap-3 text-[var(--color-text-muted)]">
                <span
                  className={
                    done ? "text-[var(--color-accent)]" : "text-[var(--color-text-faint)] animate-pulse"
                  }
                >
                  {done ? "✓" : "·"}
                </span>
                <span className={done ? "text-[var(--color-text)]" : ""}>{t(stepKey)}</span>
                {active && <span className="animate-pulse">...</span>}
              </div>
            );
          })}
        </div>
      </main>
    );
  }

  return (
    <main className="relative z-10 min-h-screen px-6 py-16 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <FolioWordmark size="sm" />
        <h1 className="mt-8 text-2xl md:text-3xl font-mono text-[var(--color-text)]">
          {t("connect.select.title")}
        </h1>
        <p className="mt-2 text-[var(--color-text-muted)]">
          {t("connect.select.subtitle")}
        </p>

        {repos.length === 0 && (
          <p className="mt-8 text-sm text-[var(--color-text-faint)] font-mono">
            {t("connect.select.noRepos")}
          </p>
        )}

        <ul className="mt-8 space-y-3">
          {repos.map((repo) => (
            <li key={repo.id}>
              <button
                onClick={() => toggleRepo(repo.id)}
                className={`w-full text-left rounded-lg border px-5 py-4 transition-colors ${
                  repo.is_selected
                    ? "border-[var(--color-accent-dim)] bg-[var(--color-surface)]"
                    : "border-[var(--color-border)] bg-transparent opacity-60 hover:opacity-90"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[var(--color-text)]">{repo.name}</span>
                      <span className="text-xs font-mono text-[var(--color-accent)]">
                        {t("connect.select.impact")} {repo.impact_score}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                      {repo.description || t("connect.select.noDescription")}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(repo.stack ?? []).slice(0, 5).map((s) => (
                        <span
                          key={s}
                          className="text-[11px] font-mono text-[var(--color-text-faint)] border border-[var(--color-border)] rounded px-1.5 py-0.5"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div
                    className={`shrink-0 mt-1 h-5 w-5 rounded border flex items-center justify-center ${
                      repo.is_selected
                        ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-ink)]"
                        : "border-[var(--color-border-bright)]"
                    }`}
                  >
                    {repo.is_selected && "✓"}
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-10 flex items-center justify-between">
          <span className="text-sm font-mono text-[var(--color-text-muted)]">
            {selectedCount}{" "}
            {t(selectedCount !== 1 ? "connect.select.projectsSelected" : "connect.select.projectSelected")}
          </span>
          <button
            onClick={handleGenerate}
            disabled={!githubUsername || generating}
            className="rounded-md bg-[var(--color-accent)] px-6 py-3 font-mono text-sm text-[var(--color-ink)] transition-opacity disabled:opacity-30 hover:opacity-90"
          >
            {generating ? t("connect.select.generating") : t("connect.select.generate")}
          </button>
        </div>
        {saveError && (
          <p className="mt-3 text-right text-sm text-[var(--color-text-faint)]">
            {t("connect.select.saveFailed")}
          </p>
        )}
      </div>
    </main>
  );
}