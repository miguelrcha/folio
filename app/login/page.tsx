"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GithubIcon } from "@/components/GithubIcon";
import { createClient } from "@/lib/supabase/client";

const GITHUB_DEFAULT_AVATAR = "https://github.com/Braian-de-Liz.png";
const GITHUB_DEFAULT_AVATAR2 = "https://github.com/hemkdev.png";
const MY_AVATAR = "https://github.com/miguelrcha.png";
const SPOUK_AVATAR = "https://github.com/spoukhs.png";

function DevAvatarStack({ totalCount }: { totalCount: number | null }) {
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
        Join several other devs
      </p>
    </div>
  );
}

export default function SignInPage() {
  const router = useRouter();
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    document.title = "Folio - Sign Up";
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.rpc("get_total_profiles").then(({ data, error }) => {
      if (!error && typeof data === "number") setTotalCount(data);
    });
  }, []);

  // Se já tiver sessão ativa, pula direto pro perfil em vez de mostrar o botão de novo
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
          // já autenticou mas o perfil ainda nem foi salvo direito
          router.replace("/connect");
          return;
        }

        // Já completou o onboarding antes (mesmo sem nenhum repo)? Pula direto pro perfil.
        if (profile.onboarding_completed) {
          router.replace(`/${profile.github_username}`);
        } else {
          router.replace("/connect");
        }
      } catch (err) {
        console.error("Erro ao checar sessão existente:", err);
        // nunca deixa a tela travada em branco — libera pra mostrar o login normal
        finish();
      }
    };

    checkSession();

    // Rede de segurança: se por qualquer motivo a checagem nunca resolver,
    // libera a tela de login depois de alguns segundos em vez de travar pra sempre.
    const safetyTimeout = setTimeout(finish, 4000);

    return () => clearTimeout(safetyTimeout);
  }, [router]);

  const handleSignIn = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: "read:user repo",
      },
    });
  };

  // Evita mostrar o botão de login por um instante enquanto ainda checa se já tem sessão
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

        <button
          onClick={handleSignIn}
          className="animate-fade-up group mt-10 inline-flex w-full cursor-pointer items-center justify-center gap-3 rounded-lg bg-[var(--color-text)] px-6 py-3.5 font-lato text-md font-semibold text-[var(--color-ink)] transition-opacity hover:opacity-85"
        >
          <GithubIcon className="h-7 w-7" />
          Sign in with GitHub
        </button>

        <p className="mt-6 text-xs text-[var(--color-text-faint)] font-mono">
          read-only · no write access to your repositories
        </p>
      </div>
    </main>
  );
}