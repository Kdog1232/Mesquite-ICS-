'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { PostgrestError, RealtimeChannel, RealtimePostgresChangesPayload, Session } from '@supabase/supabase-js';
import { grades, students, type Student } from '@/data/students';
import { supabase } from '@/lib/supabase';
import { StudentCard } from './student-card';
import { DestinationSelector } from './destination-selector';
import { DESTINATIONS, destinationDetails, isDestination, type Destination } from '@/lib/destinations';

export type StudentStatus = 'IN' | 'OUT';
export type LiveStatus = { status: StudentStatus; destination: Destination | null; outAt: string | null; updatedAt: string };
type StatusRow = { student_id: string; status: StudentStatus; destination: Destination | null; out_at: string | null; updated_at: string };
type Statuses = Record<string, LiveStatus>;
type View = 'ALL' | 'OUT' | (typeof grades)[number];
type Section = 'ALL' | '6A' | '6B' | '8A' | '8B';
type ConnectionState = 'connecting' | 'connected' | 'offline';
type LoadError = 'auth' | 'schema' | 'permission' | 'connection' | null;

const RECONNECT_DELAY_MS = 3_000;
const OFFLINE_AFTER_MS = 10_000;

function validRow(value: unknown): value is StatusRow {
  if (!value || typeof value !== 'object') return false;
  const row = value as Partial<StatusRow>;
  return typeof row.student_id === 'string' && (row.status === 'IN' || row.status === 'OUT') && (row.destination === null || isDestination(row.destination)) && typeof row.updated_at === 'string';
}

function classifyQueryError(error: PostgrestError, hasSession: boolean): Exclude<LoadError, null> {
  const detail = `${error.code} ${error.message} ${error.details ?? ''} ${error.hint ?? ''}`.toLowerCase();
  if (error.code === '42703' || error.code === 'PGRST204' || detail.includes('column') && detail.includes('destination')) return 'schema';
  if (!hasSession || error.code === 'PGRST301' || detail.includes('jwt') || detail.includes('unauthorized')) return 'auth';
  if (error.code === '42501' || detail.includes('permission denied') || detail.includes('row-level security')) return 'permission';
  return 'connection';
}

export function formatElapsed(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const remainder = safe % 60;
  return hours ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}` : `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}

export function Dashboard({ session }: { session: Session }) {
  const [statuses, setStatuses] = useState<Statuses>({});
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [loadError, setLoadError] = useState<LoadError>(null);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');
  const [updating, setUpdating] = useState<Set<string>>(new Set());
  const [updateError, setUpdateError] = useState('');
  const [now, setNow] = useState(() => Date.now());
  const [view, setView] = useState<View>('PK');
  const [query, setQuery] = useState('');
  const [section, setSection] = useState<Section>('ALL');
  const [selectingDestination, setSelectingDestination] = useState<Student | null>(null);

  const applyRows = useCallback((rows: StatusRow[]) => setStatuses(Object.fromEntries(rows.filter(validRow).map(row => [row.student_id, { status: row.status, destination: row.destination, outAt: row.out_at, updatedAt: row.updated_at }]))), []);
  const refetch = useCallback(async () => {
    if (!supabase) { setLoadError('connection'); setLoadState('error'); return false; }
    const { data, error } = await supabase.from('student_status').select('student_id,status,destination,out_at,updated_at');
    if (error) {
      const kind = classifyQueryError(error, Boolean(session));
      console.error('Supabase query failed', { operation: 'student_status.select', code: error.code, message: error.message, kind });
      setLoadError(kind); setLoadState('error'); return false;
    }
    applyRows((data ?? []) as StatusRow[]); setLoadError(null); setLoadState('ready'); return true;
  }, [applyRows, session]);

  const retry = useCallback(async () => {
    if (!supabase) return;
    setLoadState('loading');
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) {
      console.error('Supabase session verification failed', { operation: 'auth.getSession', message: error?.message ?? 'No session returned' });
      setLoadError('auth'); setLoadState('error'); return;
    }
    const expiresSoon = typeof data.session.expires_at === 'number' && data.session.expires_at * 1000 <= Date.now() + 60_000;
    if (expiresSoon) {
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        console.error('Supabase session refresh failed', { operation: 'auth.refreshSession', message: refreshError.message });
        setLoadError('auth'); setLoadState('error'); return;
      }
    }
    setReconnectAttempt(value => value + 1);
    await refetch();
  }, [refetch]);

  useEffect(() => { void refetch(); }, [refetch]);
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, []);
  useEffect(() => {
    if (!supabase) { setConnectionState('offline'); return; }
    const client = supabase;
    let channel: RealtimeChannel | null = null;
    let reconnectTimer: number | undefined;
    let offlineTimer: number | undefined;
    let stopped = false;
    let connectionFailedLongEnough = false;

    const receive = (payload: RealtimePostgresChangesPayload<StatusRow>) => {
      if (!validRow(payload.new)) return;
      const row = payload.new;
      setStatuses(current => ({ ...current, [row.student_id]: { status: row.status, destination: row.destination, outAt: row.out_at, updatedAt: row.updated_at } }));
    };

    const clearReconnectTimers = () => {
      if (reconnectTimer !== undefined) window.clearTimeout(reconnectTimer);
      if (offlineTimer !== undefined) window.clearTimeout(offlineTimer);
      reconnectTimer = undefined;
      offlineTimer = undefined;
    };

    const connect = () => {
      if (stopped) return;
      if (!connectionFailedLongEnough) setConnectionState('connecting');
      const nextChannel = client.channel('campus-status')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'student_status' }, receive)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'student_status' }, receive);
      channel = nextChannel;
      nextChannel.subscribe(status => {
        if (stopped || channel !== nextChannel) return;
        if (status === 'SUBSCRIBED') {
          clearReconnectTimers();
          connectionFailedLongEnough = false;
          setConnectionState('connected');
          void refetch();
          return;
        }
        if (status !== 'CHANNEL_ERROR' && status !== 'TIMED_OUT' && status !== 'CLOSED') return;

        if (!connectionFailedLongEnough) setConnectionState('connecting');
        if (offlineTimer === undefined) {
          offlineTimer = window.setTimeout(() => {
            if (!stopped) {
              connectionFailedLongEnough = true;
              setConnectionState('offline');
            }
          }, OFFLINE_AFTER_MS);
        }
        if (reconnectTimer === undefined) {
          reconnectTimer = window.setTimeout(() => {
            reconnectTimer = undefined;
            if (stopped || channel !== nextChannel) return;
            channel = null;
            void client.removeChannel(nextChannel).finally(connect);
          }, RECONNECT_DELAY_MS);
        }
      });
    };

    connect();
    return () => {
      stopped = true;
      clearReconnectTimers();
      const activeChannel = channel;
      channel = null;
      if (activeChannel) void client.removeChannel(activeChannel);
    };
  }, [reconnectAttempt, refetch]);

  const statusFor = useCallback((id: string): LiveStatus => statuses[id] ?? { status: 'IN', destination: null, outAt: null, updatedAt: '' }, [statuses]);
  const elapsedFor = useCallback((id: string) => { const start = statusFor(id).outAt; return start ? Math.max(0, (now - new Date(start).getTime()) / 1000) : 0; }, [now, statusFor]);
  const outCount = students.filter(student => statusFor(student.id).status === 'OUT').length;
  const outStudents = useMemo(() => students.filter(student => statusFor(student.id).status === 'OUT').sort((a, b) => elapsedFor(b.id) - elapsedFor(a.id)), [elapsedFor, statusFor]);
  const destinationCounts = useMemo(() => Object.fromEntries(DESTINATIONS.map(destination => [destination, outStudents.filter(student => statusFor(student.id).destination === destination).length])) as Record<Destination, number>, [outStudents, statusFor]);
  const restroomStudents = outStudents.filter(student => statusFor(student.id).destination === 'RESTROOM');
  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    const result = needle ? students.filter(student => student.name.toLocaleLowerCase().includes(needle))
      : view === 'OUT' ? students.filter(student => statusFor(student.id).status === 'OUT')
      : view === 'ALL' ? students : students.filter(student => student.grade === view && (section === 'ALL' || student.section === section));
    return [...result].sort((a, b) => view === 'OUT' ? elapsedFor(b.id) - elapsedFor(a.id) : a.name.localeCompare(b.name));
  }, [elapsedFor, query, section, statusFor, view]);

  async function setStatus(student: Student, destination: Destination | null) {
    if (!supabase || updating.has(student.id)) return;
    const next = destination ? 'OUT' : 'IN';
    setUpdating(current => new Set(current).add(student.id)); setUpdateError('');
    const { error } = await supabase.rpc('set_student_hallway_status', { p_student_id: student.id, p_status: next, p_destination: destination, p_student_name: student.name, p_grade: student.grade, p_section: student.section ?? null });
    if (error) {
      console.error('Supabase RPC failed', { operation: 'set_student_hallway_status', code: error.code, message: error.message });
      setUpdateError(error.code === 'PGRST202' ? 'DATABASE UPDATE REQUIRED' : 'Unable to update live status. Please try again.');
    }
    else await refetch();
    setUpdating(current => { const copy = new Set(current); copy.delete(student.id); return copy; });
  }
  function toggle(student: Student) {
    if (statusFor(student.id).status === 'IN') setSelectingDestination(student);
    else void setStatus(student, null);
  }
  function chooseDestination(destination: Destination) {
    const student = selectingDestination;
    if (!student) return;
    setSelectingDestination(null);
    void setStatus(student, destination);
  }
  function select(next: View) { setView(next); setQuery(''); setSection('ALL'); }

  if (loadState === 'loading') return <main className="mx-auto max-w-6xl p-8 text-center text-xl font-black text-navy">SYNCING LIVE CAMPUS STATUS...</main>;
  if (loadState === 'error') {
    const copy = loadError === 'auth'
      ? ['LIVE STATUS UNAVAILABLE', 'STAFF ACCESS REQUIRED']
      : loadError === 'schema'
        ? ['DATABASE UPDATE REQUIRED', 'The hallway destination migration must be applied.']
        : loadError === 'permission'
          ? ['LIVE STATUS TEMPORARILY UNAVAILABLE', 'DATABASE PERMISSION ERROR']
          : ['LIVE STATUS TEMPORARILY UNAVAILABLE', 'Unable to reach live campus status.'];
    return <main className="mx-auto max-w-6xl p-8 text-center"><p className="text-2xl font-black text-red-800">{copy[0]}</p><p className="mt-2 font-bold">{copy[1]}</p><button onClick={() => void retry()} className="mt-6 rounded-lg bg-navy px-5 py-3 font-black text-white">RETRY</button></main>;
  }
  const title = query ? 'Search Results' : view === 'OUT' ? 'Currently Out' : view === 'ALL' ? 'All Students' : `Grade ${view}`;
  const connectionIndicator = connectionState === 'connected'
    ? { className: 'bg-emerald-100 text-emerald-900', label: 'LIVE CAMPUS STATUS ●' }
    : connectionState === 'connecting'
      ? { className: 'bg-amber-100 text-amber-900', label: 'RECONNECTING... ●' }
      : { className: 'bg-red-100 text-red-900', label: 'CAMPUS STATUS OFFLINE ●' };
  return <main className="mx-auto max-w-6xl p-4 sm:p-6">
    {selectingDestination && <DestinationSelector studentName={selectingDestination.name} busy={updating.has(selectingDestination.id)} onSelect={chooseDestination} onCancel={() => setSelectingDestination(null)} />}
    <div role="status" aria-live="polite" className={`mb-4 inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-black ${connectionIndicator.className}`}>{connectionIndicator.label}</div>
    {updateError && <p role="alert" className="mb-4 rounded-lg bg-red-100 p-4 font-black text-red-900">{updateError}</p>}
    <section aria-label="Live destination totals" className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8"><button onClick={() => select('OUT')} className="rounded-xl bg-red-700 p-3 text-left text-white shadow"><span className="block text-xs font-black">CURRENTLY OUT</span><span className="text-2xl font-black">{outCount}</span></button>{DESTINATIONS.map(destination => <div key={destination} className="rounded-xl bg-white p-3 shadow"><span className="block truncate text-xs font-black uppercase text-slate-600">{destinationDetails[destination].icon} {destinationDetails[destination].label}</span><span className="text-2xl font-black text-navy">{destinationCounts[destination]}</span></div>)}</section>
    <section className="mb-5 rounded-xl border-2 border-blue-700 bg-blue-50 p-4 shadow-card"><div className="flex flex-wrap items-baseline justify-between gap-2"><h2 className="text-xl font-black text-navy">🚻 RESTROOM STATUS</h2><p className="font-black text-blue-900">{restroomStudents.length} {restroomStudents.length === 1 ? 'STUDENT' : 'STUDENTS'} CURRENTLY OUT</p></div>{restroomStudents.length ? <div className="mt-3 grid gap-2 sm:grid-cols-2">{restroomStudents.map(student => <div key={student.id} className="flex items-center justify-between rounded-lg bg-white p-3"><div><p className="font-black">{student.name}</p><p className="text-sm font-semibold text-slate-600">Grade {student.grade}</p></div><p className="font-mono text-lg font-black text-red-800">{formatElapsed(elapsedFor(student.id))}</p></div>)}</div> : <p className="mt-2 text-sm font-semibold text-slate-600">No students are currently out to the restroom.</p>}</section>
    <div className="mb-5 grid gap-3 md:grid-cols-[1fr_auto]"><label><span className="sr-only">Search student</span><input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search Student..." className="min-h-14 w-full rounded-xl border border-slate-300 bg-white px-5 text-lg shadow-sm" /></label><button onClick={() => select('OUT')} className="min-h-14 rounded-xl bg-red-700 px-7 text-lg font-black text-white shadow-md">CURRENTLY OUT: {outCount}</button></div>
    <nav aria-label="Select grade" className="mb-6 rounded-xl bg-white p-4 shadow-card"><div className="grid grid-cols-4 gap-2 sm:grid-cols-8"><button onClick={() => select('ALL')} className={`grade-button ${view === 'ALL' ? 'grade-button-active' : ''}`}>ALL</button>{grades.map(grade => <button key={grade} onClick={() => select(grade)} className={`grade-button ${view === grade ? 'grade-button-active' : ''}`}>{grade}</button>)}</div></nav>
    {(view === '6' || view === '8') && !query && <nav aria-label={`Filter Grade ${view} by section`} className="mb-6 flex gap-2">{(['ALL', `${view}A`, `${view}B`] as Section[]).map(option => <button key={option} onClick={() => setSection(option)} className={`grade-button min-w-20 ${section === option ? 'grade-button-active' : ''}`}>{option}</button>)}</nav>}
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-black text-navy">{title} — {visible.length}</h1>{view === 'OUT' && <button onClick={() => select('PK')} className="rounded-lg border-2 border-navy px-4 py-2 font-bold text-navy">Return to grade view</button>}</div>
    <div className="grid gap-3">{visible.map(student => <StudentCard key={student.id} student={student} status={statusFor(student.id).status} destination={statusFor(student.id).destination} elapsedSeconds={elapsedFor(student.id)} showGrade={Boolean(query) || view === 'OUT' || view === 'ALL'} updating={updating.has(student.id)} onToggle={() => toggle(student)} />)}{!visible.length && <div className="rounded-xl border border-dashed bg-white p-10 text-center text-slate-500">No matching students.</div>}</div>
  </main>;
}
