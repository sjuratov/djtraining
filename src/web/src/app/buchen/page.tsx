'use client';

import Link from 'next/link';
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
  expiresAt: string | null;
  effectiveExpiresAt: string | null;
  graceUntil: string | null;
  isExpiringSoon: boolean;
  daysUntilExpiry: number | null;
  status: 'active' | 'expired' | 'depleted';
}

interface CategoryEntitlement {
  totalSessions: number;
  remainingSessions: number;
  packageCount: number;
}

type TrainingCategory = TrainingType['category'];

const categoryLabels: Record<TrainingCategory, string> = {
  personal: 'Personal Training',
  gruppe: 'Gruppentraining',
  ernaehrung: 'Ernährungscoaching',
};

const bookingOfferConfigs: Array<{
  category: TrainingCategory;
  href: string;
  description: string;
}> = [
  {
    category: 'personal',
    href: '/personal-training',
    description: 'Individuelles 1:1 Training mit Fokus auf deine persönlichen Ziele.',
  },
  {
    category: 'gruppe',
    href: '/gruppentraining',
    description: 'Trainiere gemeinsam in motivierenden Gruppensessions mit klarer Struktur.',
  },
  {
    category: 'ernaehrung',
    href: '/ernaehrungscoaching',
    description: 'Begleitendes Ernährungscoaching für nachhaltige Resultate im Alltag.',
  },
];

function isTrainingCategory(value: string | null): value is TrainingCategory {
  return value === 'personal' || value === 'gruppe' || value === 'ernaehrung';
}

function createCategorySelection(category: TrainingCategory): TrainingType {
  return {
    id: `category-${category}`,
    name: categoryLabels[category],
    category,
    durationMinutes: 0,
    maxCapacity: 0,
    priceSingle: null,
    active: true,
  };
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

function formatExpiryNotice(pkg: Pick<ClientPackage, 'isExpiringSoon' | 'daysUntilExpiry'>): string | null {
  if (!pkg.isExpiringSoon || pkg.daysUntilExpiry === null) {
    return null;
  }

  if (pkg.daysUntilExpiry <= 0) {
    return 'läuft heute ab';
  }

  if (pkg.daysUntilExpiry === 1) {
    return 'läuft morgen ab';
  }

  return `läuft in ${pkg.daysUntilExpiry} Tagen ab`;
}

function getPackageLabel(pkg: Pick<ClientPackage, 'packageName' | 'trainingCategory'>): string {
  if (pkg.packageName) {
    return pkg.packageName;
  }

  const category = pkg.trainingCategory ?? null;
  if (isTrainingCategory(category)) {
    return categoryLabels[category];
  }

  return 'Dein Abo';
}

function toDateValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getMonday(date: Date): Date {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = copy.getDate() - day + (day === 0 ? -6 : 1);
  copy.setDate(diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function getVisibleMonthRange(monthDate: Date): { from: string; to: string } {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const lastDay = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
  const startMonday = getMonday(firstDay);
  const endSunday = addDays(getMonday(lastDay), 6);

  return {
    from: toDateValue(startMonday),
    to: toDateValue(endSunday),
  };
}

function getMonthGrid(monthDate: Date): Date[][] {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const lastDay = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
  const startMonday = getMonday(firstDay);
  const endSunday = addDays(getMonday(lastDay), 6);
  const weeks: Date[][] = [];

  for (let day = new Date(startMonday); day <= endSunday; day = addDays(day, 1)) {
    const weekIndex = Math.floor((day.getTime() - startMonday.getTime()) / (7 * 24 * 60 * 60 * 1000));
    if (!weeks[weekIndex]) {
      weeks[weekIndex] = [];
    }
    weeks[weekIndex].push(new Date(day));
  }

  return weeks;
}

function BuchenContent() {
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<TrainingType | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [monthSlots, setMonthSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [packages, setPackages] = useState<ClientPackage[]>([]);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Preselect category from query param
  const preselectedCategory = searchParams.get('category');

  const fetchTypes = useCallback(() => {
    setLoading(true);
    setError(null);
    setInfoMessage(null);

    const authReq = fetch('/api/auth/me').then((res) => {
      if (res.status === 401) {
        router.push('/login');
        return null;
      }
      if (!res.ok) throw new Error('Auth failed');
      return res.json();
    });

    const pkgReq = fetch('/api/packages').then((res) => {
      if (!res.ok) throw new Error('Failed to load packages');
      return res.json();
    });

    Promise.all([authReq, pkgReq])
      .then(([authData, pkgs]) => {
        if (!authData) return;
        setPackages(pkgs as ClientPackage[]);

        if (isTrainingCategory(preselectedCategory)) {
          const hasEntitlement = (pkgs as ClientPackage[]).some(
            (pkg) => pkg.trainingCategory === preselectedCategory && pkg.status === 'active' && pkg.remainingSessions > 0,
          );
          if (hasEntitlement) {
            const today = new Date();
            setSelectedType(createCategorySelection(preselectedCategory));
            setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
            setSelectedDate(toDateValue(today));
            setStep(2);
          } else {
            setInfoMessage(`Für ${categoryLabels[preselectedCategory]} hast du aktuell kein aktives Abo mit verfügbarem Guthaben.`);
          }
        }
      })
      .catch(() => setError('Daten konnten nicht geladen werden.'))
      .finally(() => setLoading(false));
  }, [router, preselectedCategory]);

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  useEffect(() => {
    if (step !== 2 || !selectedType) {
      return;
    }

    const category = selectedType.category;

    async function loadMonthSlots() {
      setSlotsLoading(true);
      try {
        const { from, to } = getVisibleMonthRange(currentMonth);
        const res = await fetch(`/api/schedule/slots?from=${from}&to=${to}&category=${category}`);
        if (!res.ok) {
          throw new Error('Failed to load slots');
        }
        const data = (await res.json()) as TimeSlot[];
        setMonthSlots(data);
      } catch {
        setMonthSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    }

    void loadMonthSlots();
  }, [currentMonth, selectedType, step]);

  function handleDateSelect(date: string) {
    setSelectedDate(date);
    setSelectedSlot(null);
  }

  function navigateMonth(direction: number) {
    setCurrentMonth((previous) => new Date(previous.getFullYear(), previous.getMonth() + direction, 1));
    setSelectedDate(null);
    setSelectedSlot(null);
  }

  function goToCurrentMonth() {
    const today = new Date();
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(toDateValue(today));
    setSelectedSlot(null);
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

  const activePackages = packages.filter((p) => p.status === 'active');
  const expiringSoonPackages = activePackages.filter((pkg) => pkg.isExpiringSoon);
  const entitlementByCategory = activePackages.reduce<Record<string, CategoryEntitlement>>((acc, pkg) => {
    const category = pkg.trainingCategory;
    if (!category) {
      return acc;
    }

    if (!acc[category]) {
      acc[category] = { totalSessions: 0, remainingSessions: 0, packageCount: 0 };
    }

    acc[category].totalSessions += pkg.totalSessions;
    acc[category].remainingSessions += pkg.remainingSessions;
    acc[category].packageCount += 1;
    return acc;
  }, {});
  const hasAnyEntitlement = Object.values(entitlementByCategory).some((entry) => entry.remainingSessions > 0);
  const weekDays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  const monthGrid = getMonthGrid(currentMonth);
  const todayValue = toDateValue(new Date());
  const slotsByDate = monthSlots.reduce<Record<string, TimeSlot[]>>((acc, slot) => {
    if (!acc[slot.date]) {
      acc[slot.date] = [];
    }
    acc[slot.date].push(slot);
    return acc;
  }, {});
  const slots = selectedDate
    ? [...(slotsByDate[selectedDate] ?? [])].sort((a, b) => a.startTime.localeCompare(b.startTime))
    : [];

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
      {infoMessage && <div className="mt-4 rounded-md bg-amber-50 p-4 text-amber-800">{infoMessage}</div>}
      {!hasAnyEntitlement && (
        <div className="mt-4 rounded-md bg-blue-50 p-4 text-blue-900">
          Du hast aktuell kein aktives Abo mit verfügbarem Guthaben. Bitte kontaktiere das Studio oder lass dir zuerst ein passendes Abo zuweisen, bevor du einen Termin buchst.
        </div>
      )}
      {expiringSoonPackages.length > 0 && (
        <div className="mt-4 rounded-md bg-amber-50 p-4 text-amber-900">
          <p className="font-medium">Abo-Hinweis</p>
          <ul className="mt-2 space-y-1 text-sm">
            {expiringSoonPackages.map((pkg) => (
              <li key={pkg.id}>
                {getPackageLabel(pkg)} {formatExpiryNotice(pkg)}.
                {pkg.graceUntil ? ` Kulanz bis ${new Date(pkg.graceUntil).toLocaleDateString('de-CH')}.` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}

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
          <p className="mt-2 text-sm text-gray-600">
            Du siehst hier alle buchbaren Angebote. Nur Kategorien mit aktivem Abo und verfügbarem Guthaben lassen sich direkt auswählen.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {bookingOfferConfigs.map((offer) => {
              const entitlement = entitlementByCategory[offer.category];
              const hasEntitlementForType = Boolean(entitlement && entitlement.remainingSessions > 0);
              const categoryPackages = activePackages.filter((pkg) => pkg.trainingCategory === offer.category);
              const expiringPackage = categoryPackages.find((pkg) => pkg.isExpiringSoon);
              const gracedPackage = categoryPackages.find((pkg) => pkg.graceUntil);

              return (
                <div
                  key={offer.category}
                  className={`rounded-lg border p-6 shadow-sm ${
                    hasEntitlementForType
                      ? 'border-gray-200 bg-white'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className={`font-semibold ${hasEntitlementForType ? 'text-gray-900' : 'text-gray-600'}`}>
                        {categoryLabels[offer.category]}
                      </p>
                      <p className="mt-2 text-sm text-gray-500">{offer.description}</p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        hasEntitlementForType
                          ? 'bg-green-50 text-green-700'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {hasEntitlementForType ? 'Buchbar' : 'Noch nicht gekauft'}
                    </span>
                  </div>

                  <div className="mt-4 rounded-md bg-white/80 px-3 py-2 text-sm">
                    {hasEntitlementForType ? (
                      <div className="space-y-1">
                        <p className="font-medium text-green-700">
                          {entitlement.remainingSessions}/{entitlement.totalSessions} Trainings übrig
                        </p>
                        {expiringPackage && (
                          <p className="text-xs text-amber-700">
                            Dieses Guthaben {formatExpiryNotice(expiringPackage)}.
                          </p>
                        )}
                        {gracedPackage?.graceUntil && (
                          <p className="text-xs text-blue-700">
                            Verlängert bis {new Date(gracedPackage.graceUntil).toLocaleDateString('de-CH')}.
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-600">
                        Dieses Angebot hast du aktuell nicht gekauft. Informiere dich auf der Angebotsseite und lass dir bei Bedarf ein passendes Abo freischalten.
                      </p>
                    )}
                  </div>

                  <div className="mt-4 flex flex-col gap-3">
                    <button
                      data-testid="training-type-card"
                      disabled={!hasEntitlementForType}
                      onClick={() => {
                        const today = new Date();
                        setInfoMessage(null);
                        setSelectedType(createCategorySelection(offer.category));
                        setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
                        setSelectedDate(toDateValue(today));
                        setMonthSlots([]);
                        setSelectedSlot(null);
                        setStep(2);
                      }}
                      className={`w-full rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                        hasEntitlementForType
                          ? 'bg-rose-600 text-white hover:bg-rose-700'
                          : 'cursor-not-allowed bg-gray-200 text-gray-500'
                      }`}
                    >
                      {hasEntitlementForType ? 'Termine anzeigen' : 'Aktuell nicht buchbar'}
                    </button>

                    <Link
                      href={offer.href}
                      className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
                    >
                      Mehr zum Angebot
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
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

          {/* Month calendar */}
          <div data-testid="date-picker" className="mt-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigateMonth(-1)}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  ←
                </button>
                <button
                  onClick={goToCurrentMonth}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Heute
                </button>
                <button
                  onClick={() => navigateMonth(1)}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  →
                </button>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 sm:text-base">
                {currentMonth.toLocaleDateString('de-CH', { month: 'long', year: 'numeric' })}
              </h3>
            </div>

            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
              <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
                {weekDays.map((day) => (
                  <div key={day} className="px-2 py-2 text-center text-xs font-medium text-gray-500">
                    {day}
                  </div>
                ))}
              </div>

              {monthGrid.map((week, weekIndex) => (
                <div key={`week-${weekIndex}`} className="grid grid-cols-7 border-b border-gray-100 last:border-b-0">
                  {week.map((day) => {
                    const dateValue = toDateValue(day);
                    const daySlots = slotsByDate[dateValue] ?? [];
                    const isSelected = selectedDate === dateValue;
                    const isToday = dateValue === todayValue;
                    const isCurrentMonth = day.getMonth() === currentMonth.getMonth();

                    return (
                      <button
                        key={dateValue}
                        onClick={() => handleDateSelect(dateValue)}
                        className={`min-h-[92px] border-r border-gray-100 p-2 text-left transition-colors last:border-r-0 ${
                          isSelected
                            ? 'bg-rose-50'
                            : isCurrentMonth
                              ? 'bg-white hover:bg-gray-50'
                              : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                        }`}
                      >
                        <span
                          className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${
                            isSelected
                              ? 'bg-rose-600 text-white'
                              : isToday
                                ? 'bg-gray-900 text-white'
                                : isCurrentMonth
                                  ? 'text-gray-900'
                                  : 'text-gray-400'
                          }`}
                        >
                          {day.getDate()}
                        </span>
                        <div className="mt-3 space-y-1">
                          {daySlots.length > 0 ? (
                            <>
                              <p className="text-xs font-medium text-gray-700">
                                {daySlots.length} {daySlots.length === 1 ? 'Termin' : 'Termine'}
                              </p>
                              <p className="text-[11px] text-gray-500">ab {formatTime(daySlots[0].startTime)}</p>
                            </>
                          ) : (
                            <p className="text-[11px] text-gray-400">Keine Slots</p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Time slots */}
          <div className="mt-6">
            {!selectedDate ? (
              <p className="text-sm text-gray-500">Wähle einen Tag im Kalender, um verfügbare Zeiten zu sehen.</p>
            ) : (
              <>
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
              </>
            )}
          </div>
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

             {selectedType.category in entitlementByCategory && (
               <div className="mt-4 rounded-md bg-gray-50 p-3">
                 <p className="text-sm text-gray-600">
                   Verfügbares Guthaben:{' '}
                   {entitlementByCategory[selectedType.category].remainingSessions}/
                   {entitlementByCategory[selectedType.category].totalSessions} Trainings für {selectedType.name}
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
