export type SubjectType = 'classique' | '1275';
export type Mode = 'monome' | 'binome';

export interface SubjectRecord {
  id: string;
  code: string;
  titre: string;
  specialite: string;
  type_sujet: 'Classique' | '1275';
  encadrant?: string;
  description?: string;
  disponible?: boolean;
  quota?: number;
}

export interface StudentRecord {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  specialite: string;
  moyenne: number;
  email?: string;
  phone?: string;
}

export interface ChoicePick {
  subjectCode: string;
  priority: number;
  isOutOfSpecialty: boolean;
}

export interface ChoiceRecord {
  id: string;
  mode: Mode;
  members: StudentRecord[];
  membersIndex: string;
  specialty: string;
  picks: ChoicePick[];
  priorityScore: number;
  status: 'pending' | 'assigned' | 'waiting' | 'unassigned';
  currentAssignment?: { subjectCode: string; priority: number };
  needsMentorApproval?: boolean;
  mentorDecision?: 'pending' | 'approved' | 'rejected';
  needsAttention?: boolean;
  locked: boolean;
  queuePositions?: { subjectCode: string; position: number }[];
}
