"use client";

import { useCvExport } from "@/components/CvExportCoordinator";
import { CV_TEMPLATES } from "@/lib/cv/templates";
import type { CvConfig } from "@/lib/cv/config";
import type { PublicProfile, Repo } from "@/lib/profile";

// The default print target, reflecting the saved config — always present so
// a plain Cmd/Ctrl+P works with no other action, for owners and visitors
// alike. Steps aside (renders nothing) while CvStudioModal is open, since
// the modal carries its own print-variant node reflecting live, possibly
// unsaved edits.
export function CvPrintFallback({
  profile,
  repos,
  config,
}: {
  profile: PublicProfile;
  repos: Repo[];
  config: CvConfig;
}) {
  const { studioOpen } = useCvExport();
  if (studioOpen) return null;

  const CvTemplate = CV_TEMPLATES[config.template].component;
  return <CvTemplate profile={profile} repos={repos} config={config} variant="print" />;
}
