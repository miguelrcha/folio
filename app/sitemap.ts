import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { SITE_URL } from "@/lib/site";

// Regenerate hourly so newly connected profiles get indexed without a
// redeploy.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/docs`, changeFrequency: "monthly", priority: 0.5 },
  ];

  try {
    // Bare anon-key client on purpose: there is no request cookie context
    // here, and the admin client must never serve visitor-facing responses.
    // The public_profiles view is exactly the anon-readable surface.
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
    );

    const { data } = await supabase
      .from("public_profiles")
      .select("github_username")
      .limit(5000);

    const profiles: MetadataRoute.Sitemap = (data ?? []).map((p) => ({
      url: `${SITE_URL}/${p.github_username}`,
      changeFrequency: "daily",
      priority: 0.8,
    }));

    return [...staticRoutes, ...profiles];
  } catch {
    // Build environments (like CI) run with placeholder Supabase envs — a
    // sitemap with just the static routes beats failing the build.
    return staticRoutes;
  }
}
