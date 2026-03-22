import { useEffect, useMemo, useState } from 'react';
import { ClipboardList, HeartPulse, MapPinned, Siren, Users } from 'lucide-react';
import ChatUI from '@/components/chat/ChatUI';
import RoleTabs from '@/components/roles/RoleTabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import {
  buildAshaQueue,
  buildAshaVillageSummary,
  fetchAshaCaseReports,
  fetchProfile,
  insertCaseReport,
  upsertProfile,
  type CaseReportRecord,
  type ProfileRecord,
} from '@/lib/dashboardService';

const statusTone = {
  'Home care': 'bg-emerald-50 text-emerald-700',
  'Clinic visit': 'bg-amber-50 text-amber-700',
  Emergency: 'bg-rose-50 text-rose-700',
};

type ProfileFormState = {
  full_name: string;
  phone: string;
  village: string;
  block: string;
  district: string;
  households_covered: string;
};

type CaseFormState = {
  patient_name: string;
  age: string;
  gender: string;
  village: string;
  block: string;
  district: string;
  symptoms: string;
  days_sick: string;
  danger_signs: string;
  triage: 'self-care' | 'clinic' | 'emergency';
  referral_status: 'pending' | 'referred' | 'completed';
};

const emptyProfileForm: ProfileFormState = {
  full_name: '',
  phone: '',
  village: '',
  block: '',
  district: '',
  households_covered: '',
};

const emptyCaseForm: CaseFormState = {
  patient_name: '',
  age: '',
  gender: '',
  village: '',
  block: '',
  district: '',
  symptoms: '',
  days_sick: '',
  danger_signs: '',
  triage: 'self-care',
  referral_status: 'pending',
};

export default function AshaWorkersPage() {
  const { user, isConfigured } = useAuth();
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [reports, setReports] = useState<CaseReportRecord[]>([]);
  const [profileForm, setProfileForm] = useState<ProfileFormState>(emptyProfileForm);
  const [caseForm, setCaseForm] = useState<CaseFormState>(emptyCaseForm);
  const [loadingData, setLoadingData] = useState(true);
  const [profileStatus, setProfileStatus] = useState<{ error?: string; info?: string }>({});
  const [caseStatus, setCaseStatus] = useState<{ error?: string; info?: string }>({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingCase, setSavingCase] = useState(false);

  useEffect(() => {
    if (!user || !isConfigured) {
      setLoadingData(false);
      return;
    }

    let active = true;

    const load = async () => {
      setLoadingData(true);
      try {
        const [profileData, reportData] = await Promise.all([
          fetchProfile(user.id),
          fetchAshaCaseReports(user.id),
        ]);

        if (!active) {
          return;
        }

        setProfile(profileData);
        setReports(reportData);
        if (profileData) {
          setProfileForm({
            full_name: profileData.full_name || '',
            phone: profileData.phone || '',
            village: profileData.village || '',
            block: profileData.block || '',
            district: profileData.district || '',
            households_covered: profileData.households_covered ? String(profileData.households_covered) : '',
          });

          setCaseForm((current) => ({
            ...current,
            village: current.village || profileData.village || '',
            block: current.block || profileData.block || '',
            district: current.district || profileData.district || '',
          }));
        }
      } catch (error) {
        if (active) {
          setProfileStatus({
            error: error instanceof Error ? error.message : 'Could not load worker data right now.',
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

  const villageSummaries = useMemo(() => buildAshaVillageSummary(reports, profile), [reports, profile]);
  const queueItems = useMemo(() => buildAshaQueue(reports), [reports]);

  const totalHouseholds = villageSummaries.reduce((sum, item) => sum + item.households, 0);
  const totalActiveCases = villageSummaries.reduce((sum, item) => sum + item.activeCases, 0);
  const totalUrgentCases = villageSummaries.reduce((sum, item) => sum + item.urgentCases, 0);
  const totalDueVisits = villageSummaries.reduce((sum, item) => sum + item.dueVisits, 0);
  const displayName = profile?.full_name || user?.email?.split('@')[0]?.replace(/[._]/g, ' ') || 'ASHA worker';

  const handleProfileSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) {
      setProfileStatus({ error: 'Please sign in again.' });
      return;
    }
    if (!isConfigured) {
      setProfileStatus({ error: 'Supabase is not configured on this site.' });
      return;
    }

    setSavingProfile(true);
    setProfileStatus({});

    try {
      const saved = await upsertProfile({
        id: user.id,
        email: user.email ?? null,
        role: 'asha',
        full_name: profileForm.full_name.trim() || null,
        phone: profileForm.phone.trim() || null,
        village: profileForm.village.trim() || null,
        block: profileForm.block.trim() || null,
        district: profileForm.district.trim() || null,
        households_covered: profileForm.households_covered ? Number(profileForm.households_covered) : null,
      });
      setProfile(saved);
      setProfileStatus({ info: 'Worker details saved.' });
      setCaseForm((current) => ({
        ...current,
        village: current.village || saved.village || '',
        block: current.block || saved.block || '',
        district: current.district || saved.district || '',
      }));
    } catch (error) {
      setProfileStatus({
        error: error instanceof Error ? error.message : 'Could not save worker details.',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCaseSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) {
      setCaseStatus({ error: 'Please sign in again.' });
      return;
    }
    if (!isConfigured) {
      setCaseStatus({ error: 'Supabase is not configured on this site.' });
      return;
    }

    setSavingCase(true);
    setCaseStatus({});

    try {
      const saved = await insertCaseReport({
        asha_user_id: user.id,
        patient_name: caseForm.patient_name.trim(),
        age: caseForm.age ? Number(caseForm.age) : null,
        gender: caseForm.gender.trim() || null,
        village: caseForm.village.trim(),
        block: caseForm.block.trim() || null,
        district: caseForm.district.trim() || null,
        symptoms: caseForm.symptoms.trim(),
        days_sick: caseForm.days_sick ? Number(caseForm.days_sick) : null,
        danger_signs: caseForm.danger_signs.trim() || null,
        triage: caseForm.triage,
        referral_status: caseForm.referral_status,
      });

      setReports((current) => [saved, ...current]);
      setCaseStatus({ info: 'Case saved to Supabase.' });
      setCaseForm({
        ...emptyCaseForm,
        village: profile?.village || '',
        block: profile?.block || '',
        district: profile?.district || '',
      });
    } catch (error) {
      setCaseStatus({
        error: error instanceof Error ? error.message : 'Could not save case report.',
      });
    } finally {
      setSavingCase(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <RoleTabs />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 md:px-6">
        <section className="rounded-[28px] border border-border bg-card p-6 shadow-[0_18px_48px_rgba(7,45,50,0.06)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal">ASHA Worker Dashboard</p>
              <h1 className="mt-3 text-3xl font-heading font-bold text-foreground md:text-5xl">
                Village view for {displayName}
              </h1>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
                Save your village details once, add patient cases through the form below, and keep the chat ready for quick triage support.
              </p>
              {!isConfigured && (
                <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Supabase is not configured in the frontend, so live worker data cannot load yet.
                </p>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl bg-muted/60 p-4">
                <Users className="h-5 w-5 text-teal" />
                <p className="mt-3 text-2xl font-bold text-foreground">{loadingData ? '...' : totalHouseholds}</p>
                <p className="text-sm text-muted-foreground">Households covered</p>
              </div>
              <div className="rounded-2xl bg-muted/60 p-4">
                <HeartPulse className="h-5 w-5 text-teal" />
                <p className="mt-3 text-2xl font-bold text-foreground">{loadingData ? '...' : totalActiveCases}</p>
                <p className="text-sm text-muted-foreground">Active cases</p>
              </div>
              <div className="rounded-2xl bg-muted/60 p-4">
                <Siren className="h-5 w-5 text-teal" />
                <p className="mt-3 text-2xl font-bold text-foreground">{loadingData ? '...' : totalUrgentCases}</p>
                <p className="text-sm text-muted-foreground">Urgent referrals</p>
              </div>
              <div className="rounded-2xl bg-muted/60 p-4">
                <ClipboardList className="h-5 w-5 text-teal" />
                <p className="mt-3 text-2xl font-bold text-foreground">{loadingData ? '...' : totalDueVisits}</p>
                <p className="text-sm text-muted-foreground">Visits due now</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[28px] border border-border bg-card p-6 shadow-[0_18px_48px_rgba(7,45,50,0.06)]">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal">Worker Details</p>
            <h2 className="mt-3 text-2xl font-heading font-bold text-foreground">Profile and coverage</h2>

            <form className="mt-6 space-y-4" onSubmit={handleProfileSave}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full name</Label>
                  <Input
                    id="full_name"
                    value={profileForm.full_name}
                    onChange={(event) => setProfileForm((current) => ({ ...current, full_name: event.target.value }))}
                    placeholder="ASHA worker name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={profileForm.phone}
                    onChange={(event) => setProfileForm((current) => ({ ...current, phone: event.target.value }))}
                    placeholder="Contact number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="village">Village</Label>
                  <Input
                    id="village"
                    value={profileForm.village}
                    onChange={(event) => setProfileForm((current) => ({ ...current, village: event.target.value }))}
                    placeholder="Village name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="block">Block</Label>
                  <Input
                    id="block"
                    value={profileForm.block}
                    onChange={(event) => setProfileForm((current) => ({ ...current, block: event.target.value }))}
                    placeholder="Block name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="district">District</Label>
                  <Input
                    id="district"
                    value={profileForm.district}
                    onChange={(event) => setProfileForm((current) => ({ ...current, district: event.target.value }))}
                    placeholder="District name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="households_covered">Households covered</Label>
                  <Input
                    id="households_covered"
                    type="number"
                    min="0"
                    value={profileForm.households_covered}
                    onChange={(event) => setProfileForm((current) => ({ ...current, households_covered: event.target.value }))}
                    placeholder="120"
                  />
                </div>
              </div>

              {profileStatus.error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {profileStatus.error}
                </div>
              )}
              {profileStatus.info && (
                <div className="rounded-xl border border-teal/30 bg-teal/10 px-3 py-2 text-sm text-teal-700">
                  {profileStatus.info}
                </div>
              )}

              <Button type="submit" disabled={savingProfile}>
                {savingProfile ? 'Saving...' : 'Save worker details'}
              </Button>
            </form>
          </div>

          <div className="rounded-[28px] border border-border bg-card p-6 shadow-[0_18px_48px_rgba(7,45,50,0.06)]">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal">Case Entry</p>
            <h2 className="mt-3 text-2xl font-heading font-bold text-foreground">Add patient report</h2>

            <form className="mt-6 space-y-4" onSubmit={handleCaseSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="patient_name">Patient name</Label>
                  <Input
                    id="patient_name"
                    value={caseForm.patient_name}
                    onChange={(event) => setCaseForm((current) => ({ ...current, patient_name: event.target.value }))}
                    placeholder="Person name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    min="0"
                    value={caseForm.age}
                    onChange={(event) => setCaseForm((current) => ({ ...current, age: event.target.value }))}
                    placeholder="Age"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Input
                    id="gender"
                    value={caseForm.gender}
                    onChange={(event) => setCaseForm((current) => ({ ...current, gender: event.target.value }))}
                    placeholder="Female / Male / Other"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="days_sick">Days sick</Label>
                  <Input
                    id="days_sick"
                    type="number"
                    min="0"
                    value={caseForm.days_sick}
                    onChange={(event) => setCaseForm((current) => ({ ...current, days_sick: event.target.value }))}
                    placeholder="3"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="case_village">Village</Label>
                  <Input
                    id="case_village"
                    value={caseForm.village}
                    onChange={(event) => setCaseForm((current) => ({ ...current, village: event.target.value }))}
                    placeholder="Village name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="case_block">Block</Label>
                  <Input
                    id="case_block"
                    value={caseForm.block}
                    onChange={(event) => setCaseForm((current) => ({ ...current, block: event.target.value }))}
                    placeholder="Block name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="case_district">District</Label>
                  <Input
                    id="case_district"
                    value={caseForm.district}
                    onChange={(event) => setCaseForm((current) => ({ ...current, district: event.target.value }))}
                    placeholder="District name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Triage result</Label>
                  <Select
                    value={caseForm.triage}
                    onValueChange={(value: 'self-care' | 'clinic' | 'emergency') =>
                      setCaseForm((current) => ({ ...current, triage: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select triage" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="self-care">Home care</SelectItem>
                      <SelectItem value="clinic">Clinic visit</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Referral status</Label>
                  <Select
                    value={caseForm.referral_status}
                    onValueChange={(value: 'pending' | 'referred' | 'completed') =>
                      setCaseForm((current) => ({ ...current, referral_status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="referred">Referred</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="symptoms">Symptoms</Label>
                <Textarea
                  id="symptoms"
                  value={caseForm.symptoms}
                  onChange={(event) => setCaseForm((current) => ({ ...current, symptoms: event.target.value }))}
                  placeholder="Fever for 3 days, cough, weakness"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="danger_signs">Danger signs</Label>
                <Textarea
                  id="danger_signs"
                  value={caseForm.danger_signs}
                  onChange={(event) => setCaseForm((current) => ({ ...current, danger_signs: event.target.value }))}
                  placeholder="Breathing trouble, chest pain, bleeding, fainting"
                />
              </div>

              {caseStatus.error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {caseStatus.error}
                </div>
              )}
              {caseStatus.info && (
                <div className="rounded-xl border border-teal/30 bg-teal/10 px-3 py-2 text-sm text-teal-700">
                  {caseStatus.info}
                </div>
              )}

              <Button type="submit" disabled={savingCase}>
                {savingCase ? 'Saving...' : 'Save case report'}
              </Button>
            </form>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[28px] border border-border bg-card p-6 shadow-[0_18px_48px_rgba(7,45,50,0.06)]">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-teal/10 p-3 text-teal">
                <MapPinned className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal">My Villages</p>
                <h2 className="text-2xl font-heading font-bold text-foreground">Village coverage</h2>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {villageSummaries.length ? (
                villageSummaries.map((item) => (
                  <div key={item.village} className="rounded-2xl border border-border bg-background/70 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-lg font-semibold text-foreground">{item.village}</p>
                        <p className="text-sm text-muted-foreground">Last visit: {item.lastVisit}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-teal/10 px-3 py-1 font-medium text-teal">{item.households} households</span>
                        <span className="rounded-full bg-amber-50 px-3 py-1 font-medium text-amber-700">{item.activeCases} active</span>
                        <span className="rounded-full bg-rose-50 px-3 py-1 font-medium text-rose-700">{item.urgentCases} urgent</span>
                        <span className="rounded-full bg-sky-50 px-3 py-1 font-medium text-sky-700">{item.dueVisits} due visits</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-background/70 p-5 text-sm text-muted-foreground">
                  Save your worker profile and first patient case to start this village summary.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-border bg-card p-6 shadow-[0_18px_48px_rgba(7,45,50,0.06)]">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal">Follow-up Queue</p>
            <h2 className="mt-3 text-2xl font-heading font-bold text-foreground">People needing action</h2>

            <div className="mt-6 space-y-4">
              {queueItems.length ? (
                queueItems.map((item) => (
                  <div key={`${item.person}-${item.updatedAt}`} className="rounded-2xl border border-border bg-background/70 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-lg font-semibold text-foreground">{item.person}</p>
                        <p className="text-sm text-muted-foreground">{item.village}</p>
                      </div>
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${statusTone[item.status]}`}>
                        {item.status}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.notes}</p>
                    <p className="mt-3 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">{item.updatedAt}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-background/70 p-5 text-sm text-muted-foreground">
                  No follow-up cases yet. Once you save case reports, they will appear here.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="min-h-[680px]">
          <ChatUI
            embedded
            mode="asha"
            initialWelcome="ASHA worker mode. Please include age, village, days of illness, and any danger signs. Example: woman, 52, fever for 3 days, vomiting, from Bareja."
          />
        </section>
      </main>
    </div>
  );
}
