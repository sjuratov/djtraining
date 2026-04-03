'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// ── Types ──

interface TrainingType {
  id: string;
  name: string;
  category: 'personal' | 'gruppe' | 'ernaehrung';
  durationMinutes: number;
  maxCapacity: number;
  active?: boolean;
}

interface CalendarSlot {
  id: string;
  templateId: string | null;
  trainingTypeId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'available' | 'cancelled' | 'full';
  maxCapacity: number;
  notes: string | null;
  trainingTypeName?: string;
  trainingTypeCategory?: string;
  currentBookings: number;
  availableSpots: number;
}

interface SlotBooking {
  id: string;
  userId: string;
  status: 'confirmed' | 'cancelled' | 'completed' | 'no-show';
  notes: string | null;
  createdAt: string;
  userEmail?: string;
  userDisplayName?: string;
}

interface User {
  id: string;
  email: string;
  displayName: string;
}

// ── Helpers ──

type ViewMode = 'month' | 'week' | 'day';

const categoryColors: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  personal: { bg: 'bg-rose-50', border: 'border-rose-300', text: 'text-rose-800', dot: 'bg-rose-500' },
  gruppe: { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-800', dot: 'bg-blue-500' },
  ernaehrung: { bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-800', dot: 'bg-emerald-500' },
};

const statusLabels: Record<string, string> = {
  confirmed: 'Bestätigt',
  cancelled: 'Storniert',
  completed: 'Abgeschlossen',
  'no-show': 'Nicht erschienen',
};

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function formatDisplayDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('de-CH', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime(time: string): string {
  return time.slice(0, 5);
}

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getDateRange(date: Date, view: ViewMode): { from: string; to: string } {
  if (view === 'day') {
    const d = formatDate(date);
    return { from: d, to: d };
  }
  if (view === 'week') {
    const monday = getMonday(date);
    return { from: formatDate(monday), to: formatDate(addDays(monday, 6)) };
  }
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const startMonday = getMonday(first);
  const endSunday = addDays(getMonday(last), 6);
  return { from: formatDate(startMonday), to: formatDate(endSunday) };
}

const weekDays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

// ── Main Component ──

export default function AdminKalenderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);

  const [view, setView] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [slots, setSlots] = useState<CalendarSlot[]>([]);
  const [slotBookings, setSlotBookings] = useState<Record<string, SlotBooking[]>>({});

  const [trainingTypes, setTrainingTypes] = useState<TrainingType[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Modals
  const [selectedSlot, setSelectedSlot] = useState<CalendarSlot | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createDate, setCreateDate] = useState('');
  const [showBulkCancelModal, setShowBulkCancelModal] = useState(false);
  const [showBookOnBehalfModal, setShowBookOnBehalfModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // ── Auth check ──
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (res.status === 401) { router.push('/login'); return null; }
        if (!res.ok) throw new Error('Failed');
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        if (data.role !== 'admin') { setDenied(true); return; }
        return Promise.all([
          fetch('/api/admin/training-types').then(r => r.json()),
          fetch('/api/admin/users').then(r => r.json()),
        ]).then(([types, userList]) => {
          setTrainingTypes(types);
          setUsers(userList);
        });
      })
      .catch(() => setDenied(true))
      .finally(() => setLoading(false));
  }, [router]);

  // ── Load calendar data ──
  const loadCalendar = useCallback(async () => {
    const { from, to } = getDateRange(currentDate, view);
    try {
      const res = await fetch(`/api/admin/calendar?from=${from}&to=${to}`);
      if (!res.ok) return;
      const data = await res.json();
      setSlots(data.slots);
      setSlotBookings(data.bookings);
    } catch { /* ignore */ }
  }, [currentDate, view]);

  useEffect(() => {
    if (!loading && !denied) loadCalendar();
  }, [loading, denied, loadCalendar]);

  // ── Navigation ──
  function navigate(direction: number) {
    const d = new Date(currentDate);
    if (view === 'month') d.setMonth(d.getMonth() + direction);
    else if (view === 'week') d.setDate(d.getDate() + direction * 7);
    else d.setDate(d.getDate() + direction);
    setCurrentDate(d);
  }

  function goToToday() {
    setCurrentDate(new Date());
  }

  function getTitle(): string {
    if (view === 'day') return formatDisplayDate(formatDate(currentDate));
    if (view === 'week') {
      const monday = getMonday(currentDate);
      const sunday = addDays(monday, 6);
      return `${monday.toLocaleDateString('de-CH', { day: 'numeric', month: 'short' })} – ${sunday.toLocaleDateString('de-CH', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    }
    return currentDate.toLocaleDateString('de-CH', { month: 'long', year: 'numeric' });
  }

  // ── Slot actions ──
  async function handleCancelSlot(slotId: string) {
    const res = await fetch(`/api/admin/time-slots/${slotId}/cancel`, { method: 'POST' });
    if (res.ok) {
      setSelectedSlot(null);
      loadCalendar();
    }
  }

  async function handleUpdateBookingStatus(bookingId: string, status: string) {
    const res = await fetch(`/api/admin/bookings/${bookingId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) loadCalendar();
  }

  // ── Group slots by date ──
  function getSlotsByDate(): Record<string, CalendarSlot[]> {
    const map: Record<string, CalendarSlot[]> = {};
    for (const s of slots) {
      if (!map[s.date]) map[s.date] = [];
      map[s.date].push(s);
    }
    return map;
  }

  // ── Renders ──

  if (loading) {
    return (
      <main className="flex min-h-[80vh] items-center justify-center">
        <p className="text-gray-600">Kalender wird geladen…</p>
      </main>
    );
  }

  if (denied) {
    return (
      <main className="flex min-h-[80vh] flex-col items-center justify-center gap-2">
        <h1 className="text-2xl font-bold text-red-600">Zugriff verweigert</h1>
        <p className="text-gray-600">Du hast keine Berechtigung, diese Seite anzuzeigen.</p>
      </main>
    );
  }

  const slotsByDate = getSlotsByDate();

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kalender</h1>
          <p className="text-sm text-gray-500">Trainingsplanung & Buchungsverwaltung</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBulkCancelModal(true)}
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
          >
            Zeitraum absagen
          </button>
          <button
            onClick={() => { setCreateDate(formatDate(currentDate)); setShowCreateModal(true); }}
            className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
          >
            + Termin erstellen
          </button>
        </div>
      </div>

      {/* View Controls */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50">←</button>
          <button onClick={goToToday} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50">Heute</button>
          <button onClick={() => navigate(1)} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50">→</button>
          <h2 className="ml-2 text-lg font-semibold text-gray-900">{getTitle()}</h2>
        </div>
        <div className="flex rounded-lg border border-gray-300 bg-white">
          {(['month', 'week', 'day'] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 text-sm font-medium ${view === v ? 'bg-rose-600 text-white' : 'text-gray-600 hover:bg-gray-50'} ${v === 'month' ? 'rounded-l-lg' : v === 'day' ? 'rounded-r-lg' : ''}`}
            >
              {v === 'month' ? 'Monat' : v === 'week' ? 'Woche' : 'Tag'}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mb-4 flex flex-wrap gap-4 text-xs">
        <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-full bg-rose-500" />Personal</span>
        <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-500" />Gruppe</span>
        <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />Ernährung</span>
        <span className="flex items-center gap-1 text-gray-400"><span className="inline-block h-2.5 w-2.5 rounded-full border border-gray-300 bg-gray-100" />Abgesagt</span>
      </div>

      {/* Calendar Grid */}
      {view === 'month' && <MonthView date={currentDate} slotsByDate={slotsByDate} onSlotClick={setSelectedSlot} onDayClick={(d) => { setCreateDate(d); setShowCreateModal(true); }} />}
      {view === 'week' && <WeekView date={currentDate} slotsByDate={slotsByDate} onSlotClick={setSelectedSlot} onDayClick={(d) => { setCreateDate(d); setShowCreateModal(true); }} />}
      {view === 'day' && <DayView date={currentDate} slotsByDate={slotsByDate} onSlotClick={setSelectedSlot} />}

      {/* Slot Detail Modal */}
      {selectedSlot && (
        <SlotDetailModal
          slot={selectedSlot}
          bookings={slotBookings[selectedSlot.id] || []}
          onClose={() => setSelectedSlot(null)}
          onCancelSlot={() => handleCancelSlot(selectedSlot.id)}
          onUpdateBookingStatus={handleUpdateBookingStatus}
          onBookOnBehalf={() => { setShowBookOnBehalfModal(true); }}
          onEditSlot={() => { setShowEditModal(true); }}
        />
      )}

      {/* Create Slot Modal */}
      {showCreateModal && (
        <CreateSlotModal
          date={createDate}
          trainingTypes={trainingTypes}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => { setShowCreateModal(false); loadCalendar(); }}
        />
      )}

      {/* Bulk Cancel Modal */}
      {showBulkCancelModal && (
        <BulkCancelModal
          onClose={() => setShowBulkCancelModal(false)}
          onCancelled={() => { setShowBulkCancelModal(false); loadCalendar(); }}
        />
      )}

      {/* Book on Behalf Modal */}
      {showBookOnBehalfModal && selectedSlot && (
        <BookOnBehalfModal
          slot={selectedSlot}
          users={users}
          onClose={() => setShowBookOnBehalfModal(false)}
          onBooked={() => { setShowBookOnBehalfModal(false); setSelectedSlot(null); loadCalendar(); }}
        />
      )}

      {/* Edit Slot Modal */}
      {showEditModal && selectedSlot && (
        <EditSlotModal
          slot={selectedSlot}
          onClose={() => setShowEditModal(false)}
          onSaved={() => { setShowEditModal(false); setSelectedSlot(null); loadCalendar(); }}
        />
      )}
    </main>
  );
}

// ═══════════════════════════════════════════════
// Calendar Views
// ═══════════════════════════════════════════════

function SlotChip({ slot, onClick }: { slot: CalendarSlot; onClick: () => void }) {
  const cat = slot.trainingTypeCategory || 'personal';
  const colors = categoryColors[cat] || categoryColors.personal;
  const isCancelled = slot.status === 'cancelled';

  return (
    <button
      onClick={onClick}
      className={`w-full rounded px-1.5 py-0.5 text-left text-xs transition-colors ${
        isCancelled
          ? 'border border-gray-200 bg-gray-50 text-gray-400 line-through'
          : `border ${colors.border} ${colors.bg} ${colors.text} hover:opacity-80`
      }`}
    >
      <span className="font-medium">{formatTime(slot.startTime)}</span>{' '}
      <span className="truncate">{slot.trainingTypeName}</span>
      {!isCancelled && (
        <span className="ml-1 text-[10px] opacity-70">
          {slot.currentBookings}/{slot.maxCapacity}
        </span>
      )}
    </button>
  );
}

function MonthView({ date, slotsByDate, onSlotClick, onDayClick }: {
  date: Date;
  slotsByDate: Record<string, CalendarSlot[]>;
  onSlotClick: (s: CalendarSlot) => void;
  onDayClick: (d: string) => void;
}) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = getDaysInMonth(year, month);
  const lastDay = new Date(year, month, daysInMonth);
  const startMonday = getMonday(firstDay);
  const endSunday = addDays(getMonday(lastDay), 6);

  const weeks: Date[][] = [];
  let current = new Date(startMonday);
  while (current <= endSunday) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(new Date(current));
      current = addDays(current, 1);
    }
    weeks.push(week);
  }

  const today = formatDate(new Date());

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
        {weekDays.map((d) => (
          <div key={d} className="px-2 py-2 text-center text-xs font-medium text-gray-500">{d}</div>
        ))}
      </div>
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7 border-b border-gray-100 last:border-b-0">
          {week.map((day) => {
            const ds = formatDate(day);
            const isCurrentMonth = day.getMonth() === month;
            const isToday = ds === today;
            const daySlots = slotsByDate[ds] || [];

            return (
              <div
                key={ds}
                className={`min-h-[100px] border-r border-gray-100 p-1 last:border-r-0 ${
                  isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                }`}
              >
                <div className="mb-1 flex items-center justify-between">
                  <button
                    onClick={() => onDayClick(ds)}
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                      isToday
                        ? 'bg-rose-600 text-white'
                        : isCurrentMonth
                          ? 'text-gray-700 hover:bg-gray-100'
                          : 'text-gray-400'
                    }`}
                  >
                    {day.getDate()}
                  </button>
                </div>
                <div className="space-y-0.5">
                  {daySlots.slice(0, 3).map((s) => (
                    <SlotChip key={s.id} slot={s} onClick={() => onSlotClick(s)} />
                  ))}
                  {daySlots.length > 3 && (
                    <p className="px-1 text-[10px] text-gray-400">+{daySlots.length - 3} weitere</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function WeekView({ date, slotsByDate, onSlotClick, onDayClick }: {
  date: Date;
  slotsByDate: Record<string, CalendarSlot[]>;
  onSlotClick: (s: CalendarSlot) => void;
  onDayClick: (d: string) => void;
}) {
  const monday = getMonday(date);
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const today = formatDate(new Date());

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const ds = formatDate(day);
          const isToday = ds === today;
          const daySlots = (slotsByDate[ds] || []).sort((a, b) => a.startTime.localeCompare(b.startTime));

          return (
            <div key={ds} className={`border-r border-gray-200 last:border-r-0 ${isToday ? 'bg-rose-50/30' : 'bg-white'}`}>
              <div className="border-b border-gray-200 p-2 text-center">
                <p className="text-xs font-medium text-gray-500">{weekDays[i]}</p>
                <button
                  onClick={() => onDayClick(ds)}
                  className={`mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                    isToday ? 'bg-rose-600 text-white' : 'text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {day.getDate()}
                </button>
              </div>
              <div className="min-h-[300px] space-y-1 p-1">
                {daySlots.map((s) => (
                  <SlotChip key={s.id} slot={s} onClick={() => onSlotClick(s)} />
                ))}
                {daySlots.length === 0 && (
                  <p className="py-8 text-center text-xs text-gray-300">—</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DayView({ date, slotsByDate, onSlotClick }: {
  date: Date;
  slotsByDate: Record<string, CalendarSlot[]>;
  onSlotClick: (s: CalendarSlot) => void;
}) {
  const ds = formatDate(date);
  const daySlots = (slotsByDate[ds] || []).sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-900">{formatDisplayDate(ds)}</h3>
      </div>
      {daySlots.length === 0 ? (
        <p className="px-4 py-12 text-center text-sm text-gray-400">Keine Termine an diesem Tag</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {daySlots.map((s) => {
            const cat = s.trainingTypeCategory || 'personal';
            const colors = categoryColors[cat] || categoryColors.personal;
            const isCancelled = s.status === 'cancelled';

            return (
              <button
                key={s.id}
                onClick={() => onSlotClick(s)}
                className="flex w-full items-center gap-4 px-4 py-3 text-left hover:bg-gray-50"
              >
                <span className={`h-3 w-3 rounded-full ${isCancelled ? 'bg-gray-300' : colors.dot}`} />
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium ${isCancelled ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                    {formatTime(s.startTime)} – {formatTime(s.endTime)}{' '}
                    <span className="font-normal">{s.trainingTypeName}</span>
                  </p>
                  {!isCancelled && (
                    <p className="text-xs text-gray-500">
                      {s.currentBookings}/{s.maxCapacity} Buchungen
                      {s.availableSpots === 0 && <span className="ml-1 text-red-500">(Ausgebucht)</span>}
                    </p>
                  )}
                  {isCancelled && <p className="text-xs text-gray-400">Abgesagt</p>}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════
// Modals
// ═══════════════════════════════════════════════

function ModalBackdrop({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-xl">
        {children}
      </div>
    </div>
  );
}

function SlotDetailModal({ slot, bookings, onClose, onCancelSlot, onUpdateBookingStatus, onBookOnBehalf, onEditSlot }: {
  slot: CalendarSlot;
  bookings: SlotBooking[];
  onClose: () => void;
  onCancelSlot: () => void;
  onUpdateBookingStatus: (bookingId: string, status: string) => void;
  onBookOnBehalf: () => void;
  onEditSlot: () => void;
}) {
  const cat = slot.trainingTypeCategory || 'personal';
  const colors = categoryColors[cat] || categoryColors.personal;
  const isCancelled = slot.status === 'cancelled';
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed');

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className={`h-3 w-3 rounded-full ${isCancelled ? 'bg-gray-300' : colors.dot}`} />
              <h3 className="text-lg font-semibold text-gray-900">{slot.trainingTypeName}</h3>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {formatDisplayDate(slot.date)} · {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        {/* Status & Capacity */}
        <div className="mb-4 flex flex-wrap gap-2">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            isCancelled ? 'bg-gray-100 text-gray-500' : slot.status === 'full' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
          }`}>
            {isCancelled ? 'Abgesagt' : slot.status === 'full' ? 'Ausgebucht' : 'Verfügbar'}
          </span>
          {!isCancelled && (
            <span className="text-xs text-gray-500">
              {slot.currentBookings}/{slot.maxCapacity} Plätze belegt
            </span>
          )}
          {slot.templateId === null && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Ad-hoc</span>
          )}
        </div>

        {slot.notes && (
          <p className="mb-4 rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-600">{slot.notes}</p>
        )}

        {/* Actions */}
        {!isCancelled && (
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              onClick={onEditSlot}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Bearbeiten
            </button>
            {slot.availableSpots > 0 && (
              <button
                onClick={onBookOnBehalf}
                className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-700"
              >
                Für Kunden buchen
              </button>
            )}
            <button
              onClick={() => { if (confirm('Diesen Termin wirklich absagen?')) onCancelSlot(); }}
              className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
            >
              Absagen
            </button>
          </div>
        )}

        {/* Bookings list */}
        <div className="mt-2">
          <h4 className="mb-2 text-sm font-semibold text-gray-900">
            Buchungen ({confirmedBookings.length})
          </h4>
          {bookings.length === 0 ? (
            <p className="text-xs text-gray-400">Keine Buchungen</p>
          ) : (
            <div className="space-y-2">
              {bookings.map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-md border border-gray-100 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{b.userDisplayName || b.userEmail || 'Unbekannt'}</p>
                    <p className="text-xs text-gray-500">{b.userEmail}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      b.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                      b.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                      b.status === 'no-show' ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {statusLabels[b.status] || b.status}
                    </span>
                    {b.status === 'confirmed' && (
                      <select
                        className="rounded border border-gray-200 px-1 py-0.5 text-xs text-gray-600"
                        defaultValue=""
                        onChange={(e) => {
                          if (e.target.value) onUpdateBookingStatus(b.id, e.target.value);
                          e.target.value = '';
                        }}
                      >
                        <option value="" disabled>Aktion…</option>
                        <option value="completed">✓ Abgeschlossen</option>
                        <option value="no-show">✗ Nicht erschienen</option>
                        <option value="cancelled">Stornieren</option>
                      </select>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ModalBackdrop>
  );
}

function CreateSlotModal({ date, trainingTypes, onClose, onCreated }: {
  date: string;
  trainingTypes: TrainingType[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [typeId, setTypeId] = useState('');
  const [slotDate, setSlotDate] = useState(date);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [maxCap, setMaxCap] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!typeId) return;
    const tt = trainingTypes.find(t => t.id === typeId);
    if (!tt) return;
    const [h, m] = startTime.split(':').map(Number);
    const total = h * 60 + m + tt.durationMinutes;
    const eh = Math.floor(total / 60) % 24;
    const em = total % 60;
    setEndTime(`${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`);
    if (!maxCap) setMaxCap(String(tt.maxCapacity));
  }, [typeId, startTime, trainingTypes, maxCap]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!typeId) { setError('Bitte Trainingsart wählen'); return; }
    setSubmitting(true);

    const res = await fetch('/api/admin/time-slots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trainingTypeId: typeId,
        date: slotDate,
        startTime,
        endTime,
        maxCapacity: maxCap ? Number(maxCap) : undefined,
        notes: notes || undefined,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: 'Fehler' }));
      setError(data.error || 'Fehler beim Erstellen');
      setSubmitting(false);
      return;
    }

    onCreated();
  }

  return (
    <ModalBackdrop onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Neuen Termin erstellen</h3>

        {error && <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Trainingsart</label>
            <select value={typeId} onChange={(e) => setTypeId(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              <option value="">Bitte wählen…</option>
              {trainingTypes.filter(t => t.active !== false).map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.category})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Datum</label>
            <input type="date" value={slotDate} onChange={(e) => setSlotDate(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Startzeit</label>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Endzeit</label>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Max. Kapazität</label>
            <input type="number" value={maxCap} onChange={(e) => setMaxCap(e.target.value)} min="1" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Notizen (optional)</label>
            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="z.B. Sondertermin, Vertretung…" />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Abbrechen</button>
          <button type="submit" disabled={submitting} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50">
            {submitting ? 'Erstelle…' : 'Termin erstellen'}
          </button>
        </div>
      </form>
    </ModalBackdrop>
  );
}

function BulkCancelModal({ onClose, onCancelled }: {
  onClose: () => void;
  onCancelled: () => void;
}) {
  const [fromDate, setFromDate] = useState(formatDate(new Date()));
  const [toDate, setToDate] = useState(formatDate(addDays(new Date(), 7)));
  const [error, setError] = useState('');
  const [result, setResult] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const res = await fetch('/api/admin/time-slots/bulk-cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromDate, toDate }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: 'Fehler' }));
      setError(data.error || 'Fehler beim Absagen');
      setSubmitting(false);
      return;
    }

    const data = await res.json();
    setResult(data.cancelledCount);
    setSubmitting(false);
  }

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Zeitraum absagen</h3>
        <p className="mb-4 text-sm text-gray-500">Alle Termine im gewählten Zeitraum werden abgesagt (z.B. Ferien).</p>

        {error && <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        {result !== null ? (
          <div className="rounded-md bg-green-50 px-4 py-3">
            <p className="text-sm font-medium text-green-800">{result} Termine abgesagt</p>
            <button onClick={onCancelled} className="mt-3 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700">Schliessen</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Von</label>
                <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Bis</label>
                <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Abbrechen</button>
              <button type="submit" disabled={submitting} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">
                {submitting ? 'Absagen…' : 'Zeitraum absagen'}
              </button>
            </div>
          </form>
        )}
      </div>
    </ModalBackdrop>
  );
}

function BookOnBehalfModal({ slot, users, onClose, onBooked }: {
  slot: CalendarSlot;
  users: User[];
  onClose: () => void;
  onBooked: () => void;
}) {
  const [userId, setUserId] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = users.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.email.toLowerCase().includes(q) || u.displayName.toLowerCase().includes(q);
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) { setError('Bitte Kunden wählen'); return; }
    setError('');
    setSubmitting(true);

    const res = await fetch('/api/admin/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, timeSlotId: slot.id, notes: notes || undefined }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: 'Fehler' }));
      setError(data.error || 'Fehler beim Buchen');
      setSubmitting(false);
      return;
    }

    onBooked();
  }

  return (
    <ModalBackdrop onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-6">
        <h3 className="mb-2 text-lg font-semibold text-gray-900">Für Kunden buchen</h3>
        <p className="mb-4 text-sm text-gray-500">
          {slot.trainingTypeName} · {formatDisplayDate(slot.date)} · {formatTime(slot.startTime)}
        </p>

        {error && <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Kunde suchen</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name oder E-Mail…"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="max-h-40 overflow-y-auto rounded-lg border border-gray-200">
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-center text-sm text-gray-400">Keine Benutzer gefunden</p>
            ) : (
              filtered.map(u => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => setUserId(u.id)}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                    userId === u.id ? 'bg-rose-50 text-rose-700' : 'text-gray-700'
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${userId === u.id ? 'bg-rose-500' : 'bg-transparent'}`} />
                  <span className="font-medium">{u.displayName}</span>
                  <span className="text-gray-400">{u.email}</span>
                </button>
              ))
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Notizen (optional)</label>
            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Abbrechen</button>
          <button type="submit" disabled={submitting || !userId} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50">
            {submitting ? 'Buche…' : 'Buchen'}
          </button>
        </div>
      </form>
    </ModalBackdrop>
  );
}

function EditSlotModal({ slot, onClose, onSaved }: {
  slot: CalendarSlot;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [slotDate, setSlotDate] = useState(slot.date);
  const [startTime, setStartTime] = useState(slot.startTime);
  const [endTime, setEndTime] = useState(slot.endTime);
  const [notes, setNotes] = useState(slot.notes || '');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const res = await fetch(`/api/admin/time-slots/${slot.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: slotDate,
        startTime,
        endTime,
        notes: notes || null,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: 'Fehler' }));
      setError(data.error || 'Fehler beim Speichern');
      setSubmitting(false);
      return;
    }

    onSaved();
  }

  return (
    <ModalBackdrop onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Termin bearbeiten</h3>
        <p className="mb-4 text-sm text-gray-500">{slot.trainingTypeName}</p>

        {error && <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Datum</label>
            <input type="date" value={slotDate} onChange={(e) => setSlotDate(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Startzeit</label>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Endzeit</label>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Notizen</label>
            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Abbrechen</button>
          <button type="submit" disabled={submitting} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50">
            {submitting ? 'Speichere…' : 'Speichern'}
          </button>
        </div>
      </form>
    </ModalBackdrop>
  );
}
