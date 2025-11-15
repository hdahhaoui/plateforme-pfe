import { useMemo } from 'react';
import { Student, useStudents } from '../hooks/useStudents';
import { StudentSelection } from '../store/useSelectionStore';

interface Props {
  specialtyFilter?: string;
  selected: StudentSelection[];
  onChange: (students: StudentSelection[]) => void;
  mode: 'monome' | 'binome';
}

function StudentSelector({ specialtyFilter, selected, onChange, mode }: Props) {
  const { students, loading } = useStudents(specialtyFilter);

  const remainingSlots = mode === 'monome' ? 1 : 2;

  const available = useMemo(
    () => students.filter((student) => !selected.some((s) => s.matricule === student.matricule)),
    [students, selected],
  );

  const addStudent = (student: Student) => {
    if (selected.length >= remainingSlots || selected.some((s) => s.matricule === student.matricule)) return;
    onChange([
      ...selected,
      {
        matricule: student.matricule,
        nom: student.nom,
        prenom: student.prenom,
        specialite: student.specialite,
        moyenne: student.moyenne,
      },
    ]);
  };

  const removeStudent = (matricule: string) => {
    onChange(selected.filter((student) => student.matricule !== matricule));
  };

  return (
    <div className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
      <div>
        <p className="text-sm font-semibold text-slate-500">
          {mode === 'monome' ? 'Sélectionnez un étudiant' : 'Sélectionnez deux étudiants'}
        </p>
        <p className="text-xs text-slate-400">
          Liste triée par moyenne décroissante (données issues du fichier `students.csv`).
        </p>
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((student) => (
            <span
              key={student.matricule}
              className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700"
            >
              {student.prenom} {student.nom} · {student.specialite} · {student.moyenne}
              <button
                type="button"
                className="text-xs text-red-600"
                onClick={() => removeStudent(student.matricule)}
              >
                Retirer
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="max-h-72 space-y-2 overflow-auto rounded border border-slate-200 p-3 text-sm">
        {loading && <p className="text-slate-400">Chargement…</p>}
        {!loading &&
          available.map((student) => (
            <button
              type="button"
              key={student.matricule}
              onClick={() => addStudent(student)}
              className="flex w-full items-center justify-between rounded border border-transparent px-2 py-2 text-left hover:border-slate-200 hover:bg-slate-50"
            >
              <span>
                {student.prenom} {student.nom}{' '}
                <span className="text-xs text-slate-400">({student.specialite})</span>
              </span>
              <span className="text-xs font-semibold text-slate-600">{student.moyenne}</span>
            </button>
          ))}
        {!loading && available.length === 0 && (
          <p className="text-slate-400">Aucun étudiant disponible pour cette spécialité.</p>
        )}
      </div>
    </div>
  );
}

export default StudentSelector;
