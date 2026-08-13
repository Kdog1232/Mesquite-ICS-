'use client';

import { useEffect, useMemo, useState } from 'react';
import { grades, students } from '@/data/students';
import { formatTime, minutesOut } from '@/lib/time';
import { StudentCard } from './student-card';

export type StudentStatus = { status: 'IN' | 'OUT'; outSince: string | null };
type Statuses = Record<string, StudentStatus>;
type View = 'ALL' | 'OUT' | (typeof grades)[number];

const storageKey = 'mesquite-ics-student-statuses';
const defaultStatus: StudentStatus = { status: 'IN', outSince: null };
const statusFor = (statuses: Statuses, id: string) => statuses[id] ?? defaultStatus;

function readStatuses(): Statuses {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(storageKey) ?? '{}');
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return {};
    return Object.fromEntries(
      Object.entries(saved).filter((entry): entry is [string, StudentStatus] => {
        const value = entry[1];
        return Boolean(
          value && typeof value === 'object' && 'status' in value &&
          (value.status === 'IN' || value.status === 'OUT') && 'outSince' in value &&
          (typeof value.outSince === 'string' || value.outSince === null),
        );
      }),
    );
  } catch {
    return {};
  }
}

export function Dashboard() {
  const [statuses, setStatuses] = useState<Statuses>({});
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState<View>('OUT');
  const [query, setQuery] = useState('');
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    setStatuses(readStatuses());
    setLoaded(true);
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const outCount = students.filter((student) => statusFor(statuses, student.id).status === 'OUT').length;
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    let result = students;
    if (needle) {
      result = result.filter((student) =>
        `${student.firstName} ${student.lastName}`.toLowerCase().includes(needle),
      );
    } else if (view === 'OUT') {
      result = result.filter((student) => statusFor(statuses, student.id).status === 'OUT');
    } else if (view !== 'ALL') {
      result = result.filter((student) => student.grade === view);
    }
    return [...result].sort((a, b) =>
      view === 'OUT'
        ? minutesOut(statusFor(statuses, b.id).outSince, now) - minutesOut(statusFor(statuses, a.id).outSince, now)
        : a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName),
    );
  }, [now, query, statuses, view]);

  function toggle(id: string) {
    setStatuses((current) => {
      const currentStatus = current[id]?.status ?? 'IN';
      const next = {
        ...current,
        [id]: currentStatus === 'OUT'
          ? { status: 'IN' as const, outSince: null }
          : { status: 'OUT' as const, outSince: new Date().toISOString() },
      };
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  }

  function select(next: View) {
    setView(next);
    setQuery('');
  }

  return <main className="mx-auto max-w-7xl p-4 sm:p-6">
    <div className="mb-5 grid gap-4 lg:grid-cols-[1fr_auto]">
      <label className="relative block"><span className="sr-only">Search student</span><span aria-hidden className="absolute left-4 top-4 text-slate-400">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search Student..." className="w-full rounded-xl border border-slate-300 bg-white py-4 pl-12 pr-4 shadow-sm"/></label>
      <button onClick={() => select('OUT')} className="flex min-h-14 items-center justify-center gap-3 rounded-xl bg-red-700 px-6 font-black text-white shadow-lg">CURRENTLY OUT: {loaded ? outCount : 0}</button>
    </div>
    <div className="mb-5 rounded-xl bg-white p-4 shadow-card">
      <div className="flex flex-wrap gap-2"><button onClick={() => select('ALL')} className={`rounded-lg px-4 py-3 font-bold ${view === 'ALL' ? 'bg-navy text-white' : 'bg-slate-100'}`}>ALL STUDENTS</button><button onClick={() => select('OUT')} className={`rounded-lg px-4 py-3 font-bold ${view === 'OUT' ? 'bg-red-700 text-white' : 'bg-red-50 text-red-800'}`}>CURRENTLY OUT</button>{grades.map((grade) => <button key={grade} onClick={() => select(grade)} className={`min-w-12 rounded-lg px-4 py-3 font-bold ${view === grade ? 'bg-navy text-white' : 'bg-slate-100 hover:bg-slate-200'}`}>{grade}</button>)}</div>
    </div>
    <h1 className="mb-4 text-2xl font-black text-navy">{query ? 'Search Results' : view === 'OUT' ? 'Currently Out' : view === 'ALL' ? 'All Students' : `Grade ${view}`} — {visible.length}</h1>
    <div className="grid gap-3">{visible.map((student) => <StudentCard key={student.id} student={student} status={statusFor(statuses, student.id)} now={now} onToggle={() => toggle(student.id)}/>)}{!visible.length && <div className="rounded-xl border border-dashed bg-white p-10 text-center text-slate-500">No matching students.</div>}</div>
    {view === 'OUT' && visible.length > 0 && <p className="mt-4 text-sm text-slate-500">Longest out students appear first. Times are saved only on this device.</p>}
    <span className="sr-only">Current time {formatTime(new Date(now).toISOString())}</span>
  </main>;
}
