'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Über mich', href: '/ueber-mich' },
  {
    label: 'Angebot',
    href: '/angebot',
    children: [
      { label: 'Personal Training', href: '/personal-training' },
      { label: 'Gruppentraining', href: '/gruppentraining' },
      { label: 'Ernährungscoaching', href: '/ernaehrungscoaching' },
    ],
  },
  { label: 'Trainingszeiten', href: '/trainingszeiten' },
  { label: 'Kundenstimmen', href: '/kundenstimmen' },
  { label: 'Kontakt', href: '/kontakt' },
];

interface AuthUser {
  email: string;
  displayName: string;
  role: string;
}

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [angebotOpen, setAngebotOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        if (data) setUser(data);
      })
      .catch(() => setUser(null));
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
    router.push('/login');
  }

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="text-xl font-bold text-gray-900">
          DJ&apos;s Training
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Hauptnavigation">
          {navLinks.map((link) =>
            link.children ? (
              <div
                key={link.href}
                className="relative"
                onMouseEnter={() => setAngebotOpen(true)}
                onMouseLeave={() => setAngebotOpen(false)}
              >
                <Link
                  href={link.href}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100 ${
                    isActive(link.href) || link.children.some((c) => isActive(c.href))
                      ? 'text-rose-600'
                      : 'text-gray-700'
                  }`}
                >
                  {link.label}
                </Link>
                {angebotOpen && (
                  <div className="absolute left-0 top-full z-50 mt-0 w-56 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
                    {link.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`block px-4 py-2 text-sm transition-colors hover:bg-gray-50 ${
                          isActive(child.href) ? 'text-rose-600 font-medium' : 'text-gray-700'
                        }`}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100 ${
                  isActive(link.href) ? 'text-rose-600' : 'text-gray-700'
                }`}
              >
                {link.label}
              </Link>
            )
          )}

          {/* Auth section */}
          {user ? (
            <div className="relative ml-2" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
                aria-expanded={userMenuOpen}
                data-testid="user-menu-button"
              >
                {user.displayName || user.email}
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
                  {user.role === 'admin' ? (
                    <>
                      <Link
                        href="/admin/kalender"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Kalender
                      </Link>
                      <Link
                        href="/admin/einstellungen"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Einstellungen
                      </Link>
                      <Link
                        href="/admin"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Benutzerverwaltung
                      </Link>
                    </>
                  ) : (
                    <Link
                      href="/meine-termine"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Meine Termine
                    </Link>
                  )}
                  <Link
                    href="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    Mein Profil
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Abmelden
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className={`ml-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100 ${
                isActive('/login') ? 'text-rose-600' : 'text-gray-700'
              }`}
            >
              Anmelden
            </Link>
          )}
        </nav>

        {/* Mobile Hamburger Button */}
        <button
          className="inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:bg-gray-100 md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-expanded={mobileMenuOpen}
          aria-label={mobileMenuOpen ? 'Menü schliessen' : 'Menü öffnen'}
        >
          {mobileMenuOpen ? (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <nav className="border-t border-gray-200 bg-white px-4 pb-4 pt-2 md:hidden" aria-label="Mobile Navigation">
          {navLinks.map((link) => (
            <div key={link.href}>
              <Link
                href={link.href}
                className={`block rounded-md px-3 py-2 text-base font-medium transition-colors hover:bg-gray-50 ${
                  isActive(link.href) ? 'text-rose-600' : 'text-gray-700'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
              {link.children?.map((child) => (
                <Link
                  key={child.href}
                  href={child.href}
                  className={`block rounded-md py-2 pl-8 pr-3 text-sm transition-colors hover:bg-gray-50 ${
                    isActive(child.href) ? 'text-rose-600 font-medium' : 'text-gray-500'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {child.label}
                </Link>
              ))}
            </div>
          ))}

          {/* Mobile auth links */}
          <div className="mt-2 border-t border-gray-200 pt-2">
            {user ? (
              <>
                {user.role === 'admin' ? (
                  <>
                    <Link
                      href="/admin/kalender"
                      className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Kalender
                    </Link>
                    <Link
                      href="/admin/einstellungen"
                      className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Einstellungen
                    </Link>
                    <Link
                      href="/admin"
                      className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Benutzerverwaltung
                    </Link>
                  </>
                ) : (
                  <Link
                    href="/meine-termine"
                    className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Meine Termine
                  </Link>
                )}
                <Link
                  href="/profile"
                  className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Mein Profil
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full rounded-md px-3 py-2 text-left text-base font-medium text-gray-700 hover:bg-gray-50"
                >
                  Abmelden
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                Anmelden
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
