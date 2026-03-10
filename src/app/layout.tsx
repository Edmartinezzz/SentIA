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
  title: "Clarity | Asistente de Bienestar Emocional con Inteligencia Artificial",
  description:
    "Clarity es tu asistente personal de bienestar emocional impulsado por IA. Comprende tus emociones, registra tu diario, cumple misiones diarias y obtén planes de mejora basados en terapia cognitivo-conductual.",
  keywords: ["bienestar", "emocional", "IA", "salud mental", "diario", "psicología", "Clarity"],
  authors: [{ name: "Carlos Martinez" }],
  creator: "Carlos Martinez",
  openGraph: {
    title: "Clarity | Tu Asistente de Bienestar Mental",
    description: "Reflexiona, entiende tus emociones y mejora tu calidad de vida interactuando con Clarity, impulsado por IA.",
    url: "https://clarity-app-orpin.vercel.app", // Reemplazaremos con dominio final si hay
    siteName: "Clarity AI",
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Clarity | Asistente de Bienestar",
    description: "Tu espacio seguro para la salud mental diaria.",
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: "mWsDt4htT2eI4zMVjBmZSkkXPsZ6XgyjrKI5oUpiAXQ",
  }
};

import { ThemeProvider } from "@/components/ThemeProvider";
import { AudioProvider } from "@/lib/audio-context";
import { GlobalAudioPlayer } from "@/components/GlobalAudioPlayer";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AudioProvider>
            <GlobalAudioPlayer />
            {children}
          </AudioProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
