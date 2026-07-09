import type { ReactNode } from "react";
import { RootProvider } from "fumadocs-ui/provider/next";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { source } from "@/lib/source";
import { baseOptions } from "@/lib/layout.shared";

export default function DocsContentLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <div className="h-[60px] md:h-[58px]" />
      <RootProvider theme={{ forcedTheme: "dark", enableSystem: false }}>
        <DocsLayout tree={source.getPageTree()} sidebar={{ collapsible: true }} {...baseOptions()}>
          {children}
        </DocsLayout>
      </RootProvider>
      <Footer />
    </>
  );
}
