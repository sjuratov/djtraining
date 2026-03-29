import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AGB — Allgemeine Geschäftsbedingungen',
  description:
    'Allgemeine Geschäftsbedingungen von DJ\u2019s Training: Stornierung, Zahlungsbedingungen, Gesundheitsfragebogen und mehr.',
  robots: 'noindex, follow',
};

const sections = [
  {
    title: '1. Geltungsbereich',
    content:
      'Diese Allgemeinen Geschäftsbedingungen gelten für alle Dienstleistungen von DJ\u2019s Training-Fitness Studio Juratovic, Rösslimattstrasse 2c, CH-5033 Buchs AG.',
  },
  {
    title: '2. Terminvereinbarung und Absage',
    content:
      'Trainingseinheiten müssen mindestens 24 Stunden vor dem vereinbarten Termin abgesagt werden. Bei Absagen innerhalb von 24 Stunden oder Nichterscheinen wird die volle Trainingsgebühr berechnet.',
  },
  {
    title: '3. Gesundheitsfragebogen',
    content:
      'Vor der ersten Trainingseinheit ist ein Gesundheitsfragebogen auszufüllen. Dieser dient der Sicherheit und ermöglicht eine individuelle Trainingsplanung. Bei gesundheitlichen Einschränkungen empfehlen wir eine vorgängige ärztliche Abklärung.',
  },
  {
    title: '4. Zahlungsbedingungen',
    content:
      'Einzelstunden sind vor dem Training zu bezahlen. Abonnements (Abos) sind bei Abschluss vollständig fällig. Bezahlung per Überweisung, Twint oder Bar.',
  },
  {
    title: '5. Abonnements',
    content:
      'Abonnements sind persönlich und nicht übertragbar. Sie sind ab Kaufdatum 12 Monate gültig. Eine Verlängerung oder Rückerstattung nach Ablauf ist ausgeschlossen.',
  },
  {
    title: '6. Saubere Schuhe',
    content:
      'Im Studio sind saubere Hallenschuhe (Indoor-Schuhe) zu tragen. Strassenschuhe sind im Trainingsbereich nicht erlaubt.',
  },
  {
    title: '7. Haftung',
    content:
      'DJ\u2019s Training-Fitness Studio Juratovic haftet nicht für Schäden oder Verletzungen, die während des Trainings entstehen, sofern diese nicht auf grobe Fahrlässigkeit oder Vorsatz zurückzuführen sind. Die Teilnahme am Training erfolgt auf eigene Verantwortung.',
  },
  {
    title: '8. Hausrecht',
    content:
      'Die Trainerin behält sich das Hausrecht vor und kann Personen bei unangemessenem Verhalten vom Training ausschliessen.',
  },
  {
    title: '9. Änderungen',
    content:
      'DJ\u2019s Training behält sich das Recht vor, diese AGB jederzeit zu ändern. Die jeweils aktuelle Version ist auf dieser Website einsehbar.',
  },
  {
    title: '10. Gerichtsstand',
    content: 'Gerichtsstand ist Aarau, Schweiz. Es gilt schweizerisches Recht.',
  },
];

export default function AGBPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="mb-2 text-3xl font-bold text-gray-900">
        Allgemeine Geschäftsbedingungen (AGB)
      </h1>
      <p className="mb-8 text-sm text-gray-500">Zuletzt aktualisiert: Januar 2025</p>

      <div className="space-y-8">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="mb-2 text-lg font-bold text-gray-900">{section.title}</h2>
            <p className="leading-relaxed text-gray-600">{section.content}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
