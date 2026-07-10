import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { translate, type Language } from "@/lib/i18n/translations";

export function baseOptions(lang: Language = "en"): BaseLayoutProps {
  return {
    nav: {
      title: translate(lang, "header.docs"),
      url: "/docs",
    },
    githubUrl: "https://github.com/miguelrcha/folio",
    links: [
      {
        type: "button",
        text: translate(lang, "cta.getStarted"),
        url: "/loading",
      },
    ],
    themeSwitch: {
      enabled: false,
    },
  };
}
