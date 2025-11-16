import StatsDashboard from '../components/StatsDashboard';

function StatsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Classement en temps réel
        </h1>

        <p className="text-sm text-slate-500">
          Trié par score de priorité décroissant (moyenne + ordre des choix).
          Les noms des encadrants et les codes des sujets apparaîtront
          automatiquement selon les données enregistrées.
        </p>
      </div>

      <StatsDashboard />
    </div>
  );
}

export default StatsPage;
