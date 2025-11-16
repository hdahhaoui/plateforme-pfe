import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import StudentSelector from '../components/StudentSelector';
import ChoiceWizard from '../components/ChoiceWizard';
import { useSelectionStore } from '../store/useSelectionStore';
import { useSubjects } from '../hooks/useSubjects';
import pb from '../config/pocketbase';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

function SelectionPage() {
  const query = useQuery();
  const modeQuery = query.get('mode') === 'binome' ? 'binome' : 'monome';

  // Tous les sujets pour construire la liste des spécialités
  const { subjects } = useSubjects();

  const { members, setMembers, mode, setMode, picks } = useSelectionStore();
  const [specialty, setSpecialty] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setMode(modeQuery);
  }, [modeQuery, setMode]);

  // Liste des spécialités uniques, triées
  const specialtyOptions = useMemo(
    () =>
      Array.from(new Set(subjects.map((s) => s.specialite)))
        .filter((s) => !!s)
        .sort(),
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
      const chosenSpecialty = specialty || members[0]?.specialite;

      // Index stable pour identifier le groupe (mono ou binôme)
      const membersIndex = members
        .map((m) => m.matricule)
        .sort()
        .join('-');

      // Score simple : moyenne des moyennes des membres
      const avgMoyenne =
        members.length > 0
          ? members.reduce((sum, m) => sum + (m.moyenne ?? 0), 0) / members.length
          : 0;

      const payload = {
        mode,
        // on stocke quelques infos de l’étudiant dans le JSON members
        members: members.map((m) => ({
          matricule: m.matricule,
          nom: m.nom,
          prenom: m.prenom,
          specialite: m.specialite,
          moyenne: m.moyenne,
        })),
        membersIndex,
        specialty: chosenSpecialty,
        picks: picks
          .slice()
          .sort((a, b) => a.priority - b.priority)
          .map((p) => ({
            subjectCode: p.subjectCode,
            priority: p.priority,
            isOutOfSpecialty: p.isOutOfSpecialty,
            subjectType: p.subjectType,
            specialty: p.specialty,
          })),
        priorityScore: avgMoyenne, // respect le schéma (0–20)
        status: 'pending',          // valeur par défaut raisonnable
        locked: true,               // le choix est figé une fois soumis
      };

      await pb.collection('choices').create(payload);

      setMessage('Vos choix ont été enregistrés et verrouillés.');
    } catch (err: any) {
      console.error('Erreur submitChoices PocketBase', err);
      setMessage(
        err?.message || 'Erreur lors de la soumission.',
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

        <select
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          value={specialty || ''}
          onChange={(event) => setSpecialty(event.target.value || undefined)}
        >
          <option value="">Toutes les spécialités</option>
          {specialtyOptions.map((s) => (
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

      {/* Choix de sujets filtrés par spécialité */}
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
