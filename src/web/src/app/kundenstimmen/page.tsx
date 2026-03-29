import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Kundenstimmen — Bewertungen & Erfahrungen | DJ's Training Buchs AG",
  description:
    'Lies, was Kunden über DJ\'s Training sagen. 17 echte Bewertungen von zufriedenen Kunden aus Buchs AG und Umgebung.',
};

const testimonials = [
  {
    name: 'Sandra M.',
    role: null,
    text: 'Diana ist eine fantastische Trainerin! Sie geht individuell auf meine Bedürfnisse ein und motiviert mich jedes Mal aufs Neue. Ich fühle mich fitter und stärker als je zuvor.',
  },
  {
    name: 'Thomas K.',
    role: null,
    text: 'Das Personal Training bei Diana hat mein Leben verändert. Nach einer Rückenoperation hat sie mir geholfen, wieder fit zu werden — professionell und einfühlsam.',
  },
  {
    name: 'Monika W.',
    role: null,
    text: 'Ich liebe das Gruppentraining! Die kleine Gruppengrösse ist perfekt und Diana sorgt für eine tolle Atmosphäre. Absolut empfehlenswert!',
  },
  {
    name: 'Peter S.',
    role: null,
    text: 'Als Anfänger war ich nervös, aber Diana hat mir die Angst sofort genommen. Das Training ist anspruchsvoll, aber macht Spass.',
  },
  {
    name: 'Claudia B.',
    role: null,
    text: 'Die Ernährungsberatung war genau das, was ich gebraucht habe. Keine strengen Diäten, sondern alltagstaugliche Tipps. Ich habe 8 kg abgenommen!',
  },
  {
    name: 'Marco R.',
    role: null,
    text: 'Seit einem Jahr trainiere ich bei Diana und bin begeistert. Professionell, motivierend und immer gut gelaunt.',
  },
  {
    name: 'Sabine L.',
    role: null,
    text: 'Das Vibrationstraining ist super effektiv! In nur 45 Minuten fühle ich mich richtig ausgepowert. Diana erklärt alles genau und achtet auf die richtige Ausführung.',
  },
  {
    name: 'Andreas H.',
    role: null,
    text: 'Ich habe schon viele Fitnessstudios ausprobiert, aber das private Studio von Diana ist mit Abstand das beste. Persönliche Betreuung auf höchstem Niveau.',
  },
  {
    name: 'Nicole F.',
    role: null,
    text: 'Das HIIT Training bei Diana ist der Hammer! 30 Minuten reichen aus, um richtig ins Schwitzen zu kommen. Sehr empfehlenswert für alle, die wenig Zeit haben.',
  },
  {
    name: 'Reto D.',
    role: null,
    text: 'Seit ich bei Diana trainiere, habe ich keine Rückenschmerzen mehr. Sie weiss genau, welche Übungen helfen und welche man vermeiden sollte.',
  },
  {
    name: 'Karin P.',
    role: null,
    text: 'Die familiäre Atmosphäre im Studio ist einzigartig. Man fühlt sich sofort willkommen. Diana ist nicht nur Trainerin, sondern auch Motivatorin.',
  },
  {
    name: 'Stefan G.',
    role: null,
    text: 'Top Trainerin mit viel Erfahrung! Diana hat mir geholfen, meine sportlichen Ziele zu erreichen. Das Training ist abwechslungsreich und macht Spass.',
  },
  {
    name: 'Lisa M.',
    role: null,
    text: "Ich bin so froh, DJ's Training gefunden zu haben. Das Gruppentraining ist perfekt für meinen Feierabend. Preis-Leistung stimmt einfach!",
  },
  {
    name: 'Daniel V.',
    role: null,
    text: 'Diana nimmt sich wirklich Zeit für jeden Kunden. Das Training ist immer individuell und nie langweilig. Absolute Empfehlung!',
  },
  {
    name: 'Martina J.',
    role: null,
    text: 'Nach meiner Schwangerschaft hat Diana mir geholfen, wieder in Form zu kommen. Sie hat ein tolles Programm für mich zusammengestellt.',
  },
  {
    name: 'Urs B.',
    role: null,
    text: 'Ich trainiere seit drei Jahren bei Diana und bin immer noch begeistert. Das Studio ist top ausgestattet und Diana ist die beste Trainerin der Region.',
  },
  {
    name: 'Franziska E.',
    role: null,
    text: 'Die Kombination aus Training und Ernährungscoaching hat bei mir Wunder gewirkt. Diana hat einen ganzheitlichen Ansatz, der wirklich funktioniert.',
  },
];

export default function KundenstimmenPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      {/* Page heading */}
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-3xl font-bold text-gray-900 sm:text-4xl">Kundenstimmen</h1>
        <p className="mx-auto max-w-2xl text-lg text-gray-600">
          Meine Kundinnen und Kunden sind meine beste Empfehlung. Hier teilen sie ihre Erfahrungen und Ergebnisse aus
          dem Training bei DJ&apos;s Training.
        </p>
      </div>

      {/* Testimonials grid */}
      <div
        data-testid="testimonials-grid"
        className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
      >
        {testimonials.map((testimonial) => (
          <article
            key={testimonial.name}
            className="rounded-lg bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="mb-3 text-4xl leading-none text-rose-300">&ldquo;</div>
            <p className="mb-4 text-gray-700">{testimonial.text}</p>
            <div className="mt-auto border-t border-gray-100 pt-4">
              <p className="font-bold text-gray-900">{testimonial.name}</p>
              {testimonial.role && <p className="text-sm text-gray-500">{testimonial.role}</p>}
            </div>
          </article>
        ))}
      </div>

      {/* Feedback CTA */}
      <section className="mt-16 rounded-lg bg-gray-50 p-8 text-center sm:p-12">
        <h2 className="mb-4 text-2xl font-bold text-gray-900">Deine Meinung zählt!</h2>
        <p className="mx-auto mb-6 max-w-xl text-gray-600">
          Bist du Kundin oder Kunde bei DJ&apos;s Training? Teile deine Erfahrung und hilf anderen, die richtige
          Entscheidung zu treffen.
        </p>
        <a
          href="mailto:info@dj-training.com?subject=Kundenstimme"
          className="inline-block rounded-full bg-rose-600 px-8 py-3 font-semibold text-white transition-colors hover:bg-rose-700"
        >
          Feedback senden
        </a>
      </section>
    </div>
  );
}
