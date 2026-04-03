'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// ── Types ──

interface TrainingType {
  id: string;
  name: string;
  category: 'personal' | 'gruppe' | 'ernaehrung';
  durationMinutes: number;
  maxCapacity: number;
  priceSingle: number | null;
  active: boolean;
}

interface ScheduleTemplate {
  id: string;
  trainingTypeId: string;
  dayOfWeek: number;
  startTime: string;
  active: boolean;
  trainingTypeName?: string;
  trainingTypeCategory?: string;
}

// ── Helpers ──

type Tab = 'types' | 'templates' | 'generate';

const categoryLabels: Record<string, string> = {
  personal: 'Personal Training',
  gruppe: 'Gruppentraining',
  ernaehrung: 'Ernährungscoaching',
};

const dayLabels = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const dayOptions = [1, 2, 3, 4, 5, 6, 0]; // Mon-Sun order

function formatPrice(rappen: number | null): string {
  if (rappen === null) return '—';
  return `CHF ${(rappen / 100).toFixed(2)}`;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// ── Main Component ──

export default function AdminEinstellungenPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [tab, setTab] = useState<Tab>('types');

  // Data
  const [types, setTypes] = useState<TrainingType[]>([]);
  const [templates, setTemplates] = useState<ScheduleTemplate[]>([]);

  // Auth check + initial data load
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
        return loadData();
      })
      .catch(() => setDenied(true))
      .finally(() => setLoading(false));
  }, [router]);

  const loadData = useCallback(async () => {
    const [typesRes, templatesRes] = await Promise.all([
      fetch('/api/admin/training-types'),
      fetch('/api/admin/schedule-templates'),
    ]);
    if (typesRes.ok) setTypes(await typesRes.json());
    if (templatesRes.ok) setTemplates(await templatesRes.json());
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-[80vh] items-center justify-center">
        <p className="text-gray-600">Einstellungen werden geladen…</p>
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

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Einstellungen</h1>
      <p className="mb-6 text-sm text-gray-500">Trainingsarten, Wochenplan und Slot-Generierung verwalten</p>

      {/* Tabs */}
      <div className="mb-6 flex border-b border-gray-200">
        {([
          { key: 'types' as Tab, label: 'Trainingsarten' },
          { key: 'templates' as Tab, label: 'Wochenplan' },
          { key: 'generate' as Tab, label: 'Slots generieren' },
        ]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === key
                ? 'border-b-2 border-rose-600 text-rose-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'types' && <TrainingTypesTab types={types} onRefresh={loadData} />}
      {tab === 'templates' && <TemplatesTab templates={templates} types={types} onRefresh={loadData} />}
      {tab === 'generate' && <GenerateSlotsTab />}
    </main>
  );
}

// ═══════════════════════════════════════════════
// Training Types Tab
// ═══════════════════════════════════════════════

function TrainingTypesTab({ types, onRefresh }: { types: TrainingType[]; onRefresh: () => Promise<void> }) {
  const [showForm, setShowForm] = useState(false);
  const [editingType, setEditingType] = useState<TrainingType | null>(null);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Trainingsarten ({types.length})</h2>
        <button
          onClick={() => { setEditingType(null); setShowForm(true); }}
          className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
        >
          + Neue Trainingsart
        </button>
      </div>

      {types.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 px-6 py-12 text-center">
          <p className="text-sm text-gray-500">Noch keine Trainingsarten angelegt.</p>
          <p className="mt-1 text-sm text-gray-400">Erstelle eine Trainingsart, um den Wochenplan einzurichten.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="px-4 py-3 font-medium text-gray-600">Kategorie</th>
                <th className="px-4 py-3 font-medium text-gray-600">Dauer</th>
                <th className="px-4 py-3 font-medium text-gray-600">Kapazität</th>
                <th className="px-4 py-3 font-medium text-gray-600">Preis</th>
                <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 font-medium text-gray-600">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {types.map((t) => (
                <tr key={t.id}>
                  <td className="px-4 py-3 font-medium text-gray-900">{t.name}</td>
                  <td className="px-4 py-3 text-gray-600">{categoryLabels[t.category] || t.category}</td>
                  <td className="px-4 py-3 text-gray-600">{t.durationMinutes} Min.</td>
                  <td className="px-4 py-3 text-gray-600">{t.maxCapacity}</td>
                  <td className="px-4 py-3 text-gray-600">{formatPrice(t.priceSingle)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      t.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {t.active ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => { setEditingType(t); setShowForm(true); }}
                      className="mr-2 rounded px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50"
                    >
                      Bearbeiten
                    </button>
                    <ToggleActiveButton
                      active={t.active}
                      onToggle={async () => {
                        await fetch(`/api/admin/training-types/${t.id}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ active: !t.active }),
                        });
                        await onRefresh();
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <TrainingTypeForm
          existing={editingType}
          onClose={() => setShowForm(false)}
          onSaved={async () => { setShowForm(false); await onRefresh(); }}
        />
      )}
    </div>
  );
}

function ToggleActiveButton({ active, onToggle }: { active: boolean; onToggle: () => Promise<void> }) {
  const [submitting, setSubmitting] = useState(false);
  return (
    <button
      disabled={submitting}
      onClick={async () => { setSubmitting(true); await onToggle(); setSubmitting(false); }}
      className={`rounded px-2 py-1 text-xs font-medium ${
        active ? 'text-gray-500 hover:bg-gray-100' : 'text-green-600 hover:bg-green-50'
      }`}
    >
      {active ? 'Deaktivieren' : 'Aktivieren'}
    </button>
  );
}

function TrainingTypeForm({ existing, onClose, onSaved }: {
  existing: TrainingType | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [name, setName] = useState(existing?.name || '');
  const [category, setCategory] = useState(existing?.category || '');
  const [duration, setDuration] = useState(existing?.durationMinutes?.toString() || '60');
  const [capacity, setCapacity] = useState(existing?.maxCapacity?.toString() || '1');
  const [price, setPrice] = useState(existing?.priceSingle ? (existing.priceSingle / 100).toFixed(2) : '');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!name || !category || !duration) {
      setError('Name, Kategorie und Dauer sind erforderlich');
      return;
    }
    setSubmitting(true);

    const body = {
      name,
      category,
      durationMinutes: Number(duration),
      maxCapacity: Number(capacity) || 1,
      priceSingle: price ? Math.round(Number(price) * 100) : null,
    };

    const url = existing
      ? `/api/admin/training-types/${existing.id}`
      : '/api/admin/training-types';
    const method = existing ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: 'Fehler' }));
      setError(data.error || 'Fehler beim Speichern');
      setSubmitting(false);
      return;
    }

    await onSaved();
  }

  return (
    <ModalBackdrop onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          {existing ? 'Trainingsart bearbeiten' : 'Neue Trainingsart'}
        </h3>

        {error && <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="z.B. Personal Training" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Kategorie</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              <option value="">Bitte wählen…</option>
              <option value="personal">Personal Training</option>
              <option value="gruppe">Gruppentraining</option>
              <option value="ernaehrung">Ernährungscoaching</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Dauer (Min.)</label>
              <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} min="15" step="15" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Max. Kapazität</label>
              <input type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} min="1" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Preis (CHF, optional)</label>
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} min="0" step="0.50" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="z.B. 120.00" />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Abbrechen</button>
          <button type="submit" disabled={submitting} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50">
            {submitting ? 'Speichere…' : existing ? 'Speichern' : 'Erstellen'}
          </button>
        </div>
      </form>
    </ModalBackdrop>
  );
}

// ═══════════════════════════════════════════════
// Templates Tab
// ═══════════════════════════════════════════════

function TemplatesTab({ templates, types, onRefresh }: {
  templates: ScheduleTemplate[];
  types: TrainingType[];
  onRefresh: () => Promise<void>;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ScheduleTemplate | null>(null);
  const activeTypes = types.filter(t => t.active);

  // Group templates by day
  const byDay = new Map<number, ScheduleTemplate[]>();
  for (const t of templates) {
    const list = byDay.get(t.dayOfWeek) || [];
    list.push(t);
    byDay.set(t.dayOfWeek, list);
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Wochenplan ({templates.length} Vorlagen)</h2>
        <button
          onClick={() => { setEditingTemplate(null); setShowForm(true); }}
          disabled={activeTypes.length === 0}
          className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50"
        >
          + Neue Vorlage
        </button>
      </div>

      {activeTypes.length === 0 && (
        <div className="mb-4 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Erstelle zuerst eine Trainingsart im Tab &quot;Trainingsarten&quot;.
        </div>
      )}

      {templates.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 px-6 py-12 text-center">
          <p className="text-sm text-gray-500">Noch keine Wochenplan-Vorlagen angelegt.</p>
          <p className="mt-1 text-sm text-gray-400">Erstelle Vorlagen, um wöchentliche Trainingszeiten zu definieren.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {dayOptions.map((dow) => {
            const dayTemplates = (byDay.get(dow) || []).sort((a, b) => a.startTime.localeCompare(b.startTime));
            if (dayTemplates.length === 0) return null;
            return (
              <div key={dow} className="rounded-lg border border-gray-200">
                <div className="border-b border-gray-200 bg-gray-50 px-4 py-2">
                  <h3 className="text-sm font-semibold text-gray-700">{dayLabels[dow]}</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {dayTemplates.map((t) => {
                    const catColor = t.trainingTypeCategory === 'personal' ? 'bg-rose-500'
                      : t.trainingTypeCategory === 'gruppe' ? 'bg-blue-500' : 'bg-emerald-500';
                    return (
                      <div key={t.id} className="flex items-center justify-between px-4 py-2.5">
                        <div className="flex items-center gap-3">
                          <span className={`h-2.5 w-2.5 rounded-full ${catColor}`} />
                          <span className="text-sm font-medium text-gray-900">{t.startTime.slice(0, 5)}</span>
                          <span className="text-sm text-gray-600">{t.trainingTypeName}</span>
                          {!t.active && (
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">Inaktiv</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => { setEditingTemplate(t); setShowForm(true); }}
                            className="rounded px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50"
                          >
                            Bearbeiten
                          </button>
                          <ToggleActiveButton
                            active={t.active}
                            onToggle={async () => {
                              if (t.active) {
                                await fetch(`/api/admin/schedule-templates/${t.id}`, { method: 'DELETE' });
                              } else {
                                await fetch(`/api/admin/schedule-templates/${t.id}`, {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ active: true }),
                                });
                              }
                              await onRefresh();
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <TemplateForm
          existing={editingTemplate}
          types={activeTypes}
          onClose={() => setShowForm(false)}
          onSaved={async () => { setShowForm(false); await onRefresh(); }}
        />
      )}
    </div>
  );
}

function TemplateForm({ existing, types, onClose, onSaved }: {
  existing: ScheduleTemplate | null;
  types: TrainingType[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [typeId, setTypeId] = useState(existing?.trainingTypeId || '');
  const [dayOfWeek, setDayOfWeek] = useState(existing?.dayOfWeek?.toString() ?? '');
  const [startTime, setStartTime] = useState(existing?.startTime?.slice(0, 5) || '09:00');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!typeId || dayOfWeek === '' || !startTime) {
      setError('Alle Felder sind erforderlich');
      return;
    }
    setSubmitting(true);

    const url = existing
      ? `/api/admin/schedule-templates/${existing.id}`
      : '/api/admin/schedule-templates';
    const method = existing ? 'PUT' : 'POST';

    const body = existing
      ? { dayOfWeek: Number(dayOfWeek), startTime }
      : { trainingTypeId: typeId, dayOfWeek: Number(dayOfWeek), startTime };

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: 'Fehler' }));
      setError(data.error || 'Fehler beim Speichern');
      setSubmitting(false);
      return;
    }

    await onSaved();
  }

  return (
    <ModalBackdrop onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          {existing ? 'Vorlage bearbeiten' : 'Neue Wochenplan-Vorlage'}
        </h3>

        {error && <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <div className="space-y-4">
          {!existing && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Trainingsart</label>
              <select value={typeId} onChange={(e) => setTypeId(e.target.value)} required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                <option value="">Bitte wählen…</option>
                {types.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({categoryLabels[t.category]})</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Wochentag</label>
            <select value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value)} required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              <option value="">Bitte wählen…</option>
              {dayOptions.map(d => (
                <option key={d} value={d}>{dayLabels[d]}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Startzeit</label>
            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Abbrechen</button>
          <button type="submit" disabled={submitting} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50">
            {submitting ? 'Speichere…' : existing ? 'Speichern' : 'Erstellen'}
          </button>
        </div>
      </form>
    </ModalBackdrop>
  );
}

// ═══════════════════════════════════════════════
// Generate Slots Tab
// ═══════════════════════════════════════════════

function GenerateSlotsTab() {
  const today = formatDate(new Date());
  const fourWeeks = formatDate(new Date(Date.now() + 28 * 24 * 60 * 60 * 1000));

  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(fourWeeks);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ generated: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setResult(null);
    setSubmitting(true);

    const res = await fetch('/api/admin/generate-slots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromDate, toDate }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: 'Fehler' }));
      setError(data.error || 'Fehler bei der Generierung');
      setSubmitting(false);
      return;
    }

    const data = await res.json();
    setResult(data);
    setSubmitting(false);
  }

  return (
    <div>
      <h2 className="mb-2 text-lg font-semibold text-gray-900">Zeitfenster generieren</h2>
      <p className="mb-6 text-sm text-gray-500">
        Generiere buchbare Zeitfenster aus den aktiven Wochenplan-Vorlagen für einen Zeitraum.
        Bereits existierende Slots werden übersprungen.
      </p>

      <form onSubmit={handleGenerate} className="max-w-md space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Von</label>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} min={today} required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Bis</label>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} min={fromDate} required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
        </div>

        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        {result && (
          <div className="rounded-md bg-green-50 px-4 py-3">
            <p className="text-sm font-medium text-green-800">
              {result.generated > 0
                ? `${result.generated} neue Zeitfenster generiert!`
                : 'Keine neuen Zeitfenster generiert (alle existieren bereits oder keine aktiven Vorlagen).'}
            </p>
            <p className="mt-1 text-xs text-green-600">
              Die Zeitfenster sind jetzt im Kalender und für Kunden sichtbar.
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-rose-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50"
        >
          {submitting ? 'Generiere…' : 'Slots generieren'}
        </button>
      </form>
    </div>
  );
}

// ═══════════════════════════════════════════════
// Shared Modal
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
