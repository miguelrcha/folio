import { docs, docsPt } from "@/.source/server";
import { loader } from "fumadocs-core/source";
import type { Language } from "@/lib/i18n/translations";

export const source = loader({
  baseUrl: "/docs",
  source: docs.toFumadocsSource(),
});

const sourcePt = loader({
  baseUrl: "/docs",
  source: docsPt.toFumadocsSource(),
});

// The docs live at the same English URLs regardless of language — our i18n
// is cookie-driven, not URL-driven — so we just pick the matching MDX
// collection for the request's language instead of routing to /docs/pt/...
export function getDocsSource(lang: Language) {
  return lang === "pt" ? sourcePt : source;
}
