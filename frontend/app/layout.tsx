// app/layout.tsx

/**
 * Layout raíz de la aplicación (Next.js App Router).
 * Envuelve todas las páginas con la estructura HTML base y aplica las fuentes globales.
 *
 * Autores:
 * - Yael Sinuhe Grajeda Martinez
 * - Daniel Alvarez Sil
 *
 * Notas:
 * - Define `metadata` con `title` y `description` para el sitio.
 * - Carga las fuentes Geist y Geist_Mono desde `next/font/google` y las expone vía CSS variables.
 * - Aplica clases globales (`antialiased`) y estilos de `globals.css`.
 */

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Beneficio Joven",
  description: "Sistema de Beneficio Joven por el Gobierno de Atizapán",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
