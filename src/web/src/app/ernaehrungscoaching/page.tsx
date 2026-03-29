import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Ernährungscoaching in Buchs AG',
  description:
    'Ganzheitliche Ernährungsberatung ohne Diäten. Kostenloses Erstgespräch in Buchs AG mit Diana Juratovic.',
};

export default function ErnaehrungscoachingPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <h1 className="mb-4 text-3xl font-bold text-gray-900">Ernährungscoaching</h1>
      <p className="mb-8 max-w-3xl text-lg text-gray-600">
        Ganzheitliche Ernährungsberatung ohne strenge Diäten. Ich unterstütze dich dabei, nachhaltige
        Essgewohnheiten zu entwickeln, die zu deinem Alltag passen — für mehr Energie, Gesundheit
        und Wohlbefinden.
      </p>

      {/* Free consultation highlight */}
      <section className="mb-10 rounded-lg bg-green-50 p-6 text-center">
        <h2 className="mb-2 text-xl font-bold text-gray-900">Kostenloses Erstgespräch</h2>
        <p className="text-gray-600">
          Das Erstgespräch (60 Minuten) ist <strong>kostenlos</strong> und unverbindlich. Dabei
          lernen wir uns kennen und besprechen deine Ziele und Wünsche.
        </p>
      </section>

      {/* Pricing */}
      <section className="mb-10">
        <h2 className="mb-4 text-2xl font-bold text-gray-900">Preise</h2>
        <div className="overflow-x-auto">
          <table className="w-full max-w-md text-left">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-2 text-sm font-semibold text-gray-700">Paket</th>
                <th className="py-2 text-right text-sm font-semibold text-gray-700">Preis (CHF)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-2 text-gray-700">Einzelstunde</td>
                <td className="py-2 text-right font-medium text-gray-900">100 CHF</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="py-2 text-gray-700">5er-Abo</td>
                <td className="py-2 text-right font-medium text-gray-900">450 CHF</td>
              </tr>
              <tr>
                <td className="py-2 text-gray-700">10er-Abo</td>
                <td className="py-2 text-right font-medium text-gray-900">900 CHF</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-lg bg-rose-50 p-8 text-center">
        <h2 className="mb-4 text-2xl font-bold text-gray-900">
          Jetzt kostenloses Erstgespräch vereinbaren
        </h2>
        <p className="mb-6 text-gray-600">
          Nimm Kontakt auf und starte deine Reise zu einer gesünderen Ernährung.
        </p>
        <Link
          href="/kontakt"
          className="inline-block rounded-full bg-rose-600 px-8 py-3 text-lg font-semibold text-white transition-colors hover:bg-rose-700"
        >
          Erstgespräch anfragen
        </Link>
      </section>
    </div>
  );
}
