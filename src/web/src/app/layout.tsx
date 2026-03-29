import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "DJ's Training — Personal Training & Fitness in Buchs AG",
    template: "%s | DJ's Training",
  },
  description: "Starte deine persönliche Reise zu mehr Gesundheit, Fitness & Wohlbefinden. Personal Training, Gruppentraining und Ernährungscoaching in Buchs AG mit Diana Juratovic.",
  openGraph: {
    title: "DJ's Training — Personal Training & Fitness in Buchs AG",
    description: "Personal Training, Gruppentraining und Ernährungscoaching in Buchs AG.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
