"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GithubIcon } from "@/components/GithubIcon";
import { useLanguage } from "@/components/LanguageProvider";
import { createClient } from "@/lib/supabase/client";

// Error codes the OAuth callback reports back via ?error= — until now they
// were silently dropped and a denied GitHub prompt looked like a no-op.
const LOGIN_ERROR_KEYS: Record<string, string> = {
  auth_failed: "login.error.authFailed",
  profile_save_failed: "login.error.profileSaveFailed",
};

// useSearchParams needs its own Suspense boundary on a prerendered page.
function LoginErrorBanner() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const errorKey = LOGIN_ERROR_KEYS[searchParams.get("error") ?? ""];

  if (!errorKey) return null;

  return (
    <p className="mt-6 w-full text-center text-xs font-mono text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
      {t(errorKey)}
    </p>
  );
}

const GITHUB_DEFAULT_AVATAR = "https://github.com/Braian-de-Liz.png";
const GITHUB_DEFAULT_AVATAR2 = "https://github.com/hemkdev.png";
const MY_AVATAR = "https://github.com/miguelrcha.png";
const SPOUK_AVATAR = "https://github.com/spoukhs.png";

function DevAvatarStack({ totalCount }: { totalCount: number | null }) {
  const { t } = useLanguage();
  const avatars = [MY_AVATAR, GITHUB_DEFAULT_AVATAR2, SPOUK_AVATAR, GITHUB_DEFAULT_AVATAR,];
  const displayCount = totalCount === null ? null : `+${totalCount}`;

  return (
    <div className="mt-10 flex flex-col items-center gap-3">
      <div className="flex items-center">
        {avatars.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={src}
            alt=""
            className="h-10 w-10 rounded-full border-2 border-[var(--color-surface)] object-cover -ml-3 first:ml-0"
            style={{ zIndex: avatars.length - i }}
          />
        ))}
        <div
          className="h-10 w-10 rounded-full border-2 border-[var(--color-surface)] bg-[var(--color-surface-raised)] flex items-center justify-center -ml-3"
          style={{ zIndex: 0 }}
        >
          <span className="text-xs font-mono text-[var(--color-text-muted)]">
            {displayCount ?? "—"}
          </span>
        </div>
      </div>
      <p className="text-sm font-mono text-[var(--color-text-muted)]">
        {t("login.joinDevs")}
      </p>
    </div>
  );
}

export default function SignInPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    document.title = t("login.docTitle");
  }, [t]);

  useEffect(() => {
    const supabase = createClient();
    supabase.rpc("get_total_profiles").then(({ data, error }) => {
      if (!error && typeof data === "number") setTotalCount(data);
    });
  }, []);

  // If there's already an active session, skip straight to the profile instead of showing the button again
  useEffect(() => {
    const supabase = createClient();
    let settled = false;

    const finish = () => {
      if (!settled) {
        settled = true;
        setCheckingSession(false);
      }
    };

    const checkSession = async () => {
      try {
        // The callback redirects here with ?error= when something went wrong
        // (e.g. the profile upsert failed with a live session). Skipping the
        // auto-redirect lets the person actually read the error — signing in
        // again is the recovery action.
        const params = new URLSearchParams(window.location.search);
        if (LOGIN_ERROR_KEYS[params.get("error") ?? ""]) {
          finish();
          return;
        }

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          finish();
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("github_username, onboarding_completed")
          .eq("id", user.id)
          .single();

        if (profileError || !profile?.github_username) {
          // already authenticated but the profile hasn't been saved properly yet
          router.replace("/connect");
          return;
        }

        // Already completed onboarding before (even with no repos)? Skip straight to the profile.
        if (profile.onboarding_completed) {
          router.replace(`/${profile.github_username}`);
        } else {
          router.replace("/connect");
        }
      } catch (err) {
        console.error("Error checking existing session:", err);
        // never leave the screen stuck blank — release it to show the normal login
        finish();
      }
    };

    checkSession();

    // Safety net: if for any reason the check never resolves, release the
    // login screen after a few seconds instead of hanging forever.
    const safetyTimeout = setTimeout(finish, 4000);

    return () => clearTimeout(safetyTimeout);
  }, [router]);

  const handleSignIn = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        // Public data only (repos, languages, profile README) — the broad
        // "repo" scope (read/write, incl. private) contradicted the read-only
        // promise below and is not needed by the sync.
        scopes: "read:user",
      },
    });
  };

  // Avoids showing the login button for an instant while still checking for an existing session
  if (checkingSession) {
    return (
      <main className="relative z-10 min-h-screen flex items-center justify-center px-6 overflow-hidden">
        <div className="hero-glow" />
      </main>
    );
  }

  return (
    <main className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden">
      <div className="hero-glow" />

      <div className="animate-fade-up  relative flex flex-col items-center text-center max-w-sm">
        <span className="animate-fade-up font-lato text-5xl md:text-6xl tracking-tight text-[var(--color-text)]">
          folio
        </span>

        <DevAvatarStack totalCount={totalCount} />

        <Suspense fallback={null}>
          <LoginErrorBanner />
        </Suspense>

        <button
          onClick={handleSignIn}
          className="animate-fade-up group mt-10 inline-flex w-full cursor-pointer items-center justify-center gap-3 rounded-lg bg-[var(--color-text)] px-6 py-3.5 font-lato text-md font-semibold text-[var(--color-ink)] transition-opacity hover:opacity-85"
        >
          <GithubIcon className="h-7 w-7" />
          {t("header.signIn")}
        </button>

        <p className="mt-6 text-xs text-[var(--color-text-faint)] font-mono">
          {t("login.readOnly")}
        </p>
      </div>
    </main>
  );
}