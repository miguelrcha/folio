import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Content lives on the landing, the docs and the public profiles — auth and
// onboarding flows have nothing to index.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/auth/", "/connect", "/loading", "/login"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
