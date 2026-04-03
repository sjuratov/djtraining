'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Booking {
  id: string;
  userId: string;
  timeSlotId: string;
  status: 'confirmed' | 'cancelled' | 'completed' | 'no-show';
  slotDate?: string;
  slotStartTime?: string;
  slotEndTime?: string;
  trainingTypeName?: string;
  trainingTypeCategory?: string;
  notes: string | null;
  createdAt: string;
}

interface ClientPackage {
  id: string;
  packageName?: string;
  trainingCategory?: string;
  totalSessions: number;
  remainingSessions: number;
  expiresAt: string | null;
  effectiveExpiresAt: string | null;
  graceUntil: string | null;
  isExpiringSoon: boolean;
  daysUntilExpiry: number | null;
  status: 'active' | 'expired' | 'depleted';
}

function formatPackageNotice(pkg: Pick<ClientPackage, 'isExpiringSoon' | 'daysUntilExpiry'>): string | null {
  if (!pkg.isExpiringSoon || pkg.daysUntilExpiry === null) {
    return null;
  }

  if (pkg.daysUntilExpiry <= 0) {
    return 'Dein Paket läuft heute ab.';
  }

  if (pkg.daysUntilExpiry === 1) {
    return 'Dein Paket läuft morgen ab.';
  }

  return `Dein Paket läuft in ${pkg.daysUntilExpiry} Tagen ab.`;
}

function isWithin24Hours(slotDate: string, slotStartTime: string): boolean {
  const slotDateTime = new Date(`${slotDate}T${slotStartTime}`);
  const hoursUntil = (slotDateTime.getTime() - Date.now()) / (1000 * 60 * 60);
  return hoursUntil >= 0 && hoursUntil < 24;
}

function formatBookingDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('de-CH', {
    weekday: 'short',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatTime(time: string): string {
  return time.slice(0, 5);
}

function MeineTermineContent() {
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [packages, setPackages] = useState<ClientPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [pastExpanded, setPastExpanded] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const showSuccess = useCallback((msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 5000);
  }, []);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(false);

    const authReq = fetch('/api/auth/me').then((res) => {
      if (res.status === 401) {
        router.push('/login');
        return null;
      }
      if (!res.ok) throw new Error('Auth failed');
      return res.json();
    });

    const upcomingReq = fetch('/api/bookings?upcoming=true').then((res) => {
      if (!res.ok) throw new Error('Failed to load bookings');
      return res.json();
    });

    const allReq = fetch('/api/bookings').then((res) => {
      if (!res.ok) throw new Error('Failed to load bookings');
      return res.json();
    });

    const packagesReq = fetch('/api/packages').then((res) => {
      if (!res.ok) throw new Error('Failed to load packages');
      return res.json();
    });

    Promise.all([authReq, upcomingReq, allReq, packagesReq])
      .then(([authData, upcoming, all, pkgs]) => {
        if (!authData) return;
        const confirmedUpcoming = (upcoming as Booking[]).filter((b) => b.status === 'confirmed');
        setUpcomingBookings(confirmedUpcoming);
        setAllBookings(all as Booking[]);
        setPackages(pkgs as ClientPackage[]);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (searchParams.get('booked') === 'true') {
      showSuccess('Dein Termin wurde erfolgreich gebucht!');
      window.history.replaceState(null, '', '/meine-termine');
    }
  }, [searchParams, showSuccess]);

  async function handleCancel() {
    if (!cancelTarget) return;
    setCancelLoading(true);
    try {
      const res = await fetch(`/api/bookings/${cancelTarget.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? 'Stornierung fehlgeschlagen');
      }
      setCancelTarget(null);
      showSuccess('Termin erfolgreich storniert');
      fetchData();
    } catch {
      setCancelTarget(null);
    } finally {
      setCancelLoading(false);
    }
  }

  async function handleReschedule(booking: Booking) {
    try {
      await fetch(`/api/bookings/${booking.id}`, { method: 'DELETE' });
    } catch {
      // continue to buchen page regardless
    }
    router.push('/buchen');
  }

  const today = new Date().toISOString().split('T')[0];
  const pastBookings = allBookings.filter(
    (b) => b.slotDate && b.slotDate < today && b.status !== 'confirmed',
  );
  const activePackages = packages.filter((p) => p.status === 'active');

  if (loading) {
    return (
      <main className="flex min-h-[80vh] items-center justify-center">
        <p className="text-gray-600">Termine werden geladen…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-[80vh] flex-col items-center justify-center gap-4">
        <p className="text-red-600">Termine konnten nicht geladen werden.</p>
        <button
          onClick={fetchData}
          className="rounded bg-rose-600 px-4 py-2 font-medium text-white hover:bg-rose-700"
        >
          Erneut versuchen
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <h1 data-testid="meine-termine-heading" className="text-3xl font-bold text-gray-900">
        Meine Termine
      </h1>

      {successMessage && (
        <div className="mt-4 rounded-md bg-green-50 p-4 text-green-800">{successMessage}</div>
      )}

      {/* Package Balance */}
      <div data-testid="package-balance" className="mt-8">
        {activePackages.length > 0 ? (
          <div className="space-y-3">
            {activePackages.map((pkg) => (
              <div
                key={pkg.id}
                className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
              >
                <p className="font-semibold text-gray-900">
                  {pkg.packageName ?? 'Paket'}
                </p>
                <p className="text-sm text-gray-600">
                  {pkg.remainingSessions} von {pkg.totalSessions} Sitzungen verbleibend
                </p>
                {pkg.expiresAt && (
                  <p className="text-xs text-gray-400">
                    Ursprünglich gültig bis{' '}
                    {new Date(pkg.expiresAt).toLocaleDateString('de-CH', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                )}
                {pkg.graceUntil && (
                  <p className="text-xs font-medium text-blue-700">
                    Verlängert / Kulanz bis{' '}
                    {new Date(pkg.graceUntil).toLocaleDateString('de-CH', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                )}
                {formatPackageNotice(pkg) && (
                  <div className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    {formatPackageNotice(pkg)}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">Kein aktives Paket</p>
        )}
      </div>

      {/* Upcoming Bookings */}
      <section data-testid="upcoming-bookings" className="mt-10">
        <h2 className="text-xl font-semibold text-gray-900">Kommende Termine</h2>
        {upcomingBookings.length === 0 ? (
          <p className="mt-4 text-gray-500">
            Du hast keine anstehenden Termine. Buche jetzt deinen nächsten Termin!
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {upcomingBookings.map((booking) => (
              <div
                key={booking.id}
                data-testid="booking-card"
                className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
              >
                <p className="font-medium text-gray-900">
                  {booking.slotDate ? formatBookingDate(booking.slotDate) : '—'}
                  {booking.slotStartTime && booking.slotEndTime && (
                    <span className="ml-2 text-gray-500">
                      · {formatTime(booking.slotStartTime)}–{formatTime(booking.slotEndTime)}
                    </span>
                  )}
                </p>
                <p className="text-sm text-gray-600">{booking.trainingTypeName ?? '—'}</p>
                <div className="mt-3 flex gap-2">
                  <button
                    data-testid="cancel-button"
                    onClick={() => setCancelTarget(booking)}
                    className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Stornieren
                  </button>
                  <button
                    data-testid="reschedule-button"
                    onClick={() => handleReschedule(booking)}
                    className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Umbuchen
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6">
          <Link
            href="/buchen"
            data-testid="new-booking-link"
            className="inline-block rounded bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
          >
            Neuen Termin buchen →
          </Link>
        </div>
      </section>

      {/* Past Bookings */}
      {pastBookings.length > 0 && (
        <section data-testid="past-bookings" className="mt-10">
          <button
            onClick={() => setPastExpanded(!pastExpanded)}
            className="flex items-center gap-2 text-lg font-semibold text-gray-700 hover:text-gray-900"
          >
            <span className={`inline-block transition-transform ${pastExpanded ? 'rotate-90' : ''}`}>
              ▸
            </span>
            Vergangene Termine ({pastBookings.length})
          </button>
          {pastExpanded && (
            <div className="mt-4 space-y-3">
              {pastBookings.map((booking) => (
                <div
                  key={booking.id}
                  data-testid="booking-card"
                  className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
                >
                  <p className="font-medium text-gray-900">
                    {booking.slotDate ? formatBookingDate(booking.slotDate) : '—'}
                    {booking.slotStartTime && booking.slotEndTime && (
                      <span className="ml-2 text-gray-500">
                        · {formatTime(booking.slotStartTime)}–{formatTime(booking.slotEndTime)}
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-gray-600">{booking.trainingTypeName ?? '—'}</p>
                  <p className="mt-1 text-xs capitalize text-gray-400">{booking.status}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Cancel Confirmation Modal */}
      {cancelTarget && (
        <div data-testid="cancel-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Termin stornieren?</h3>
            <p className="mt-2 text-sm text-gray-600">
              Möchtest du den Termin am{' '}
              {cancelTarget.slotDate ? formatBookingDate(cancelTarget.slotDate) : '—'} wirklich
              stornieren?
            </p>
            {cancelTarget.slotDate &&
              cancelTarget.slotStartTime &&
              isWithin24Hours(cancelTarget.slotDate, cancelTarget.slotStartTime) && (
                <p className="mt-2 text-sm text-amber-600">
                  Achtung: Dieser Termin ist in weniger als 24 Stunden. Gemäss unseren AGB kann eine
                  Stornogebühr anfallen.
                </p>
              )}
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setCancelTarget(null)}
                className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Abbrechen
              </button>
              <button
                data-testid="confirm-cancel-button"
                onClick={handleCancel}
                disabled={cancelLoading}
                className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {cancelLoading ? 'Wird storniert…' : 'Stornieren'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function MeineTerminePage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[80vh] items-center justify-center">
          <p className="text-gray-600">Termine werden geladen…</p>
        </main>
      }
    >
      <MeineTermineContent />
    </Suspense>
  );
}
