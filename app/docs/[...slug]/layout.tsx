import type { ReactNode } from "react";
import { RootProvider } from "fumadocs-ui/provider/next";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getDocsSource } from "@/lib/source";
import { baseOptions } from "@/lib/layout.shared";
import { getServerLanguage } from "@/lib/i18n/server";
import { getDocsI18nProviderProps } from "@/lib/i18n/docs";

export default async function DocsContentLayout({ children }: { children: ReactNode }) {
  const lang = await getServerLanguage();
  const source = getDocsSource(lang);

  return (
    <>
      <Header />
      <div className="h-[60px] md:h-[58px]" />
      <RootProvider
        theme={{ forcedTheme: "dark", enableSystem: false }}
        i18n={getDocsI18nProviderProps(lang)}
      >
        <DocsLayout tree={source.getPageTree()} sidebar={{ collapsible: true }} {...baseOptions(lang)}>
          {children}
        </DocsLayout>
      </RootProvider>
      <Footer />
    </>
  );
}
