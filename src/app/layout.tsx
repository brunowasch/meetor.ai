import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Meetor",
  description:
    "Agende e realize sessões de mentoria por videochamada com mentores especialistas. Conexões que transformam carreiras.",
  keywords: "mentoria, videochamada, desenvolvimento profissional, coaching, carreira",
  openGraph: {
    title: "Meetor",
    description: "Plataforma de agendamento e realização de sessões de mentoria por vídeo.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
