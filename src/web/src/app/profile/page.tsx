'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  username: string;
  role: string;
  createdAt: string;
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('de-DE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(dateStr));
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const router = useRouter();

  function fetchProfile() {
    setLoading(true);
    setError(false);
    fetch('/api/auth/me')
      .then((res) => {
        if (res.status === 401) {
          router.push('/login');
          return null;
        }
        if (!res.ok) throw new Error('Failed to load');
        return res.json();
      })
      .then((data) => {
        if (data) setUser(data);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
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
          onClick={fetchProfile}
          className="rounded bg-rose-600 px-4 py-2 font-medium text-white hover:bg-rose-700"
        >
          Erneut versuchen
        </button>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 rounded-lg border border-gray-200 bg-white p-8 shadow-sm text-center">
        <h1 className="text-2xl font-bold text-gray-900">Mein Profil</h1>
        <div className="space-y-3">
          <p className="text-lg font-semibold text-gray-900">{user.username}</p>
          <span data-testid="role-badge" className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${
            user.role === 'admin'
              ? 'bg-rose-100 text-rose-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {user.role === 'admin' ? 'Admin' : 'Benutzer'}
          </span>
          <p className="text-gray-600">
            Mitglied seit {formatDate(user.createdAt)}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full rounded bg-gray-200 px-4 py-2 font-medium text-gray-800 hover:bg-gray-300"
        >
          Abmelden
        </button>
      </div>
    </main>
  );
}
