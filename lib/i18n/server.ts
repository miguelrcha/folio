import { cookies } from "next/headers";
import { LANGUAGE_COOKIE, isSupportedLanguage, type Language } from "@/lib/i18n/translations";

export async function getServerLanguage(): Promise<Language> {
  const store = await cookies();
  const value = store.get(LANGUAGE_COOKIE)?.value;
  return isSupportedLanguage(value) ? value : "en";
}
