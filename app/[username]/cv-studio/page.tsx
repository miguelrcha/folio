import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { CvStudioScreen } from "@/components/CvStudioScreen";
import type { Repo } from "@/lib/profile";
import { getPublicProfile } from "../profile-data";

export const metadata: Metadata = {
  robots: { index: false },
};

export default async function CvStudioPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();

  const profile = await getPublicProfile(username);
  if (!profile) notFound();

  // Owner-only tool — anyone else lands back on the public profile.
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();
  if (currentUser?.id !== profile.id) redirect(`/${username}`);

  const { data: repos } = await supabase
    .from("repos")
    .select("id, name, description, summary, stack, stars, forks, impact_score")
    .eq("profile_id", profile.id)
    .eq("is_selected", true)
    .order("impact_score", { ascending: false })
    .returns<Repo[]>();

  return <CvStudioScreen profile={profile} repos={repos ?? []} />;
}
