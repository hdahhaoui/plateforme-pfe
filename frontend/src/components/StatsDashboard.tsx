import { useMemo } from 'react';
import { useSubjects } from '../hooks/useSubjects';
import { useAssignments, Choice } from '../hooks/useAssignments';

const DEFAULT_QUOTA = 1;

function StatsDashboard() {
  const { subjects } = useSubjects();
  const assignments = useAssignments();

  const subjectStats = useMemo(() => {
    const map = new Map<
      string,
      {
        assigned: Choice[];
        waiting: { choice: Choice; position: number }[];
        total: number;
      }
    >();

    subjects.forEach((subject) => {
      map.set(subject.code, { assigned: [], waiting: [], total: 0 });
    });

    assignments.forEach((choice) => {
      choice.queuePositions?.forEach((queue) => {
        const stats = map.get(queue.subjectCode);
        if (!stats) return;
        stats.total += 1;
        const isAssigned = choice.currentAssignment?.subjectCode === queue.subjectCode;
        if (isAssigned) {
          stats.assigned.push(choice);
        } else {
          stats.waiting.push({ choice, position: queue.position });
        }
      });
    });

    return map;
  }, [subjects, assignments]);

  const rows = useMemo(
    () =>
      assignments.map((choice) => ({
        id: choice.id,
        members: choice.members.map((m) => m.matricule).join(', '),
        priorityScore: choice.priorityScore,
        status: choice.status,
        currentAssignment: choice.currentAssignment?.subjectCode,
        needsAttention: choice.needsAttention,
      })),
    [assignments],
  );

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-semibold text-slate-900">Affectations par sujet</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {subjects.map((subject) => {
            const stats = subjectStats.get(subject.code) ?? {
              assigned: [],
              waiting: [],
              total: 0,
            };
            return (
              <div key={subject.code} className="rounded-xl bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">{subject.titre}</p>
                    <p className="text-xs text-slate-400">
                      {subject.specialite} · {subject.type_sujet} · quota {DEFAULT_QUOTA}
                    </p>
                  </div>
                  <span className="text-xs text-slate-500">{stats.total} choix</span>
                </div>
                <div className="mt-3">
                  <p className="text-xs font-semibold uppercase text-slate-400">Attribués</p>
                  <ul className="space-y-1 text-sm">
                    {stats.assigned.length > 0 ? (
                      stats.assigned.map((choice) => (
                        <li
                          key={`${subject.code}-assigned-${choice.id}`}
                          className="flex items-center justify-between rounded bg-slate-50 px-2 py-1"
                        >
                          <span>{choice.members.map((m) => m.matricule).join(' + ')}</span>
                          <span className="text-xs text-slate-500">{choice.priorityScore}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-xs text-slate-400">Personne pour le moment.</li>
                    )}
                  </ul>
                </div>
                <div className="mt-3">
                  <p className="text-xs font-semibold uppercase text-slate-400">File d'attente</p>
                  <ul className="space-y-1 text-sm">
                    {stats.waiting.length > 0 ? (
                      stats.waiting
                        .sort((a, b) => a.position - b.position)
                        .map(({ choice, position }) => (
                          <li
                            key={`${subject.code}-waiting-${choice.id}`}
                            className="flex items-center justify-between rounded px-2 py-1"
                          >
                            <span>{choice.members.map((m) => m.matricule).join(' + ')}</span>
                            <span className="text-xs text-slate-500">rang {position}</span>
                          </li>
                        ))
                    ) : (
                      <li className="text-xs text-slate-400">Aucune attente.</li>
                    )}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Liste des équipes</h2>
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-slate-100 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Équipe</th>
                <th className="px-4 py-3 text-left">Score</th>
                <th className="px-4 py-3 text-left">Affectation</th>
                <th className="px-4 py-3 text-left">Statut</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-700">{row.members}</td>
                  <td className="px-4 py-3">{row.priorityScore}</td>
                  <td className="px-4 py-3 text-slate-600">{row.currentAssignment || '—'}</td>
                  <td className="px-4 py-3">
                    {row.needsAttention ? (
                      <span className="rounded bg-red-100 px-2 py-1 text-xs font-semibold text-red-600">
                        Aucun sujet disponible
                      </span>
                    ) : (
                      <span className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                        {row.status}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                    Aucun choix enregistré.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default StatsDashboard;
