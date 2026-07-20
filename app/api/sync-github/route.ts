import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { decrypt } from "@/lib/crypto";
import { syncGithubProfile, SyncError } from "@/lib/github-sync";

// A large account (repos are paginated, each repo costs two more GitHub
// calls) can take well over a minute — be explicit about the budget instead
// of leaning on the platform default.
export const maxDuration = 300;

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("github_access_token")
    .eq("id", user.id)
    .single();

  if (!profile?.github_access_token) {
    return NextResponse.json({ error: "no github token stored" }, { status: 400 });
  }

  let githubAccessToken: string;
  try {
    githubAccessToken = decrypt(profile.github_access_token);
  } catch {
    // Token saved before this encryption went into effect (plain text).
    // Ask the person to sign in again so it gets saved already encrypted.
    return NextResponse.json(
      { error: "token in legacy format, please sign in again" },
      { status: 401 }
    );
  }

  try {
    const result = await syncGithubProfile(supabase, user.id, githubAccessToken);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof SyncError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
