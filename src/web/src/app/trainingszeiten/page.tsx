import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Trainingszeiten — Wochenplan',
  description:
    'Trainingszeiten bei DJ\u2019s Training in Buchs AG. Personal Training Mo–Fr 9–12 & 16–21 Uhr. Gruppentraining Mo & Do 18:00 & 19:15.',
};

const personalTrainingDays = [
  { tag: 'Montag', vormittag: '9:00–12:00', nachmittag: '16:00–21:00' },
  { tag: 'Dienstag', vormittag: '9:00–12:00', nachmittag: '16:00–21:00' },
  { tag: 'Mittwoch', vormittag: '9:00–12:00', nachmittag: '16:00–21:00' },
  { tag: 'Donnerstag', vormittag: '9:00–12:00', nachmittag: '16:00–21:00' },
  { tag: 'Freitag', vormittag: '9:00–12:00', nachmittag: '16:00–21:00' },
  { tag: 'Samstag', vormittag: 'Geschlossen', nachmittag: 'Geschlossen' },
  { tag: 'Sonntag', vormittag: 'Geschlossen', nachmittag: 'Geschlossen' },
];

const gruppentrainingDays = [
  { tag: 'Montag', zeit: '18:00 & 19:15' },
  { tag: 'Donnerstag', zeit: '18:00 & 19:15' },
];

export default function TrainingszeitenPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <h1 className="mb-4 text-3xl font-bold text-gray-900">Trainingszeiten</h1>
      <p className="mb-12 max-w-3xl text-lg text-gray-600">
        Hier findest du die aktuellen Trainingszeiten in meinem Studio in Buchs AG. Für Personal
        Training und Ernährungscoaching kannst du individuell Termine vereinbaren. Das
        Gruppentraining findet zu festen Zeiten statt.
      </p>

      {/* Legend */}
      <div className="mb-8 flex flex-wrap gap-6 text-sm">
        <span className="flex items-center gap-2">
          <span className="inline-block h-4 w-4 rounded bg-blue-100" /> Personal Training (nach Vereinbarung)
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block h-4 w-4 rounded bg-green-100" /> Gruppentraining (feste Zeiten)
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block h-4 w-4 rounded bg-gray-100" /> Geschlossen
        </span>
      </div>

      {/* Personal Training Schedule */}
      <section className="mb-12">
        <h2 className="mb-4 text-2xl font-bold text-gray-900">Personal Training</h2>
        <p className="mb-4 text-gray-600">
          Individuelle Termine nach Vereinbarung zu folgenden Zeiten:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-2 text-sm font-semibold text-gray-700">Tag</th>
                <th className="py-2 text-sm font-semibold text-gray-700">Vormittag</th>
                <th className="py-2 text-sm font-semibold text-gray-700">Nachmittag/Abend</th>
              </tr>
            </thead>
            <tbody>
              {personalTrainingDays.map((day, i) => {
                const isClosed = day.vormittag === 'Geschlossen';
                return (
                  <tr
                    key={day.tag}
                    className={isClosed ? 'bg-gray-50 text-gray-400' : i % 2 === 1 ? 'bg-blue-50' : ''}
                  >
                    <td className="py-2 font-medium">{day.tag}</td>
                    <td className="py-2">{day.vormittag}</td>
                    <td className="py-2">{day.nachmittag}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Gruppentraining Schedule */}
      <section className="mb-12">
        <h2 className="mb-4 text-2xl font-bold text-gray-900">Gruppentraining</h2>
        <p className="mb-4 text-gray-600">
          Feste Trainingszeiten in der Kleingruppe (max. 5 Personen):
        </p>
        <div className="overflow-x-auto">
          <table className="w-full max-w-md text-left">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-2 text-sm font-semibold text-gray-700">Tag</th>
                <th className="py-2 text-sm font-semibold text-gray-700">Zeit</th>
              </tr>
            </thead>
            <tbody>
              {gruppentrainingDays.map((day) => (
                <tr key={day.tag} className="bg-green-50">
                  <td className="py-2 font-medium text-gray-700">{day.tag}</td>
                  <td className="py-2 text-gray-700">{day.zeit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-sm text-gray-500">Dauer: 60 Minuten pro Einheit</p>
      </section>

      {/* CTA */}
      <section className="rounded-lg bg-rose-50 p-8 text-center">
        <h2 className="mb-4 text-2xl font-bold text-gray-900">Termin vereinbaren</h2>
        <p className="mb-6 text-gray-600">
          Möchtest du einen Termin buchen oder hast du Fragen zu den Trainingszeiten? Kontaktiere
          mich gerne!
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
