import { useMemo } from 'react';
import { Subject, useSubjects } from '../hooks/useSubjects';
import { ChoiceSelection, useSelectionStore } from '../store/useSelectionStore';

interface Props {
  specialty?: string;
  onSubmit: () => Promise<void>;
  submitting: boolean;
  error?: string | null;
  disabled?: boolean;
  disabledReason?: string;
}

type DisplayPick = ChoiceSelection | { priority: number };

function ChoiceWizard({
  specialty,
  onSubmit,
  submitting,
  error,
  disabled = false,
  disabledReason,
}: Props) {
  const { subjects } = useSubjects(specialty);
  const picks = useSelectionStore((state) => state.picks);
  const setPicks = useSelectionStore((state) => state.setPicks);

  const orderedPicks: DisplayPick[] = useMemo(
    () => [
      ...[...picks].sort((a, b) => a.priority - b.priority),
      ...Array.from({ length: Math.max(0, 4 - picks.length) }, (_, idx) => ({
        priority: picks.length + idx + 1,
      })),
    ],
    [picks],
  );

  const handleSelect = (
    priority: number,
    subject: Subject,
    isOutOfSpecialty: boolean,
  ) => {
    const next: ChoiceSelection = {
      subjectCode: subject.code,
      subjectTitle: subject.titre,
      priority,
      subjectType: subject.type_sujet,
      specialty: subject.specialite,
      isOutOfSpecialty,
    };

    const filtered = picks.filter(
      (pick) => pick.priority !== priority && pick.subjectCode !== subject.code,
    );
    setPicks([...filtered, next]);
  };

  // ✅ on exige maintenant exactement 4 choix
  const canSubmit = picks.length === 4;
  const isSubmitDisabled = disabled || submitting || !canSubmit;

  return (
    <div className="space-y-6">
      {orderedPicks.map((pick) => (
        <div key={pick.priority} className="rounded-xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">
                Choix #{pick.priority}
              </p>
              {'subjectCode' in pick ? (
                <p className="text-lg font-semibold text-slate-900">
                  {pick.subjectTitle}
                </p>
              ) : (
                <p className="text-sm text-slate-400">Sélectionnez un sujet</p>
              )}
            </div>
            {'subjectType' in pick && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {pick.subjectType}
              </span>
            )}
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {subjects.map((subject) => (
              <button
                type="button"
                key={subject.code}
                onClick={() =>
                  handleSelect(
                    pick.priority,
                    subject,
                    subject.specialite !== specialty &&
                      subject.type_sujet === '1275',
                  )
                }
                className="rounded border border-slate-200 p-3 text-left text-sm hover:border-slate-400"
              >
                <p className="font-semibold text-slate-800">
                  {subject.titre}
                </p>
                <p className="text-xs text-slate-500">
                  {subject.specialite} · {subject.type_sujet.toUpperCase()}
                </p>
                <p className="text-xs text-slate-500">
                  Code sujet : {subject.code}
                </p>
                <p className="text-xs text-slate-500">
                  Encadrant : {subject.encadrant || '—'}
                </p>
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Message spécifique si on n'a pas encore 4 choix */}
      {picks.length !== 4 && (
        <p className="text-xs text-amber-600">
          Vous devez sélectionner exactement 4 sujets avant de soumettre vos
          choix.
        </p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {disabled && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {disabledReason ||
            'La période de soumission est actuellement fermée.'}
        </div>
      )}

      <button
        type="button"
        onClick={disabled ? undefined : onSubmit}
        disabled={isSubmitDisabled}
        className="w-full rounded-lg bg-slate-900 px-4 py-3 text-white disabled:opacity-40"
      >
        {disabled
          ? 'Soumissions clôturées'
          : submitting
            ? 'Soumission…'
            : 'Soumettre mes choix'}
      </button>
      <p className="text-xs text-slate-400">
        Une fois vos choix enregistrés, ils seront verrouillés. Pour toute
        modification, contactez l&apos;administration.
      </p>
    </div>
  );
}

export default ChoiceWizard;
