export type AshaVillageSummary = {
  village: string;
  households: number;
  activeCases: number;
  urgentCases: number;
  dueVisits: number;
  lastVisit: string;
};

export type AshaCaseItem = {
  person: string;
  village: string;
  status: 'Home care' | 'Clinic visit' | 'Emergency';
  notes: string;
  updatedAt: string;
};

export type DistrictWorkerRow = {
  name: string;
  block: string;
  villages: number;
  activeCases: number;
  urgentCases: number;
  todayVisits: number;
};

export type DistrictVillageRow = {
  village: string;
  block: string;
  ashaName: string;
  activeCases: number;
  urgentCases: number;
  clinicReferrals: number;
};

export const ashaVillageSummaries: AshaVillageSummary[] = [
  {
    village: 'Bareja',
    households: 214,
    activeCases: 12,
    urgentCases: 2,
    dueVisits: 5,
    lastVisit: 'Today, 9:30 AM',
  },
  {
    village: 'Navapura',
    households: 168,
    activeCases: 8,
    urgentCases: 1,
    dueVisits: 3,
    lastVisit: 'Yesterday',
  },
  {
    village: 'Mahij',
    households: 196,
    activeCases: 10,
    urgentCases: 0,
    dueVisits: 4,
    lastVisit: 'Today, 11:00 AM',
  },
];

export const ashaCaseQueue: AshaCaseItem[] = [
  {
    person: 'Ramilaben, 52',
    village: 'Bareja',
    status: 'Clinic visit',
    notes: 'Fever for 3 days, vomiting, needs PHC review today.',
    updatedAt: '10 min ago',
  },
  {
    person: 'Mitesh, 8',
    village: 'Navapura',
    status: 'Home care',
    notes: 'Mild cough, no red flags, follow up after 24 hours.',
    updatedAt: '25 min ago',
  },
  {
    person: 'Savitaben, 31',
    village: 'Mahij',
    status: 'Emergency',
    notes: 'Chest pain and breathing trouble, referral started.',
    updatedAt: '40 min ago',
  },
];

export const districtSummary = {
  villagesCovered: 24,
  ashaWorkers: 9,
  activeCases: 86,
  emergencyCases: 7,
};

export const districtWorkers: DistrictWorkerRow[] = [
  {
    name: 'Kajal Patel',
    block: 'Daskroi',
    villages: 3,
    activeCases: 30,
    urgentCases: 2,
    todayVisits: 11,
  },
  {
    name: 'Rina Parmar',
    block: 'Bavla',
    villages: 4,
    activeCases: 21,
    urgentCases: 1,
    todayVisits: 7,
  },
  {
    name: 'Meena Chauhan',
    block: 'Bareja',
    villages: 2,
    activeCases: 18,
    urgentCases: 3,
    todayVisits: 8,
  },
  {
    name: 'Pooja Solanki',
    block: 'Sanand',
    villages: 5,
    activeCases: 17,
    urgentCases: 1,
    todayVisits: 6,
  },
];

export const districtVillages: DistrictVillageRow[] = [
  {
    village: 'Bareja',
    block: 'Daskroi',
    ashaName: 'Kajal Patel',
    activeCases: 12,
    urgentCases: 2,
    clinicReferrals: 4,
  },
  {
    village: 'Navapura',
    block: 'Daskroi',
    ashaName: 'Kajal Patel',
    activeCases: 8,
    urgentCases: 1,
    clinicReferrals: 3,
  },
  {
    village: 'Mahij',
    block: 'Bareja',
    ashaName: 'Meena Chauhan',
    activeCases: 10,
    urgentCases: 0,
    clinicReferrals: 2,
  },
  {
    village: 'Ranoda',
    block: 'Sanand',
    ashaName: 'Pooja Solanki',
    activeCases: 9,
    urgentCases: 1,
    clinicReferrals: 2,
  },
];

