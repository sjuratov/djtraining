import Link from 'next/link';

const services = [
  {
    title: 'Personal Training',
    description: 'Individuelles Training, HIIT und Vibrationstraining — massgeschneidert auf deine Ziele und dein Fitnesslevel.',
    href: '/personal-training',
    icon: '💪',
  },
  {
    title: 'Gruppentraining',
    description: 'Training in Kleingruppen mit maximal 5 Personen — motivierend, effektiv und zu fairen Preisen.',
    href: '/gruppentraining',
    icon: '👥',
  },
  {
    title: 'Ernährungscoaching',
    description: 'Ganzheitliche Ernährungsberatung ohne strenge Diäten — für nachhaltige Gewohnheiten und mehr Wohlbefinden.',
    href: '/ernaehrungscoaching',
    icon: '🥗',
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative flex min-h-[60vh] items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-rose-900 px-4 text-center text-white">
        <div className="max-w-3xl">
          <h1 className="mb-6 text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
            Starte mit mir deine persönliche Reise zu mehr Gesundheit, Fitness &amp; Wohlbefinden
          </h1>
          <Link
            href="/kontakt"
            className="inline-block rounded-full bg-rose-600 px-8 py-3 text-lg font-semibold text-white transition-colors hover:bg-rose-700"
          >
            Kostenloses Probetraining
          </Link>
        </div>
      </section>

      {/* Über mich Teaser */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="grid items-center gap-8 lg:grid-cols-2">
          <div className="flex h-64 items-center justify-center rounded-lg bg-gray-200 text-gray-500 lg:h-80">
            Foto Diana Juratovic
          </div>
          <div>
            <h2 className="mb-4 text-2xl font-bold text-gray-900 sm:text-3xl">Über mich</h2>
            <p className="mb-6 text-lg leading-relaxed text-gray-600">
              Ich bin Diana Juratovic, zertifizierte Personal Trainerin und Ernährungscoach mit über 20 Jahren
              Erfahrung. In meinem privaten Studio in Buchs AG begleite ich dich auf deinem Weg zu mehr Gesundheit,
              Fitness und Wohlbefinden — individuell und persönlich.
            </p>
            <Link href="/ueber-mich" className="font-semibold text-rose-600 hover:text-rose-700">
              Mehr erfahren →
            </Link>
          </div>
        </div>
      </section>

      {/* Mein Angebot */}
      <section className="bg-gray-50 px-4 py-16 sm:px-6 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-12 text-center text-2xl font-bold text-gray-900 sm:text-3xl">Mein Angebot</h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <Link
                key={service.href}
                href={service.href}
                className="group rounded-lg bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-4 text-4xl">{service.icon}</div>
                <h3 className="mb-2 text-xl font-bold text-gray-900">{service.title}</h3>
                <p className="mb-4 text-gray-600">{service.description}</p>
                <span className="font-semibold text-rose-600 group-hover:text-rose-700">Mehr erfahren →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
