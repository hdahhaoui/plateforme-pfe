import { getPocketBaseAdmin } from './_lib/pocketbase';
import { recomputeAssignments } from './_lib/matching';
import type { ChoicePick, Mode, StudentRecord, SubjectRecord } from './_lib/types';

interface SubmitBody {
  members: { matricule: string }[];
  picks: ChoicePick[];
  specialty?: string;
  mode: Mode;
}

// ---------- VALIDATION LOCALE (plus besoin de ./_lib/validation) ----------

const normalizeType = (type?: string) =>
  type?.toLowerCase() === '1275' ? '1275' : 'classique';

function validateChoicePayload(params: {
  mode: Mode;
  members: StudentRecord[];
  picks: ChoicePick[];
  specialty?: string;
  subjectsMap: Map<string, SubjectRecord>;
}) {
  const { mode, members, picks, specialty, subjectsMap } = params;

  // Vérif monome / binome
  if (mode === 'monome' && members.length !== 1) {
    throw new Error('Sélectionnez un seul étudiant pour le mode monome.');
  }

  if (mode === 'binome' && members.length !== 2) {
    throw new Error('Le mode binôme nécessite deux étudiants.');
  }

  // 🔒 Exiger exactement 4 choix
  if (picks.length !== 4) {
    throw new Error('Vous devez fournir exactement 4 sujets.');
  }

  const seenSubjects = new Set<string>();
  let outOfSpecialtyCount = 0;
  let subjectType: 'classique' | '1275' | null = null;

  picks.forEach((pick) => {
    if (seenSubjects.has(pick.subjectCode)) {
      throw new Error('Un sujet ne peut être sélectionné deux fois.');
    }
    seenSubjects.add(pick.subjectCode);

    const subject = subjectsMap.get(pick.subjectCode);
    if (!subject) {
      throw new Error(`Sujet introuvable : ${pick.subjectCode}`);
    }

    const currentType = normalizeType(subject.type_sujet);
    if (!subjectType) {
      subjectType = currentType;
    }

    // Tous les choix doivent être de même type
    if (subjectType !== currentType) {
      throw new Error(
        'Tous les choix doivent être du même type (4 classiques OU 4 projets 1275).',
      );
    }

    const memberSpecialty = specialty || members[0]?.specialite;

    // Classique: obligé dans la spécialité
    if (currentType === 'classique' && subject.specialite !== memberSpecialty) {
      throw new Error('Les sujets classiques doivent appartenir à votre spécialité.');
    }

    // 1275 hors spécialité: max 1
    if (subject.specialite !== memberSpecialty && currentType === '1275') {
      outOfSpecialtyCount += 1;
    }
  });

  if (outOfSpecialtyCount > 1) {
    throw new Error('Un seul sujet 1275 hors spécialité est autorisé.');
  }
}

function computePriorityScore(members: StudentRecord[]) {
  const total = members.reduce(
    (acc, member) => acc + Number(member.moyenne || 0),
    0,
  );
  return Math.round((total / members.length) * 100) / 100;
}

// ---------------------- HANDLER API ----------------------

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Méthode non autorisée' });
    return;
  }

  try {
    const body: SubmitBody =
      typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    if (!body || !Array.isArray(body.members) || !Array.isArray(body.picks)) {
      throw new Error('Payload invalide.');
    }

    const pb = await getPocketBaseAdmin();

    // Récupérer les étudiants
    const memberRecords = await Promise.all(
      body.members.map((member) =>
        pb
          .collection('students')
          .getFirstListItem(`matricule="${member.matricule}"`)
          .catch(() => {
            throw new Error(`Étudiant introuvable (${member.matricule}).`);
          }),
      ),
    );

    const normalizedMembers: StudentRecord[] = memberRecords.map((record: any) => ({
      id: record.id,
      matricule: record.matricule,
      nom: record.nom,
      prenom: record.prenom,
      specialite: record.specialite,
      moyenne: record.moyenne,
      email: record.email,
      phone: record.phone,
    }));

    // Récupérer les sujets concernés
    const subjectsMap = new Map<string, SubjectRecord>();
    for (const pick of body.picks) {
      if (!subjectsMap.has(pick.subjectCode)) {
        const subject = await pb
          .collection('subjects')
          .getFirstListItem(`code="${pick.subjectCode}"`)
          .catch(() => {
            throw new Error(`Sujet introuvable (${pick.subjectCode}).`);
          });
        subjectsMap.set(pick.subjectCode, subject as SubjectRecord);
      }
    }

    // Validation complète
    validateChoicePayload({
      mode: body.mode,
      members: normalizedMembers,
      picks: body.picks,
      specialty: body.specialty,
      subjectsMap,
    });

    // Vérifier que les étudiants n’ont pas déjà soumis
    const existingChoices = await pb.collection('choices').getFullList({
      fields: 'id,membersIndex',
    });

    const selectedIds = normalizedMembers.map((member) => member.matricule);
    const conflict = existingChoices.some((choice: any) =>
      selectedIds.some((id) => (choice.membersIndex || '').includes(id)),
    );

    if (conflict) {
      throw new Error(
        'Un des étudiants sélectionnés a déjà enregistré ses choix.',
      );
    }

    // Calcul du score
    const priorityScore = computePriorityScore(normalizedMembers);
    const membersIndex = [...selectedIds].sort().join('|');

    // Création du document choices
    await pb.collection('choices').create({
      mode: body.mode,
      members: normalizedMembers,
      membersIndex,
      specialty: body.specialty || normalizedMembers[0]?.specialite,
      picks: body.picks,
      locked: true,
      priorityScore,
      status: 'pending',
      currentAssignment: null,
      needsMentorApproval: false,
      mentorDecision: 'pending',
      needsAttention: false,
    });

    // Recalcul des affectations
    await recomputeAssignments(pb);

    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Erreur submitChoices:', error);
    res.status(400).json({ error: error?.message || 'Erreur inattendue.' });
  }
}
