import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Pill, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  Filter, 
  ArrowRight, 
  ArrowUpDown, 
  TrendingDown, 
  TrendingUp, 
  MapPin, 
  Sparkles,
  Info,
  Layers,
  Activity,
  Truck,
  Clock,
  ThermometerSnowflake,
  ShieldCheck,
  Check,
  XCircle,
  FileCheck
} from 'lucide-react';
import { Medicine, PHC, StockPrediction, StockRecord, UserProfile, RedistributionRecommendation } from '../types';
import { DEMO_DISTRICTS, DEMO_MEDICINES, DEMO_PHCS, getDailyUsage, formatStockDisplay } from '../data/mockData';
import { calculateStockRisk } from '../services/riskCalculator';
import { 
  generateRedistributionCandidates, 
  EnrichedRedistributionRecommendation,
  calculateHaversineDistance,
  estimateTransitTimeMinutes 
} from '../services/redistributionEngine';
import { GeminiExplanationModal } from './GeminiExplanationModal';
import { RedistributionReviewModal } from './RedistributionReviewModal';

interface DistrictDashboardProps {
  currentUser: UserProfile;
  stockRecords: StockRecord[];
  redistributions?: RedistributionRecommendation[];
  onUpdateStockRecord?: (record: StockRecord) => Promise<void>;
  onSaveRedistribution?: (recommendation: RedistributionRecommendation) => Promise<void>;
  onNavigateToPhc?: (phcId: string) => void;
  onSelectMedicineForExplain?: (phcId: string, medicineId: string) => void;
}

export const DistrictDashboard: React.FC<DistrictDashboardProps> = ({
  currentUser,
  stockRecords,
  redistributions = [],
  onUpdateStockRecord,
  onSaveRedistribution,
  onNavigateToPhc,
}) => {
  const [activeTab, setActiveTab] = useState<'surveillance' | 'redistributions'>('surveillance');
  const [selectedDistrict, setSelectedDistrict] = useState<string>(
    currentUser.districtId || 'All'
  );
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMedicineFilter, setSelectedMedicineFilter] = useState<string>('ALL');

  // Success Toast for dispatch action
  const [dispatchToast, setDispatchToast] = useState<{
    message: string;
    type: 'success' | 'reject';
  } | null>(null);

  // Modal state for Gemini explanation
  const [explanationTarget, setExplanationTarget] = useState<{
    phc: PHC;
    medicine: Medicine;
    record: StockRecord;
    prediction: StockPrediction;
    dailyUsage: number;
  } | null>(null);

  // Modal state for Redistribution Review
  const [selectedReviewRecommendation, setSelectedReviewRecommendation] = useState<EnrichedRedistributionRecommendation | null>(null);

  // Live Inventory evaluation
  const evaluatedInventory = useMemo(() => {
    const list: Array<{
      phc: PHC;
      medicine: Medicine;
      record: StockRecord;
      dailyUsage: number;
      prediction: StockPrediction;
    }> = [];

    DEMO_PHCS.forEach((phc) => {
      DEMO_MEDICINES.forEach((medicine) => {
        const record = stockRecords.find(
          (r) => r.phcId === phc.id && r.medicineId === medicine.id
        ) || {
          phcId: phc.id,
          medicineId: medicine.id,
          quantity: 0,
          lastUpdated: 'Out of Stock / No Active Batch',
          expiryDate: 'Out of Stock / No Active Batch',
          updatedBy: 'System',
        };

        const dailyUsage = getDailyUsage(phc.id, medicine.id);
        const prediction = calculateStockRisk({
          phcId: phc.id,
          medicineId: medicine.id,
          currentStock: record.quantity,
          averageDailyUsage: dailyUsage,
        });

        list.push({
          phc,
          medicine,
          record,
          dailyUsage,
          prediction,
        });
      });
    });

    return list;
  }, [stockRecords]);

  const scopedPhcs = useMemo(() => {
    if (selectedDistrict === 'All') return DEMO_PHCS;
    return DEMO_PHCS.filter((p) => p.district === selectedDistrict);
  }, [selectedDistrict]);

  const scopedInventory = useMemo(() => {
    if (selectedDistrict === 'All') return evaluatedInventory;
    return evaluatedInventory.filter((item) => item.phc.district === selectedDistrict);
  }, [evaluatedInventory, selectedDistrict]);

  // Aggregate metrics
  const stats = useMemo(() => {
    const totalPhcs = scopedPhcs.length;
    const highRiskItems = scopedInventory.filter((i) => i.prediction.riskLevel === 'HIGH').length;
    const mediumRiskItems = scopedInventory.filter((i) => i.prediction.riskLevel === 'MEDIUM').length;
    const lowRiskItems = scopedInventory.filter((i) => i.prediction.riskLevel === 'LOW').length;

    const deficitPhcSet = new Set(
      scopedInventory.filter((i) => i.prediction.stockStatus === 'DEFICIT').map((i) => i.phc.id)
    );

    const surplusPhcSet = new Set(
      scopedInventory.filter((i) => i.prediction.stockStatus === 'SURPLUS').map((i) => i.phc.id)
    );

    return {
      totalPhcs,
      highRiskItems,
      mediumRiskItems,
      lowRiskItems,
      deficitPhcsCount: deficitPhcSet.size,
      surplusPhcsCount: surplusPhcSet.size,
    };
  }, [scopedPhcs, scopedInventory]);

  // Filtered rows for Surveillance table
  const filteredRows = useMemo(() => {
    return scopedInventory.filter((item) => {
      if (selectedRiskFilter !== 'ALL' && item.prediction.riskLevel !== selectedRiskFilter) {
        return false;
      }
      if (selectedMedicineFilter !== 'ALL' && item.medicine.id !== selectedMedicineFilter) {
        return false;
      }
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchesPhc = item.phc.name.toLowerCase().includes(query);
        const matchesMed = item.medicine.name.toLowerCase().includes(query);
        if (!matchesPhc && !matchesMed) return false;
      }
      return true;
    });
  }, [scopedInventory, selectedRiskFilter, selectedMedicineFilter, searchQuery]);

  // Real-time Redistribution candidates from Engine
  const generatedCandidates = useMemo(() => {
    return generateRedistributionCandidates(stockRecords, selectedDistrict);
  }, [stockRecords, selectedDistrict]);

  // Merge generated candidates with Firestore persisted status if available
  const mergedRecommendations: EnrichedRedistributionRecommendation[] = useMemo(() => {
    return generatedCandidates.map((candidate) => {
      const persisted = redistributions.find((r) => r.id === candidate.id);
      if (persisted) {
        return {
          ...candidate,
          status: persisted.status,
          reviewedAt: persisted.reviewedAt,
          reviewedBy: persisted.reviewedBy,
          reviewNotes: persisted.reviewNotes,
          quantity: persisted.quantity || candidate.quantity,
        };
      }
      return candidate;
    });
  }, [generatedCandidates, redistributions]);

  const pendingRecommendations = useMemo(() => {
    return mergedRecommendations.filter((r) => r.status === 'PENDING');
  }, [mergedRecommendations]);

  const approvedRecommendations = useMemo(() => {
    return mergedRecommendations.filter((r) => r.status === 'APPROVED');
  }, [mergedRecommendations]);

  const rejectedRecommendations = useMemo(() => {
    return mergedRecommendations.filter((r) => r.status === 'REJECTED');
  }, [mergedRecommendations]);

  // Helper to open review modal for an imbalance candidate
  const handleOpenReview = (rec: EnrichedRedistributionRecommendation) => {
    setSelectedReviewRecommendation(rec);
  };

  // Handler for approving a redistribution proposal
  const handleApproveRecommendation = async (
    rec: EnrichedRedistributionRecommendation,
    customQuantity: number,
    notes: string,
    executeStockTransfer: boolean
  ) => {
    const updatedRec: RedistributionRecommendation = {
      id: rec.id,
      fromPhcId: rec.fromPhcId,
      toPhcId: rec.toPhcId,
      medicineId: rec.medicineId,
      quantity: customQuantity,
      priority: rec.priority,
      reason: notes.slice(0, 480) || rec.reason.slice(0, 480),
      status: 'APPROVED',
      createdAt: rec.createdAt,
      reviewedAt: new Date().toISOString(),
      reviewedBy: currentUser.name,
      reviewNotes: notes.slice(0, 480),
    };

    // 1. Save recommendation status in Firestore
    if (onSaveRedistribution) {
      await onSaveRedistribution(updatedRec);
    }

    // 2. If requested, automatically adjust and sync both stock records in Firestore
    if (executeStockTransfer && onUpdateStockRecord) {
      const donorRecord = stockRecords.find(
        (r) => r.phcId === rec.fromPhcId && r.medicineId === rec.medicineId
      );
      const receiverRecord = stockRecords.find(
        (r) => r.phcId === rec.toPhcId && r.medicineId === rec.medicineId
      );

      const donorQty = Math.max(0, (donorRecord?.quantity || rec.donorCurrentStock) - customQuantity);
      const receiverQty = (receiverRecord?.quantity || rec.receiverCurrentStock) + customQuantity;

      const now = new Date().toISOString();

      const updatedDonorRecord: StockRecord = {
        phcId: rec.fromPhcId,
        medicineId: rec.medicineId,
        quantity: donorQty,
        lastUpdated: now,
        expiryDate: donorRecord?.expiryDate || '2027-12-31',
        batchNumber: donorRecord?.batchNumber || 'REDIST-OUT',
        updatedBy: `Dispatched by ${currentUser.name}`,
      };

      const updatedReceiverRecord: StockRecord = {
        phcId: rec.toPhcId,
        medicineId: rec.medicineId,
        quantity: receiverQty,
        lastUpdated: now,
        expiryDate: donorRecord?.expiryDate || '2027-12-31',
        batchNumber: donorRecord?.batchNumber || 'REDIST-IN',
        updatedBy: `Received via ${currentUser.name}`,
      };

      await onUpdateStockRecord(updatedDonorRecord);
      await onUpdateStockRecord(updatedReceiverRecord);
    }

    setDispatchToast({
      message: `Transfer Approved: Dispatched ${customQuantity} ${rec.medicine.unit} from ${rec.fromPhc.name} to ${rec.toPhc.name}! Cloud Firestore updated.`,
      type: 'success',
    });

    setTimeout(() => {
      setDispatchToast(null);
    }, 6000);
  };

  // Handler for rejecting a recommendation
  const handleRejectRecommendation = async (
    rec: EnrichedRedistributionRecommendation,
    notes: string
  ) => {
    const updatedRec: RedistributionRecommendation = {
      id: rec.id,
      fromPhcId: rec.fromPhcId,
      toPhcId: rec.toPhcId,
      medicineId: rec.medicineId,
      quantity: rec.quantity,
      priority: rec.priority,
      reason: notes.slice(0, 480) || rec.reason.slice(0, 480),
      status: 'REJECTED',
      createdAt: rec.createdAt,
      reviewedAt: new Date().toISOString(),
      reviewedBy: currentUser.name,
      reviewNotes: notes.slice(0, 480),
    };

    if (onSaveRedistribution) {
      await onSaveRedistribution(updatedRec);
    }

    setDispatchToast({
      message: `Proposal Rejected for ${rec.medicine.name}. Recorded in audit log.`,
      type: 'reject',
    });

    setTimeout(() => {
      setDispatchToast(null);
    }, 5000);
  };

  return (
    <div className="space-y-6">
      {/* Action Notification Toast */}
      {dispatchToast && (
        <div className={`p-4 rounded-xl shadow-lg border flex items-center justify-between text-xs font-semibold animate-in fade-in slide-in-from-top-2 duration-200 ${
          dispatchToast.type === 'success'
            ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
            : 'bg-red-50 text-red-900 border-red-300'
        }`}>
          <div className="flex items-center gap-2">
            {dispatchToast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <XCircle className="w-4 h-4 text-red-600" />
            )}
            <span>{dispatchToast.message}</span>
          </div>
          <button
            onClick={() => setDispatchToast(null)}
            className="text-slate-400 hover:text-slate-700 text-xs px-2 py-0.5 rounded cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top Header Card with Tab Switcher */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                DISTRICT SURVEILLANCE & DISPATCH
              </span>
              <span className="text-xs text-slate-500 font-medium">Tamil Nadu State Health Mission</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
              District Health Officer Command Center
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Live run-rate risk classification, Gemini explanation, and human-in-the-loop redistribution dispatch.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Jurisdiction Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700">District:</span>
              <select
                id="district-filter-select"
                aria-label="Filter District Jurisdiction"
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-medium text-slate-800 focus:outline-blue-600"
              >
                <option value="All">All Districts (3 Districts • 12 PHCs)</option>
                {DEMO_DISTRICTS.map((district) => (
                  <option key={district} value={district}>
                    {district} District
                  </option>
                ))}
              </select>
            </div>

            {/* Tab Controls */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-medium">
              <button
                onClick={() => setActiveTab('surveillance')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                  activeTab === 'surveillance'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Activity className="w-3.5 h-3.5 text-blue-600" />
                Risk Surveillance Matrix
              </button>
              <button
                onClick={() => setActiveTab('redistributions')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                  activeTab === 'redistributions'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Truck className="w-3.5 h-3.5 text-purple-600" />
                AI Redistribution Hub
                {pendingRecommendations.length > 0 && (
                  <span className="px-1.5 py-0.2 bg-purple-600 text-white rounded-full text-[10px] font-bold">
                    {pendingRecommendations.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* TAB 1: RISK SURVEILLANCE MATRIX */}
      {activeTab === 'surveillance' && (
        <>
          {/* 6 Executive Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[11px] text-slate-500 font-medium">Total PHCs Monitored</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{stats.totalPhcs}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Primary facilities reporting</div>
            </div>

            <div className="bg-red-50/70 p-3.5 rounded-xl border border-red-200 shadow-xs">
              <div className="text-[11px] text-red-700 font-medium flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> High Risk Alert Items
              </div>
              <div className="text-2xl font-bold text-red-800 mt-1">{stats.highRiskItems}</div>
              <div className="text-[10px] text-red-600 mt-0.5">Medicine stockouts ≤ 3 days</div>
            </div>

            <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200 shadow-xs">
              <div className="text-[11px] text-amber-700 font-medium flex items-center gap-1">
                <Activity className="w-3.5 h-3.5" /> Medium Risk Alert Items
              </div>
              <div className="text-2xl font-bold text-amber-800 mt-1">{stats.mediumRiskItems}</div>
              <div className="text-[10px] text-amber-600 mt-0.5">3 to 7 days run-rate</div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[11px] text-slate-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" /> Low Risk Safe Items
              </div>
              <div className="text-2xl font-bold text-slate-800 mt-1">{stats.lowRiskItems}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">&gt; 7 days buffer</div>
            </div>

            <div className="bg-red-100/50 p-3.5 rounded-xl border border-red-300 shadow-xs">
              <div className="text-[11px] text-red-800 font-medium flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5" /> Deficit PHCs
              </div>
              <div className="text-2xl font-bold text-red-900 mt-1">{stats.deficitPhcsCount}</div>
              <div className="text-[10px] text-red-700 mt-0.5">Facilities with shortfalls</div>
            </div>

            <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200 shadow-xs">
              <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> Surplus PHCs
              </div>
              <div className="text-2xl font-bold text-emerald-800 mt-1">{stats.surplusPhcsCount}</div>
              <div className="text-[10px] text-emerald-600 mt-0.5">Donor candidates (≥25d)</div>
            </div>
          </div>

          {/* Quick Cross-Facility Imbalance Cards with direct "Review & Dispatch" Action */}
          {pendingRecommendations.length > 0 && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <h2 className="text-sm font-bold text-slate-900">
                    Active Deficit vs. Surplus Imbalances ({pendingRecommendations.length} Recommendations)
                  </h2>
                </div>
                <button
                  onClick={() => setActiveTab('redistributions')}
                  className="text-xs text-purple-700 hover:text-purple-900 font-semibold inline-flex items-center gap-1 cursor-pointer"
                >
                  View All in Redistribution Hub <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pendingRecommendations.slice(0, 4).map((rec) => (
                  <div 
                    key={rec.id}
                    className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 hover:border-purple-300 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-800">{rec.medicine.name}</span>
                        {rec.coldChainRequired && (
                          <span title="Cold chain required">
                            <ThermometerSnowflake className="w-3 h-3 text-blue-600" />
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                        {rec.formattedQuantity.primary} recommended
                      </span>
                    </div>

                    <div className="grid grid-cols-5 items-center gap-2 text-xs mb-3">
                      <div className="col-span-2 bg-red-50 p-2 rounded border border-red-200">
                        <div className="text-[9px] text-red-600 font-bold uppercase">RECEIVER (Deficit)</div>
                        <div className="font-semibold text-slate-800 text-[11px] truncate">{rec.toPhc.name}</div>
                        <div className="font-mono text-red-700 font-bold mt-0.5 text-[10px]">
                          {rec.receiverBufferDaysBefore}d left
                        </div>
                      </div>

                      <div className="col-span-1 flex flex-col items-center justify-center text-slate-400">
                        <span className="text-[9px] font-semibold text-purple-700">{rec.distanceKm} km</span>
                        <ArrowRight className="w-3.5 h-3.5 text-purple-600 my-0.5" />
                        <span className="text-[8px] text-slate-400">~{rec.estimatedTransitMinutes}m</span>
                      </div>

                      <div className="col-span-2 bg-emerald-50 p-2 rounded border border-emerald-200">
                        <div className="text-[9px] text-emerald-600 font-bold uppercase">DONOR (Surplus)</div>
                        <div className="font-semibold text-slate-800 text-[11px] truncate">{rec.fromPhc.name}</div>
                        <div className="font-mono text-emerald-700 font-bold mt-0.5 text-[10px]">
                          {rec.donorBufferDaysBefore}d buffer
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        rec.priority === 'HIGH' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {rec.priority} Priority
                      </span>

                      <button
                        onClick={() => handleOpenReview(rec)}
                        className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                      >
                        <Sparkles className="w-3 h-3" />
                        Review & Dispatch
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main Stock-Out Risk Surveillance Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Primary Health Centre Supply Matrix
                  </h2>
                  <p className="text-xs text-slate-500">
                    Run-rate calculation: <code className="text-slate-700">Days Remaining = Current Stock / Daily Consumption</code>
                  </p>
                </div>
                <div className="text-xs text-slate-500">
                  Showing <strong>{filteredRows.length}</strong> items
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search PHC facility or medicine..."
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-slate-800 focus:outline-blue-600"
                  />
                </div>

                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                  {(['ALL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setSelectedRiskFilter(lvl)}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                        selectedRiskFilter === lvl
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>

                <select
                  aria-label="Filter by Medicine"
                  value={selectedMedicineFilter}
                  onChange={(e) => setSelectedMedicineFilter(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-blue-600"
                >
                  <option value="ALL">All Medicines (8)</option>
                  {DEMO_MEDICINES.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[11px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Primary Health Centre (PHC)</th>
                    <th className="py-3 px-4">Medicine</th>
                    <th className="py-3 px-4">Current Stock</th>
                    <th className="py-3 px-4">7-Day Demand</th>
                    <th className="py-3 px-4">Days Remaining</th>
                    <th className="py-3 px-4">Supply Status</th>
                    <th className="py-3 px-4">Risk Level</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredRows.map((item) => {
                    const { phc, medicine, record, prediction, dailyUsage } = item;
                    const isHigh = prediction.riskLevel === 'HIGH';
                    const isMedium = prediction.riskLevel === 'MEDIUM';
                    const stockFormatted = formatStockDisplay(record.quantity, medicine.id);
                    const isZeroStock = record.quantity === 0;

                    return (
                      <tr key={`${phc.id}_${medicine.id}`} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">{phc.name}</div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" /> {phc.district} District • {phc.type}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800">{medicine.name}</div>
                          <div className="text-[10px] text-slate-400">{medicine.category}</div>
                        </td>

                        <td className="py-3.5 px-4 font-mono">
                          {isZeroStock ? (
                            <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded text-[11px] font-semibold border border-amber-200">
                              0 {medicine.unit} (Out of Stock)
                            </span>
                          ) : (
                            <div>
                              <span className="font-bold text-slate-900">{stockFormatted.primary}</span>
                              {stockFormatted.secondary && (
                                <span className="text-[11px] text-slate-500 ml-1.5 font-normal">
                                  {stockFormatted.secondary}
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 font-mono text-slate-700">
                          {prediction.forecastedDemand} {medicine.unit}
                          <div className="text-[10px] text-slate-400 font-sans">
                            Burn: {dailyUsage} / day
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className={`font-mono font-bold text-sm ${
                            isHigh ? 'text-red-600' : isMedium ? 'text-amber-600' : 'text-slate-800'
                          }`}>
                            {prediction.daysToStockout} days
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {prediction.estimatedShortage > 0 
                              ? `Deficit: -${prediction.estimatedShortage} ${medicine.unit}`
                              : 'No shortfall'}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                            prediction.stockStatus === 'DEFICIT'
                              ? 'bg-red-100 text-red-800'
                              : prediction.stockStatus === 'SURPLUS'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {prediction.stockStatus}
                          </span>
                        </td>

                        {/* Risk Level Badge - Clickable to trigger Gemini explanation */}
                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => setExplanationTarget(item)}
                            title="Click to trigger Gemini AI Root Cause Explanation"
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-all hover:scale-105 ${
                              isHigh
                                ? 'bg-red-50 text-red-700 border border-red-300 hover:bg-red-100 hover:ring-2 hover:ring-red-400/40 shadow-xs'
                                : isMedium
                                ? 'bg-amber-50 text-amber-700 border border-amber-300 hover:bg-amber-100'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
                            }`}
                          >
                            {isHigh ? <AlertTriangle className="w-3 h-3" /> : <Sparkles className="w-3 h-3 text-purple-600" />}
                            {prediction.riskLevel}
                            {isHigh && <Sparkles className="w-2.5 h-2.5 text-red-500 animate-pulse ml-0.5" />}
                          </button>
                        </td>

                        {/* Action Column */}
                        <td className="py-3.5 px-4 text-right space-x-2">
                          <button
                            onClick={() => setExplanationTarget(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-md border border-purple-200 transition-colors cursor-pointer"
                            title="Generate Gemini AI root cause & recommended logistics action"
                          >
                            <Sparkles className="w-3 h-3 text-purple-600" />
                            Explain Risk
                          </button>

                          {onNavigateToPhc && (
                            <button
                              onClick={() => onNavigateToPhc(phc.id)}
                              className="text-[11px] font-medium text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                            >
                              Facility
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* TAB 2: AI REDISTRIBUTION & DISPATCH HUB */}
      {activeTab === 'redistributions' && (
        <div className="space-y-6">
          {/* Dispatch Metrics Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="bg-purple-50/70 p-4 rounded-xl border border-purple-200 shadow-xs">
              <div className="text-xs text-purple-700 font-semibold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Pending Officer Authorization
              </div>
              <div className="text-2xl font-black text-purple-900 mt-1">
                {pendingRecommendations.length}
              </div>
              <div className="text-[11px] text-purple-600 mt-0.5">Automated candidate transfers</div>
            </div>

            <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 shadow-xs">
              <div className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Dispatched & Approved
              </div>
              <div className="text-2xl font-black text-emerald-900 mt-1">
                {approvedRecommendations.length}
              </div>
              <div className="text-[11px] text-emerald-600 mt-0.5">Transfers executed & in transit</div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-600 font-semibold flex items-center gap-1">
                <Truck className="w-3.5 h-3.5" /> Avg Road Transit Distance
              </div>
              <div className="text-2xl font-black text-slate-800 mt-1">
                {pendingRecommendations.length > 0
                  ? Math.round(
                      (pendingRecommendations.reduce((acc, r) => acc + r.distanceKm, 0) /
                        pendingRecommendations.length) *
                        10
                    ) / 10
                  : '—'}{' '}
                km
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Optimized proximity routing</div>
            </div>

            <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-200 shadow-xs">
              <div className="text-xs text-blue-700 font-semibold flex items-center gap-1">
                <ThermometerSnowflake className="w-3.5 h-3.5" /> Cold Chain Operations
              </div>
              <div className="text-2xl font-black text-blue-900 mt-1">
                {pendingRecommendations.filter((r) => r.coldChainRequired).length}
              </div>
              <div className="text-[11px] text-blue-600 mt-0.5">2°C - 8°C insulated carriers</div>
            </div>
          </div>

          {/* Pending Proposals Section */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  Gemini-Optimized Redistribution Proposals
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Proposals pair acute deficits with nearby surplus facilities while safeguarding donor reserves.
                </p>
              </div>
              <span className="text-[11px] bg-slate-100 text-slate-700 px-2.5 py-1 rounded font-medium border border-slate-200">
                {pendingRecommendations.length} pending review
              </span>
            </div>

            {pendingRecommendations.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200 text-slate-500">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <div className="font-semibold text-slate-700 text-sm">All Stock In Safe Equilibrium</div>
                <p className="text-xs text-slate-400 mt-1">
                  No active facility shortfalls require emergency inter-facility mutual aid in this jurisdiction.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRecommendations.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-purple-300 transition-all shadow-xs"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left: Medicine & Urgency Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            rec.priority === 'HIGH'
                              ? 'bg-red-100 text-red-800'
                              : rec.priority === 'MEDIUM'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {rec.priority} Urgency
                          </span>
                          <span className="font-bold text-sm text-slate-900">
                            {rec.medicine.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            ({rec.medicine.category})
                          </span>
                          {rec.coldChainRequired && (
                            <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 text-[10px] font-semibold flex items-center gap-1">
                              <ThermometerSnowflake className="w-2.5 h-2.5" /> Cold Chain (2°-8°C)
                            </span>
                          )}
                        </div>

                        {/* Corridor Flow */}
                        <div className="flex flex-wrap items-center gap-2 text-xs mt-2 text-slate-700">
                          <span className="font-semibold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded">
                            Donor: {rec.fromPhc.name}
                          </span>
                          <span className="text-slate-400 text-[11px]">
                            ({rec.donorBufferDaysBefore}d stock)
                          </span>
                          
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400 mx-1" />

                          <span className="font-semibold text-red-800 bg-red-100/70 px-2 py-0.5 rounded">
                            Receiver: {rec.toPhc.name}
                          </span>
                          <span className="text-slate-400 text-[11px]">
                            ({rec.receiverBufferDaysBefore}d critical left)
                          </span>

                          <span className="text-slate-400 text-[10px] ml-2">
                            • {rec.distanceKm} km transit (~{rec.estimatedTransitMinutes} mins)
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-600 mt-2 italic bg-white/80 p-2 rounded border border-slate-200/80">
                          "{rec.reason}"
                        </p>
                      </div>

                      {/* Right: Quantity & Action Buttons */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
                        <div className="text-right">
                          <div className="text-xs text-slate-500 font-medium">Proposed Quantity</div>
                          <div className="text-lg font-black text-slate-900 font-mono">
                            {rec.formattedQuantity.primary}
                          </div>
                          <div className="text-[10px] text-emerald-700 font-medium">
                            Restores to {rec.receiverBufferDaysAfter}d buffer
                          </div>
                        </div>

                        <button
                          onClick={() => handleOpenReview(rec)}
                          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          Review & Dispatch
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Approved & Dispatched Orders Audit Log */}
          {approvedRecommendations.length > 0 && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  Authorized Transfer Orders & Audit Trail ({approvedRecommendations.length})
                </h2>
              </div>

              <div className="divide-y divide-slate-200 text-xs">
                {approvedRecommendations.map((rec) => (
                  <div key={rec.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{rec.medicine.name}</span>
                        <span className="px-2 py-0.2 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">
                          DISPATCH AUTHORIZED
                        </span>
                        <span className="font-mono text-slate-700 font-semibold">
                          {formatStockDisplay(rec.quantity, rec.medicine.id).primary}
                        </span>
                      </div>
                      <div className="text-slate-500 text-[11px] mt-0.5">
                        Transferred from <strong>{rec.fromPhc.name}</strong> to <strong>{rec.toPhc.name}</strong>
                      </div>
                      {rec.reviewNotes && (
                        <div className="text-slate-600 text-[11px] mt-1 bg-slate-50 p-1.5 rounded border border-slate-200">
                          Officer Note: {rec.reviewNotes}
                        </div>
                      )}
                    </div>

                    <div className="text-right text-[11px] text-slate-400">
                      <div>Authorized by: <strong className="text-slate-700">{rec.reviewedBy || 'District Officer'}</strong></div>
                      <div>{rec.reviewedAt ? new Date(rec.reviewedAt).toLocaleDateString() : 'Just now'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rejected Proposals Log */}
          {rejectedRecommendations.length > 0 && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <XCircle className="w-4 h-4 text-red-500" />
                <h2 className="text-sm font-bold text-slate-900">
                  Officer Rejected Proposals ({rejectedRecommendations.length})
                </h2>
              </div>

              <div className="divide-y divide-slate-200 text-xs">
                {rejectedRecommendations.map((rec) => (
                  <div key={rec.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800">{rec.medicine.name}</span>
                        <span className="px-1.5 py-0.2 bg-red-100 text-red-800 rounded text-[10px] font-bold">
                          REJECTED
                        </span>
                        <span className="text-slate-500">
                          {rec.fromPhc.name} → {rec.toPhc.name}
                        </span>
                      </div>
                      {rec.reviewNotes && (
                        <p className="text-[11px] text-slate-500 mt-0.5">Reason: {rec.reviewNotes}</p>
                      )}
                    </div>
                    <div className="text-right text-[10px] text-slate-400">
                      Rejected by {rec.reviewedBy || 'Officer'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Gemini AI Root Cause Explanation Modal */}
      {explanationTarget && (
        <GeminiExplanationModal
          isOpen={!!explanationTarget}
          onClose={() => setExplanationTarget(null)}
          phc={explanationTarget.phc}
          medicine={explanationTarget.medicine}
          record={explanationTarget.record}
          prediction={explanationTarget.prediction}
          dailyUsage={explanationTarget.dailyUsage}
        />
      )}

      {/* Inter-Facility Redistribution Review & Dispatch Modal */}
      {selectedReviewRecommendation && (
        <RedistributionReviewModal
          isOpen={!!selectedReviewRecommendation}
          onClose={() => setSelectedReviewRecommendation(null)}
          recommendation={selectedReviewRecommendation}
          currentUser={currentUser}
          onApprove={handleApproveRecommendation}
          onReject={handleRejectRecommendation}
        />
      )}
    </div>
  );
};
