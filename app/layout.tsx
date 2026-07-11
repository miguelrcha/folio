import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Lato } from "next/font/google";
import { LanguageProvider } from "@/components/LanguageProvider";
import { getServerLanguage } from "@/lib/i18n/server";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});
const lato = Lato({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-lato-raw",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: "Folio - Turn your GitHub into a professional resume with AI",

  description:
    "Folio analyzes your repositories, commits, and real tech stack to generate a professional profile and an AI-powered resume.",

  openGraph: {
    title: "Folio",
    description:
      "Turn your GitHub into a professional resume with AI.",
    url: "https://meufolio.dev",
    siteName: "Folio",
    images: [
      {
        url: "/url-preview.png",
        width: 1200,
        height: 630,
        alt: "Folio - Turn your GitHub into a professional resume with AI",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Folio",
    description:
      "Turn your GitHub into a professional resume with AI.",
    images: ["/url-preview.png"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const lang = await getServerLanguage();

  return (
    <html lang={lang} suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} ${lato.variable} antialiased`}>
        <div className="grain" />
        <LanguageProvider initialLang={lang}>{children}</LanguageProvider>
      </body>
    </html>
  );
}