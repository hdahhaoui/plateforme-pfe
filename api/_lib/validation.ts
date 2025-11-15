import { ChoicePick, Mode, StudentRecord, SubjectRecord } from './types';

interface ValidateChoiceParams {
  mode: Mode;
  members: StudentRecord[];
  picks: ChoicePick[];
  specialty?: string;
  subjectsMap: Map<string, SubjectRecord>;
}

const normalizeType = (type?: string) =>
  type?.toLowerCase() === '1275' ? '1275' : 'classique';

export function validateChoicePayload(params: ValidateChoiceParams) {
  if (params.mode === 'monome' && params.members.length !== 1) {
    throw new Error('Sélectionnez un seul étudiant pour le mode monome.');
  }

  if (params.mode === 'binome' && params.members.length !== 2) {
    throw new Error('Le mode binôme nécessite deux étudiants.');
  }

  if (params.picks.length === 0 || params.picks.length > 4) {
    throw new Error('Vous devez fournir entre 1 et 4 sujets.');
  }

  const seenSubjects = new Set<string>();
  let outOfSpecialtyCount = 0;
  let subjectType: 'classique' | '1275' | null = null;

  params.picks.forEach((pick) => {
    if (seenSubjects.has(pick.subjectCode)) {
      throw new Error('Un sujet ne peut être sélectionné deux fois.');
    }
    seenSubjects.add(pick.subjectCode);

    const subject = params.subjectsMap.get(pick.subjectCode);
    if (!subject) {
      throw new Error(`Sujet introuvable : ${pick.subjectCode}`);
    }

    const currentType = normalizeType(subject.type_sujet);
    if (!subjectType) {
      subjectType = currentType;
    }

    if (subjectType !== currentType) {
      throw new Error('Tous les choix doivent être du même type (4 classiques OU 4 projets 1275).');
    }

    const memberSpecialty = params.specialty || params.members[0]?.specialite;
    if (currentType === 'classique' && subject.specialite !== memberSpecialty) {
      throw new Error('Les sujets classiques doivent appartenir à votre spécialité.');
    }

    if (subject.specialite !== memberSpecialty && currentType === '1275') {
      outOfSpecialtyCount += 1;
    }
  });

  if (outOfSpecialtyCount > 1) {
    throw new Error('Un seul sujet 1275 hors spécialité est autorisé.');
  }
}

export function computePriorityScore(members: StudentRecord[]) {
  const total = members.reduce((acc, member) => acc + Number(member.moyenne || 0), 0);
  return Math.round((total / members.length) * 100) / 100;
}
