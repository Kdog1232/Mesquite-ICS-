'use client';

import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, supabaseConfigurationError } from '@/lib/supabase';
import { Dashboard } from './dashboard';
import { Header } from './header';

export function StaffApp() {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(supabaseConfigurationError ?? '');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!supabase) { setChecking(false); return; }
    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (sessionError) setError('STAFF ACCESS REQUIRED');
      setSession(data.session);
      setChecking(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setChecking(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function signIn(event: React.FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setSubmitting(true); setError('');
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) setError('STAFF ACCESS REQUIRED');
    setSubmitting(false);
  }

  async function signOut() {
    if (supabase) await supabase.auth.signOut();
    setSession(null);
  }

  if (checking) return <div className="flex min-h-screen items-center justify-center font-black text-navy">CHECKING STAFF ACCESS...</div>;
  if (!session) return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={signIn} className="w-full max-w-md rounded-2xl bg-white p-8 shadow-card">
        <p className="text-3xl font-black text-navy">MESQUITE ICS</p>
        <h1 className="mt-1 text-lg font-black tracking-widest text-gold-dark">STAFF ACCESS</h1>
        <label className="mt-8 block font-bold">Staff Email<input required type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 min-h-12 w-full rounded-lg border px-3 font-normal" /></label>
        <label className="mt-4 block font-bold">Password<input required type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 min-h-12 w-full rounded-lg border px-3 font-normal" /></label>
        {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 font-bold text-red-800">{error}</p>}
        <button disabled={submitting || !supabase} className="mt-6 min-h-12 w-full rounded-lg bg-navy font-black text-white disabled:opacity-50">{submitting ? 'SIGNING IN...' : 'SIGN IN'}</button>
      </form>
    </main>
  );

  return <><Header onSignOut={signOut} /><Dashboard /></>;
}
