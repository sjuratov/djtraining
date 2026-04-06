'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';

export default function KontaktPage() {
  const localApiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('sending');

    try {
      const contactEndpoint = new URL('/api/contact', localApiBaseUrl).pathname;
      const res = await fetch(contactEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setStatus('success');
        setFormData({ name: '', email: '', phone: '', message: '' });
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <h1 className="mb-8 text-3xl font-bold text-gray-900">Kontakt</h1>

      {/* Free trial CTA */}
      <section className="mb-12 rounded-lg bg-rose-50 p-6 text-center">
        <h2 className="mb-2 text-xl font-bold text-gray-900">Kostenloses Probetraining</h2>
        <p className="text-gray-600">
          Du möchtest DJ&apos;s Training kennenlernen? Vereinbare jetzt dein kostenloses und
          unverbindliches Probetraining! Egal ob Personal Training oder Gruppentraining — die erste
          Stunde ist gratis.
        </p>
      </section>

      <div className="grid gap-12 lg:grid-cols-2">
        {/* Contact Form */}
        <section>
          <h2 className="mb-6 text-2xl font-bold text-gray-900">Schreib mir eine Nachricht</h2>

          {status === 'success' && (
            <div className="mb-6 rounded-lg bg-green-50 p-4 text-green-800">
              Vielen Dank für deine Nachricht! Ich melde mich so schnell wie möglich bei dir.
            </div>
          )}

          {status === 'error' && (
            <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-800">
              Leider konnte die Nachricht nicht gesendet werden. Bitte versuche es erneut oder
              kontaktiere mich direkt per Telefon.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
                Dein Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                placeholder="Vor- und Nachname"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                Deine E-Mail
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                placeholder="name@beispiel.ch"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div>
              <label htmlFor="phone" className="mb-1 block text-sm font-medium text-gray-700">
                Telefon (optional)
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                placeholder="+41 XX XXX XX XX"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div>
              <label htmlFor="message" className="mb-1 block text-sm font-medium text-gray-700">
                Deine Nachricht
              </label>
              <textarea
                id="message"
                name="message"
                required
                rows={5}
                placeholder="Wie kann ich dir helfen?"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <button
              type="submit"
              disabled={status === 'sending'}
              className="w-full rounded-full bg-rose-600 px-8 py-3 text-lg font-semibold text-white transition-colors hover:bg-rose-700 disabled:opacity-50 sm:w-auto"
            >
              {status === 'sending' ? 'Wird gesendet...' : 'Nachricht senden'}
            </button>
          </form>
        </section>

        {/* Contact Info + Map */}
        <section>
          <h2 className="mb-6 text-2xl font-bold text-gray-900">Kontaktdaten</h2>

          <div className="mb-8 space-y-4 text-gray-700">
            <div className="flex items-start gap-3">
              <span className="text-xl">📍</span>
              <div>
                <p className="font-medium">Adresse</p>
                <p>Rösslimattstrasse 2c</p>
                <p>CH-5033 Buchs AG</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xl">📞</span>
              <div>
                <p className="font-medium">Telefon</p>
                <a href="tel:+41786112479" className="text-rose-600 hover:text-rose-700">
                  +41 78 611 24 79
                </a>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xl">✉️</span>
              <div>
                <p className="font-medium">E-Mail</p>
                <a href="mailto:info@dj-training.com" className="text-rose-600 hover:text-rose-700">
                  info@dj-training.com
                </a>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xl">🕐</span>
              <div>
                <p className="font-medium">Öffnungszeiten</p>
                <p>Montag–Freitag: 9:00–12:00 &amp; 16:00–21:00</p>
                <p>Samstag &amp; Sonntag: Geschlossen</p>
              </div>
            </div>
          </div>

          {/* Google Maps embed */}
          <div className="overflow-hidden rounded-lg">
            <iframe
              title="Standort DJ's Training — Rösslimattstrasse 2c, Buchs AG"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2714.5!2d8.0805!3d47.3897!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s!2sR%C3%B6sslimattstrasse+2c%2C+5033+Buchs+AG%2C+Switzerland!5e0!3m2!1sde!2sch"
              width="100%"
              height="300"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </section>
      </div>
    </div>
  );
}
