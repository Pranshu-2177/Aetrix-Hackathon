import { Shield } from 'lucide-react';
import { NavLink } from '@/components/NavLink';

const links = [
  { to: '/patients', label: 'Patients & Families' },
  { to: '/asha-workers', label: 'ASHA Workers' },
  { to: '/district-admin', label: 'District Admins' },
];

export default function RoleTabs() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl gradient-cta">
            <Shield className="h-5 w-5 text-accent-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">SwasthAI</p>
            <p className="text-xs text-muted-foreground">Choose the page for the person using it</p>
          </div>
        </div>

        <nav className="flex flex-wrap gap-2">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className="rounded-full border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition hover:border-teal/40 hover:text-foreground"
              activeClassName="border-teal bg-teal/10 text-foreground"
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
