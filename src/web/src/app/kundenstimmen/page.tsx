import type { Metadata } from 'next';
import KundenstimmenContent from './KundenstimmenContent';

export const metadata: Metadata = {
  title: "Kundenstimmen — Bewertungen & Erfahrungen | DJ's Training Buchs AG",
  description:
    'Lies, was Kunden über DJ\'s Training sagen. 18 echte Bewertungen von zufriedenen Kunden aus Buchs AG und Umgebung.',
};

export default function KundenstimmenPage() {
  return <KundenstimmenContent />;
}
