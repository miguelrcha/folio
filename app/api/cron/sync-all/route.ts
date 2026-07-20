import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { decrypt } from "@/lib/crypto";
import { mapWithConcurrency, syncGithubProfile } from "@/lib/github-sync";

// A full sync makes dozens of GitHub calls per profile; the platform default
// timeout is not something to lean on implicitly for a job that grows with
// the user base.
export const maxDuration = 300;

// How many profiles sync at once. Each one already fans out its own repo
// fetches (bounded inside syncGithubProfile), and each uses its owner's
// token, so GitHub rate limits are per-profile — this cap is about not
// saturating the function's own network, not about GitHub quotas.
// ponytail: all profiles still sync in a single invocation; move to a
// cursor/queue (e.g. Vercel Queues) when profile count outgrows the 300s window.
const CRON_SYNC_CONCURRENCY = 5;

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

  // Failures are caught per profile (allSettled semantics) so one revoked
  // token or rate-limited account never blocks the rest of the batch.
  const results = await mapWithConcurrency(profiles ?? [], CRON_SYNC_CONCURRENCY, async (profile) => {
    try {
      const accessToken = decrypt(profile.github_access_token as string);
      await syncGithubProfile(supabase, profile.id, accessToken);
      return { profileId: profile.id as string, error: null };
    } catch (err) {
      return {
        profileId: profile.id as string,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  });

  const failures = results
    .filter((r): r is { profileId: string; error: string } => r.error !== null)
    .map((r) => ({ profileId: r.profileId, error: r.error }));

  return NextResponse.json({
    total: results.length,
    synced: results.length - failures.length,
    failed: failures.length,
    failures,
  });
}
