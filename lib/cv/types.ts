import type { ComponentType } from "react";
import type { PublicProfile, Repo } from "@/lib/profile";
import type { CvConfig, CvTemplateKey } from "@/lib/cv/config";

export type CvTemplateProps = {
  profile: PublicProfile;
  repos: Repo[];
  config: CvConfig;
};

export type CvTemplateMeta = {
  key: CvTemplateKey;
  displayName: string;
  /** Real thumbnails are a nice-to-have for the template picker (issue #29) — unset for now. */
  thumbnail: string | null;
  supportsPhoto: boolean;
  component: ComponentType<CvTemplateProps>;
};
