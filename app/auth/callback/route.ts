import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { encrypt } from "@/lib/crypto";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      const githubToken = data.session.provider_token;
      const user = data.session.user;

      const { error: upsertError } = await supabase.from("profiles").upsert({
        id: user.id,
        github_username: user.user_metadata.user_name,
        full_name: user.user_metadata.full_name ?? null,
        avatar_url: user.user_metadata.avatar_url,
        github_access_token: githubToken ? encrypt(githubToken) : null,
        updated_at: new Date().toISOString(),
      });

      if (upsertError) {
        console.error("Failed to save profile:", upsertError.message);
        return NextResponse.redirect(
          `${origin}/login?error=profile_save_failed&reason=${encodeURIComponent(upsertError.message)}`
        );
      }

      // If this person already completed onboarding before (returning
      // login), skip straight to the profile — even if they have no repos.
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", user.id)
        .single();

      if (existingProfile?.onboarding_completed) {
        return NextResponse.redirect(`${origin}/${user.user_metadata.user_name}`);
      }

      return NextResponse.redirect(`${origin}/connect`);
    }

    if (error) {
      console.error("Failed to exchange code for session:", error.message);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}