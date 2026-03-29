import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-900 text-gray-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* Business Info */}
          <div>
            <h3 className="mb-3 text-lg font-semibold text-white">DJ&apos;s Training</h3>
            <p className="text-sm leading-relaxed">
              DJ&apos;s Training-Fitness Studio Juratovic
              <br />
              Rösslimattstrasse 2c
              <br />
              CH-5033 Buchs AG
            </p>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="mb-3 text-lg font-semibold text-white">Kontakt</h3>
            <p className="text-sm leading-relaxed">
              Tel:{' '}
              <a href="tel:+41786112479" className="hover:text-white transition-colors">
                +41 78 611 24 79
              </a>
              <br />
              E-Mail:{' '}
              <a href="mailto:info@dj-training.com" className="hover:text-white transition-colors">
                info@dj-training.com
              </a>
            </p>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="mb-3 text-lg font-semibold text-white">Rechtliches</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/impressum" className="hover:text-white transition-colors">
                  Impressum
                </Link>
              </li>
              <li>
                <Link href="/agb" className="hover:text-white transition-colors">
                  AGB
                </Link>
              </li>
              <li>
                <Link href="/datenschutz" className="hover:text-white transition-colors">
                  Datenschutz
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-700 pt-6 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} DJ&apos;s Training</p>
        </div>
      </div>
    </footer>
  );
}
