import { useEffect, useMemo, useState } from 'react';
import pb from '../config/pocketbase';

export interface Subject {
  id: string;
  code: string;
  titre: string;
  description?: string;
  encadrant: string;
  specialite: string;
  type_sujet: 'Classique' | '1275';
  disponible: boolean;
}

function normalizeSpecialty(raw?: string) {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  return trimmed.replace(/^"(.*)"$/, '$1');
}

export function useSubjects(selectedSpecialty?: string) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let disposed = false;
    let unsubscribe: (() => void) | undefined;

    const mapRecord = (record: any): Subject => ({
      id: record.id,
      code: record.code,
      titre: record.titre,
      description: record.description,
      encadrant: record.encadrant,
      specialite: record.specialite,
      type_sujet: record.type_sujet,
      disponible: !!record.disponible,
    });

    const refresh = async () => {
      try {
        const specialty = normalizeSpecialty(selectedSpecialty);
        const filter = specialty ? `specialite="${specialty}"` : undefined;

        const options: any = { sort: 'titre' };
        if (filter) {
          options.filter = filter;
        }

        const list = await pb.collection('subjects').getFullList(options);

        if (!disposed) {
          setSubjects(list.map(mapRecord));
          setLoading(false);
        }
      } catch (error) {
        console.error('Impossible de charger les sujets', error);
        if (!disposed) {
          setLoading(false);
        }
      }
    };

    refresh();

    (async () => {
      try {
        unsubscribe = await pb.collection('subjects').subscribe('*', refresh);
      } catch (error) {
        console.error('Subscription subjects échouée', error);
      }
    })();

    return () => {
      disposed = true;
      unsubscribe?.();
    };
  }, [selectedSpecialty]);

  const sorted = useMemo(
    () => [...subjects].sort((a, b) => a.titre.localeCompare(b.titre)),
    [subjects],
  );

  return { subjects: sorted, loading };
}
