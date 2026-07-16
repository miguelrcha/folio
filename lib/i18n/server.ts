import { cookies, headers } from "next/headers";
import {
  LANGUAGE_COOKIE,
  isSupportedLanguage,
  pickLanguageFromAcceptHeader,
  type Language,
} from "@/lib/i18n/translations";

export async function getServerLanguage(): Promise<Language> {
  const store = await cookies();
  const value = store.get(LANGUAGE_COOKIE)?.value;
  if (isSupportedLanguage(value)) return value;

  // First visit (no cookie yet): honor the browser's language preference.
  const accept = (await headers()).get("accept-language");
  return pickLanguageFromAcceptHeader(accept) ?? "en";
}
