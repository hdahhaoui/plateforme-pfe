import StatsDashboard from '../components/StatsDashboard';

function StatsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Classement en temps réel
        </h1>

        <p className="text-sm text-slate-500">
          Accédez au classement actualisé, aux affectations provisoires, aux files
          d’attente, aux choix soumis par les étudiants, ainsi qu’au statut des
          étudiants sans sujets disponibles. Les noms des encadrants et les codes
          des sujets apparaîtront automatiquement selon les données enregistrées.
        </p>
      </div>

      <StatsDashboard />
    </div>
  );
}

export default StatsPage;
