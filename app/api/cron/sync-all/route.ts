import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { decrypt } from "@/lib/crypto";
import { syncGithubProfile, SyncError } from "@/lib/github-sync";

// Disparado 1x/dia pelo Vercel Cron (ver vercel.json) pra manter bio, nome e
// total de commits em dia mesmo sem a pessoa abrir o folio ou reconectar o
// GitHub. Vercel injeta o header Authorization com o valor de CRON_SECRET
// automaticamente quando essa env var está configurada no projeto.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, github_access_token")
    .not("github_access_token", "is", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results = await Promise.allSettled(
    (profiles ?? []).map(async (profile) => {
      const accessToken = decrypt(profile.github_access_token as string);
      return syncGithubProfile(supabase, profile.id, accessToken);
    })
  );

  const failures = results
    .map((r, i) => ({ r, id: profiles![i].id }))
    .filter((x) => x.r.status === "rejected")
    .map((x) => ({
      profileId: x.id,
      error:
        x.r.status === "rejected"
          ? x.r.reason instanceof SyncError || x.r.reason instanceof Error
            ? x.r.reason.message
            : String(x.r.reason)
          : "",
    }));

  return NextResponse.json({
    total: results.length,
    synced: results.length - failures.length,
    failed: failures.length,
    failures,
  });
}
