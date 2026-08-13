'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { grades } from '@/data/students';
import { supabase } from '@/lib/supabase';
import { formatElapsed } from './dashboard';
import { DESTINATIONS, destinationLabel, isDestination, type Destination } from '@/lib/destinations';
import { DestinationBadge } from './destination-badge';

type HallwayEvent = { id: string | number; student_id: string; student_name: string; grade: string; section: string | null; destination: Destination | null; out_at: string; in_at: string | null; duration_seconds: number | null };
const localDate = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const clock = (value: string | null) => value ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'CURRENTLY OUT';
const csvCell = (value: string | number | null) => `"${String(value ?? '').replaceAll('"', '""')}"`;

function downloadCsv(events: HallwayEvent[], filename: string) {
  const header = ['Student', 'Grade', 'Section', 'Destination', 'Out Time', 'In Time', 'Duration'];
  const rows = events.map(event => [event.student_name, event.grade, event.section, destinationLabel(event.destination), clock(event.out_at), event.in_at ? clock(event.in_at) : '', event.duration_seconds === null ? 'OPEN' : formatElapsed(event.duration_seconds)]);
  const csv = `\uFEFF${[header, ...rows].map(row => row.map(csvCell).join(',')).join('\r\n')}`;
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url);
}

export function DailyLog() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [date, setDate] = useState(localDate());
  const [grade, setGrade] = useState('ALL');
  const [query, setQuery] = useState('');
  const [destination, setDestination] = useState<'ALL' | Destination>('ALL');
  const [events, setEvents] = useState<HallwayEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState(localDate());
  const [endDate, setEndDate] = useState(localDate());

  useEffect(() => {
    if (!supabase) { setChecking(false); return; }
    void supabase.auth.getSession().then(({ data }) => { setSession(data.session); setChecking(false); });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!session || !supabase) return;
    const from = new Date(`${date}T00:00:00`).toISOString();
    const toDate = new Date(`${date}T00:00:00`); toDate.setDate(toDate.getDate() + 1);
    setLoading(true); setError('');
    void supabase.from('hallway_events').select('*').gte('out_at', from).lt('out_at', toDate.toISOString()).order('out_at', { ascending: false }).then(({ data, error: requestError }) => {
      if (requestError) { setError(requestError.message.toLowerCase().includes('permission') ? 'STAFF ACCESS REQUIRED' : 'DAILY LOG UNAVAILABLE'); setEvents([]); }
      else setEvents(((data ?? []) as HallwayEvent[]).map(event => ({ ...event, destination: isDestination(event.destination) ? event.destination : null })));
      setLoading(false);
    });
  }, [date, session]);

  const filtered = useMemo(() => events.filter(event => (grade === 'ALL' || event.grade === grade) && (destination === 'ALL' || event.destination === destination) && event.student_name.toLowerCase().includes(query.trim().toLowerCase())), [destination, events, grade, query]);
  const completed = events.filter(event => event.duration_seconds !== null);
  const average = completed.length ? completed.reduce((sum, event) => sum + (event.duration_seconds ?? 0), 0) / completed.length : 0;
  const longest = Math.max(0, ...completed.map(event => event.duration_seconds ?? 0));
  const destinationTotals = Object.fromEntries(DESTINATIONS.map(item => [item, events.filter(event => event.destination === item).length])) as Record<Destination, number>;

  async function exportRange() {
    if (!supabase || startDate > endDate) { setError('Choose a valid date range.'); return; }
    const after = new Date(`${endDate}T00:00:00`); after.setDate(after.getDate() + 1);
    const { data, error: rangeError } = await supabase.from('hallway_events').select('*').gte('out_at', new Date(`${startDate}T00:00:00`).toISOString()).lt('out_at', after.toISOString()).order('out_at');
    if (rangeError) setError('Unable to export date range.');
    else downloadCsv(((data ?? []) as HallwayEvent[]).map(event => ({ ...event, destination: isDestination(event.destination) ? event.destination : null })), `Mesquite-ICS-Hallway-Log-${startDate}-to-${endDate}.csv`);
  }

  async function signOut() {
    await supabase?.auth.signOut();
    router.replace('/');
  }

  if (checking) return <main className="p-10 text-center font-black">CHECKING STAFF ACCESS...</main>;
  if (!session) return <main className="flex min-h-screen items-center justify-center p-4"><div className="rounded-xl bg-white p-8 text-center shadow-card"><p className="text-2xl font-black text-navy">MESQUITE ICS</p><p className="mt-2 font-black text-red-800">STAFF ACCESS REQUIRED</p><Link href="/" className="mt-6 inline-block rounded-lg bg-navy px-5 py-3 font-black text-white">STAFF SIGN IN</Link></div></main>;
  return <main className="mx-auto max-w-7xl p-4 sm:p-6">
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3"><div><p className="text-3xl font-black text-navy">MESQUITE ICS</p><h1 className="font-black tracking-wider text-gold-dark">HALLWAY MONITOR — DAILY LOG</h1></div><div className="flex gap-2"><Link href="/" className="rounded-lg border-2 border-navy px-4 py-2 font-black text-navy">LIVE TRACKER</Link><button onClick={() => void signOut()} className="rounded-lg bg-navy px-4 py-2 font-black text-white">SIGN OUT</button></div></div>
    <div className="mb-5 grid gap-3 rounded-xl bg-white p-4 shadow-card sm:grid-cols-2 lg:grid-cols-4"><label className="font-bold">Date<input type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 min-h-11 w-full rounded border px-2" /></label><label className="font-bold">Grade<select value={grade} onChange={e => setGrade(e.target.value)} className="mt-1 min-h-11 w-full rounded border px-2"><option>ALL</option>{grades.map(item => <option key={item}>{item}</option>)}</select></label><label className="font-bold">Destination<select value={destination} onChange={e => setDestination(e.target.value as 'ALL' | Destination)} className="mt-1 min-h-11 w-full rounded border px-2"><option value="ALL">ALL DESTINATIONS</option>{DESTINATIONS.map(item => <option key={item} value={item}>{destinationLabel(item).toUpperCase()}</option>)}</select></label><label className="font-bold">Student search<input type="search" value={query} onChange={e => setQuery(e.target.value)} className="mt-1 min-h-11 w-full rounded border px-2" /></label></div>
    <section className="mb-5 grid gap-3 sm:grid-cols-4">{[['OUT-OF-CLASS EVENTS TODAY', events.length], ['AVERAGE TIME OUT', formatElapsed(average)], ['LONGEST TIME OUT', formatElapsed(longest)], ['CURRENTLY OUT', events.filter(event => !event.in_at).length]].map(([label, value]) => <div key={label} className="rounded-xl bg-navy p-4 text-white"><p className="text-xs font-bold text-slate-300">{label}</p><p className="mt-1 text-2xl font-black">{value}</p></div>)}</section>
    <section aria-label="Destination totals" className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">{DESTINATIONS.map(item => <div key={item} className="rounded-lg bg-white p-3 shadow"><p className="truncate text-xs font-black text-slate-600">{destinationLabel(item).toUpperCase()}</p><p className="text-xl font-black text-navy">{destinationTotals[item]}</p></div>)}</section>
    <div className="mb-5 flex flex-wrap items-end gap-3"><button onClick={() => downloadCsv(filtered, `Mesquite-ICS-Hallway-Log-${date}.csv`)} className="min-h-11 rounded-lg bg-emerald-800 px-4 font-black text-white">EXPORT DAILY REPORT</button><label className="font-bold">Start Date<input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="ml-2 min-h-11 rounded border px-2" /></label><label className="font-bold">End Date<input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="ml-2 min-h-11 rounded border px-2" /></label><button onClick={() => void exportRange()} className="min-h-11 rounded-lg bg-navy px-4 font-black text-white">EXPORT DATE RANGE</button></div>
    {error && <p className="mb-4 rounded bg-red-100 p-4 font-black text-red-800">{error}</p>}
    {loading ? <p className="p-8 text-center font-black">LOADING DAILY LOG...</p> : <div className="overflow-x-auto rounded-xl bg-white shadow-card"><table className="w-full text-left"><thead className="bg-slate-100"><tr>{['Student', 'Grade', 'Section', 'Destination', 'Time Out', 'Time In', 'Duration'].map(label => <th key={label} className="p-3">{label}</th>)}</tr></thead><tbody>{filtered.map(event => <tr key={event.id} className="border-t"><td className="p-3 font-bold">{event.student_name}</td><td className="p-3">{event.grade}</td><td className="p-3">{event.section ?? '—'}</td><td className="p-3"><DestinationBadge destination={event.destination} /></td><td className="p-3">{clock(event.out_at)}</td><td className="p-3">{clock(event.in_at)}</td><td className="p-3">{event.duration_seconds === null ? 'OPEN' : formatElapsed(event.duration_seconds)}</td></tr>)}</tbody></table>{!filtered.length && <p className="p-8 text-center text-slate-500">No events match these filters.</p>}</div>}
  </main>;
}
