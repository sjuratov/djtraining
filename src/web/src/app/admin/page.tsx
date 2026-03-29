'use client';

import { useEffect, useState } from 'react';
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

function ProfileField({ name, value }: { name: string; value: string | number | null | undefined }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500">{name}</dt>
      <dd className="text-sm text-gray-900">{value ?? '—'}</dd>
    </div>
  );
}

function ProfilePanel({ userId, onClose }: { userId: string; onClose: () => void }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/users/${userId}/profile`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed');
        return res.json();
      })
      .then((data: UserProfile) => setProfile(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [userId]);

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
    </div>
  );
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (res.status === 401) {
          router.push('/login');
          return null;
        }
        if (!res.ok) throw new Error('Failed');
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        if (data.role !== 'admin') {
          setDenied(true);
          setLoading(false);
          return;
        }
        setCurrentUserId(data.sub);
        return fetch('/api/admin/users')
          .then((res) => {
            if (!res.ok) throw new Error('Failed');
            return res.json();
          })
          .then((userList) => setUsers(userList));
      })
      .catch(() => setDenied(true))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
              <>
                <tr key={u.id} className="border-b border-gray-100">
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
                  <tr key={`${u.id}-profile`} className="border-b border-gray-100">
                    <td colSpan={7} className="bg-gray-50">
                      <ProfilePanel userId={u.id} onClose={() => setExpandedUserId(null)} />
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
