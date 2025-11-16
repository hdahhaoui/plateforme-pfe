import { Link } from 'react-router-dom';

const cards = [
  {
    title: 'Monome',
    description: 'Choisissez un étudiant et classez jusqu’à 4 sujets (classique ou 1275).',
    to: '/selection?mode=monome',
  },
  {
    title: 'Binôme',
    description: 'Sélectionnez deux étudiants, calculez la moyenne combinée et soumettez vos choix (classique ou 1275).',
    to: '/selection?mode=binome',
  },
];

function LandingPage() {
  return (
    <section className="space-y-8">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Plateforme PFE · Session 2024/2025
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Choisissez vos sujets en toute transparence</h1>
        <p className="mt-3 text-slate-500">
          Aucun compte requis : sélectionnez votre nom depuis la liste officielle, classez vos sujets, et suivez en
          direct les affectations provisoires selon les moyennes.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {cards.map((card) => (
          <div key={card.title} className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{card.title}</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{card.description}</p>
            <Link
              to={card.to}
              className="mt-6 inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Démarrer
            </Link>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
        <p>
          🔁 Mise à jour des sujets et étudiants. Les règles de
          spécialité, les quotas et les projets 1275 sont appliqués automatiquement.
        </p>
      </div>
    </section>
  );
}

export default LandingPage;
