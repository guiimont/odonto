import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Odonto — Gestão clínica",
  description: "Agenda e prontuário odontológico em um único fluxo.",
  applicationName: "Odonto",
};

export const viewport: Viewport = { themeColor: "#111a17", colorScheme: "light" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable}`}><body>{children}</body></html>;
}
