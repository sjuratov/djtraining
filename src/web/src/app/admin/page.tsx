'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  displayName: string;
  role: string;
  authProvider: string;
  status: string;
  createdAt: string;
  hasProfile: boolean;
}

interface MemberProfile {
  firstName: string;
  lastName: string;
  phone: string;
  birthDate: string | null;
  gender: string | null;
  trainingGoal: string | null;
  experienceLevel: string | null;
  healthNotes: string;
  trainingType: string | null;
  sessionsPerWeek: number | null;
  preferredTimes: string[];
}

interface UserProfile {
  email: string;
  displayName: string;
  role: string;
  status: string;
  authProvider: string;
  createdAt: string;
  profile: MemberProfile;
}

interface PackageDefinition {
  id: string;
  name: string;
  trainingCategory: 'personal' | 'gruppe' | 'ernaehrung';
  totalSessions: number;
  priceChf: number;
  validityDays: number | null;
  active: boolean;
}

interface ClientPackage {
  id: string;
  userId: string;
  packageDefId: string;
  totalSessions: number;
  remainingSessions: number;
  purchasedAt: string;
  expiresAt: string | null;
  effectiveExpiresAt: string | null;
  graceUntil: string | null;
  graceReason: string | null;
  graceSetBy: string | null;
  graceSetAt: string | null;
  status: 'active' | 'expired' | 'depleted';
  isExpired: boolean;
  isExpiringSoon: boolean;
  isBookable: boolean;
  daysUntilExpiry: number | null;
  notes: string | null;
  packageName?: string;
  trainingCategory?: string;
  userEmail?: string;
  userDisplayName?: string;
}

interface PackagesOverview {
  expiringSoon: ClientPackage[];
  depleted: ClientPackage[];
  expired: ClientPackage[];
}

const genderLabels: Record<string, string> = {
  männlich: 'Männlich',
  weiblich: 'Weiblich',
  divers: 'Divers',
};

const trainingGoalLabels: Record<string, string> = {
  abnehmen: 'Abnehmen',
  muskelaufbau: 'Muskelaufbau',
  fitness: 'Fitness',
  reha: 'Reha',
  wohlbefinden: 'Wohlbefinden',
};

const experienceLevelLabels: Record<string, string> = {
  anfänger: 'Anfänger',
  fortgeschritten: 'Fortgeschritten',
  profi: 'Profi',
};

const trainingTypeLabels: Record<string, string> = {
  personal: 'Personal Training',
  gruppe: 'Gruppentraining',
  beides: 'Beides',
};

const packageCategoryLabels: Record<string, string> = {
  personal: 'Personal Training',
  gruppe: 'Gruppentraining',
  ernaehrung: 'Ernährungscoaching',
};

const preferredTimesLabels: Record<string, string> = {
  morgens: 'Morgens',
  mittags: 'Mittags',
  abends: 'Abends',
};

function label(value: string | null | undefined, map: Record<string, string>): string {
  if (!value) return '—';
  return map[value] ?? value;
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('de-DE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(dateStr));
}

function toDateInputValue(dateStr: string): string {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return toDateInputValue(date.toISOString());
}

function formatExpiryNotice(pkg: Pick<ClientPackage, 'daysUntilExpiry' | 'isExpiringSoon' | 'isExpired'>): string | null {
  if (pkg.isExpired) {
    return 'Bereits abgelaufen';
  }

  if (!pkg.isExpiringSoon || pkg.daysUntilExpiry === null) {
    return null;
  }

  if (pkg.daysUntilExpiry <= 0) {
    return 'Läuft heute ab';
  }

  if (pkg.daysUntilExpiry === 1) {
    return 'Läuft morgen ab';
  }

  return `Läuft in ${pkg.daysUntilExpiry} Tagen ab`;
}

function ProfileField({ name, value }: { name: string; value: string | number | null | undefined }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500">{name}</dt>
      <dd className="text-sm text-gray-900">{value ?? '—'}</dd>
    </div>
  );
}

function ProfilePanel({ userId, onClose, onPackagesUpdated }: { userId: string; onClose: () => void; onPackagesUpdated: () => Promise<void> | void }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [packageDefinitions, setPackageDefinitions] = useState<PackageDefinition[]>([]);
  const [clientPackages, setClientPackages] = useState<ClientPackage[]>([]);
  const [selectedPackageDefId, setSelectedPackageDefId] = useState('');
  const [packageNotes, setPackageNotes] = useState('');
  const [gracePackageId, setGracePackageId] = useState<string | null>(null);
  const [graceUntil, setGraceUntil] = useState('');
  const [graceReason, setGraceReason] = useState('');
  const [error, setError] = useState(false);
  const [packageError, setPackageError] = useState<string | null>(null);
  const [assigningPackage, setAssigningPackage] = useState(false);
  const [savingGrace, setSavingGrace] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfileData() {
      setLoading(true);
      setError(false);
      setPackageError(null);

      try {
        const profileRes = await fetch(`/api/admin/users/${userId}/profile`);
        if (!profileRes.ok) {
          throw new Error('Failed');
        }

        const [profileData, definitionsRes, packagesRes] = await Promise.all([
          profileRes.json() as Promise<UserProfile>,
          fetch('/api/admin/package-definitions'),
          fetch(`/api/admin/users/${userId}/packages`),
        ]);

        setProfile(profileData);

        if (definitionsRes.ok) {
          const definitions = await definitionsRes.json() as PackageDefinition[];
          setPackageDefinitions(definitions);
        } else {
          setPackageError('Paketdefinitionen konnten nicht geladen werden.');
        }

        if (packagesRes.ok) {
          const packages = await packagesRes.json() as ClientPackage[];
          setClientPackages(packages);
        } else {
          setPackageError('Kunden-Abos konnten nicht geladen werden.');
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    void loadProfileData();
  }, [userId]);

  async function refreshPackages() {
    const [definitionsRes, packagesRes] = await Promise.all([
      fetch('/api/admin/package-definitions'),
      fetch(`/api/admin/users/${userId}/packages`),
    ]);

    if (!definitionsRes.ok || !packagesRes.ok) {
      setPackageError('Paketdaten konnten nicht aktualisiert werden.');
      return;
    }

    setPackageDefinitions(await definitionsRes.json() as PackageDefinition[]);
    setClientPackages(await packagesRes.json() as ClientPackage[]);
    setPackageError(null);
  }

  async function assignPackage() {
    if (!selectedPackageDefId) {
      setPackageError('Bitte wähle zuerst ein Abo aus.');
      return;
    }

    setAssigningPackage(true);
    setPackageError(null);

    try {
      const res = await fetch(`/api/admin/users/${userId}/packages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageDefId: selectedPackageDefId,
          notes: packageNotes.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? 'Abo konnte nicht zugewiesen werden.');
      }

      setSelectedPackageDefId('');
      setPackageNotes('');
      await refreshPackages();
      await onPackagesUpdated();
    } catch (assignError) {
      setPackageError(assignError instanceof Error ? assignError.message : 'Abo konnte nicht zugewiesen werden.');
    } finally {
      setAssigningPackage(false);
    }
  }

  function openGraceForm(pkg: ClientPackage) {
    if (!pkg.expiresAt) {
      return;
    }

    setGracePackageId(pkg.id);
    setGraceUntil(pkg.graceUntil ? toDateInputValue(pkg.graceUntil) : addDays(pkg.effectiveExpiresAt ?? pkg.expiresAt, 14));
    setGraceReason(pkg.graceReason ?? '');
    setPackageError(null);
  }

  async function saveGrace(packageId: string) {
    setSavingGrace(true);
    setPackageError(null);

    try {
      const res = await fetch(`/api/admin/packages/${packageId}/grace`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          graceUntil,
          reason: graceReason,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? 'Verlängerung konnte nicht gespeichert werden.');
      }

      setGracePackageId(null);
      setGraceUntil('');
      setGraceReason('');
      await refreshPackages();
      await onPackagesUpdated();
    } catch (graceError) {
      setPackageError(graceError instanceof Error ? graceError.message : 'Verlängerung konnte nicht gespeichert werden.');
    } finally {
      setSavingGrace(false);
    }
  }

  if (loading) {
    return (
      <div data-testid="member-profile-panel" className="px-6 py-4 text-sm text-gray-500">
        Profil wird geladen…
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div data-testid="member-profile-panel" className="px-6 py-4 text-sm text-red-600">
        Profil konnte nicht geladen werden.
        <button onClick={onClose} className="ml-4 text-gray-500 underline hover:text-gray-700">Schliessen</button>
      </div>
    );
  }

  const p = profile.profile;
  const times = p.preferredTimes.length > 0
    ? p.preferredTimes.map((t) => label(t, preferredTimesLabels)).join(', ')
    : '—';
  const assignableDefinitions = packageDefinitions.filter((pkg) => pkg.active);
  const activePackages = clientPackages.filter((pkg) => pkg.status === 'active');
  const historicalPackages = clientPackages.filter((pkg) => pkg.status !== 'active');

  return (
    <div data-testid="member-profile-panel" className="px-6 py-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Mitgliederprofil — {profile.displayName}</h3>
        <button
          onClick={onClose}
          className="rounded px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200"
        >
          Schliessen
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Persönliche Daten */}
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-rose-600">Persönliche Daten</h4>
          <dl className="space-y-2">
            <ProfileField name="Vorname" value={p.firstName || '—'} />
            <ProfileField name="Nachname" value={p.lastName || '—'} />
            <ProfileField name="Telefon" value={p.phone || '—'} />
            <ProfileField name="Geburtsdatum" value={p.birthDate ? formatDate(p.birthDate) : '—'} />
            <ProfileField name="Geschlecht" value={label(p.gender, genderLabels)} />
          </dl>
        </div>

        {/* Fitness-Profil */}
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-rose-600">Fitness-Profil</h4>
          <dl className="space-y-2">
            <ProfileField name="Trainingsziel" value={label(p.trainingGoal, trainingGoalLabels)} />
            <ProfileField name="Erfahrungslevel" value={label(p.experienceLevel, experienceLevelLabels)} />
            <ProfileField name="Gesundheitliche Hinweise" value={p.healthNotes || '—'} />
          </dl>
        </div>

        {/* Mitgliedschaft */}
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-rose-600">Mitgliedschaft</h4>
          <dl className="space-y-2">
            <ProfileField name="Trainingsart" value={label(p.trainingType, trainingTypeLabels)} />
            <ProfileField name="Einheiten/Woche" value={p.sessionsPerWeek ?? '—'} />
            <ProfileField name="Bevorzugte Zeiten" value={times} />
          </dl>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h4 className="text-sm font-semibold text-gray-900">Abos & Pakete</h4>
            <p className="mt-1 text-xs text-gray-500">
              Weise dem Benutzer ein passendes Abo zu und überwache verbleibende Trainings sowie Ablaufdatum.
            </p>
          </div>
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
            {clientPackages.length} {clientPackages.length === 1 ? 'Paket' : 'Pakete'}
          </span>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,360px)]">
          <div className="space-y-4">
            <div>
              <h5 className="mb-2 text-xs font-semibold uppercase tracking-wide text-rose-600">Aktive Abos</h5>
              {activePackages.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-5 text-sm text-gray-500">
                  Kein aktives Abo vorhanden. Weise ein Abo zu, damit der Benutzer buchen kann.
                </div>
              ) : (
                <div className="space-y-3">
                  {activePackages.map((pkg) => (
                    <div key={pkg.id} className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{pkg.packageName ?? 'Abo'}</p>
                          <p className="text-xs text-gray-500">
                            {packageCategoryLabels[pkg.trainingCategory ?? ''] ?? pkg.trainingCategory ?? '—'}
                          </p>
                        </div>
                        <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                          Aktiv
                        </span>
                      </div>
                      <div className="mt-3 grid gap-3 sm:grid-cols-3">
                        <div>
                          <p className="text-xs font-medium text-gray-500">Stand</p>
                          <p className="text-sm text-gray-900">{pkg.remainingSessions}/{pkg.totalSessions} Trainings übrig</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500">Gekauft am</p>
                          <p className="text-sm text-gray-900">{formatDate(pkg.purchasedAt)}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500">Läuft ab</p>
                          <p className="text-sm text-gray-900">{pkg.expiresAt ? formatDate(pkg.expiresAt) : 'Kein Ablaufdatum'}</p>
                        </div>
                      </div>
                      {(pkg.isExpiringSoon || pkg.graceUntil || pkg.isExpired) && (
                        <div className="mt-3 space-y-2">
                          {formatExpiryNotice(pkg) && (
                            <div className="rounded-md bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                              {formatExpiryNotice(pkg)}
                            </div>
                          )}
                          {pkg.graceUntil && (
                            <div className="rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-900">
                              Kulanz / Verlängerung bis <span className="font-medium">{formatDate(pkg.graceUntil)}</span>
                              {pkg.graceReason ? ` · Grund: ${pkg.graceReason}` : ''}
                              {pkg.graceSetAt ? ` · gesetzt am ${formatDate(pkg.graceSetAt)}` : ''}
                            </div>
                          )}
                        </div>
                      )}
                      {pkg.notes && <p className="mt-3 text-xs text-gray-500">Notiz: {pkg.notes}</p>}
                      {pkg.expiresAt ? (
                        <div className="mt-3 border-t border-gray-200 pt-3">
                          {gracePackageId === pkg.id ? (
                            <div className="space-y-3">
                              <div className="grid gap-3 sm:grid-cols-2">
                                <div>
                                  <label htmlFor={`grace-until-${pkg.id}`} className="mb-1 block text-xs font-medium text-gray-600">
                                    Neues Enddatum
                                  </label>
                                  <input
                                    id={`grace-until-${pkg.id}`}
                                    type="date"
                                    value={graceUntil}
                                    onChange={(event) => setGraceUntil(event.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-rose-400 focus:outline-none focus:ring-1 focus:ring-rose-400"
                                  />
                                </div>
                                <div>
                                  <label htmlFor={`grace-reason-${pkg.id}`} className="mb-1 block text-xs font-medium text-gray-600">
                                    Grund
                                  </label>
                                  <input
                                    id={`grace-reason-${pkg.id}`}
                                    type="text"
                                    value={graceReason}
                                    onChange={(event) => setGraceReason(event.target.value)}
                                    placeholder="z. B. Ferien, Krankheit, Kulanz"
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-rose-400 focus:outline-none focus:ring-1 focus:ring-rose-400"
                                  />
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => void saveGrace(pkg.id)}
                                  disabled={savingGrace || !graceUntil || !graceReason.trim()}
                                  className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-medium text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {savingGrace ? 'Wird gespeichert…' : 'Verlängerung speichern'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setGracePackageId(null);
                                    setGraceUntil('');
                                    setGraceReason('');
                                  }}
                                  className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100"
                                >
                                  Abbrechen
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openGraceForm(pkg)}
                              className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100"
                            >
                              Kulanz / Verlängerung setzen
                            </button>
                          )}
                        </div>
                      ) : (
                        <p className="mt-3 text-xs text-gray-500">Dieses Abo hat kein Ablaufdatum und benötigt keine Verlängerung.</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h5 className="mb-2 text-xs font-semibold uppercase tracking-wide text-rose-600">Vergangene / verbrauchte Abos</h5>
              {historicalPackages.length === 0 ? (
                <p className="text-sm text-gray-500">Noch keine abgelaufenen oder aufgebrauchten Abos.</p>
              ) : (
                <div className="space-y-2">
                  {historicalPackages.map((pkg) => (
                    <div key={pkg.id} className="rounded-lg border border-gray-200 px-4 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{pkg.packageName ?? 'Abo'}</p>
                          <p className="text-xs text-gray-500">
                            {pkg.remainingSessions}/{pkg.totalSessions} übrig · {pkg.expiresAt ? `Ablauf ${formatDate(pkg.expiresAt)}` : 'Kein Ablaufdatum'}
                            {pkg.graceUntil ? ` · Kulanz bis ${formatDate(pkg.graceUntil)}` : ''}
                          </p>
                        </div>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          pkg.status === 'expired'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {pkg.status === 'expired' ? 'Abgelaufen' : 'Aufgebraucht'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <h5 className="text-sm font-semibold text-gray-900">Neues Abo zuweisen</h5>
            <p className="mt-1 text-xs text-gray-500">
              Wähle ein aktives Paket aus. Ablaufdatum und Trainingskontingent werden automatisch übernommen.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label htmlFor={`package-definition-${userId}`} className="mb-1 block text-xs font-medium text-gray-600">
                  Abo auswählen
                </label>
                <select
                  id={`package-definition-${userId}`}
                  value={selectedPackageDefId}
                  onChange={(event) => setSelectedPackageDefId(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-rose-400 focus:outline-none focus:ring-1 focus:ring-rose-400"
                >
                  <option value="">Bitte wählen…</option>
                  {assignableDefinitions.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} · {packageCategoryLabels[pkg.trainingCategory] ?? pkg.trainingCategory} · {pkg.totalSessions} Sessions
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor={`package-notes-${userId}`} className="mb-1 block text-xs font-medium text-gray-600">
                  Notiz (optional)
                </label>
                <textarea
                  id={`package-notes-${userId}`}
                  value={packageNotes}
                  onChange={(event) => setPackageNotes(event.target.value)}
                  rows={3}
                  placeholder="z. B. telefonisch abgeschlossen, Sonderkondition..."
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-rose-400 focus:outline-none focus:ring-1 focus:ring-rose-400"
                />
              </div>

              {packageError && (
                <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
                  {packageError}
                </div>
              )}

              {assignableDefinitions.length === 0 ? (
                <div className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">
                  Keine aktiven Paketdefinitionen verfügbar. Lege zuerst unter <span className="font-medium">Einstellungen</span> ein passendes Abo an.
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => void assignPackage()}
                  disabled={assigningPackage || !selectedPackageDefId}
                  className="w-full rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {assigningPackage ? 'Abo wird zugewiesen…' : 'Abo zuweisen'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [packagesOverview, setPackagesOverview] = useState<PackagesOverview>({
    expiringSoon: [],
    depleted: [],
    expired: [],
  });
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function loadAdminData() {
      try {
        const authRes = await fetch('/api/auth/me');
        if (authRes.status === 401) {
          router.push('/login');
          return;
        }
        if (!authRes.ok) {
          throw new Error('Failed');
        }

        const authData = await authRes.json();
        if (authData.role !== 'admin') {
          setDenied(true);
          return;
        }

        setCurrentUserId(authData.sub);

        const [usersRes, overviewRes] = await Promise.all([
          fetch('/api/admin/users'),
          fetch('/api/admin/packages/overview'),
        ]);

        if (!usersRes.ok || !overviewRes.ok) {
          throw new Error('Failed');
        }

        setUsers(await usersRes.json() as User[]);
        setPackagesOverview(await overviewRes.json() as PackagesOverview);
      } catch {
        setDenied(true);
      } finally {
        setLoading(false);
      }
    }

    void loadAdminData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refreshPackagesOverview() {
    const res = await fetch('/api/admin/packages/overview');
    if (!res.ok) {
      return;
    }

    setPackagesOverview(await res.json() as PackagesOverview);
  }

  async function toggleRole(userId: string, currentRole: string) {
    const action = currentRole === 'admin' ? 'demote' : 'promote';
    const res = await fetch(`/api/admin/users/${userId}/${action}`, { method: 'POST' });
    if (!res.ok) return;
    setUsers(users.map(u => u.id === userId ? { ...u, role: currentRole === 'admin' ? 'user' : 'admin' } : u));
  }

  const filteredUsers = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.email.toLowerCase().includes(q) || u.displayName.toLowerCase().includes(q);
  });

  if (loading) {
    return (
      <main className="flex min-h-[80vh] items-center justify-center">
        <p className="text-gray-600">Benutzer werden geladen...</p>
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
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Admin Dashboard</h1>
      <p className="mb-6 text-gray-600">{users.length} Benutzer registriert</p>

      <section className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Abo-Hinweise</h2>
            <p className="mt-1 text-sm text-gray-500">
              Pakete im 14-Tage-Fenster werden hier hervorgehoben, damit du rechtzeitig reagieren kannst.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-medium">
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-800">
              {packagesOverview.expiringSoon.length} bald fällig
            </span>
            <span className="rounded-full bg-red-50 px-2.5 py-1 text-red-700">
              {packagesOverview.expired.length} abgelaufen
            </span>
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-700">
              {packagesOverview.depleted.length} aufgebraucht
            </span>
          </div>
        </div>

        {packagesOverview.expiringSoon.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">Aktuell läuft kein Paket innerhalb der nächsten 14 Tage ab.</p>
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {packagesOverview.expiringSoon.map((pkg) => (
              <div key={pkg.id} className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-sm font-semibold text-gray-900">
                  {pkg.userDisplayName ?? pkg.userEmail ?? 'Mitglied'}
                </p>
                <p className="text-xs text-gray-600">{pkg.userEmail}</p>
                <p className="mt-2 text-sm text-gray-800">
                  {pkg.packageName ?? 'Abo'} · {formatExpiryNotice(pkg)}
                </p>
                <p className="mt-1 text-xs text-gray-600">
                  Ursprünglicher Ablauf: {pkg.expiresAt ? formatDate(pkg.expiresAt) : 'Kein Ablaufdatum'}
                  {pkg.graceUntil ? ` · Kulanz bis ${formatDate(pkg.graceUntil)}` : ''}
                </p>
                <button
                  type="button"
                  onClick={() => setExpandedUserId(pkg.userId)}
                  className="mt-3 rounded bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
                >
                  Profil öffnen
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Search */}
      <div className="relative mb-4">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
          </svg>
        </span>
        <input
          data-testid="search-users"
          type="text"
          placeholder="Nach E-Mail oder Name suchen…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-rose-400 focus:outline-none focus:ring-1 focus:ring-rose-400"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-4 py-3 text-sm font-medium text-gray-600">E-Mail</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-600">Name</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-600">Rolle</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-600">Anbieter</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-600">Registriert am</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-600">Profil</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => (
              <React.Fragment key={u.id}>
                <tr className="border-b border-gray-100">
                  <td className="px-4 py-3 text-gray-900">{u.email}</td>
                  <td className="px-4 py-3 text-gray-700">{u.displayName}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      u.role === 'admin'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {u.role === 'admin' ? 'Admin' : 'Benutzer'}
                    </span>
                    {u.id !== currentUserId && (
                      <button
                        data-testid={`toggle-role-${u.id}`}
                        onClick={() => toggleRole(u.id, u.role)}
                        className="ml-2 rounded px-2 py-0.5 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                      >
                        {u.role === 'admin' ? 'Herabstufen' : 'Befördern'}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      u.authProvider === 'google'
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {u.authProvider === 'google' ? 'Google' : 'Lokal'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      u.status === 'active'
                        ? 'bg-green-50 text-green-700'
                        : 'bg-yellow-50 text-yellow-700'
                    }`}>
                      {u.status === 'active' ? 'Aktiv' : 'Ausstehend'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3">
                    <button
                      data-testid={`view-profile-${u.id}`}
                      onClick={() => setExpandedUserId(expandedUserId === u.id ? null : u.id)}
                      className="rounded bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100"
                    >
                      {expandedUserId === u.id ? 'Schliessen' : 'Anzeigen'}
                    </button>
                  </td>
                </tr>
                {expandedUserId === u.id && (
                  <tr className="border-b border-gray-100">
                    <td colSpan={7} className="bg-gray-50">
                      <ProfilePanel
                        userId={u.id}
                        onClose={() => setExpandedUserId(null)}
                        onPackagesUpdated={refreshPackagesOverview}
                      />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
