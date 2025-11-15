import { Link, useLocation } from 'react-router-dom';
import clsx from 'clsx';

const links = [
  { to: '/', label: 'Accueil' },
  { to: '/selection', label: 'Formulaire' },
  { to: '/stats', label: 'Classements' },
];

function Header() {
  const location = useLocation();

  return (
    <header className="bg-white shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link to="/" className="text-lg font-semibold text-slate-900">
          Plateforme PFE
        </Link>
        <nav className="flex gap-4 text-sm font-medium text-slate-500">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={clsx(
                'rounded px-3 py-2 transition-colors',
                location.pathname === link.to
                  ? 'bg-slate-900 text-white'
                  : 'hover:bg-slate-100 hover:text-slate-900',
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export default Header;
