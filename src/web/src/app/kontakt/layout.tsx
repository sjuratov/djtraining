import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kontakt — DJ\u2019s Training | Fitness Studio in Buchs AG',
  description:
    'Kontaktiere DJ\u2019s Training in Buchs AG. Kostenloses Probetraining, Telefon +41 78 611 24 79, E-Mail info@dj-training.com.',
};

export default function KontaktLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
