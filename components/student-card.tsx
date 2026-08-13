import type { Student } from '@/data/students';
import type { StudentStatus } from './dashboard';
import { StatusToggle } from './status-toggle';
import { formatElapsed } from './dashboard';
import type { Destination } from '@/lib/destinations';
import { DestinationBadge } from './destination-badge';

type Props = {
  student: Student;
  status: StudentStatus;
  destination: Destination | null;
  showGrade: boolean;
  elapsedSeconds: number;
  updating: boolean;
  onToggle: () => void;
};

export function StudentCard({ student, status, destination, showGrade, elapsedSeconds, updating, onToggle }: Props) {
  const out = status === 'OUT';

  return (
    <article className={`rounded-xl border-2 bg-white p-4 shadow-card sm:flex sm:items-center sm:justify-between ${out ? 'border-red-300' : 'border-transparent'}`}>
      <div>
        <h2 className="text-lg font-black uppercase sm:text-xl">{student.name}</h2>
        {showGrade && <p className="mt-1 font-semibold text-slate-600">Grade {student.grade}{student.section ? ` · Section ${student.section}` : ''}</p>}
        <p className={`mt-1 font-black ${out ? 'text-red-800' : 'text-emerald-800'}`}>{status}</p>
        {out && <><div className="my-2"><DestinationBadge destination={destination} /></div><p className="font-black text-red-800">OUT FOR: {formatElapsed(elapsedSeconds)}</p>{elapsedSeconds >= 600 ? <p className="mt-1 rounded bg-red-800 px-2 py-1 font-black text-white">ATTENTION — 10+ MINUTES OUT</p> : elapsedSeconds >= 300 ? <p className="font-black text-amber-700">5+ MINUTES OUT</p> : null}</>}
      </div>
      <div className="mt-4 sm:ml-6 sm:mt-0">
        <StatusToggle name={student.name} status={status} disabled={updating} onChange={onToggle} />
      </div>
    </article>
  );
}
