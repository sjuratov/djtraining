'use client';

import { useEffect, useState, useCallback, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  email: string;
  displayName: string;
  role: string;
  authProvider: string;
  createdAt: string;
}

interface Profile {
  firstName: string;
  lastName: string;
  phone: string;
  birthDate: string;
  gender: string;
  trainingGoal: string;
  experienceLevel: string;
  healthNotes: string;
  trainingType: string;
  sessionsPerWeek: number | '';
  preferredTimes: string[];
}

const emptyProfile: Profile = {
  firstName: '',
  lastName: '',
  phone: '',
  birthDate: '',
  gender: '',
  trainingGoal: '',
  experienceLevel: '',
  healthNotes: '',
  trainingType: '',
  sessionsPerWeek: '',
  preferredTimes: [],
};

type Tab = 'personal' | 'fitness' | 'membership';

const TABS: { key: Tab; label: string; testId: string }[] = [
  { key: 'personal', label: 'Persönliche Daten', testId: 'tab-personal' },
  { key: 'fitness', label: 'Fitness-Profil', testId: 'tab-fitness' },
  { key: 'membership', label: 'Mitgliedschaft', testId: 'tab-membership' },
];

const PREFERRED_TIMES_OPTIONS = ['morgens', 'mittags', 'abends'] as const;
const PREFERRED_TIMES_LABELS: Record<string, string> = {
  morgens: 'Morgens',
  mittags: 'Mittags',
  abends: 'Abends',
};

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('de-DE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(dateStr));
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('personal');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const router = useRouter();

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(false);

    const userReq = fetch('/api/auth/me').then((res) => {
      if (res.status === 401) {
        router.push('/login');
        return null;
      }
      if (!res.ok) throw new Error('Failed to load user');
      return res.json();
    });

    const profileReq = fetch('/api/profile').then((res) => {
      if (!res.ok && res.status !== 404) throw new Error('Failed to load profile');
      if (res.status === 404) return null;
      return res.json();
    });

    Promise.all([userReq, profileReq])
      .then(([userData, profileData]) => {
        if (userData) setUser(userData);
        if (profileData) {
          setProfile({
            ...emptyProfile,
            ...profileData,
            sessionsPerWeek: profileData.sessionsPerWeek ?? '',
            preferredTimes: profileData.preferredTimes ?? [],
          });
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  function updateField<K extends keyof Profile>(key: K, value: Profile[K]) {
    setProfile((prev) => ({ ...prev, [key]: value }));
  }

  function togglePreferredTime(time: string) {
    setProfile((prev) => {
      const times = prev.preferredTimes.includes(time)
        ? prev.preferredTimes.filter((t) => t !== time)
        : [...prev.preferredTimes, time];
      return { ...prev, preferredTimes: times };
    });
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...profile,
          sessionsPerWeek: profile.sessionsPerWeek === '' ? null : Number(profile.sessionsPerWeek),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? 'Speichern fehlgeschlagen');
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-[80vh] items-center justify-center">
        <p className="text-gray-600">Profil wird geladen…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-[80vh] flex-col items-center justify-center gap-4">
        <p className="text-red-600">Profil konnte nicht geladen werden. Bitte versuche es erneut.</p>
        <button
          onClick={fetchData}
          className="rounded bg-rose-600 px-4 py-2 font-medium text-white hover:bg-rose-700"
        >
          Erneut versuchen
        </button>
      </main>
    );
  }

  if (!user) return null;

  const inputClass =
    'block w-full rounded border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <main className="flex min-h-[80vh] flex-col items-center px-4 py-8 gap-6">
      {/* User info card */}
      <div className="w-full max-w-2xl space-y-4 rounded-lg border border-gray-200 bg-white p-8 shadow-sm text-center">
        <h1 className="text-2xl font-bold text-gray-900">Mein Profil</h1>
        <div className="space-y-3">
          <p className="text-lg font-semibold text-gray-900">{user.displayName}</p>
          <p className="text-sm text-gray-500">{user.email}</p>
          <div className="flex items-center justify-center gap-2">
            <span
              data-testid="role-badge"
              className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${
                user.role === 'admin'
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {user.role === 'admin' ? 'Admin' : 'Benutzer'}
            </span>
            {user.authProvider === 'google' && (
              <span className="inline-block rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                Google
              </span>
            )}
          </div>
          <p className="text-gray-600">Mitglied seit {formatDate(user.createdAt)}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full rounded bg-gray-200 px-4 py-2 font-medium text-gray-800 hover:bg-gray-300"
        >
          Abmelden
        </button>
      </div>

      {/* Profile form */}
      <form
        data-testid="profile-form"
        onSubmit={handleSave}
        className="w-full max-w-2xl rounded-lg border border-gray-200 bg-white shadow-sm"
      >
        {/* Tab navigation */}
        <div className="flex border-b border-gray-200">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              data-testid={tab.testId}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'border-b-2 border-rose-500 text-rose-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6 space-y-5">
          {/* Persönliche Daten */}
          {activeTab === 'personal' && (
            <div className="space-y-4">
              <div>
                <label htmlFor="firstName" className={labelClass}>Vorname</label>
                <input
                  id="firstName"
                  data-testid="field-firstName"
                  type="text"
                  value={profile.firstName}
                  onChange={(e) => updateField('firstName', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="lastName" className={labelClass}>Nachname</label>
                <input
                  id="lastName"
                  data-testid="field-lastName"
                  type="text"
                  value={profile.lastName}
                  onChange={(e) => updateField('lastName', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="phone" className={labelClass}>Telefonnummer</label>
                <input
                  id="phone"
                  data-testid="field-phone"
                  type="text"
                  value={profile.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="birthDate" className={labelClass}>Geburtsdatum</label>
                <input
                  id="birthDate"
                  data-testid="field-birthDate"
                  type="date"
                  value={profile.birthDate}
                  onChange={(e) => updateField('birthDate', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="gender" className={labelClass}>Geschlecht</label>
                <select
                  id="gender"
                  data-testid="field-gender"
                  value={profile.gender}
                  onChange={(e) => updateField('gender', e.target.value)}
                  className={inputClass}
                >
                  <option value="">— Bitte wählen —</option>
                  <option value="männlich">Männlich</option>
                  <option value="weiblich">Weiblich</option>
                  <option value="divers">Divers</option>
                </select>
              </div>
            </div>
          )}

          {/* Fitness-Profil */}
          {activeTab === 'fitness' && (
            <div className="space-y-4">
              <div>
                <label htmlFor="trainingGoal" className={labelClass}>Trainingsziel</label>
                <select
                  id="trainingGoal"
                  data-testid="field-trainingGoal"
                  value={profile.trainingGoal}
                  onChange={(e) => updateField('trainingGoal', e.target.value)}
                  className={inputClass}
                >
                  <option value="">— Bitte wählen —</option>
                  <option value="abnehmen">Abnehmen</option>
                  <option value="muskelaufbau">Muskelaufbau</option>
                  <option value="fitness">Fitness</option>
                  <option value="reha">Reha</option>
                  <option value="wohlbefinden">Wohlbefinden</option>
                </select>
              </div>
              <div>
                <label htmlFor="experienceLevel" className={labelClass}>Erfahrungslevel</label>
                <select
                  id="experienceLevel"
                  data-testid="field-experienceLevel"
                  value={profile.experienceLevel}
                  onChange={(e) => updateField('experienceLevel', e.target.value)}
                  className={inputClass}
                >
                  <option value="">— Bitte wählen —</option>
                  <option value="anfänger">Anfänger</option>
                  <option value="fortgeschritten">Fortgeschritten</option>
                  <option value="profi">Profi</option>
                </select>
              </div>
              <div>
                <label htmlFor="healthNotes" className={labelClass}>Gesundheitliche Hinweise</label>
                <textarea
                  id="healthNotes"
                  data-testid="field-healthNotes"
                  value={profile.healthNotes}
                  onChange={(e) => updateField('healthNotes', e.target.value)}
                  rows={4}
                  className={inputClass}
                />
              </div>
            </div>
          )}

          {/* Mitgliedschaft */}
          {activeTab === 'membership' && (
            <div className="space-y-4">
              <div>
                <label htmlFor="trainingType" className={labelClass}>Trainingsart</label>
                <select
                  id="trainingType"
                  data-testid="field-trainingType"
                  value={profile.trainingType}
                  onChange={(e) => updateField('trainingType', e.target.value)}
                  className={inputClass}
                >
                  <option value="">— Bitte wählen —</option>
                  <option value="personal">Personal Training</option>
                  <option value="gruppe">Gruppentraining</option>
                  <option value="beides">Beides</option>
                </select>
              </div>
              <div>
                <label htmlFor="sessionsPerWeek" className={labelClass}>
                  Trainingseinheiten pro Woche
                </label>
                <input
                  id="sessionsPerWeek"
                  data-testid="field-sessionsPerWeek"
                  type="number"
                  min={1}
                  max={5}
                  value={profile.sessionsPerWeek}
                  onChange={(e) =>
                    updateField(
                      'sessionsPerWeek',
                      e.target.value === '' ? '' : Number(e.target.value),
                    )
                  }
                  className={inputClass}
                />
              </div>
              <fieldset>
                <legend className={labelClass}>Bevorzugte Zeiten</legend>
                <div className="flex gap-4 mt-1">
                  {PREFERRED_TIMES_OPTIONS.map((time) => (
                    <label key={time} className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        data-testid={`field-preferredTimes-${time}`}
                        checked={profile.preferredTimes.includes(time)}
                        onChange={() => togglePreferredTime(time)}
                        className="h-4 w-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                      />
                      {PREFERRED_TIMES_LABELS[time]}
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
          )}
        </div>

        {/* Save area */}
        <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex-1">
            {saveSuccess && (
              <p data-testid="save-success" className="text-sm font-medium text-green-600">
                Profil erfolgreich gespeichert
              </p>
            )}
            {saveError && (
              <p data-testid="save-error" className="text-sm font-medium text-red-600">
                {saveError}
              </p>
            )}
          </div>
          <button
            type="submit"
            data-testid="save-profile"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded bg-rose-600 px-6 py-2 font-medium text-white hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving && (
              <svg
                className="h-4 w-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            )}
            Speichern
          </button>
        </div>
      </form>
    </main>
  );
}
