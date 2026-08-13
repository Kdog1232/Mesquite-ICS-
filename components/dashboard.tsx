'use client';

import { useEffect, useMemo, useState } from 'react';
import { grades, students } from '@/data/students';
import { StudentCard } from './student-card';

export type StudentStatus = 'IN' | 'OUT';
type Statuses = Record<string, StudentStatus>;
type View = 'ALL' | 'OUT' | (typeof grades)[number];
type Section = 'ALL' | '6A' | '6B' | '8A' | '8B';

const storageKey = 'mesquite-ics-student-statuses';

function readStatuses(): Statuses {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(storageKey) ?? '{}');
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return {};

    return Object.fromEntries(
      Object.entries(saved).filter(
        (entry): entry is [string, StudentStatus] => entry[1] === 'IN' || entry[1] === 'OUT',
      ),
    );
  } catch {
    return {};
  }
}

export function Dashboard() {
  const [statuses, setStatuses] = useState<Statuses>({});
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState<View>('PK');
  const [query, setQuery] = useState('');
  const [section, setSection] = useState<Section>('ALL');

  useEffect(() => {
    setStatuses(readStatuses());
    setLoaded(true);
  }, []);

  const statusFor = (id: string): StudentStatus => statuses[id] ?? 'IN';
  const outCount = students.filter((student) => statusFor(student.id) === 'OUT').length;
  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    const result = needle
      ? students.filter((student) => student.name.toLocaleLowerCase().includes(needle))
      : view === 'OUT'
        ? students.filter((student) => statusFor(student.id) === 'OUT')
        : view === 'ALL'
          ? students
          : students.filter(
              (student) => student.grade === view && (section === 'ALL' || student.section === section),
            );

    return [...result].sort((a, b) => a.name.localeCompare(b.name));
  // statuses must refresh the currently-out view.
  }, [query, section, statuses, view]);

  function toggle(id: string) {
    setStatuses((current) => {
      const next: Statuses = { ...current, [id]: (current[id] ?? 'IN') === 'IN' ? 'OUT' : 'IN' };
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  }

  function select(next: View) {
    setView(next);
    setQuery('');
    setSection('ALL');
  }

  const title = query
    ? 'Search Results'
    : view === 'OUT'
      ? 'Currently Out'
      : view === 'ALL'
        ? 'All Students'
        : `Grade ${view}`;

  return (
    <main className="mx-auto max-w-6xl p-4 sm:p-6">
      <div className="mb-5 grid gap-3 md:grid-cols-[1fr_auto]">
        <label>
          <span className="sr-only">Search student</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search Student..."
            className="min-h-14 w-full rounded-xl border border-slate-300 bg-white px-5 text-lg shadow-sm"
          />
        </label>
        <button onClick={() => select('OUT')} className="min-h-14 rounded-xl bg-red-700 px-7 text-lg font-black text-white shadow-md">
          CURRENTLY OUT: {loaded ? outCount : 0}
        </button>
      </div>

      <nav aria-label="Select grade" className="mb-6 rounded-xl bg-white p-4 shadow-card">
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
          <button onClick={() => select('ALL')} className={`grade-button ${view === 'ALL' ? 'grade-button-active' : ''}`}>ALL</button>
          {grades.map((grade) => (
            <button key={grade} onClick={() => select(grade)} className={`grade-button ${view === grade ? 'grade-button-active' : ''}`}>
              {grade}
            </button>
          ))}
        </div>
      </nav>

      {(view === '6' || view === '8') && !query && (
        <nav aria-label={`Filter Grade ${view} by section`} className="mb-6 flex gap-2">
          {(['ALL', `${view}A`, `${view}B`] as Section[]).map((option) => (
            <button
              key={option}
              onClick={() => setSection(option)}
              className={`grade-button min-w-20 ${section === option ? 'grade-button-active' : ''}`}
            >
              {option}
            </button>
          ))}
        </nav>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black text-navy">{title} — {visible.length}</h1>
        {view === 'OUT' && (
          <button onClick={() => select('PK')} className="rounded-lg border-2 border-navy px-4 py-2 font-bold text-navy">
            Return to grade view
          </button>
        )}
      </div>

      <div className="grid gap-3">
        {visible.map((student) => (
          <StudentCard
            key={student.id}
            student={student}
            status={statusFor(student.id)}
            showGrade={Boolean(query) || view === 'OUT' || view === 'ALL'}
            onToggle={() => toggle(student.id)}
          />
        ))}
        {!visible.length && <div className="rounded-xl border border-dashed bg-white p-10 text-center text-slate-500">No matching students.</div>}
      </div>
    </main>
  );
}
