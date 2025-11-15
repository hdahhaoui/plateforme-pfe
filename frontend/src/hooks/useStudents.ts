export function useStudents(selectedSpecialty?: string) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let disposed = false;
    let unsubscribe: (() => void) | undefined;

    const mapRecord = (record: any): Student => ({
      id: record.id,
      matricule: record.matricule,
      nom: record.nom,
      prenom: record.prenom,
      specialite: record.specialite,
      moyenne: record.moyenne,
    });

    const refresh = async () => {
      const filter = selectedSpecialty ? `specialite="${selectedSpecialty}"` : undefined;
      console.log('➡️ useStudents.refresh()', {
        baseUrl: pb.baseUrl,
        selectedSpecialty,
        filter,
      });

      try {
        const list = await pb
          .collection('students')
          .getList(1, 200, { filter, sort: '-moyenne' });

        console.log('✅ students fetched:', list.totalItems);

        if (!disposed) {
          setStudents(list.items.map(mapRecord));
          setLoading(false);
        }
      } catch (error) {
        console.error('❌ Impossible de charger les étudiants', error);
        if (!disposed) {
          setLoading(false);
        }
      }
    };

    refresh();

    (async () => {
      try {
        unsubscribe = await pb.collection('students').subscribe('*', refresh);
      } catch (error) {
        console.error('Subscription students échouée', error);
      }
    })();

    return () => {
      disposed = true;
      unsubscribe?.();
    };
  }, [selectedSpecialty]);

  const sorted = useMemo(
    () =>
      [...students].sort((a, b) => b.moyenne - a.moyenne || a.nom.localeCompare(b.nom)),
    [students],
  );

  return { students: sorted, loading };
}
