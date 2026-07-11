import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { PublicProfile } from "@/lib/profile";

// One profile fetch shared by the page, generateMetadata and the OG image —
// React's cache() dedupes the query within a single request, so adding
// metadata didn't add database round-trips. Reads the public_profiles view
// only (never the profiles table — see AGENTS.md).
export const getPublicProfile = cache(async (username: string): Promise<PublicProfile | null> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("public_profiles")
    .select("*")
    .eq("github_username", username)
    .single<PublicProfile>();
  return data;
});
