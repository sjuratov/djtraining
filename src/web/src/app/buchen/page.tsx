'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface TrainingType {
  id: string;
  name: string;
  category: 'personal' | 'gruppe' | 'ernaehrung';
  durationMinutes: number;
  maxCapacity: number;
  priceSingle: number | null;
  active: boolean;
}

interface TimeSlot {
  id: string;
  trainingTypeId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'available' | 'cancelled' | 'full';
  maxCapacity: number;
  trainingTypeName?: string;
  trainingTypeCategory?: string;
  currentBookings: number;
  availableSpots: number;
}

interface ClientPackage {
  id: string;
  packageName?: string;
  trainingCategory?: string;
  totalSessions: number;
  remainingSessions: number;
  status: 'active' | 'expired' | 'depleted';
}

function formatDate(dateStr: string): string {
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

function generateDateRange(weeks: number): string[] {
  const dates: string[] = [];
  const today = new Date();
  for (let i = 0; i < weeks * 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

function BuchenContent() {
  const [step, setStep] = useState(1);
  const [trainingTypes, setTrainingTypes] = useState<TrainingType[]>([]);
  const [selectedType, setSelectedType] = useState<TrainingType | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [packages, setPackages] = useState<ClientPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Preselect category from query param
  const preselectedCategory = searchParams.get('category');

  const fetchTypes = useCallback(() => {
    setLoading(true);
    setError(null);

    const authReq = fetch('/api/auth/me').then((res) => {
      if (res.status === 401) {
        router.push('/login');
        return null;
      }
      if (!res.ok) throw new Error('Auth failed');
      return res.json();
    });

    const typesReq = fetch('/api/schedule/types').then((res) => {
      if (!res.ok) throw new Error('Failed to load training types');
      return res.json();
    });

    const pkgReq = fetch('/api/packages').then((res) => {
      if (!res.ok) throw new Error('Failed to load packages');
      return res.json();
    });

    Promise.all([authReq, typesReq, pkgReq])
      .then(([authData, types, pkgs]) => {
        if (!authData) return;
        setTrainingTypes(types as TrainingType[]);
        setPackages(pkgs as ClientPackage[]);

        if (preselectedCategory) {
          const match = (types as TrainingType[]).find(
            (t) => t.category === preselectedCategory,
          );
          if (match) {
            setSelectedType(match);
            setStep(2);
          }
        }
      })
      .catch(() => setError('Daten konnten nicht geladen werden.'))
      .finally(() => setLoading(false));
  }, [router, preselectedCategory]);

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  async function handleDateSelect(date: string) {
    setSelectedDate(date);
    setSelectedSlot(null);
    setSlotsLoading(true);
    try {
      const categoryParam = selectedType ? `&category=${selectedType.category}` : '';
      const res = await fetch(`/api/schedule/slots?from=${date}&to=${date}${categoryParam}`);
      if (!res.ok) throw new Error('Failed to load slots');
      const data = (await res.json()) as TimeSlot[];
      setSlots(data);
    } catch {
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }

  async function handleBooking() {
    if (!selectedSlot) return;
    setBookingLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeSlotId: selectedSlot.id }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? 'Buchung fehlgeschlagen');
      }
      router.push('/meine-termine?booked=true');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Buchung fehlgeschlagen');
    } finally {
      setBookingLoading(false);
    }
  }

  const dateRange = generateDateRange(4);
  const activePackages = packages.filter((p) => p.status === 'active');

  if (loading) {
    return (
      <main className="flex min-h-[80vh] items-center justify-center">
        <p className="text-gray-600">Wird geladen…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <h1 data-testid="buchen-heading" className="text-3xl font-bold text-gray-900">
        Termin buchen
      </h1>

      {error && <div className="mt-4 rounded-md bg-red-50 p-4 text-red-800">{error}</div>}

      {/* Step indicator */}
      <div className="mt-6 flex items-center gap-2 text-sm text-gray-500">
        <span className={step >= 1 ? 'font-semibold text-rose-600' : ''}>1. Trainingsart</span>
        <span>→</span>
        <span className={step >= 2 ? 'font-semibold text-rose-600' : ''}>2. Termin wählen</span>
        <span>→</span>
        <span className={step >= 3 ? 'font-semibold text-rose-600' : ''}>3. Bestätigen</span>
      </div>

      {/* Step 1: Select Training Type */}
      {step === 1 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900">Trainingsart wählen</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {trainingTypes.map((tt) => (
              <button
                key={tt.id}
                data-testid="training-type-card"
                onClick={() => {
                  setSelectedType(tt);
                  setSelectedDate(null);
                  setSlots([]);
                  setSelectedSlot(null);
                  setStep(2);
                }}
                className="rounded-lg border border-gray-200 bg-white p-6 text-left shadow-sm transition-colors hover:border-rose-300 hover:shadow"
              >
                <p className="font-semibold text-gray-900">{tt.name}</p>
                <p className="mt-1 text-sm text-gray-500">{tt.durationMinutes} Minuten</p>
                {tt.priceSingle !== null && (
                  <p className="mt-1 text-sm text-gray-500">CHF {tt.priceSingle.toFixed(2)}</p>
                )}
              </button>
            ))}
          </div>
          {trainingTypes.length === 0 && (
            <p className="mt-4 text-gray-500">Keine Trainingsarten verfügbar.</p>
          )}
        </section>
      )}

      {/* Step 2: Select Date and Time Slot */}
      {step === 2 && selectedType && (
        <section className="mt-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setStep(1)}
              className="text-sm text-rose-600 hover:text-rose-700"
            >
              ← Zurück
            </button>
            <h2 className="text-lg font-semibold text-gray-900">
              {selectedType.name} — Termin wählen
            </h2>
          </div>

          {/* Date picker grid */}
          <div data-testid="date-picker" className="mt-4">
            <div className="grid grid-cols-7 gap-1">
              {dateRange.map((date) => {
                const d = new Date(date);
                const dayLabel = d.toLocaleDateString('de-CH', { weekday: 'short' });
                const dayNum = d.getDate();
                const isSelected = selectedDate === date;
                return (
                  <button
                    key={date}
                    onClick={() => handleDateSelect(date)}
                    className={`flex flex-col items-center rounded-md px-1 py-2 text-xs transition-colors ${
                      isSelected
                        ? 'bg-rose-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span>{dayLabel}</span>
                    <span className="text-sm font-semibold">{dayNum}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time slots */}
          {selectedDate && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700">
                Verfügbare Zeiten am {formatDate(selectedDate)}
              </h3>
              {slotsLoading ? (
                <p className="mt-2 text-sm text-gray-500">Lade Zeitfenster…</p>
              ) : slots.length === 0 ? (
                <p className="mt-2 text-sm text-gray-500">
                  Keine verfügbaren Zeitfenster an diesem Tag.
                </p>
              ) : (
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {slots.map((slot) => {
                    const isFull = slot.availableSpots === 0;
                    return (
                      <button
                        key={slot.id}
                        data-testid="time-slot-card"
                        disabled={isFull}
                        onClick={() => {
                          setSelectedSlot(slot);
                          setStep(3);
                        }}
                        className={`rounded-lg border p-4 text-left transition-colors ${
                          isFull
                            ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400'
                            : 'border-gray-200 bg-white text-gray-900 hover:border-rose-300 hover:shadow'
                        }`}
                      >
                        <p className="font-medium">
                          {formatTime(slot.startTime)}–{formatTime(slot.endTime)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {isFull
                            ? 'Ausgebucht'
                            : `${slot.availableSpots} ${slot.availableSpots === 1 ? 'Platz' : 'Plätze'} frei`}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* Step 3: Confirm Booking */}
      {step === 3 && selectedType && selectedSlot && selectedDate && (
        <section data-testid="booking-summary" className="mt-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setStep(2)}
              className="text-sm text-rose-600 hover:text-rose-700"
            >
              ← Zurück
            </button>
            <h2 className="text-lg font-semibold text-gray-900">Buchung bestätigen</h2>
          </div>

          <div className="mt-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <dl className="space-y-2">
              <div>
                <dt className="text-sm text-gray-500">Trainingsart</dt>
                <dd className="font-medium text-gray-900">{selectedType.name}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Datum</dt>
                <dd className="font-medium text-gray-900">{formatDate(selectedDate)}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Uhrzeit</dt>
                <dd className="font-medium text-gray-900">
                  {formatTime(selectedSlot.startTime)}–{formatTime(selectedSlot.endTime)}
                </dd>
              </div>
            </dl>

            {activePackages.length > 0 && (
              <div className="mt-4 rounded-md bg-gray-50 p-3">
                <p className="text-sm text-gray-600">
                  Paket:{' '}
                  {activePackages
                    .map(
                      (p) =>
                        `${p.packageName ?? 'Paket'} (${p.remainingSessions}/${p.totalSessions} verbleibend)`,
                    )
                    .join(', ')}
                </p>
              </div>
            )}

            <button
              data-testid="confirm-booking-button"
              onClick={handleBooking}
              disabled={bookingLoading}
              className="mt-6 w-full rounded bg-rose-600 px-4 py-3 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50"
            >
              {bookingLoading ? 'Wird gebucht…' : 'Termin buchen'}
            </button>
          </div>
        </section>
      )}
    </main>
  );
}

export default function BuchenPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[80vh] items-center justify-center">
          <p className="text-gray-600">Wird geladen…</p>
        </main>
      }
    >
      <BuchenContent />
    </Suspense>
  );
}
