import { useEffect, useMemo, useState } from 'react';
import { Activity, Building2, MapPinned, ShieldCheck, UsersRound } from 'lucide-react';
import RoleTabs from '@/components/roles/RoleTabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  buildDistrictSummary,
  buildDistrictVillages,
  buildDistrictWorkers,
  fetchDistrictCaseReports,
  fetchDistrictProfiles,
  fetchProfile,
  upsertProfile,
  type CaseReportRecord,
  type ProfileRecord,
} from '@/lib/dashboardService';
import { useAuth } from '@/hooks/use-auth';

type LeadFormState = {
  full_name: string;
  phone: string;
  block: string;
  district: string;
};

const emptyLeadForm: LeadFormState = {
  full_name: '',
  phone: '',
  block: '',
  district: '',
};

export default function DistrictAdminPage() {
  const { user, isConfigured } = useAuth();
  const [leadProfile, setLeadProfile] = useState<ProfileRecord | null>(null);
  const [workerProfiles, setWorkerProfiles] = useState<ProfileRecord[]>([]);
  const [reports, setReports] = useState<CaseReportRecord[]>([]);
  const [leadForm, setLeadForm] = useState<LeadFormState>(emptyLeadForm);
  const [loadingData, setLoadingData] = useState(true);
  const [status, setStatus] = useState<{ error?: string; info?: string }>({});
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (!user || !isConfigured) {
      setLoadingData(false);
      return;
    }

    let active = true;

    const load = async () => {
      setLoadingData(true);
      try {
        const [lead, workers, allReports] = await Promise.all([
          fetchProfile(user.id),
          fetchDistrictProfiles(),
          fetchDistrictCaseReports(),
        ]);

        if (!active) {
          return;
        }

        setLeadProfile(lead);
        setWorkerProfiles(workers);
        setReports(allReports);
        if (lead) {
          setLeadForm({
            full_name: lead.full_name || '',
            phone: lead.phone || '',
            block: lead.block || '',
            district: lead.district || '',
          });
        }
      } catch (error) {
        if (active) {
          setStatus({
            error: error instanceof Error ? error.message : 'Could not load district dashboard data.',
          });
        }
      } finally {
        if (active) {
          setLoadingData(false);
        }
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [user, isConfigured]);

  const summary = useMemo(() => buildDistrictSummary(workerProfiles, reports), [workerProfiles, reports]);
  const workerRows = useMemo(() => buildDistrictWorkers(workerProfiles, reports), [workerProfiles, reports]);
  const villageRows = useMemo(() => buildDistrictVillages(reports, workerProfiles), [reports, workerProfiles]);
  const totalVisits = workerRows.reduce((sum, item) => sum + item.todayVisits, 0);

  const handleSaveLeadProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) {
      setStatus({ error: 'Please sign in again.' });
      return;
    }
    if (!isConfigured) {
      setStatus({ error: 'Supabase is not configured on this site.' });
      return;
    }

    setSavingProfile(true);
    setStatus({});
    try {
      const saved = await upsertProfile({
        id: user.id,
        email: user.email ?? null,
        role: 'admin',
        full_name: leadForm.full_name.trim() || null,
        phone: leadForm.phone.trim() || null,
        village: null,
        block: leadForm.block.trim() || null,
        district: leadForm.district.trim() || null,
        households_covered: null,
      });
      setLeadProfile(saved);
      setStatus({ info: 'District lead details saved.' });
    } catch (error) {
      setStatus({
        error: error instanceof Error ? error.message : 'Could not save district lead details.',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <RoleTabs />

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        <section className="rounded-[28px] border border-border bg-card p-6 shadow-[0_18px_48px_rgba(7,45,50,0.06)]">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal">District Health Lead Dashboard</p>
              <h1 className="mt-3 text-3xl font-heading font-bold text-foreground md:text-5xl">
                District-wide village and worker view
              </h1>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
                Once ASHA workers save their profiles and field cases, this page turns that into a district overview with worker names, villages, referrals, and urgent case pressure.
              </p>
              {!isConfigured && (
                <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Supabase is not configured in the frontend, so live district data cannot load yet.
                </p>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl bg-muted/60 p-4">
                <MapPinned className="h-5 w-5 text-teal" />
                <p className="mt-3 text-2xl font-bold text-foreground">{loadingData ? '...' : summary.villagesCovered}</p>
                <p className="text-sm text-muted-foreground">Villages covered</p>
              </div>
              <div className="rounded-2xl bg-muted/60 p-4">
                <UsersRound className="h-5 w-5 text-teal" />
                <p className="mt-3 text-2xl font-bold text-foreground">{loadingData ? '...' : summary.ashaWorkers}</p>
                <p className="text-sm text-muted-foreground">ASHA workers active</p>
              </div>
              <div className="rounded-2xl bg-muted/60 p-4">
                <Activity className="h-5 w-5 text-teal" />
                <p className="mt-3 text-2xl font-bold text-foreground">{loadingData ? '...' : summary.activeCases}</p>
                <p className="text-sm text-muted-foreground">Active triage cases</p>
              </div>
              <div className="rounded-2xl bg-muted/60 p-4">
                <ShieldCheck className="h-5 w-5 text-teal" />
                <p className="mt-3 text-2xl font-bold text-foreground">{loadingData ? '...' : summary.emergencyCases}</p>
                <p className="text-sm text-muted-foreground">Emergency cases</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-[28px] border border-border bg-card p-6 shadow-[0_18px_48px_rgba(7,45,50,0.06)]">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal">Lead Profile</p>
            <h2 className="mt-3 text-2xl font-heading font-bold text-foreground">District details</h2>

            <form className="mt-6 space-y-4" onSubmit={handleSaveLeadProfile}>
              <div className="space-y-2">
                <Label htmlFor="lead_name">Full name</Label>
                <Input
                  id="lead_name"
                  value={leadForm.full_name}
                  onChange={(event) => setLeadForm((current) => ({ ...current, full_name: event.target.value }))}
                  placeholder="District health lead name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lead_phone">Phone</Label>
                <Input
                  id="lead_phone"
                  value={leadForm.phone}
                  onChange={(event) => setLeadForm((current) => ({ ...current, phone: event.target.value }))}
                  placeholder="Contact number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lead_block">Block</Label>
                <Input
                  id="lead_block"
                  value={leadForm.block}
                  onChange={(event) => setLeadForm((current) => ({ ...current, block: event.target.value }))}
                  placeholder="Primary block"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lead_district">District</Label>
                <Input
                  id="lead_district"
                  value={leadForm.district}
                  onChange={(event) => setLeadForm((current) => ({ ...current, district: event.target.value }))}
                  placeholder="District name"
                />
              </div>

              {status.error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {status.error}
                </div>
              )}
              {status.info && (
                <div className="rounded-xl border border-teal/30 bg-teal/10 px-3 py-2 text-sm text-teal-700">
                  {status.info}
                </div>
              )}

              <Button type="submit" disabled={savingProfile}>
                {savingProfile ? 'Saving...' : 'Save lead details'}
              </Button>
            </form>

            <div className="mt-6 rounded-2xl bg-muted/60 p-4">
              <p className="text-sm text-muted-foreground">Total field visits today</p>
              <p className="mt-2 text-3xl font-bold text-foreground">{loadingData ? '...' : totalVisits}</p>
            </div>
          </div>

          <div className="rounded-[28px] border border-border bg-card p-6 shadow-[0_18px_48px_rgba(7,45,50,0.06)]">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-teal/10 p-3 text-teal">
                <UsersRound className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal">ASHA Worker Coverage</p>
                <h2 className="text-2xl font-heading font-bold text-foreground">Worker performance view</h2>
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-border">
              <div className="grid grid-cols-[1.3fr_0.8fr_0.7fr_0.7fr_0.7fr] gap-3 bg-muted/60 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                <span>ASHA worker</span>
                <span>Block</span>
                <span>Villages</span>
                <span>Cases</span>
                <span>Urgent</span>
              </div>
              {workerRows.length ? (
                workerRows.map((worker) => (
                  <div key={worker.name} className="grid grid-cols-[1.3fr_0.8fr_0.7fr_0.7fr_0.7fr] gap-3 border-t border-border px-4 py-4 text-sm">
                    <div>
                      <p className="font-semibold text-foreground">{worker.name}</p>
                      <p className="text-xs text-muted-foreground">{worker.todayVisits} visits today</p>
                    </div>
                    <span className="text-muted-foreground">{worker.block}</span>
                    <span className="font-medium text-foreground">{worker.villages}</span>
                    <span className="font-medium text-foreground">{worker.activeCases}</span>
                    <span className="font-medium text-rose-700">{worker.urgentCases}</span>
                  </div>
                ))
              ) : (
                <div className="border-t border-border px-4 py-6 text-sm text-muted-foreground">
                  No ASHA worker profiles yet. Worker names will appear here after ASHA workers create accounts and save their profile details.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[28px] border border-border bg-card p-6 shadow-[0_18px_48px_rgba(7,45,50,0.06)]">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal">Village Watchlist</p>
          <h2 className="mt-3 text-2xl font-heading font-bold text-foreground">Where extra support may be needed</h2>

          <div className="mt-6 overflow-hidden rounded-2xl border border-border">
            <div className="grid grid-cols-[1fr_0.9fr_1.1fr_0.8fr_0.8fr_0.9fr] gap-3 bg-muted/60 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              <span>Village</span>
              <span>Block</span>
              <span>ASHA worker</span>
              <span>Cases</span>
              <span>Urgent</span>
              <span>Clinic referrals</span>
            </div>
            {villageRows.length ? (
              villageRows.map((village) => (
                <div key={`${village.village}-${village.ashaName}`} className="grid grid-cols-[1fr_0.9fr_1.1fr_0.8fr_0.8fr_0.9fr] gap-3 border-t border-border px-4 py-4 text-sm">
                  <span className="font-semibold text-foreground">{village.village}</span>
                  <span className="text-muted-foreground">{village.block}</span>
                  <span className="text-foreground">{village.ashaName}</span>
                  <span className="font-medium text-foreground">{village.activeCases}</span>
                  <span className="font-medium text-rose-700">{village.urgentCases}</span>
                  <span className="font-medium text-foreground">{village.clinicReferrals}</span>
                </div>
              ))
            ) : (
              <div className="border-t border-border px-4 py-6 text-sm text-muted-foreground">
                No village case reports yet. This watchlist fills up after ASHA workers start saving patient reports.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
