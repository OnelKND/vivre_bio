import type { Metadata } from "next";
import { Poppins, Great_Vibes } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { CartProvider } from "@/lib/cart-context";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-poppins",
  display: "swap",
});

const greatVibes = Great_Vibes({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-great-vibes",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "VIVRE BIO | Huiles essentielles et extraits naturels",
    template: "%s | VIVRE BIO",
  },
  description:
    "VIVRE BIO transforme des plantes aromatiques en huiles essentielles et extraits naturels. Le meilleur de la nature pour vous. Livraison au Bénin, paiement à la livraison.",
  openGraph: {
    type: "website",
    locale: "fr_BJ",
    siteName: "VIVRE BIO",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      data-theme="vivrebio"
      className={`h-full antialiased ${poppins.variable} ${greatVibes.variable}`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <CartProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </CartProvider>
        <Script
          src="https://kit.fontawesome.com/27290c1c94.js"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
