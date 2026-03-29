import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Impressum — DJ\u2019s Training-Fitness Studio Juratovic',
  description:
    'Impressum von DJ\u2019s Training-Fitness Studio Juratovic, Rösslimattstrasse 2c, CH-5033 Buchs AG.',
  robots: 'noindex, follow',
};

export default function ImpressumPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="mb-2 text-3xl font-bold text-gray-900">Impressum</h1>
      <p className="mb-8 text-sm text-gray-500">Zuletzt aktualisiert: Januar 2025</p>

      <div className="prose prose-gray max-w-none space-y-8">
        <p>
          Angaben gemäss Art. 3 Abs. 1 Bst. s des Bundesgesetzes gegen den unlauteren Wettbewerb
          (UWG):
        </p>

        <div className="space-y-2">
          <p>
            <strong>Firmenname:</strong> DJ&apos;s Training-Fitness Studio Juratovic
          </p>
          <p>
            <strong>Inhaberin:</strong> Diana Juratovic
          </p>
          <p>
            <strong>Adresse:</strong> Rösslimattstrasse 2c, CH-5033 Buchs AG
          </p>
          <p>
            <strong>Telefon:</strong>{' '}
            <a href="tel:+41786112479" className="text-rose-600 hover:text-rose-700">
              +41 78 611 24 79
            </a>
          </p>
          <p>
            <strong>E-Mail:</strong>{' '}
            <a href="mailto:info@dj-training.com" className="text-rose-600 hover:text-rose-700">
              info@dj-training.com
            </a>
          </p>
          <p>
            <strong>Handelsregisternummer:</strong> CH-400.1.035.771-0
          </p>
        </div>

        <section>
          <h2 className="text-xl font-bold text-gray-900">Haftungsausschluss</h2>
          <p className="text-gray-600">
            Die Inhalte dieser Website werden mit grösster Sorgfalt erstellt. Für die Richtigkeit,
            Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900">Urheberrecht</h2>
          <p className="text-gray-600">
            Die durch den Seitenbetreiber erstellten Inhalte und Werke auf dieser Website unterliegen
            dem schweizerischen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede
            Art der Verwertung ausserhalb der Grenzen des Urheberrechts bedürfen der schriftlichen
            Zustimmung des jeweiligen Autors bzw. Erstellers.
          </p>
        </section>
      </div>
    </div>
  );
}
