import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Tipografías del kit de marca: Inter para la interfaz y JetBrains Mono para datos.
// Los nombres de variable (--font-inter, --font-jetbrains) los lee globals.css.
const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const jetbrainsMono = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: { default: "Consultoría Hospital", template: "%s · Consultoría Hospital" },
  description: "Gestión Hospitalaria · Ministerio del Poder Popular para la Defensa.",
  // Safari no acepta AVIF como ícono: favicon y apple-touch en PNG (BRANDING.md, paso 6).
  icons: { icon: "/icons/mppd-32.png", apple: "/icons/mppd-180.png" },
};

export const viewport: Viewport = { themeColor: "#F5F6EF" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
