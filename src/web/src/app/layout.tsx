import type { Metadata } from "next";
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";

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
      <body className="antialiased">
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
