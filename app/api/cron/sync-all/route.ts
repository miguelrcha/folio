import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { decrypt } from "@/lib/crypto";
import { syncGithubProfile, SyncError } from "@/lib/github-sync";

// Triggered once a day by Vercel Cron (see vercel.json) to keep bio, name,
// and total commits current even without the person opening folio or
// reconnecting GitHub. Vercel injects the Authorization header with the
// CRON_SECRET value automatically when that env var is set on the project.
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
