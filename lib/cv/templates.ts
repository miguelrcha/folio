import { ClassicTemplate } from "@/components/cv/templates/ClassicTemplate";
import { ModernTemplate } from "@/components/cv/templates/ModernTemplate";
import type { CvTemplateKey } from "@/lib/cv/config";
import type { CvTemplateMeta } from "@/lib/cv/types";

export const CV_TEMPLATES: Record<CvTemplateKey, CvTemplateMeta> = {
  classic: {
    key: "classic",
    displayName: "Classic",
    thumbnail: null,
    supportsPhoto: true,
    component: ClassicTemplate,
  },
  modern: {
    key: "modern",
    displayName: "Modern",
    thumbnail: null,
    supportsPhoto: true,
    component: ModernTemplate,
  },
};
