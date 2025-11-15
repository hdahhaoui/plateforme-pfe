import { create } from 'zustand';

export type Mode = 'monome' | 'binome';

export interface StudentSelection {
  matricule: string;
  nom: string;
  prenom: string;
  specialite: string;
  moyenne: number;
}

export interface ChoiceSelection {
  subjectCode: string;
  subjectTitle: string;
  priority: number;
  subjectType: 'Classique' | '1275';
  specialty: string;
  isOutOfSpecialty: boolean;
}

interface SelectionState {
  mode: Mode;
  members: StudentSelection[];
  picks: ChoiceSelection[];
  setMode: (mode: Mode) => void;
  setMembers: (members: StudentSelection[]) => void;
  setPicks: (picks: ChoiceSelection[]) => void;
  reset: () => void;
}

export const useSelectionStore = create<SelectionState>((set) => ({
  mode: 'monome',
  members: [],
  picks: [],
  setMode: (mode) => set({ mode }),
  setMembers: (members) => set({ members }),
  setPicks: (picks) => set({ picks }),
  reset: () => set({ mode: 'monome', members: [], picks: [] }),
}));
