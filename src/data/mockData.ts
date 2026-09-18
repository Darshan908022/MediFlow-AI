/**
 * MediFlow AI - Synthetic Demo Data
 * 
 * DISCLAIMER: This data is purely synthetic and generated for demonstration 
 * of PHC supply-chain workflows and AI redistribution logic in India.
 * It does NOT represent actual government facility inventories.
 */

import { Medicine, PHC, StockRecord, UserProfile } from '../types';

export const DEMO_DISTRICTS = ['Chengalpattu', 'Kanchipuram', 'Tiruvallur'];

export const DEMO_PHCS: PHC[] = [
  // District 1: Chengalpattu
  {
    id: 'phc_cpt_01',
    name: 'Kelambakkam Community PHC',
    district: 'Chengalpattu',
    state: 'Tamil Nadu',
    lat: 12.7845,
    lng: 80.2212,
    type: '24x7 PHC',
    contactNumber: '+91 44 2747 4101',
    bedCapacity: 12,
  },
  {
    id: 'phc_cpt_02',
    name: 'Nemmeli Coastal PHC',
    district: 'Chengalpattu',
    state: 'Tamil Nadu',
    lat: 12.6983,
    lng: 80.1745,
    type: 'Block PHC',
    contactNumber: '+91 44 2747 4102',
    bedCapacity: 6,
  },
  {
    id: 'phc_cpt_03',
    name: 'Thiruporur Model PHC',
    district: 'Chengalpattu',
    state: 'Tamil Nadu',
    lat: 12.7231,
    lng: 80.1894,
    type: '24x7 PHC',
    contactNumber: '+91 44 2747 4103',
    bedCapacity: 15,
  },
  {
    id: 'phc_cpt_04',
    name: 'Maraimalai Nagar Urban PHC',
    district: 'Chengalpattu',
    state: 'Tamil Nadu',
    lat: 12.7932,
    lng: 80.0245,
    type: 'Urban PHC',
    contactNumber: '+91 44 2747 4104',
    bedCapacity: 8,
  },

  // District 2: Kanchipuram
  {
    id: 'phc_kan_01',
    name: 'Walajabad Block PHC',
    district: 'Kanchipuram',
    state: 'Tamil Nadu',
    lat: 12.8021,
    lng: 79.8213,
    type: 'Block PHC',
    contactNumber: '+91 44 2723 5201',
    bedCapacity: 10,
  },
  {
    id: 'phc_kan_02',
    name: 'Sriperumbudur Industrial PHC',
    district: 'Kanchipuram',
    state: 'Tamil Nadu',
    lat: 12.9691,
    lng: 79.9482,
    type: '24x7 PHC',
    contactNumber: '+91 44 2723 5202',
    bedCapacity: 18,
  },
  {
    id: 'phc_kan_03',
    name: 'Uthiramerur Rural PHC',
    district: 'Kanchipuram',
    state: 'Tamil Nadu',
    lat: 12.6142,
    lng: 79.7612,
    type: 'Block PHC',
    contactNumber: '+91 44 2723 5203',
    bedCapacity: 8,
  },
  {
    id: 'phc_kan_04',
    name: 'Kundrathur Taluk PHC',
    district: 'Kanchipuram',
    state: 'Tamil Nadu',
    lat: 12.9983,
    lng: 80.0964,
    type: 'Urban PHC',
    contactNumber: '+91 44 2723 5204',
    bedCapacity: 14,
  },

  // District 3: Tiruvallur
  {
    id: 'phc_tlr_01',
    name: 'Poonamallee General PHC',
    district: 'Tiruvallur',
    state: 'Tamil Nadu',
    lat: 13.0489,
    lng: 80.0945,
    type: '24x7 PHC',
    contactNumber: '+91 44 2627 6301',
    bedCapacity: 20,
  },
  {
    id: 'phc_tlr_02',
    name: 'Gummidipoondi Border PHC',
    district: 'Tiruvallur',
    state: 'Tamil Nadu',
    lat: 13.4072,
    lng: 80.1284,
    type: 'Block PHC',
    contactNumber: '+91 44 2627 6302',
    bedCapacity: 10,
  },
  {
    id: 'phc_tlr_03',
    name: 'Tiruttani Hillside PHC',
    district: 'Tiruvallur',
    state: 'Tamil Nadu',
    lat: 13.1812,
    lng: 79.6102,
    type: 'Community Health Centre',
    contactNumber: '+91 44 2627 6303',
    bedCapacity: 16,
  },
  {
    id: 'phc_tlr_04',
    name: 'Avadi Suburban PHC',
    district: 'Tiruvallur',
    state: 'Tamil Nadu',
    lat: 13.1189,
    lng: 80.1012,
    type: 'Urban PHC',
    contactNumber: '+91 44 2627 6304',
    bedCapacity: 12,
  },
];

export const DEMO_MEDICINES: Medicine[] = [
  {
    id: 'med_pcm_500',
    name: 'Paracetamol 500mg Tablets',
    unit: 'Tablets',
    category: 'Essential Analgesic',
    standardDailyThreshold: 45,
    criticalBufferDays: 5,
  },
  {
    id: 'med_amx_500',
    name: 'Amoxicillin 500mg Capsules',
    unit: 'Capsules',
    category: 'Antibiotic',
    standardDailyThreshold: 30,
    criticalBufferDays: 4,
  },
  {
    id: 'med_ors_21g',
    name: 'Oral Rehydration Salts (ORS)',
    unit: 'Sachets',
    category: 'Emergency & Critical Care',
    standardDailyThreshold: 50,
    criticalBufferDays: 7,
  },
  {
    id: 'med_arv_vial',
    name: 'Anti-Rabies Vaccine (ARV)',
    unit: 'Vials',
    category: 'Vaccine & Anti-serum',
    standardDailyThreshold: 8,
    criticalBufferDays: 7,
  },
  {
    id: 'med_met_500',
    name: 'Metformin 500mg Tablets',
    unit: 'Tablets',
    category: 'Chronic Care (NCD)',
    standardDailyThreshold: 40,
    criticalBufferDays: 6,
  },
  {
    id: 'med_ifa_tab',
    name: 'Iron & Folic Acid (IFA) Large',
    unit: 'Tablets',
    category: 'Maternal & Child Health',
    standardDailyThreshold: 20,
    criticalBufferDays: 10,
  },
  {
    id: 'med_oxy_10iu',
    name: 'Oxytocin Injection 10 IU/ml',
    unit: 'Ampoules',
    category: 'Maternal & Child Health',
    standardDailyThreshold: 6,
    criticalBufferDays: 5,
  },
  {
    id: 'med_art_lum',
    name: 'Artemether 20mg + Lumefantrine 120mg',
    unit: 'Tablets',
    category: 'Antibiotic',
    standardDailyThreshold: 12,
    criticalBufferDays: 5,
  },
];

/**
 * Standardizes inventory quantity reporting to base units with packaging conversions
 * e.g. 110 Tablets (11 Strips), 12 Vials, 580 Sachets
 */
export function formatStockDisplay(quantity: number, medicineId: string): {
  primary: string;
  secondary?: string;
  combined: string;
} {
  const med = DEMO_MEDICINES.find((m) => m.id === medicineId);
  const baseUnit = med ? med.unit : 'Units';

  if (quantity === 0) {
    return {
      primary: `0 ${baseUnit}`,
      combined: `0 ${baseUnit}`,
    };
  }

  if (medicineId === 'med_pcm_500') {
    const strips = Math.round(quantity / 10);
    return {
      primary: `${quantity} Tablets`,
      secondary: `(${strips} Strips)`,
      combined: `${quantity} Tablets (${strips} Strips)`,
    };
  }

  if (medicineId === 'med_amx_500') {
    const strips = Math.round(quantity / 10);
    return {
      primary: `${quantity} Capsules`,
      secondary: `(${strips} Strips)`,
      combined: `${quantity} Capsules (${strips} Strips)`,
    };
  }

  if (medicineId === 'med_art_lum') {
    const strips = Math.round(quantity / 24);
    return {
      primary: `${quantity} Tablets`,
      secondary: `(${strips} Strips)`,
      combined: `${quantity} Tablets (${strips} Strips)`,
    };
  }

  return {
    primary: `${quantity} ${baseUnit}`,
    combined: `${quantity} ${baseUnit}`,
  };
}


/**
 * Synthetic baseline consumption rates (units per day) per PHC and medicine.
 * Allows deterministic, realistic stock calculations.
 */
export const DEMO_CONSUMPTION_RATES: Record<string, Record<string, number>> = {
  // Kelambakkam (Heavy footfall)
  phc_cpt_01: {
    med_pcm_500: 55,
    med_amx_500: 38,
    med_ors_21g: 65,
    med_arv_vial: 10,
    med_met_500: 48,
    med_ifa_tab: 24,
    med_oxy_10iu: 8,
    med_art_lum: 14,
  },
  // Nemmeli (Moderate coastal)
  phc_cpt_02: {
    med_pcm_500: 42,
    med_amx_500: 28,
    med_ors_21g: 50,
    med_arv_vial: 6,
    med_met_500: 35,
    med_ifa_tab: 18,
    med_oxy_10iu: 5,
    med_art_lum: 10,
  },
  // Thiruporur (Hub with large warehouse surplus)
  phc_cpt_03: {
    med_pcm_500: 50,
    med_amx_500: 32,
    med_ors_21g: 60,
    med_arv_vial: 8,
    med_met_500: 42,
    med_ifa_tab: 22,
    med_oxy_10iu: 7,
    med_art_lum: 12,
  },
  // Maraimalai Nagar (Urban clinic)
  phc_cpt_04: {
    med_pcm_500: 60,
    med_amx_500: 40,
    med_ors_21g: 70,
    med_arv_vial: 12,
    med_met_500: 52,
    med_ifa_tab: 25,
    med_oxy_10iu: 9,
    med_art_lum: 15,
  },
  // Sriperumbudur (High industrial footfall)
  phc_kan_02: {
    med_pcm_500: 65,
    med_amx_500: 45,
    med_ors_21g: 75,
    med_arv_vial: 14,
    med_met_500: 55,
    med_ifa_tab: 28,
    med_oxy_10iu: 10,
    med_art_lum: 16,
  },
  // Walajabad
  phc_kan_01: {
    med_pcm_500: 40,
    med_amx_500: 25,
    med_ors_21g: 45,
    med_arv_vial: 6,
    med_met_500: 32,
    med_ifa_tab: 16,
    med_oxy_10iu: 4,
    med_art_lum: 8,
  },
};

// Fallback baseline consumption rate generator for unlisted PHCs
export function getDailyUsage(phcId: string, medicineId: string): number {
  if (DEMO_CONSUMPTION_RATES[phcId] && DEMO_CONSUMPTION_RATES[phcId][medicineId]) {
    return DEMO_CONSUMPTION_RATES[phcId][medicineId];
  }
  const med = DEMO_MEDICINES.find((m) => m.id === medicineId);
  return med ? med.standardDailyThreshold : 25;
}

/**
 * Synthetic initial inventory designed to show:
 * - Critical stock-out threats (e.g. Paracetamol or ARV vaccine down to < 2-3 days in Kelambakkam & Poonamallee)
 * - Healthy surplus reserves in nearby PHCs (e.g. Thiruporur & Sriperumbudur) ready for redistribution
 */
export const INITIAL_STOCK_RECORDS: StockRecord[] = [
  // --- Chengalpattu District ---
  // Kelambakkam: Severe shortages in Paracetamol and Anti-Rabies Vaccine
  {
    phcId: 'phc_cpt_01',
    medicineId: 'med_pcm_500',
    quantity: 110, // 110 / 55 = 2.0 days (CRITICAL DEFICIT)
    lastUpdated: '2026-09-17T05:30:00Z',
    expiryDate: '2027-08-31',
    updatedBy: 'Staff Nurse Priya S.',
    batchNumber: 'PCM-26-081',
  },
  {
    phcId: 'phc_cpt_01',
    medicineId: 'med_arv_vial',
    quantity: 12, // 12 / 10 = 1.2 days (CRITICAL DEFICIT)
    lastUpdated: '2026-09-17T05:40:00Z',
    expiryDate: '2027-03-15',
    updatedBy: 'Staff Nurse Priya S.',
    batchNumber: 'ARV-25-412',
  },
  {
    phcId: 'phc_cpt_01',
    medicineId: 'med_amx_500',
    quantity: 190, // ~5 days (MEDIUM)
    lastUpdated: '2026-09-16T10:00:00Z',
    expiryDate: '2027-11-30',
    updatedBy: 'Staff Nurse Priya S.',
  },
  {
    phcId: 'phc_cpt_01',
    medicineId: 'med_ors_21g',
    quantity: 580, // ~8.9 days (LOW)
    lastUpdated: '2026-09-16T11:00:00Z',
    expiryDate: '2028-01-31',
    updatedBy: 'Staff Nurse Priya S.',
  },

  // Thiruporur: Rich surplus in Paracetamol and Anti-Rabies Vaccine (Donor candidate)
  {
    phcId: 'phc_cpt_03',
    medicineId: 'med_pcm_500',
    quantity: 1650, // 1650 / 50 = 33 days (SURPLUS)
    lastUpdated: '2026-09-17T04:15:00Z',
    expiryDate: '2027-10-31',
    updatedBy: 'Pharmacist R. Kumar',
    batchNumber: 'PCM-26-099',
  },
  {
    phcId: 'phc_cpt_03',
    medicineId: 'med_arv_vial',
    quantity: 260, // 260 / 8 = 32.5 days (SURPLUS)
    lastUpdated: '2026-09-17T04:20:00Z',
    expiryDate: '2027-06-30',
    updatedBy: 'Pharmacist R. Kumar',
    batchNumber: 'ARV-26-104',
  },
  {
    phcId: 'phc_cpt_03',
    medicineId: 'med_amx_500',
    quantity: 480, // 15 days (NORMAL)
    lastUpdated: '2026-09-15T09:00:00Z',
    expiryDate: '2027-12-31',
    updatedBy: 'Pharmacist R. Kumar',
  },

  // Nemmeli: Deficit in Oxytocin & ORS
  {
    phcId: 'phc_cpt_02',
    medicineId: 'med_oxy_10iu',
    quantity: 14, // 14 / 5 = 2.8 days (CRITICAL DEFICIT)
    lastUpdated: '2026-09-17T06:10:00Z',
    expiryDate: '2027-05-15',
    updatedBy: 'ANM Lakshmi M.',
    batchNumber: 'OXY-26-033',
  },
  {
    phcId: 'phc_cpt_02',
    medicineId: 'med_pcm_500',
    quantity: 650, // 15.4 days (NORMAL)
    lastUpdated: '2026-09-16T08:00:00Z',
    expiryDate: '2027-09-30',
    updatedBy: 'ANM Lakshmi M.',
  },

  // Maraimalai Nagar: Surplus in Oxytocin & ORS
  {
    phcId: 'phc_cpt_04',
    medicineId: 'med_oxy_10iu',
    quantity: 280, // 280 / 9 = 31 days (SURPLUS)
    lastUpdated: '2026-09-16T12:00:00Z',
    expiryDate: '2027-09-30',
    updatedBy: 'Pharmacist Anita D.',
    batchNumber: 'OXY-26-041',
  },
  {
    phcId: 'phc_cpt_04',
    medicineId: 'med_pcm_500',
    quantity: 720, // 12 days (NORMAL)
    lastUpdated: '2026-09-16T12:30:00Z',
    expiryDate: '2027-07-31',
    updatedBy: 'Pharmacist Anita D.',
  },

  // --- Kanchipuram District ---
  // Walajabad: Deficit in Amoxicillin
  {
    phcId: 'phc_kan_01',
    medicineId: 'med_amx_500',
    quantity: 50, // 50 / 25 = 2.0 days (CRITICAL DEFICIT)
    lastUpdated: '2026-09-17T06:45:00Z',
    expiryDate: '2027-04-30',
    updatedBy: 'Staff Murugan K.',
    batchNumber: 'AMX-26-012',
  },
  // Sriperumbudur: Surplus in Amoxicillin
  {
    phcId: 'phc_kan_02',
    medicineId: 'med_amx_500',
    quantity: 1400, // 1400 / 45 = 31.1 days (SURPLUS)
    lastUpdated: '2026-09-17T05:00:00Z',
    expiryDate: '2027-12-15',
    updatedBy: 'Pharmacist Devaki V.',
    batchNumber: 'AMX-26-088',
  },

  // --- Tiruvallur District ---
  // Poonamallee: Deficit in Anti-Rabies Vaccine
  {
    phcId: 'phc_tlr_01',
    medicineId: 'med_arv_vial',
    quantity: 15, // 15 / 12 = 1.25 days (CRITICAL DEFICIT)
    lastUpdated: '2026-09-17T06:00:00Z',
    expiryDate: '2027-02-28',
    updatedBy: 'Sister Mary J.',
    batchNumber: 'ARV-26-004',
  },
  // Tiruttani: Surplus in Anti-Rabies Vaccine
  {
    phcId: 'phc_tlr_03',
    medicineId: 'med_arv_vial',
    quantity: 320, // 320 / 8 = 40 days (SURPLUS)
    lastUpdated: '2026-09-16T14:00:00Z',
    expiryDate: '2027-08-31',
    updatedBy: 'Staff Govind R.',
    batchNumber: 'ARV-26-077',
  },
];

// Pre-configured Demo Users for instant testing
export const DEMO_USERS: UserProfile[] = [
  {
    uid: 'user_phc_cpt_01',
    role: 'phc_staff',
    name: 'Priya Sundaram (Staff Nurse)',
    email: 'priya.s@kelambakkam.phc.gov.in',
    phcId: 'phc_cpt_01',
    districtId: 'Chengalpattu',
  },
  {
    uid: 'user_officer_cpt',
    role: 'district_officer',
    name: 'Dr. K. Ravichandran, MBBS, MD',
    email: 'ddhs.chengalpattu@health.tn.gov.in',
    districtId: 'Chengalpattu',
  },
  {
    uid: 'user_officer_kan',
    role: 'district_officer',
    name: 'Dr. Meenakshi S., Deputy Director',
    email: 'ddhs.kanchipuram@health.tn.gov.in',
    districtId: 'Kanchipuram',
  },
];
