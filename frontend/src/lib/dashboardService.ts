import { supabase } from '@/lib/supabaseClient';
import {
  type AshaCaseItem,
  type AshaVillageSummary,
  type DistrictVillageRow,
  type DistrictWorkerRow,
} from '@/lib/dashboardData';
import type { UserRole } from '@/hooks/use-auth';

export interface ProfileRecord {
  id: string;
  email: string | null;
  role: UserRole;
  full_name: string | null;
  phone: string | null;
  village: string | null;
  block: string | null;
  district: string | null;
  households_covered: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface CaseReportRecord {
  id: string;
  asha_user_id: string;
  patient_name: string;
  age: number | null;
  gender: string | null;
  village: string;
  block: string | null;
  district: string | null;
  symptoms: string;
  days_sick: number | null;
  danger_signs: string | null;
  triage: 'self-care' | 'clinic' | 'emergency';
  referral_status: 'pending' | 'referred' | 'completed';
  created_at: string;
}

type DistrictSummary = {
  villagesCovered: number;
  ashaWorkers: number;
  activeCases: number;
  emergencyCases: number;
};

function ensureSupabase() {
  if (!supabase) {
    throw new Error('Supabase is not configured on this site.');
  }
  return supabase;
}

export async function fetchProfile(userId: string): Promise<ProfileRecord | null> {
  const client = ensureSupabase();
  const { data, error } = await client
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as ProfileRecord | null;
}

export async function upsertProfile(profile: Omit<ProfileRecord, 'created_at' | 'updated_at'>): Promise<ProfileRecord> {
  const client = ensureSupabase();
  const { data, error } = await client
    .from('profiles')
    .upsert(profile, { onConflict: 'id' })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as ProfileRecord;
}

export async function insertCaseReport(report: Omit<CaseReportRecord, 'id' | 'created_at'>): Promise<CaseReportRecord> {
  const client = ensureSupabase();
  const { data, error } = await client
    .from('case_reports')
    .insert(report)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as CaseReportRecord;
}

export async function fetchAshaCaseReports(userId: string): Promise<CaseReportRecord[]> {
  const client = ensureSupabase();
  const { data, error } = await client
    .from('case_reports')
    .select('*')
    .eq('asha_user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as CaseReportRecord[];
}

export async function fetchDistrictProfiles(): Promise<ProfileRecord[]> {
  const client = ensureSupabase();
  const { data, error } = await client
    .from('profiles')
    .select('*')
    .eq('role', 'asha')
    .order('full_name', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as ProfileRecord[];
}

export async function fetchDistrictCaseReports(): Promise<CaseReportRecord[]> {
  const client = ensureSupabase();
  const { data, error } = await client
    .from('case_reports')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as CaseReportRecord[];
}

export function buildAshaVillageSummary(
  reports: CaseReportRecord[],
  profile: ProfileRecord | null
): AshaVillageSummary[] {
  if (!reports.length) {
    if (!profile?.village) {
      return [];
    }

    return [
      {
        village: profile.village,
        households: profile.households_covered ?? 0,
        activeCases: 0,
        urgentCases: 0,
        dueVisits: 0,
        lastVisit: 'No cases saved yet',
      },
    ];
  }

  type VillageAccumulator = AshaVillageSummary & { lastVisitAt: string };
  const grouped = new Map<string, VillageAccumulator>();

  for (const report of reports) {
    const key = report.village || profile?.village || 'Unknown village';
    const current = grouped.get(key) ?? {
      village: key,
      households: key === profile?.village ? profile.households_covered ?? 0 : 0,
      activeCases: 0,
      urgentCases: 0,
      dueVisits: 0,
      lastVisit: new Date(report.created_at).toLocaleString(),
      lastVisitAt: report.created_at,
    };

    current.activeCases += 1;
    current.dueVisits += report.referral_status === 'pending' ? 1 : 0;
    current.urgentCases += report.triage === 'emergency' ? 1 : 0;
    if (new Date(report.created_at) > new Date(current.lastVisitAt)) {
      current.lastVisit = new Date(report.created_at).toLocaleString();
      current.lastVisitAt = report.created_at;
    }
    grouped.set(key, current);
  }

  return Array.from(grouped.values()).map(({ lastVisitAt: _lastVisitAt, ...summary }) => summary);
}

export function buildAshaQueue(reports: CaseReportRecord[]): AshaCaseItem[] {
  if (!reports.length) {
    return [];
  }

  return reports.slice(0, 6).map((report) => ({
    person: report.age ? `${report.patient_name}, ${report.age}` : report.patient_name,
    village: report.village,
    status: report.triage === 'emergency' ? 'Emergency' : report.triage === 'clinic' ? 'Clinic visit' : 'Home care',
    notes: `${report.symptoms}${report.danger_signs ? ` Danger signs: ${report.danger_signs}.` : ''}`,
    updatedAt: new Date(report.created_at).toLocaleString(),
  }));
}

export function buildDistrictSummary(
  profiles: ProfileRecord[],
  reports: CaseReportRecord[]
): DistrictSummary {
  const villages = new Set(reports.map((item) => `${item.village}-${item.block ?? ''}-${item.district ?? ''}`));
  return {
    villagesCovered: villages.size,
    ashaWorkers: profiles.length,
    activeCases: reports.length,
    emergencyCases: reports.filter((item) => item.triage === 'emergency').length,
  };
}

export function buildDistrictWorkers(
  profiles: ProfileRecord[],
  reports: CaseReportRecord[]
): DistrictWorkerRow[] {
  return profiles.map((profile) => {
    const workerReports = reports.filter((report) => report.asha_user_id === profile.id);
    const villages = new Set(workerReports.map((report) => report.village));
    return {
      name: profile.full_name || profile.email || 'Unnamed worker',
      block: profile.block || 'Unknown block',
      villages: villages.size,
      activeCases: workerReports.length,
      urgentCases: workerReports.filter((report) => report.triage === 'emergency').length,
      todayVisits: workerReports.filter((report) => {
        const created = new Date(report.created_at);
        const now = new Date();
        return created.toDateString() === now.toDateString();
      }).length,
    };
  });
}

export function buildDistrictVillages(reports: CaseReportRecord[], profiles: ProfileRecord[]): DistrictVillageRow[] {
  if (!reports.length) {
    return [];
  }

  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));
  const grouped = new Map<string, DistrictVillageRow>();

  for (const report of reports) {
    const key = `${report.village}-${report.block ?? ''}-${report.district ?? ''}`;
    const existing = grouped.get(key) ?? {
      village: report.village,
      block: report.block || 'Unknown block',
      ashaName: profileMap.get(report.asha_user_id)?.full_name || profileMap.get(report.asha_user_id)?.email || 'Unknown worker',
      activeCases: 0,
      urgentCases: 0,
      clinicReferrals: 0,
    };

    existing.activeCases += 1;
    existing.urgentCases += report.triage === 'emergency' ? 1 : 0;
    existing.clinicReferrals += report.triage === 'clinic' ? 1 : 0;
    grouped.set(key, existing);
  }

  return Array.from(grouped.values()).sort((a, b) => b.activeCases - a.activeCases);
}
