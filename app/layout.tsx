import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("http://localhost:3000"), // alterar para dominio real quando for deployar

  title: "Folio - Turn your GitHub into a professional resume with AI",

  description:
    "Folio analyzes your repositories, commits, and real tech stack to generate a professional profile and an AI-powered resume.",

  openGraph: {
    title: "Folio",
    description:
      "Turn your GitHub into a professional resume with AI.",
    url: "http://localhost:3000", // alterar para dominio real quando for deployar
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
    <html lang="en">
      <body className="antialiased">
        <div className="grain" />
        {children}
      </body>
    </html>
  );
}