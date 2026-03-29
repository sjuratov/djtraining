import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Personal Training in Buchs AG',
  description:
    'Individuelles Training, HIIT und Vibrationstraining in Buchs AG. Massgeschneidert auf deine Ziele mit Diana Juratovic.',
};

interface PricingRow {
  paket: string;
  preis: string;
}

function PricingTable({ title, duration, description, rows }: {
  title: string;
  duration: string;
  description: string;
  rows: PricingRow[];
}) {
  return (
    <div className="mb-10 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-1 text-xl font-bold text-gray-900">{title}</h2>
      <p className="mb-1 text-sm font-medium text-rose-600">{duration}</p>
      <p className="mb-4 text-gray-600">{description}</p>
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="py-2 text-sm font-semibold text-gray-700">Paket</th>
            <th className="py-2 text-right text-sm font-semibold text-gray-700">Preis (CHF)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.paket} className={i % 2 === 1 ? 'bg-gray-50' : ''}>
              <td className="py-2 text-gray-700">{row.paket}</td>
              <td className="py-2 text-right font-medium text-gray-900">{row.preis}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function PersonalTrainingPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <h1 className="mb-4 text-3xl font-bold text-gray-900">Personal Training</h1>
      <p className="mb-4 max-w-3xl text-lg text-gray-600">
        Dein individuelles Training — massgeschneidert auf deine Ziele, dein Fitnesslevel und deine
        Bedürfnisse. Ob Muskelaufbau, Fettabbau, Rehabilitation oder allgemeine Fitness — ich
        begleite dich persönlich auf deinem Weg.
      </p>
      <p className="mb-12 text-gray-600">
        <strong>Trainingszeiten:</strong> Montag bis Freitag, 9:00–12:00 &amp; 16:00–21:00 |{' '}
        <Link href="/trainingszeiten" className="text-rose-600 hover:text-rose-700">
          Alle Trainingszeiten →
        </Link>
      </p>

      <div className="grid gap-6 lg:grid-cols-3">
        <PricingTable
          title="Individuelles Training"
          duration="60 Minuten"
          description="Persönliches 1:1 Training, komplett auf dich abgestimmt."
          rows={[
            { paket: 'Einzelstunde', preis: '100 CHF' },
            { paket: '20er-Abo', preis: "1\u2019900 CHF" },
            { paket: '40er-Abo', preis: "3\u2019600 CHF" },
          ]}
        />
        <PricingTable
          title="HIIT Training"
          duration="30 Minuten"
          description="Hochintensives Intervalltraining für maximale Ergebnisse in kurzer Zeit."
          rows={[
            { paket: 'Einzelstunde', preis: '50 CHF' },
            { paket: '20er-Abo', preis: '960 CHF' },
            { paket: '40er-Abo', preis: "1\u2019800 CHF" },
          ]}
        />
        <PricingTable
          title="Vibrationstraining"
          duration="45 Minuten"
          description="Training auf der Vibrationsplatte — effektiv für Muskelaufbau, Balance und Durchblutung."
          rows={[
            { paket: 'Einzelstunde', preis: '80 CHF' },
            { paket: '20er-Abo', preis: "1\u2019440 CHF" },
            { paket: '40er-Abo', preis: "2\u2019560 CHF" },
          ]}
        />
      </div>

      {/* Pair training note */}
      <div className="mt-8 rounded-lg bg-gray-50 p-6">
        <p className="text-gray-700">
          <strong>Zu zweit trainieren:</strong> Paartraining ist zu höheren Konditionen möglich.
          Kontaktiere mich für ein individuelles Angebot.
        </p>
      </div>

      {/* CTA */}
      <section className="mt-12 rounded-lg bg-rose-50 p-8 text-center">
        <h2 className="mb-4 text-2xl font-bold text-gray-900">Bereit loszulegen?</h2>
        <p className="mb-6 text-gray-600">
          Vereinbare jetzt dein kostenloses Probetraining und erlebe Personal Training in Buchs AG.
        </p>
        <Link
          href="/kontakt"
          className="inline-block rounded-full bg-rose-600 px-8 py-3 text-lg font-semibold text-white transition-colors hover:bg-rose-700"
        >
          Probetraining vereinbaren
        </Link>
      </section>
    </div>
  );
}
