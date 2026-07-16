import { translate, type Language } from "@/lib/i18n/translations";

export type LanguageEntry = {
  language: string; // code, ex: "portuguese"
  proficiency: string; // ex: "Native"
};

export const LANGUAGE_OPTIONS: { code: string; name: string; flag: string }[] = [
  { code: "portuguese", name: "Portuguese", flag: "🇧🇷" },
  { code: "english", name: "English", flag: "🇺🇸" },
  { code: "spanish", name: "Spanish", flag: "🇪🇸" },
  { code: "french", name: "French", flag: "🇫🇷" },
  { code: "german", name: "German", flag: "🇩🇪" },
  { code: "italian", name: "Italian", flag: "🇮🇹" },
  { code: "japanese", name: "Japanese", flag: "🇯🇵" },
  { code: "mandarin", name: "Mandarin", flag: "🇨🇳" },
  { code: "korean", name: "Korean", flag: "🇰🇷" },
  { code: "russian", name: "Russian", flag: "🇷🇺" },
  { code: "arabic", name: "Arabic", flag: "🇸🇦" },
  { code: "hindi", name: "Hindi", flag: "🇮🇳" },
  { code: "dutch", name: "Dutch", flag: "🇳🇱" },
  { code: "swedish", name: "Swedish", flag: "🇸🇪" },
  { code: "polish", name: "Polish", flag: "🇵🇱" },
  { code: "turkish", name: "Turkish", flag: "🇹🇷" },
  { code: "vietnamese", name: "Vietnamese", flag: "🇻🇳" },
  { code: "greek", name: "Greek", flag: "🇬🇷" },
  { code: "hebrew", name: "Hebrew", flag: "🇮🇱" },
  { code: "ukrainian", name: "Ukrainian", flag: "🇺🇦" },
];

export const PROFICIENCY_OPTIONS = ["Basic", "Intermediate", "Advanced", "Fluent", "Native"];

export function emptyLanguageEntry(): LanguageEntry {
  return { language: LANGUAGE_OPTIONS[0].code, proficiency: PROFICIENCY_OPTIONS[0] };
}

// Dictionary lookup that keeps the stored value as fallback — translate()
// returns the key itself on a miss, which must never leak into the UI.
function tOr(lang: Language, key: string, fallback: string): string {
  const value = translate(lang, key);
  return value === key ? fallback : value;
}

export function languageName(code: string, lang: Language = "en"): string {
  const option = LANGUAGE_OPTIONS.find((l) => l.code === code);
  if (!option) return "";
  return tOr(lang, `language.${option.code}`, option.name);
}

export function proficiencyLabel(proficiency: string, lang: Language = "en"): string {
  return tOr(lang, `proficiency.${proficiency.toLowerCase()}`, proficiency);
}

export function formatLanguageEntry(
  entry: LanguageEntry,
  { showFlag = true, lang = "en" as Language } = {}
): string {
  const option = LANGUAGE_OPTIONS.find((l) => l.code === entry.language);
  if (!option) return "";
  const label = `${languageName(entry.language, lang)} - ${proficiencyLabel(entry.proficiency, lang)}`;
  return showFlag ? `${option.flag} ${label}` : label;
}
