import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Über mich — Diana Juratovic',
  description:
    'Lerne Diana Juratovic kennen — zertifizierte Personal Trainerin und Ernährungscoach mit über 20 Jahren Erfahrung in Buchs AG.',
};

const qualifications = [
  'Zertifizierte Personal Trainerin',
  'Ernährungscoach',
  'Pilates Trainerin',
  'HIIT Spezialistin',
  'Kraft- und Ausdauertraining',
  'Vibrationstraining',
  'Gruppentraining Leitung',
  'Erste Hilfe Zertifikat',
];

export default function UeberMichPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <h1 className="mb-12 text-3xl font-bold text-gray-900">Über mich</h1>

      {/* Bio section: photo + text */}
      <div className="mb-16 grid items-start gap-8 lg:grid-cols-2">
        {/* Photo placeholder */}
        <div
          className="flex h-80 items-center justify-center rounded-lg bg-gray-200 lg:h-96"
          aria-label="Diana Juratovic — Personal Trainerin &amp; Ernährungscoach"
          role="img"
        >
          <span className="text-lg text-gray-400">Foto Diana Juratovic</span>
        </div>

        {/* Biography */}
        <div className="space-y-4 text-lg leading-relaxed text-gray-600">
          <p>
            Mein Name ist Diana Juratovic. Ich wurde in Kroatien geboren, bin verheiratet und Mutter
            von zwei Kindern. Meine Leidenschaft für Fitness und Gesundheit hat mich 2004 in England
            dazu inspiriert, meine Karriere als Personal Trainerin zu starten.
          </p>
          <p>
            Seitdem habe ich internationale Erfahrung in verschiedenen Ländern gesammelt und mich
            kontinuierlich weitergebildet. Heute bringe ich über 20 Jahre Expertise in den Bereichen
            Fitness, Ernährung und Wohlbefinden mit.
          </p>
          <p>
            In meinem privaten Studio in Buchs AG biete ich dir ein persönliches und professionelles
            Trainingsumfeld — weg von überfüllten Fitnessstudios, hin zu individueller Betreuung und
            echten Ergebnissen.
          </p>
          <p>
            Mein Ziel ist es, dich auf deinem ganz persönlichen Weg zu mehr Gesundheit, Fitness und
            Wohlbefinden zu begleiten — mit einem ganzheitlichen Ansatz, der auf deine Bedürfnisse
            zugeschnitten ist.
          </p>
        </div>
      </div>

      {/* Qualifications */}
      <section className="mb-16">
        <h2 className="mb-8 text-2xl font-bold text-gray-900">Meine Qualifikationen</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {qualifications.map((q) => (
            <li key={q} className="flex items-center gap-3 text-gray-700">
              <span className="text-rose-600">✓</span>
              {q}
            </li>
          ))}
        </ul>
      </section>

      {/* Studio */}
      <section className="mb-16">
        <h2 className="mb-4 text-2xl font-bold text-gray-900">Mein Studio</h2>
        <p className="max-w-3xl text-lg leading-relaxed text-gray-600">
          Mein privates Trainingsstudio befindet sich an der Rösslimattstrasse 2c in Buchs AG. Hier
          trainierst du in einer ruhigen, persönlichen Atmosphäre — ohne Wartezeiten, ohne Ablenkung
          und mit meiner vollen Aufmerksamkeit.
        </p>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-gray-600">
          Das Studio ist ausgestattet mit modernen Trainingsgeräten, einer Vibrationsplatte und
          allem, was du für ein effektives Training brauchst.
        </p>
      </section>

      {/* CTA */}
      <section className="rounded-lg bg-rose-50 p-8 text-center">
        <h2 className="mb-4 text-2xl font-bold text-gray-900">Bereit für dein erstes Training?</h2>
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
