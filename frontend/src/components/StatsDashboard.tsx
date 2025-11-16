import { useEffect, useMemo, useState } from 'react';
import pb from '../config/pocketbase';

interface Member {
  matricule: string;
  nom: string;
  prenom: string;
  specialite?: string;
  moyenne?: number;
}

interface Pick {
  subjectCode: string;
  subjectTitle: string;
  priority: number;
  subjectType: 'Classique' | '1275' | string;
  specialty: string;
  isOutOfSpecialty?: boolean;
}

interface ChoiceRow {
  id: string;
  mode: 'monome' | 'binome' | string;
  specialty: string;
  membersIndex: string;
  members?: Member[];
  picks?: Pick[];
  priorityScore: number;
  status: string;
}

function StatsDashboard() {
  const [rows, setRows] = useState<ChoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [specialtyFilter, setSpecialtyFilter] = useState<string>('');

  // --- Chargement des choix depuis PocketBase ---
  useEffect(() => {
    let disposed = false;
    let unsubscribe: (() => void) | undefined;

    const refresh = async () => {
      try {
        setError(null);
        const list = await pb
          .collection('choices')
          .getList<ChoiceRow>(1, 500, {
            sort: '-priorityScore',
          });

        if (!disposed) {
          setRows(list.items);
          setLoading(false);
        }
      } catch (err) {
        console.error('Impossible de charger les classements', err);
        if (!disposed) {
          setError('Impossible de charger les classements.');
          setLoading(false);
        }
      }
    };

    // premier chargement
    refresh();

    // abonnement temps réel
    (async () => {
      try {
        unsubscribe = await pb.collection('choices').subscribe('*', refresh);
      } catch (err) {
        console.error('Subscription choices échouée', err);
      }
    })();

    return () => {
      disposed = true;
      unsubscribe?.();
    };
  }, []);

  // --- Liste des spécialités disponibles ---
  const specialties = useMemo(
    () => Array.from(new Set(rows.map((r) => r.specialty))).sort(),
    [rows],
  );

  const filteredRows = useMemo(
    () =>
      rows.filter((r) =>
        specialtyFilter ? r.specialty === specialtyFilter : true,
      ),
    [rows, specialtyFilter],
  );

  // --- Formatage des noms d’étudiants pour l’affichage ---
  function formatMembers(row: ChoiceRow): string {
    if (Array.isArray(row.members) && row.members.length > 0) {
      return row.members
        .map((m) => `${m.nom} ${m.prenom}`)
        .join(row.members.length === 2 ? ' & ' : ', ');
    }
    // fallback : index des membres si jamais members est vide
    return row.membersIndex;
  }

  // --- Algorithme d’affectation des sujets en fonction du score + priorités ---
  // On ne touche pas à PocketBase : c’est uniquement une simulation côté UI.
  const assignmentsByChoiceId = useMemo(() => {
    const takenSubjects = new Set<string>();
    const result: Record<
      string,
      { subjectCode: string; subjectTitle: string; priority: number }
    > = {};

    // On reparcourt les lignes triées par score décroissant
    const sortedByScore = [...rows].sort(
      (a, b) => b.priorityScore - a.priorityScore,
    );

    for (const row of sortedByScore) {
      const picks = [...(row.picks ?? [])].sort(
        (a, b) => (a.priority || 0) - (b.priority || 0),
      );

      const chosen = picks.find((pick) => !takenSubjects.has(pick.subjectCode));

      if (chosen) {
        takenSubjects.add(chosen.subjectCode);
        result[row.id] = {
          subjectCode: chosen.subjectCode,
          subjectTitle: chosen.subjectTitle,
          priority: chosen.priority,
        };
      }
    }

    return result;
  }, [rows]);

  if (loading) {
    return (
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">
          Chargement des classements…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">
          Aucun choix enregistré pour le moment.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-400">
            Classement en temps réel
          </p>
          <h2 className="text-2xl font-bold text-slate-900">
            Choix enregistrés par priorité
          </h2>
          <p className="text-xs text-slate-500">
            Trié par score de priorité décroissant (moyenne + ordre des choix).
            L&apos;affectation des sujets est calculée en tenant compte du score
            et de la priorité (choix 1 ➝ 4).
          </p>
        </div>

        <select
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          value={specialtyFilter}
          onChange={(e) => setSpecialtyFilter(e.target.value)}
        >
          <option value="">Toutes les spécialités</option>
          {specialties.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
            <tr>
              <th className="py-2">#</th>
              <th className="py-2">Mode</th>
              <th className="py-2">Spécialité</th>
              <th className="py-2">Étudiants</th>
              <th className="py-2">Sujet affecté</th>
              <th className="py-2">Score de priorité</th>
              <th className="py-2">Statut</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row, index) => {
              const assignment = assignmentsByChoiceId[row.id];

              return (
                <tr
                  key={row.id}
                  className="border-b border-slate-100 last:border-b-0"
                >
                  <td className="py-2 pr-2 text-xs text-slate-500">
                    {index + 1}
                  </td>
                  <td className="py-2">
                    {row.mode === 'binome' ? 'Binôme' : 'Monome'}
                  </td>
                  <td className="py-2">{row.specialty}</td>
                  <td className="py-2">{formatMembers(row)}</td>
                  <td className="py-2">
                    {assignment ? (
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800">
                          {assignment.subjectTitle}
                        </span>
                        <span className="text-[11px] uppercase text-slate-400">
                          Code&nbsp;: {assignment.subjectCode} · Choix #
                          {assignment.priority}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">
                        Aucun sujet disponible sur ses 4 choix
                      </span>
                    )}
                  </td>
                  <td className="py-2 font-semibold">
                    {row.priorityScore.toFixed(2)}
                  </td>
                  <td className="py-2 text-xs uppercase text-slate-500">
                    {row.status}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default StatsDashboard;
