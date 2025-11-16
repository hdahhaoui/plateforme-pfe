import { useEffect, useState } from 'react';
import pb from '../config/pocketbase';

interface ChoiceRow {
  id: string;
  mode: 'monome' | 'binome';
  specialty: string;
  membersIndex: string;
  priorityScore: number;
  status: string;
}

function StatsDashboard() {
  const [rows, setRows] = useState<ChoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let disposed = false;
    let unsubscribe: (() => void) | undefined;

    const refresh = async () => {
      try {
        const list = await pb
          .collection('choices')
          .getList<ChoiceRow>(1, 200, { sort: '-priorityScore' });

        if (!disposed) {
          setRows(list.items);
          setLoading(false);
        }
      } catch (err) {
        console.error('Impossible de charger les classements', err);
        if (!disposed) {
          setError("Impossible de charger les classements.");
          setLoading(false);
        }
      }
    };

    refresh();

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

  if (loading) {
    return <p className="text-sm text-slate-500">Chargement des classements…</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (rows.length === 0) {
    return <p className="text-sm text-slate-500">Aucun choix enregistré pour le moment.</p>;
  }

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-slate-900">
        Classement (tous les choix par priorité)
      </h2>
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
          <tr>
            <th className="py-2">Binôme / Monôme</th>
            <th className="py-2">Spécialité</th>
            <th className="py-2">Index membres</th>
            <th className="py-2">Score de priorité</th>
            <th className="py-2">Statut</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-slate-100">
              <td className="py-2">{row.mode === 'binome' ? 'Binôme' : 'Monome'}</td>
              <td className="py-2">{row.specialty}</td>
              <td className="py-2">{row.membersIndex}</td>
              <td className="py-2 font-semibold">{row.priorityScore.toFixed(2)}</td>
              <td className="py-2 text-xs uppercase text-slate-500">{row.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default StatsDashboard;
