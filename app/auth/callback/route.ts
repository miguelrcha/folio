import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      const githubToken = data.session.provider_token;
      const user = data.session.user;

      await supabase.from("profiles").upsert({
        id: user.id,
        github_username: user.user_metadata.user_name,
        avatar_url: user.user_metadata.avatar_url,
        github_access_token: githubToken,
        updated_at: new Date().toISOString(),
      });

      return NextResponse.redirect(`${origin}/connect`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}