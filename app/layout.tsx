import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Lato } from "next/font/google";
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
  metadataBase: new URL("https://meufolio.dev"),

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} ${lato.variable} antialiased`}>
        <div className="grain" />
        {children}
      </body>
    </html>
  );
}