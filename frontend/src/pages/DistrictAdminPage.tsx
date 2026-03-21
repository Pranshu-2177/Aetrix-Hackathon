import { Activity, AlertTriangle, Building2, MapPinned } from 'lucide-react';
import RoleTabs from '@/components/roles/RoleTabs';

const summaryCards = [
  {
    title: 'Emergency cases',
    text: 'Track urgent referrals that may need ambulance support or faster escalation.',
    Icon: AlertTriangle,
  },
  {
    title: 'Clinic-bound cases',
    text: 'See how many patients should travel to a PHC, CHC, or district hospital.',
    Icon: Building2,
  },
  {
    title: 'Area attention',
    text: 'Spot which blocks or villages are sending repeated serious cases.',
    Icon: MapPinned,
  },
  {
    title: 'Trend view',
    text: 'Watch changes in symptom patterns over time once live data is connected.',
    Icon: Activity,
  },
];

const adminViews = [
  'Daily count of home care, clinic, and emergency cases',
  'Most common symptoms by block or village',
  'Villages sending repeated emergency alerts',
  'Referral load on PHCs, CHCs, and district hospitals',
];

export default function DistrictAdminPage() {
  return (
    <div className="min-h-screen bg-background">
      <RoleTabs />

      <main className="mx-auto max-w-6xl px-4 py-6 md:py-8">
        <section className="rounded-[28px] border border-border bg-card p-6 shadow-[0_16px_40px_rgba(7,45,50,0.06)]">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal">For District Health Admins</p>
            <h1 className="mt-3 text-3xl font-heading font-bold text-foreground md:text-5xl">
              Monitor what is happening across the district
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              This page is for district teams who need a simple view of triage trends, referral pressure, and areas needing faster attention.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map(({ title, text, Icon }) => (
              <div key={title} className="rounded-2xl bg-muted/60 p-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal/10 text-teal">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-foreground">{title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[28px] border border-border bg-card p-6 shadow-[0_16px_40px_rgba(7,45,50,0.06)]">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal">What This Page Should Show</p>
            <h2 className="mt-3 text-2xl font-heading font-bold text-foreground">District overview</h2>
            <ul className="mt-5 space-y-3 text-sm leading-relaxed text-muted-foreground">
              {adminViews.map((item) => (
                <li key={item} className="rounded-2xl bg-muted/60 px-4 py-3">
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[28px] border border-border bg-card p-6 shadow-[0_16px_40px_rgba(7,45,50,0.06)]">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal">Current Status</p>
            <h2 className="mt-3 text-2xl font-heading font-bold text-foreground">Needs live analytics</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              The page layout is ready, but live district numbers still need a backend analytics API and Supabase queries. Right now this is the admin-facing shell.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
