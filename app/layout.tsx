import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RecetaBarata — Cocina bien y gasta menos",
  description:
    "Descubre recetas deliciosas y compara precios en Mercadona, Carrefour, Lidl, Alcampo y Dia para ahorrar en tu compra.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${geistSans.variable} h-full`}>
      <body className="min-h-full bg-stone-50 antialiased">
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}
