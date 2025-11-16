import { getPocketBaseAdmin } from './_lib/pocketbase';
import { computePriorityScore, validateChoicePayload } from './_lib/validation';
import { recomputeAssignments } from './_lib/matching';
import { ChoicePick, Mode, StudentRecord } from './_lib/types';

interface SubmitBody {
  members: { matricule: string }[];
  picks: ChoicePick[];
  specialty?: string;
  mode: Mode;
}

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

    // ✅ Exiger exactement 4 sujets
    if (body.picks.length !== 4) {
      throw new Error(
        'Vous devez choisir exactement 4 sujets avant de soumettre vos choix.',
      );
    }

    const pb = await getPocketBaseAdmin();

    // Récupération des étudiants
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

    const normalizedMembers: StudentRecord[] = memberRecords.map(
      (record: any) => ({
        id: record.id,
        matricule: record.matricule,
        nom: record.nom,
        prenom: record.prenom,
        specialite: record.specialite,
        moyenne: record.moyenne,
        email: record.email,
        phone: record.phone,
      }),
    );

    // Récupération des sujets correspondants aux picks
    const subjectsMap = new Map<string, any>();
    for (const pick of body.picks) {
      if (!subjectsMap.has(pick.subjectCode)) {
        const subject = await pb
          .collection('subjects')
          .getFirstListItem(`code="${pick.subjectCode}"`)
          .catch(() => {
            throw new Error(`Sujet introuvable (${pick.subjectCode}).`);
          });
        subjectsMap.set(pick.subjectCode, subject);
      }
    }

    // Validation métier (spécialité, 1275, doublons, etc.)
    validateChoicePayload({
      mode: body.mode,
      members: normalizedMembers,
      picks: body.picks,
      specialty: body.specialty,
      subjectsMap,
    });

    // Vérifier qu’aucun des étudiants n’a déjà enregistré des choix
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

    const priorityScore = computePriorityScore(normalizedMembers);
    const membersIndex = [...selectedIds].sort().join('|');

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

    // Recalcul des affectations après chaque soumission
    await recomputeAssignments(pb);

    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Erreur submitChoices:', error);
    res.status(400).json({ error: error?.message || 'Erreur inattendue.' });
  }
}
