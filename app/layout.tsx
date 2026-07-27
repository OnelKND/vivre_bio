import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VIVRE BIO | Huiles essentielles et extraits naturels",
  description:
    "VIVRE BIO transforme des plantes aromatiques en huiles essentielles et extraits naturels. Le meilleur de la nature pour vous.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" data-theme="vivrebio" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}