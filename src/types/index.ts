/**
 * MediFlow AI - Core Domain Models & Data Types
 * Designed to mirror Firestore collections for PHC supply chain intelligence.
 */

export type UserRole = 'phc_staff' | 'district_officer';

export interface UserProfile {
  uid: string;
  role: UserRole;
  name: string;
  email: string;
  phcId?: string; // Present for phc_staff
  districtId?: string; // Present for district_officer or phc_staff
}

export type PHCType = '24x7 PHC' | 'Block PHC' | 'Urban PHC' | 'Community Health Centre';

export interface PHC {
  id: string;
  name: string;
  district: string;
  state: string;
  lat: number;
  lng: number;
  type: PHCType;
  contactNumber?: string;
  bedCapacity?: number;
}

export type MedicineCategory = 
  | 'Essential Analgesic'
  | 'Antibiotic'
  | 'Vaccine & Anti-serum'
  | 'Maternal & Child Health'
  | 'Chronic Care (NCD)'
  | 'Emergency & Critical Care';

export interface Medicine {
  id: string;
  name: string;
  unit: string; // e.g., 'Strips (10 tabs)', 'Vials', 'Packets', 'Ampoules'
  category: MedicineCategory;
  standardDailyThreshold: number; // baseline consumption
  criticalBufferDays: number; // usually 3-7 days
}

export interface StockRecord {
  phcId: string;
  medicineId: string;
  quantity: number;
  lastUpdated: string; // ISO timestamp
  expiryDate: string;  // YYYY-MM-DD
  updatedBy: string;   // Staff name or UID
  batchNumber?: string;
}

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type StockStatus = 'DEFICIT' | 'NORMAL' | 'SURPLUS';

export interface StockPrediction {
  phcId: string;
  medicineId: string;
  currentStock: number;
  averageDailyUsage: number;
  forecastedDemand: number; // 7-day projected demand
  daysToStockout: number;
  estimatedShortage: number;
  riskScore: number; // 0 to 100
  riskLevel: RiskLevel;
  stockStatus: StockStatus;
  calculationBreakdown: {
    formula: string;
    stock: number;
    usagePerDay: number;
    forecastWindowDays: number;
  };
  generatedAt: string;
}

export interface GeminiRiskExplanation {
  phcName: string;
  medicineName: string;
  riskSummary: string;
  reason: string;
  currentStock: number;
  forecastedDemand: number;
  estimatedShortage: number;
  suggestedAction: string;
  generatedAt: string;
  isAiGenerated: boolean;
}

export type RecommendationPriority = 'HIGH' | 'MEDIUM' | 'LOW';
export type RecommendationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface RedistributionRecommendation {
  id: string;
  fromPhcId: string;
  toPhcId: string;
  medicineId: string;
  quantity: number;
  priority: RecommendationPriority;
  reason: string;
  status: RecommendationStatus;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
}

export interface DistrictSummary {
  district: string;
  totalPhcs: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  surplusPhcsCount: number;
  deficitPhcsCount: number;
}
