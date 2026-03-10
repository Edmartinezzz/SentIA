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
  title: "Clarity · Asistente de bienestar emocional",
  description:
    "Clarity es un asistente de bienestar emocional impulsado por inteligencia artificial que te ayuda a reflexionar, comprender tus emociones y crear pequeños planes de mejora.",
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
