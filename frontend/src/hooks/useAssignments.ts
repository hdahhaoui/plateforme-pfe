import { useEffect, useState } from 'react';
import pb from '../config/pocketbase';

export interface Choice {
  id: string;
  members: { matricule: string; specialite: string; nom: string; prenom: string }[];
  picks: { subjectCode: string; priority: number }[];
  priorityScore: number;
  currentAssignment?: { subjectCode: string; priority: number };
  status: string;
  needsAttention?: boolean;
  mode: 'monome' | 'binome';
  queuePositions?: { subjectCode: string; position: number }[];
}

export function useAssignments() {
  const [choices, setChoices] = useState<Choice[]>([]);

  useEffect(() => {
    let disposed = false;
    let unsubscribe: (() => void) | undefined;

    const refresh = async () => {
      const list = await pb
        .collection('choices')
        .getFullList({ sort: '-priorityScore' });

      if (!disposed) {
        setChoices(
          list.map(
            (record: any) =>
              ({
                id: record.id,
                members: record.members,
                picks: record.picks,
                priorityScore: record.priorityScore,
                currentAssignment: record.currentAssignment,
                status: record.status,
                needsAttention: record.needsAttention,
                mode: record.mode,
                queuePositions: record.queuePositions,
              }) as Choice,
          ),
        );
      }
    };

    refresh();

    (async () => {
      unsubscribe = await pb.collection('choices').subscribe('*', refresh);
    })();

    return () => {
      disposed = true;
      unsubscribe?.();
    };
  }, []);

  return choices;
}
