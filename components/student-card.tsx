import type { Student } from '@/data/students';
import type { StudentStatus } from './dashboard';
import { StatusToggle } from './status-toggle';

type Props = {
  student: Student;
  status: StudentStatus;
  showGrade: boolean;
  onToggle: () => void;
};

export function StudentCard({ student, status, showGrade, onToggle }: Props) {
  const out = status === 'OUT';

  return (
    <article className={`rounded-xl border-2 bg-white p-4 shadow-card sm:flex sm:items-center sm:justify-between ${out ? 'border-red-300' : 'border-transparent'}`}>
      <div>
        <h2 className="text-lg font-black uppercase sm:text-xl">{student.name}</h2>
        {showGrade && <p className="mt-1 font-semibold text-slate-600">Grade {student.grade}</p>}
        <p className={`mt-1 font-black ${out ? 'text-red-800' : 'text-emerald-800'}`}>{status}</p>
      </div>
      <div className="mt-4 sm:ml-6 sm:mt-0">
        <StatusToggle name={student.name} status={status} onChange={onToggle} />
      </div>
    </article>
  );
}
