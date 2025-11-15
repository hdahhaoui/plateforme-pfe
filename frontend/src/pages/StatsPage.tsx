import StatsDashboard from '../components/StatsDashboard';

function StatsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Classement en temps réel</h1>
        <p className="text-sm text-slate-500">
          Toute personne peut consulter les affectations provisoires, les files d’attente et les choix enregistrés,
          ainsi que l’état des étudiants sans sujets disponibles.
        </p>
      </div>
      <StatsDashboard />
    </div>
  );
}

export default StatsPage;
