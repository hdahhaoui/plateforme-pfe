import { useEffect, useState } from 'react';
import pb from '../config/pocketbase';

export interface Subject {
  id: string;
  code: string;
  titre: string;
  specialite: string;
  type_sujet: 'Classique' | '1275';
  encadrant?: string;
  description?: string;
  disponible?: boolean;
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
      specialite: record.specialite,
      type_sujet: record.type_sujet || 'Classique',
      encadrant: record.encadrant,
      description: record.description,
      disponible: record.disponible,
    });

    const refresh = async () => {
      try {
        const filter = selectedSpecialty ? `specialite="${selectedSpecialty}"` : undefined;
        const list = await pb
          .collection('subjects')
          .getList(1, 200, { filter, sort: 'titre' });
        if (!disposed) {
          setSubjects(list.items.map(mapRecord));
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

  return { subjects, loading };
}
