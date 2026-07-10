"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LANGUAGE_COOKIE, translate, type Language } from "@/lib/i18n/translations";

type LanguageContextValue = {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({
  initialLang,
  children,
}: {
  initialLang: Language;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [lang, setLangState] = useState<Language>(initialLang);

  const setLang = useCallback(
    (next: Language) => {
      setLangState(next);
      document.cookie = `${LANGUAGE_COOKIE}=${next}; path=/; max-age=31536000; SameSite=Lax`;
      // Server Components (e.g. the profile page) read the language from the
      // cookie, so they need a refresh to pick up the new value.
      router.refresh();
    },
    [router]
  );

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => translate(lang, key, vars),
    [lang]
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within a LanguageProvider");
  return ctx;
}
