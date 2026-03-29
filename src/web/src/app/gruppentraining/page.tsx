import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Gruppentraining in Buchs AG',
  description:
    'Gruppentraining in Kleingruppen mit max. 5 Personen. Montag und Donnerstag in Buchs AG. Kostenloses Probetraining!',
};

export default function GruppentrainingPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <h1 className="mb-4 text-3xl font-bold text-gray-900">Gruppentraining</h1>
      <p className="mb-8 max-w-3xl text-lg text-gray-600">
        Training in der Kleingruppe — motivierend, effektiv und erschwinglich. Maximal 5 Personen
        pro Gruppe garantieren persönliche Betreuung und eine familiäre Atmosphäre.
      </p>

      {/* Details */}
      <div className="mb-10 grid gap-6 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm">
          <p className="text-3xl font-bold text-rose-600">60 Minuten</p>
          <p className="mt-1 text-gray-600">pro Einheit</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm">
          <p className="text-3xl font-bold text-rose-600">Max. 5 Personen</p>
          <p className="mt-1 text-gray-600">pro Gruppe</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm">
          <p className="text-3xl font-bold text-rose-600">2× pro Woche</p>
          <p className="mt-1 text-gray-600">Montag &amp; Donnerstag</p>
        </div>
      </div>

      {/* Schedule */}
      <section className="mb-10">
        <h2 className="mb-4 text-2xl font-bold text-gray-900">Trainingszeiten</h2>
        <div className="overflow-x-auto">
          <table className="w-full max-w-md text-left">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-2 text-sm font-semibold text-gray-700">Tag</th>
                <th className="py-2 text-sm font-semibold text-gray-700">Zeit</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-2 text-gray-700">Montag</td>
                <td className="py-2 text-gray-700">18:00 &amp; 19:15</td>
              </tr>
              <tr>
                <td className="py-2 text-gray-700">Donnerstag</td>
                <td className="py-2 text-gray-700">18:00 &amp; 19:15</td>
              </tr>
            </tbody>
          </table>
        </div>
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
                <td className="py-2 text-right font-medium text-gray-900">25 CHF</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="py-2 text-gray-700">20er-Abo</td>
                <td className="py-2 text-right font-medium text-gray-900">460 CHF</td>
              </tr>
              <tr>
                <td className="py-2 text-gray-700">40er-Abo</td>
                <td className="py-2 text-right font-medium text-gray-900">800 CHF</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Free trial */}
      <section className="mb-10 rounded-lg bg-green-50 p-6 text-center">
        <h2 className="mb-2 text-xl font-bold text-gray-900">Kostenloses Probetraining</h2>
        <p className="text-gray-600">
          Probiere eine Stunde gratis aus! Überzeuge dich selbst vom Gruppentraining bei DJ&apos;s
          Training.
        </p>
      </section>

      {/* CTA */}
      <section className="rounded-lg bg-rose-50 p-8 text-center">
        <h2 className="mb-4 text-2xl font-bold text-gray-900">Jetzt anmelden</h2>
        <p className="mb-6 text-gray-600">
          Melde dich für das Gruppentraining an oder vereinbare dein kostenloses Probetraining.
        </p>
        <Link
          href="/kontakt"
          className="inline-block rounded-full bg-rose-600 px-8 py-3 text-lg font-semibold text-white transition-colors hover:bg-rose-700"
        >
          Kontakt aufnehmen
        </Link>
      </section>
    </div>
  );
}
