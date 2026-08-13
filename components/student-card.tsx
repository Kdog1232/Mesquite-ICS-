'use client';

import type { Student } from '@/data/students';
import { formatTime, minutesOut } from '@/lib/time';
import type { StudentStatus } from './dashboard';
import { StatusToggle } from './status-toggle';

export function StudentCard({ student, status, now, onToggle }: { student: Student; status: StudentStatus; now: number; onToggle: () => void }) {
  const out = status.status === 'OUT';
  const minutes = minutesOut(status.outSince, now);
  return <article className={`rounded-xl border-2 p-4 shadow-card sm:flex sm:items-center sm:justify-between ${out ? minutes >= 15 ? 'border-red-500 bg-red-50' : minutes >= 10 ? 'border-amber-400 bg-amber-50' : 'border-red-200 bg-white' : 'border-transparent bg-white'}`}>
    <div><h2 className="text-lg font-black uppercase">{student.firstName} {student.lastName}</h2><p className="text-sm text-slate-600">Grade {student.grade} <span aria-hidden>•</span> {student.section || 'No section'}</p><p className={`mt-2 font-black ${out ? 'text-red-800' : 'text-emerald-800'}`}>STATUS: {status.status}</p>{out && <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold"><span>Out Since: {formatTime(status.outSince)}</span><span>Out For: {minutes} Minute{minutes === 1 ? '' : 's'}</span>{minutes >= 10 && <span className={`font-black ${minutes >= 15 ? 'text-red-800' : 'text-amber-800'}`}>⚠ {minutes >= 15 ? 'ATTENTION — OUT 15+ MINUTES' : 'OUT 10+ MINUTES'}</span>}</div>}</div>
    <div className="mt-4 sm:ml-4 sm:mt-0"><StatusToggle name={`${student.firstName} ${student.lastName}`} status={status.status} disabled={false} onChange={onToggle}/></div>
  </article>;
}
