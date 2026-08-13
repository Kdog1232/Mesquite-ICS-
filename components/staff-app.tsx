'use client';

import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, supabaseConfigurationError } from '@/lib/supabase';
import { Dashboard } from './dashboard';
import { Header } from './header';

export function StaffApp() {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [campusPassword, setCampusPassword] = useState('');
  const [error, setError] = useState(supabaseConfigurationError ?? '');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!supabase) { setChecking(false); return; }
    let active = true;
    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return;
      if (sessionError) {
        console.error('Supabase session initialization failed', { operation: 'auth.getSession', message: sessionError.message });
        setError('STAFF ACCESS REQUIRED');
      }
      setSession(data.session);
      setChecking(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      // INITIAL_SESSION and TOKEN_REFRESHED are both authoritative session
      // updates. Realtime channel state is deliberately not used for auth.
      setSession(nextSession);
      setChecking(false);
    });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, []);

  async function signIn(event: React.FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setSubmitting(true); setError('');
    try {
      const response = await fetch('/api/auth/campus-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campusPassword }),
      });
      const result = await response.json() as { accessToken?: string; refreshToken?: string; error?: string };
      if (!response.ok || !result.accessToken || !result.refreshToken) {
        setError(result.error ?? 'Unable to sign in. Please try again.');
      } else {
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: result.accessToken,
          refresh_token: result.refreshToken,
        });
        if (sessionError || !sessionData.session) setError('Unable to sign in. Please try again.');
        else {
          // Do not render Dashboard until setSession has installed and returned
          // the authenticated browser session.
          const { data: verification, error: verificationError } = await supabase.auth.getSession();
          if (verificationError || !verification.session) setError('Unable to sign in. Please try again.');
          else { setSession(verification.session); setCampusPassword(''); }
        }
      }
    } catch {
      setError('Unable to sign in. Please try again.');
    }
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
        <p className="mt-6 text-slate-700">Enter the campus password provided by administration to access the live Hallway Monitor.</p>
        <label className="mt-6 block font-bold">Campus Password<input required type="password" autoComplete="current-password" value={campusPassword} onChange={(e) => setCampusPassword(e.target.value)} className="mt-2 min-h-12 w-full rounded-lg border px-3 font-normal" /></label>
        {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 font-bold text-red-800">{error}</p>}
        <button disabled={submitting || !supabase} className="mt-6 min-h-12 w-full rounded-lg bg-navy font-black text-white disabled:opacity-50">{submitting ? 'ENTERING...' : 'ENTER HALLWAY MONITOR'}</button>
      </form>
    </main>
  );

  return <><Header onSignOut={signOut} /><Dashboard session={session} /></>;
}
