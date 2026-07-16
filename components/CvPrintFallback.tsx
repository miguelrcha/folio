"use client";

import { CV_TEMPLATES } from "@/lib/cv/templates";
import { useLanguage } from "@/components/LanguageProvider";
import type { CvConfig } from "@/lib/cv/config";
import type { PublicProfile, Repo } from "@/lib/profile";

// The print target for the main profile page, reflecting the saved config —
// always present so a plain Cmd/Ctrl+P works with no other action, for
// owners and visitors alike. Owners customizing the CV do so on the
// dedicated /[username]/cv-studio route, which carries its own print-variant
// node, so this one only ever needs to reflect the saved config.
export function CvPrintFallback({
  profile,
  repos,
  config,
}: {
  profile: PublicProfile;
  repos: Repo[];
  config: CvConfig;
}) {
  const { lang } = useLanguage();
  const CvTemplate = CV_TEMPLATES[config.template].component;
  return (
    <CvTemplate profile={profile} repos={repos} config={config} variant="print" lang={lang} />
  );
}
