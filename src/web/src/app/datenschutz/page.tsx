import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Datenschutz — Datenschutzerklärung',
  description:
    'Datenschutzerklärung von DJ\u2019s Training: Informationen zur Erhebung, Speicherung und Nutzung personenbezogener Daten.',
  robots: 'noindex, follow',
};

export default function DatenschutzPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="mb-2 text-3xl font-bold text-gray-900">Datenschutzerklärung</h1>
      <p className="mb-8 text-sm text-gray-500">Zuletzt aktualisiert: Januar 2025</p>

      <div className="space-y-8 leading-relaxed text-gray-600">
        <section>
          <h2 className="mb-2 text-lg font-bold text-gray-900">1. Allgemeines</h2>
          <p>
            Der Schutz deiner persönlichen Daten ist uns wichtig. Diese Datenschutzerklärung
            informiert dich über die Art, den Umfang und den Zweck der Erhebung und Verwendung
            personenbezogener Daten durch DJ&apos;s Training-Fitness Studio Juratovic.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold text-gray-900">2. Verantwortliche Stelle</h2>
          <p>
            DJ&apos;s Training-Fitness Studio Juratovic
            <br />
            Diana Juratovic
            <br />
            Rösslimattstrasse 2c
            <br />
            CH-5033 Buchs AG
            <br />
            E-Mail: info@dj-training.com
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold text-gray-900">3. Erhobene Daten</h2>
          <p className="mb-2">
            Wir erheben und verarbeiten folgende personenbezogene Daten:
          </p>
          <ul className="list-inside list-disc space-y-1">
            <li>Name, E-Mail-Adresse, Telefonnummer (bei Kontaktaufnahme)</li>
            <li>Gesundheitsdaten (im Rahmen des Gesundheitsfragebogens)</li>
            <li>Nutzungsdaten (bei Registrierung auf der Website)</li>
            <li>Technische Daten (IP-Adresse, Browser, Zugriffszeit)</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold text-gray-900">4. Zweck der Datenverarbeitung</h2>
          <p className="mb-2">
            Die erhobenen Daten werden ausschliesslich verwendet für:
          </p>
          <ul className="list-inside list-disc space-y-1">
            <li>Bearbeitung von Anfragen und Terminvereinbarungen</li>
            <li>Durchführung und Planung des Trainings</li>
            <li>Kommunikation mit Kunden</li>
            <li>Verbesserung unserer Website und Dienstleistungen</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold text-gray-900">5. Datenweitergabe</h2>
          <p>
            Personenbezogene Daten werden nicht an Dritte weitergegeben, es sei denn, dies ist zur
            Vertragserfüllung erforderlich oder gesetzlich vorgeschrieben.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold text-gray-900">6. Datensicherheit</h2>
          <p>
            Wir treffen angemessene technische und organisatorische Massnahmen zum Schutz deiner
            personenbezogenen Daten gegen unbefugten Zugriff, Verlust, Zerstörung oder Veränderung.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold text-gray-900">7. Cookies</h2>
          <p>
            Diese Website verwendet technisch notwendige Cookies. Für Analyse- oder Marketing-Cookies
            holen wir deine Einwilligung ein. Du kannst Cookies in deinen Browsereinstellungen
            jederzeit deaktivieren.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold text-gray-900">8. Deine Rechte</h2>
          <p className="mb-2">
            Gemäss dem Bundesgesetz über den Datenschutz (DSG) hast du folgende Rechte:
          </p>
          <ul className="list-inside list-disc space-y-1">
            <li>Recht auf Auskunft über deine gespeicherten Daten</li>
            <li>Recht auf Berichtigung unrichtiger Daten</li>
            <li>Recht auf Löschung deiner Daten</li>
            <li>Recht auf Einschränkung der Datenverarbeitung</li>
            <li>Recht auf Datenportabilität</li>
          </ul>
          <p className="mt-2">
            Zur Ausübung deiner Rechte kontaktiere uns unter info@dj-training.com.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold text-gray-900">9. Änderungen</h2>
          <p>
            Wir behalten uns vor, diese Datenschutzerklärung jederzeit zu aktualisieren. Die aktuelle
            Version ist auf dieser Website verfügbar.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold text-gray-900">10. Anwendbares Recht</h2>
          <p>
            Es gilt schweizerisches Recht, insbesondere das Bundesgesetz über den Datenschutz (DSG).
          </p>
        </section>
      </div>
    </div>
  );
}
