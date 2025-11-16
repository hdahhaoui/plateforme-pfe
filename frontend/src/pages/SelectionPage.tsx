import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import StudentSelector from '../components/StudentSelector';
import ChoiceWizard from '../components/ChoiceWizard';
import { useSelectionStore } from '../store/useSelectionStore';
import { useSubjects } from '../hooks/useSubjects';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

// petite fonction pour nettoyer les libellés de spécialité
function normalizeSpecialtyLabel(raw: string) {
  if (!raw) return '';
  const trimmed = raw.trim();
  return trimmed.replace(/^"(.*)"$/, '$1');
}

function SelectionPage() {
  const query = useQuery();
  const modeQuery = query.get('mode') === 'binome' ? 'binome' : 'monome';

  // on récupère tous les sujets, juste pour construire la liste des spécialités
  const { subjects } = useSubjects();

  const { members, setMembers, mode, setMode, picks } = useSelectionStore();
  const [specialty, setSpecialty] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setMode(modeQuery);
  }, [modeQuery, setMode]);

  const apiBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

  // spécialités uniques, normalisées
  const specialties = useMemo(
    () =>
      Array.from(
        new Set(
          subjects.map((subject) => normalizeSpecialtyLabel(subject.specialite)),
        ),
      ).filter((s) => s !== ''),
    [subjects],
  );

  const submitChoices = async () => {
    setMessage(null);
    if (members.length === 0 || picks.length === 0) {
      setMessage('Sélectionnez au moins un étudiant et un sujet.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${apiBase}/api/submitChoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          members: members.map((member) => ({ matricule: member.matricule })),
          picks: picks.map((pick) => ({
            subjectCode: pick.subjectCode,
            priority: pick.priority,
            isOutOfSpecialty: pick.isOutOfSpecialty,
          })),
          specialty: specialty || members[0]?.specialite,
          mode,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || 'Impossible de soumettre vos choix.');
      }

      setMessage('Vos choix ont été enregistrés et verrouillés.');
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : 'Erreur lors de la soumission.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-400">
            Mode sélectionné
          </p>
          <h2 className="text-2xl font-bold text-slate-900">
            {mode === 'binome' ? 'Binôme' : 'Monome'}
          </h2>
        </div>

        {/* Select de spécialité */}
        <select
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          value={specialty || ''}
          onChange={(event) =>
            setSpecialty(event.target.value || undefined)
          }
        >
          <option value="">Toutes les spécialités</option>
          {specialties.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Étudiants filtrés par spécialité */}
      <StudentSelector
        specialtyFilter={specialty}
        selected={members}
        onChange={setMembers}
        mode={mode}
      />

      {/* Saisie des choix de sujets (la spécialité est envoyée à ChoiceWizard) */}
      <ChoiceWizard
        specialty={specialty || members[0]?.specialite}
        onSubmit={submitChoices}
        submitting={submitting}
        error={message}
      />
    </div>
  );
}

export default SelectionPage;
