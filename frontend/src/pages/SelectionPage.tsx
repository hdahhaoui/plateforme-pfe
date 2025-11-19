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

function SelectionPage() {
  const query = useQuery();
  const modeQuery = query.get('mode') === 'binome' ? 'binome' : 'monome';

  const { subjects } = useSubjects();
  const { members, setMembers, mode, setMode, picks } = useSelectionStore();

  const [specialty, setSpecialty] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const submissionsClosed =
    (import.meta.env.VITE_CHOICES_DISABLED || '').toLowerCase() === 'true';
  const submissionsClosedMessage =
    import.meta.env.VITE_CHOICES_DISABLED_MESSAGE ||
    'La période de soumission des vœux est terminée.';

  // sync du mode avec le paramètre d'URL
  useEffect(() => {
    setMode(modeQuery);
  }, [modeQuery, setMode]);

  const apiBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

  const submitChoices = async () => {
    setMessage(null);

    // 1) vérifier qu’un étudiant est choisi
    if (members.length === 0) {
      setMessage('Sélectionnez d’abord un étudiant.');
      return;
    }

    // 2) imposer exactement 4 sujets
    if (picks.length !== 4) {
      setMessage('Vous devez sélectionner exactement 4 sujets.');
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
        let payload: any = {};
        try {
          payload = await response.json();
        } catch (_) {
          // pas un JSON → on garde le message générique
        }

        throw new Error(
          (payload && payload.error) || 'Impossible de soumettre vos choix.',
        );
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
      {submissionsClosed && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {submissionsClosedMessage}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-400">
            Mode sélectionné
          </p>
          <h2 className="text-2xl font-bold text-slate-900">
            {mode === 'binome' ? 'Binôme' : 'Monome'}
          </h2>
        </div>

        <select
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          value={specialty || ''}
          onChange={(event) => setSpecialty(event.target.value || undefined)}
        >
          <option value="">Toutes les spécialités</option>
          {[...new Set(subjects.map((subject) => subject.specialite))].map(
            (s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ),
          )}
        </select>
      </div>

      <StudentSelector
        specialtyFilter={specialty}
        selected={members}
        onChange={setMembers}
        mode={mode}
      />

      <ChoiceWizard
        specialty={specialty || members[0]?.specialite}
        onSubmit={submitChoices}
        submitting={submitting}
        error={message}
        disabled={submissionsClosed}
        disabledReason={submissionsClosedMessage}
      />
    </div>
  );
}

export default SelectionPage;
