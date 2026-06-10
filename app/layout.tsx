import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import { SITE_URL, SITE_NAME } from "@/lib/seo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const SITE_DESCRIPTION =
  "Descubre recetas deliciosas y compara precios en Mercadona, Carrefour, Lidl, Alcampo y Dia para ahorrar en tu compra.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "RecetaFácil — Cocina bien y gasta menos",
  description: SITE_DESCRIPTION,
  keywords: [
    "recetas baratas",
    "recetas económicas",
    "comparar precios supermercado",
    "recetas Mercadona",
    "recetas fáciles España",
    "lista de compras barata",
  ],
  openGraph: {
    siteName: SITE_NAME,
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${geistSans.variable} h-full`}>
      <body className="min-h-full bg-stone-50 antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}
