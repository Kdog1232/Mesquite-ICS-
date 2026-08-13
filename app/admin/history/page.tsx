import { redirect } from 'next/navigation';

import { Header } from '@/components/header';
import { createClient, getRole } from '@/lib/supabase/server';
import { formatTime } from '@/lib/time';

type HistoryRow = {
  id: string;
  student_id: string;
  out_at: string;
  in_at: string | null;
  duration_minutes: number | null;
  students: {
    first_name: string;
    last_name: string;
    grade: string;
    section: string;
  } | null;
};

type HistorySearchParams = {
  date?: string;
  student?: string;
  grade?: string;
  section?: string;
};

export default async function History({
  searchParams,
}: {
  searchParams: HistorySearchParams;
}) {
  const role = await getRole();
  if (role !== 'ADMIN') redirect('/');

  const db = createClient();
  let query = db
    .from('bathroom_visits')
    .select(
      'id,student_id,out_at,in_at,duration_minutes,students!inner(first_name,last_name,grade,section)',
    )
    // PostgREST 12 cannot always infer embedded resources from a hand-maintained
    // Database type. Validate the complete result shape at the query boundary.
    .returns<HistoryRow[]>()
    .order('out_at', { ascending: false })
    .limit(500);

  if (searchParams.date) {
    query = query
      .gte('out_at', `${searchParams.date}T00:00:00`)
      .lt('out_at', `${searchParams.date}T23:59:59.999`);
  }
  if (searchParams.grade) query = query.eq('students.grade', searchParams.grade);
  if (searchParams.section) query = query.eq('students.section', searchParams.section);

  const { data, error } = await query;
  if (error) throw new Error('Unable to load bathroom history.');

  const needle = searchParams.student?.trim().toLowerCase();
  const rows = (data ?? []).filter((visit) => {
    if (!needle) return true;
    if (!visit.students) return false;
    const fullName = `${visit.students.first_name} ${visit.students.last_name}`;
    return fullName.toLowerCase().includes(needle);
  });

  return (
    <>
      <Header role="ADMIN" />
      <main className="mx-auto max-w-7xl p-4 sm:p-6">
        <h1 className="text-3xl font-black text-navy">Bathroom History</h1>
        <p className="text-slate-600">Admin-only audit of bathroom visits.</p>
        <form className="my-5 grid gap-3 rounded-xl bg-white p-4 shadow-card sm:grid-cols-4">
          <input
            aria-label="Date"
            name="date"
            type="date"
            defaultValue={searchParams.date}
            className="rounded-lg border p-3"
          />
          <input
            aria-label="Student"
            name="student"
            placeholder="Student name"
            defaultValue={searchParams.student}
            className="rounded-lg border p-3"
          />
          <input
            aria-label="Grade"
            name="grade"
            placeholder="Grade"
            defaultValue={searchParams.grade}
            className="rounded-lg border p-3"
          />
          <div className="flex gap-2">
            <input
              aria-label="Section"
              name="section"
              placeholder="Section"
              defaultValue={searchParams.section}
              className="min-w-0 flex-1 rounded-lg border p-3"
            />
            <button className="rounded-lg bg-navy px-5 font-bold text-white">
              Filter
            </button>
          </div>
        </form>
        <div className="overflow-x-auto rounded-xl bg-white shadow-card">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100">
              <tr>
                {['Student', 'Grade', 'Section', 'Out Time', 'Return Time', 'Duration'].map(
                  (heading) => (
                    <th className="p-4" key={heading}>
                      {heading}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((visit) => {
                const student = visit.students;
                return (
                  <tr className="border-t" key={visit.id}>
                    <td className="p-4 font-bold">
                      {student ? `${student.last_name}, ${student.first_name}` : 'Unknown student'}
                    </td>
                    <td className="p-4">{student?.grade ?? '—'}</td>
                    <td className="p-4">{student?.section || '—'}</td>
                    <td className="p-4">
                      {new Date(visit.out_at).toLocaleDateString()} {formatTime(visit.out_at)}
                    </td>
                    <td className="p-4">{formatTime(visit.in_at)}</td>
                    <td className="p-4">
                      {visit.duration_minutes == null
                        ? 'Open'
                        : `${visit.duration_minutes} min`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
