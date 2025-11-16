import type PocketBase from 'pocketbase';
import { ChoiceRecord, ChoicePick, SubjectRecord } from './types';

interface Assignment {
  choiceId: string;
  subjectCode: string;
  priority: number;
}

interface SubjectState extends SubjectRecord {
  code: string;
  quota: number;
  queue: { choiceId: string; priority: number; priorityScore: number }[];
  assigned: Assignment[];
}

const normalizeType = (type?: string) =>
  type?.toLowerCase() === '1275' ? '1275' : 'classique';

export async function recomputeAssignments(pb: PocketBase) {
  const [subjects, choices] = await Promise.all([
    pb.collection('subjects').getFullList({ sort: 'code' }),
    pb.collection('choices').getFullList({ sort: '-priorityScore,-created' }),
  ]);

  const subjectState = new Map<string, SubjectState>();

  subjects.forEach((subject: any) => {
    const code = subject.code || subject.id;
    subjectState.set(code, {
      ...(subject as SubjectRecord),
      code,
      quota: Number(subject.quota ?? 1) || 1,
      queue: [],
      assigned: [],
    });
  });

  const assignmentMap = new Map<string, Assignment | null>();
  const queuePositions = new Map<string, { subjectCode: string; position: number }[]>();

  const buildQueue = (choice: any) => {
    (choice.picks as ChoicePick[]).forEach((pick) => {
      const state = subjectState.get(pick.subjectCode);
      if (!state) return;
      state.queue.push({
        choiceId: choice.id,
        priority: pick.priority,
        priorityScore: choice.priorityScore,
      });
    });
  };

  choices.forEach((choice) => buildQueue(choice));

  subjectState.forEach((state) => {
    state.queue.sort((a, b) => {
      if (b.priorityScore === a.priorityScore) {
        return a.priority - b.priority;
      }
      return b.priorityScore - a.priorityScore;
    });

    state.queue.forEach((candidate, index) => {
      const entry = queuePositions.get(candidate.choiceId) ?? [];
      entry.push({ subjectCode: state.code, position: index + 1 });
      queuePositions.set(candidate.choiceId, entry);
    });
  });

  const sortedChoices = [...choices].sort((a: any, b: any) => {
    if (b.priorityScore === a.priorityScore) {
      return a.created.localeCompare(b.created);
    }
    return b.priorityScore - a.priorityScore;
  });

  sortedChoices.forEach((choice: any) => {
    const picks = [...(choice.picks as ChoicePick[])].sort((a, b) => a.priority - b.priority);
    const membersChoice: Assignment | null = tryAssign(choice.id, picks, subjectState);
    assignmentMap.set(choice.id, membersChoice);

    function tryAssign(
      choiceId: string,
      picksList: ChoicePick[],
      stateMap: Map<string, SubjectState>,
    ): Assignment | null {
      for (const pick of picksList) {
        const state = stateMap.get(pick.subjectCode);
        if (!state) continue;
        if (state.assigned.length < state.quota) {
          const assignment: Assignment = {
            choiceId,
            subjectCode: pick.subjectCode,
            priority: pick.priority,
          };
          state.assigned.push(assignment);
          return assignment;
        }
      }
      return null;
    }
  });

  const choiceUpdates: Promise<any>[] = [];
  let unassignedCount = 0;

  choices.forEach((choice: any) => {
    const assignment = assignmentMap.get(choice.id);
    let status: ChoiceRecord['status'] = 'waiting';
    let currentAssignment: { subjectCode: string; priority: number } | null = null;
    let needsAttention = false;
    let needsMentorApproval = false;

    if (assignment) {
      status = 'assigned';
      currentAssignment = {
        subjectCode: assignment.subjectCode,
        priority: assignment.priority,
      };
      const subject = subjectState.get(assignment.subjectCode);
      needsMentorApproval = normalizeType(subject?.type_sujet) === '1275';
    } else {
      status = 'unassigned';
      needsAttention = true;
      unassignedCount += 1;
    }

    choiceUpdates.push(
      pb.collection('choices').update(choice.id, {
        status,
        currentAssignment,
        needsMentorApproval,
        needsAttention,
        queuePositions: queuePositions.get(choice.id) || [],
      }),
    );
  });

  const topSubjects = [...subjectState.values()]
    .sort((a, b) => b.queue.length - a.queue.length)
    .slice(0, 5)
    .map((subject) => ({
      subjectCode: subject.code,
      choiceCount: subject.queue.length,
    }));

  const metrics = await getMetricsRecord(pb);
  const metricsPromise = metrics
    ? pb.collection('metrics').update(metrics.id, {
        topSubjects,
        unassignedCount,
      })
    : pb.collection('metrics').create({
        slug: 'global',
        topSubjects,
        unassignedCount,
      });

  await Promise.all([...choiceUpdates, metricsPromise]);
}

async function getMetricsRecord(pb: PocketBase) {
  try {
    return await pb.collection('metrics').getFirstListItem('slug="global"');
  } catch {
    return null;
  }
}
