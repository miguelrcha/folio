import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: "Docs",
      url: "/docs",
    },
    githubUrl: "https://github.com/miguelrcha/folio",
    links: [
      {
        type: "button",
        text: "Get started",
        url: "/loading",
      },
    ],
    themeSwitch: {
      enabled: false,
    },
  };
}
