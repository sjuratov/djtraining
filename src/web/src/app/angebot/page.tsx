import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Angebot — Personal Training, Gruppentraining & Ernährungscoaching',
  description:
    'Entdecke das Angebot von DJ\u2019s Training in Buchs AG: Personal Training, Gruppentraining und Ernährungscoaching.',
};

const services = [
  {
    title: 'Personal Training',
    description:
      'Individuelles Training, HIIT und Vibrationstraining — massgeschneidert auf deine Ziele und dein Fitnesslevel.',
    href: '/personal-training',
    icon: '💪',
  },
  {
    title: 'Gruppentraining',
    description:
      'Training in Kleingruppen mit maximal 5 Personen — motivierend, effektiv und zu fairen Preisen.',
    href: '/gruppentraining',
    icon: '👥',
  },
  {
    title: 'Ernährungscoaching',
    description:
      'Ganzheitliche Ernährungsberatung ohne strenge Diäten — für nachhaltige Gewohnheiten und mehr Wohlbefinden.',
    href: '/ernaehrungscoaching',
    icon: '🥗',
  },
];

export default function AngebotPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <h1 className="mb-4 text-3xl font-bold text-gray-900">Mein Angebot</h1>
      <p className="mb-12 max-w-3xl text-lg text-gray-600">
        Ob Personal Training, Gruppentraining oder Ernährungscoaching — bei DJ&apos;s Training
        findest du das passende Angebot für deine Ziele. Alle Trainings finden in meinem privaten
        Studio in Buchs AG statt.
      </p>

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <Link
            key={service.href}
            href={service.href}
            className="group rounded-lg bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="mb-4 text-4xl">{service.icon}</div>
            <h2 className="mb-2 text-xl font-bold text-gray-900">{service.title}</h2>
            <p className="mb-4 text-gray-600">{service.description}</p>
            <span className="font-semibold text-rose-600 group-hover:text-rose-700">
              Mehr erfahren →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
