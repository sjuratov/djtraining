'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

type VerificationState = 'loading' | 'success' | 'error';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [state, setState] = useState<VerificationState>('loading');
  const [message, setMessage] = useState('Bestätigungslink wird geprüft ...');

  useEffect(() => {
    if (!token) {
      setState('error');
      setMessage('Bestätigungslink ist ungültig oder unvollständig.');
      return;
    }

    const controller = new AbortController();

    fetch(`/api/auth/verify/${encodeURIComponent(token)}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          setState('error');
          setMessage(data.error || 'Bestätigungslink ist ungültig oder abgelaufen.');
          return;
        }
        setState('success');
        setMessage(data.message || 'E-Mail-Adresse erfolgreich bestätigt.');
      })
      .catch(() => {
        setState('error');
        setMessage('Die Bestätigung konnte nicht abgeschlossen werden. Bitte versuche es erneut.');
      });

    return () => controller.abort();
  }, [token]);

  const isSuccess = state === 'success';
  const panelClasses = isSuccess
    ? 'border-green-200 bg-green-50 text-green-900'
    : state === 'error'
      ? 'border-red-200 bg-red-50 text-red-900'
      : 'border-gray-200 bg-white text-gray-900';

  return (
    <div className={`w-full max-w-lg rounded-lg border p-8 shadow-sm ${panelClasses}`}>
      <h1 className="text-2xl font-bold">
        {isSuccess ? 'E-Mail bestätigt' : state === 'error' ? 'Bestätigung fehlgeschlagen' : 'E-Mail wird bestätigt'}
      </h1>
      <p className="mt-4">{message}</p>
      <div className="mt-6 flex gap-4">
        <Link
          href="/login"
          className="rounded bg-rose-600 px-4 py-2 font-medium text-white hover:bg-rose-700"
        >
          Zum Login
        </Link>
        <Link
          href="/register"
          className="rounded border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
        >
          Erneut registrieren
        </Link>
      </div>
    </div>
  );
}

function VerifyEmailFallback() {
  return (
    <div className="w-full max-w-lg rounded-lg border border-gray-200 bg-white p-8 text-gray-900 shadow-sm">
      <h1 className="text-2xl font-bold">E-Mail wird bestätigt</h1>
      <p className="mt-4">Bestätigungslink wird geprüft ...</p>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <main className="flex min-h-[80vh] items-center justify-center px-4">
      <Suspense fallback={<VerifyEmailFallback />}>
        <VerifyEmailContent />
      </Suspense>
    </main>
  );
}
