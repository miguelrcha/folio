// Canonical site origin, used for metadataBase, canonical/OG URLs, robots
// and the sitemap. meufolio.dev is the production domain; the env override
// exists for previews and local checks.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://meufolio.dev";
