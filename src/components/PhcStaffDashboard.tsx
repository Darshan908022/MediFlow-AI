import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Pill, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Edit3, 
  Plus, 
  MapPin, 
  Phone, 
  Calendar, 
  Activity, 
  Info, 
  Check, 
  X, 
  Sparkles,
  Truck,
  ThermometerSnowflake,
  ArrowRight
} from 'lucide-react';
import { Medicine, PHC, StockPrediction, StockRecord, UserProfile, RedistributionRecommendation } from '../types';
import { DEMO_MEDICINES, DEMO_PHCS, getDailyUsage, formatStockDisplay } from '../data/mockData';
import { calculateStockRisk } from '../services/riskCalculator';
import { GeminiExplanationModal } from './GeminiExplanationModal';

interface PhcStaffDashboardProps {
  currentUser: UserProfile;
  stockRecords: StockRecord[];
  redistributions?: RedistributionRecommendation[];
  onUpdateStock: (updatedRecord: StockRecord) => void;
  onConfirmReceipt?: (recommendation: RedistributionRecommendation) => Promise<void>;
  onSelectPhc?: (phcId: string) => void;
}

export const PhcStaffDashboard: React.FC<PhcStaffDashboardProps> = ({
  currentUser,
  stockRecords,
  redistributions = [],
  onUpdateStock,
  onConfirmReceipt,
}) => {
  const [activePhcId, setActivePhcId] = useState<string>(
    currentUser.phcId || DEMO_PHCS[0].id
  );

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedMedId, setSelectedMedId] = useState<string>(DEMO_MEDICINES[0].id);
  const [quantityInput, setQuantityInput] = useState<number>(100);
  const [expiryInput, setExpiryInput] = useState<string>('2027-12-31');
  const [batchInput, setBatchInput] = useState<string>('BAT-2026-X1');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Gemini explanation modal state
  const [explanationTarget, setExplanationTarget] = useState<{
    phc: PHC;
    medicine: Medicine;
    record: StockRecord;
    prediction: StockPrediction;
    dailyUsage: number;
  } | null>(null);

  const activePhc = useMemo(() => {
    return DEMO_PHCS.find((p) => p.id === activePhcId) || DEMO_PHCS[0];
  }, [activePhcId]);

  const phcInventory = useMemo(() => {
    return DEMO_MEDICINES.map((medicine) => {
      const existingRecord = stockRecords.find(
        (r) => r.phcId === activePhcId && r.medicineId === medicine.id
      );

      const quantity = existingRecord ? existingRecord.quantity : 0;
      const isZero = quantity === 0;

      const lastUpdated = isZero 
        ? 'Out of Stock / No Active Batch' 
        : existingRecord?.lastUpdated || 'Out of Stock / No Active Batch';

      const expiryDate = isZero 
        ? 'Out of Stock / No Active Batch' 
        : existingRecord?.expiryDate || 'Out of Stock / No Active Batch';

      const batchNumber = isZero 
        ? 'Out of Stock / No Active Batch' 
        : existingRecord?.batchNumber || '—';

      const updatedBy = isZero ? 'System' : existingRecord?.updatedBy || 'Staff';

      const dailyUsage = getDailyUsage(activePhcId, medicine.id);
      const prediction: StockPrediction = calculateStockRisk({
        phcId: activePhcId,
        medicineId: medicine.id,
        currentStock: quantity,
        averageDailyUsage: dailyUsage,
      });

      const stockRecord: StockRecord = existingRecord || {
        phcId: activePhcId,
        medicineId: medicine.id,
        quantity,
        lastUpdated,
        expiryDate,
        batchNumber,
        updatedBy,
      };

      return {
        medicine,
        quantity,
        isZero,
        lastUpdated,
        expiryDate,
        batchNumber,
        updatedBy,
        dailyUsage,
        prediction,
        stockRecord,
      };
    });
  }, [activePhcId, stockRecords]);

  const summaryStats = useMemo(() => {
    const highRisk = phcInventory.filter((i) => i.prediction.riskLevel === 'HIGH').length;
    const mediumRisk = phcInventory.filter((i) => i.prediction.riskLevel === 'MEDIUM').length;
    const lowRisk = phcInventory.filter((i) => i.prediction.riskLevel === 'LOW').length;
    return { highRisk, mediumRisk, lowRisk, total: phcInventory.length };
  }, [phcInventory]);

  // Inter-facility transfers affecting this facility
  const facilityTransfers = useMemo(() => {
    return redistributions.filter(
      (r) => (r.fromPhcId === activePhcId || r.toPhcId === activePhcId) && r.status === 'APPROVED'
    );
  }, [redistributions, activePhcId]);

  const [acknowledgedTransferIds, setAcknowledgedTransferIds] = useState<Record<string, boolean>>({});

  const handleAcknowledgeTransfer = async (rec: RedistributionRecommendation) => {
    setAcknowledgedTransferIds((prev) => ({ ...prev, [rec.id]: true }));
    if (onConfirmReceipt) {
      await onConfirmReceipt(rec);
    }
  };

  const handleOpenUpdate = (medId: string, currentQty: number, expiry: string, batch?: string) => {
    setSelectedMedId(medId);
    setQuantityInput(currentQty);
    setExpiryInput(
      expiry && expiry !== 'N/A' && expiry !== 'Out of Stock / No Active Batch'
        ? expiry
        : '2027-12-31'
    );
    setBatchInput(
      batch && batch !== '—' && batch !== 'Out of Stock / No Active Batch'
        ? batch
        : `BAT-${Date.now().toString().slice(-4)}`
    );
    setIsModalOpen(true);
  };

  const modalLivePrediction = useMemo(() => {
    const dailyUsage = getDailyUsage(activePhcId, selectedMedId);
    return calculateStockRisk({
      phcId: activePhcId,
      medicineId: selectedMedId,
      currentStock: quantityInput,
      averageDailyUsage: dailyUsage,
    });
  }, [activePhcId, selectedMedId, quantityInput]);

  const handleSubmitStock = (e: React.FormEvent) => {
    e.preventDefault();
    const med = DEMO_MEDICINES.find((m) => m.id === selectedMedId);
    const updatedRecord: StockRecord = {
      phcId: activePhcId,
      medicineId: selectedMedId,
      quantity: Number(quantityInput),
      lastUpdated: new Date().toISOString(),
      expiryDate: expiryInput,
      updatedBy: currentUser.name,
      batchNumber: batchInput,
    };

    onUpdateStock(updatedRecord);
    setIsModalOpen(false);

    const formatted = formatStockDisplay(Number(quantityInput), selectedMedId).combined;
    setSuccessToast(`Updated ${med?.name} inventory to ${formatted}.`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Toast feedback */}
      {successToast && (
        <div 
          id="toast-notification"
          className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-bottom-2"
        >
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Check className="w-4 h-4" />
          </div>
          <span className="text-xs font-medium">{successToast}</span>
          <button onClick={() => setSuccessToast(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Facility Header */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                {activePhc.type}
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600">
                {activePhc.district} District
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600">
                {activePhc.state}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {activePhc.name}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                Lat: {activePhc.lat.toFixed(4)}, Lng: {activePhc.lng.toFixed(4)}
              </span>
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {activePhc.contactNumber || 'Direct Health Helpline Active'}
              </span>
              <span>Beds: <strong>{activePhc.bedCapacity || 10}</strong></span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="text-xs">
              <label className="block text-[10px] text-slate-400 font-semibold uppercase mb-0.5">
                Switch PHC Facility:
              </label>
              <select
                id="phc-facility-select"
                aria-label="Switch PHC Facility"
                value={activePhcId}
                onChange={(e) => setActivePhcId(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:outline-teal-600"
              >
                {DEMO_PHCS.map((phc) => (
                  <option key={phc.id} value={phc.id}>
                    {phc.name} ({phc.district})
                  </option>
                ))}
              </select>
            </div>

            <button
              id="btn-open-stock-update"
              onClick={() => handleOpenUpdate(DEMO_MEDICINES[0].id, 110, '2027-12-31')}
              className="mt-auto flex items-center justify-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Update Medicine Stock
            </button>
          </div>
        </div>
      </div>

      {/* Active Inter-Facility Logistics & Transfer Notice */}
      {facilityTransfers.length > 0 && (
        <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-xl p-4 border border-blue-700/50 shadow-md">
          <div className="flex items-center justify-between gap-3 mb-3 border-b border-blue-800/60 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600/40 border border-blue-400/50 flex items-center justify-center text-blue-200">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                  <span>District Logistics Authorization Notice</span>
                  <span className="text-[10px] uppercase font-semibold bg-blue-500/30 text-blue-200 px-2 py-0.5 rounded border border-blue-400/30">
                    Live Dispatch
                  </span>
                </h2>
                <p className="text-xs text-blue-200/80">
                  Mutual-aid transfers authorized by District Health Officer for {activePhc.name}.
                </p>
              </div>
            </div>
            <span className="text-xs text-blue-300 font-mono bg-blue-950/60 px-2.5 py-1 rounded border border-blue-800/80">
              {facilityTransfers.length} Active Transfer{facilityTransfers.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="space-y-2.5">
            {facilityTransfers.map((rec) => {
              const med = DEMO_MEDICINES.find((m) => m.id === rec.medicineId);
              const donor = DEMO_PHCS.find((p) => p.id === rec.fromPhcId);
              const recipient = DEMO_PHCS.find((p) => p.id === rec.toPhcId);
              const isIncoming = rec.toPhcId === activePhcId;
              const isAcknowledged = acknowledgedTransferIds[rec.id];

              return (
                <div
                  key={rec.id}
                  className="bg-white/10 hover:bg-white/[0.14] border border-white/10 rounded-lg p-3 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded font-bold uppercase tracking-wider mt-0.5 ${
                      isIncoming 
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40' 
                        : 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                    }`}>
                      {isIncoming ? 'INCOMING AID' : 'OUTGOING DISPATCH'}
                    </span>
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-1.5">
                        <span>{rec.quantity} {med?.unit || 'Units'} of {med?.name}</span>
                        {med?.category === 'Vaccine & Anti-serum' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-cyan-900/60 text-cyan-200 border border-cyan-600/50 px-1.5 py-0.5 rounded">
                            <ThermometerSnowflake className="w-2.5 h-2.5" /> 2°C–8°C Cold Box
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-blue-200/90 mt-0.5 flex flex-wrap items-center gap-2">
                        <span>From: <strong>{donor?.name}</strong></span>
                        <ArrowRight className="w-3 h-3 text-blue-400 inline" />
                        <span>To: <strong>{recipient?.name}</strong></span>
                        <span>• Priority: <strong className="uppercase">{rec.priority}</strong></span>
                      </div>
                      {rec.reviewNotes && (
                        <div className="text-[11px] text-blue-300/80 italic mt-1 bg-black/20 px-2 py-1 rounded">
                          Officer Note: "{rec.reviewNotes}"
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="self-end sm:self-center">
                    {isIncoming ? (
                      isAcknowledged ? (
                        <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-950/60 border border-emerald-700/60 px-3 py-1.5 rounded-lg text-xs font-semibold">
                          <Check className="w-3.5 h-3.5" />
                          <span>Receipt Acknowledged</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAcknowledgeTransfer(rec)}
                          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-3 py-1.5 rounded-lg shadow-xs transition-colors cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Confirm Arrival at PHC</span>
                        </button>
                      )
                    ) : (
                      <span className="text-[11px] text-blue-300 bg-blue-900/40 border border-blue-700/50 px-2.5 py-1 rounded">
                        Dispatch Vehicle En Route
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Medicines Monitored</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{summaryStats.total}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Base Units Standardized</div>
        </div>

        <div className="bg-red-50/70 p-4 rounded-xl border border-red-200 shadow-xs">
          <div className="text-xs text-red-700 font-medium flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> High Risk (≤ 3 Days)
          </div>
          <div className="text-2xl font-bold text-red-800 mt-1">{summaryStats.highRisk}</div>
          <div className="text-[11px] text-red-600 mt-0.5">Click badge for Gemini AI analysis</div>
        </div>

        <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 shadow-xs">
          <div className="text-xs text-amber-700 font-medium flex items-center gap-1">
            <Activity className="w-3.5 h-3.5" /> Medium Risk (3–7 Days)
          </div>
          <div className="text-2xl font-bold text-amber-800 mt-1">{summaryStats.mediumRisk}</div>
          <div className="text-[11px] text-amber-600 mt-0.5">Buffer warning window</div>
        </div>

        <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 shadow-xs">
          <div className="text-xs text-emerald-700 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Low Risk / Normal
          </div>
          <div className="text-2xl font-bold text-emerald-800 mt-1">{summaryStats.lowRisk}</div>
          <div className="text-[11px] text-emerald-600 mt-0.5">&gt; 7 days buffer</div>
        </div>
      </div>

      {/* Main Stock Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">Current Medicine Stock & Risk Assessment</h2>
            <p className="text-xs text-slate-500">
              Quantities reported in clinical base units (Tablets, Capsules, Sachets, Vials, Ampoules).
            </p>
          </div>
          <span className="text-xs text-slate-400">
            Click any <strong className="text-red-600">HIGH</strong> risk badge or <strong>Explain</strong> button to invoke Gemini.
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[11px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Medicine & Category</th>
                <th className="py-3 px-4">Current Stock</th>
                <th className="py-3 px-4">Avg. Daily Usage</th>
                <th className="py-3 px-4">7-Day Demand</th>
                <th className="py-3 px-4">Days Left</th>
                <th className="py-3 px-4">Risk Level</th>
                <th className="py-3 px-4">Batch / Expiry</th>
                <th className="py-3 px-4">Last Updated</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {phcInventory.map((item) => {
                const { medicine, quantity, isZero, dailyUsage, prediction, lastUpdated, expiryDate, batchNumber, updatedBy, stockRecord } = item;
                const isHigh = prediction.riskLevel === 'HIGH';
                const isMedium = prediction.riskLevel === 'MEDIUM';
                const stockFormatted = formatStockDisplay(quantity, medicine.id);

                return (
                  <tr key={medicine.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{medicine.name}</div>
                      <span className="inline-block text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded mt-0.5">
                        {medicine.category}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono">
                      {isZero ? (
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

                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {dailyUsage} {medicine.unit} / day
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {prediction.forecastedDemand} {medicine.unit}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className={`font-mono font-bold text-sm ${
                        isHigh ? 'text-red-600' : isMedium ? 'text-amber-600' : 'text-emerald-700'
                      }`}>
                        {prediction.daysToStockout} days
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {prediction.estimatedShortage > 0 ? `Deficit: -${prediction.estimatedShortage} ${medicine.unit}` : 'Stock sufficient'}
                      </div>
                    </td>

                    {/* Risk Badge - CLICKABLE to trigger Gemini explanation */}
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => setExplanationTarget({
                          phc: activePhc,
                          medicine,
                          record: stockRecord,
                          prediction,
                          dailyUsage,
                        })}
                        title="Click to trigger Gemini AI explanation"
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

                    {/* Batch / Expiry Column */}
                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      {isZero ? (
                        <span className="text-slate-500 text-[11px] font-sans italic">
                          Out of Stock / No Active Batch
                        </span>
                      ) : (
                        <>
                          <div className="text-slate-700 font-medium">{batchNumber}</div>
                          <div className="text-slate-400 text-[10px]">Exp: {expiryDate}</div>
                        </>
                      )}
                    </td>

                    {/* Last Updated Column */}
                    <td className="py-3.5 px-4 text-[11px] text-slate-500">
                      {isZero ? (
                        <span className="text-slate-500 italic">
                          Out of Stock / No Active Batch
                        </span>
                      ) : (
                        <>
                          <div>{lastUpdated.includes('T') ? new Date(lastUpdated).toLocaleDateString() : lastUpdated}</div>
                          <div className="text-[10px] text-slate-400">By: {updatedBy}</div>
                        </>
                      )}
                    </td>

                    {/* Action Column */}
                    <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => setExplanationTarget({
                          phc: activePhc,
                          medicine,
                          record: stockRecord,
                          prediction,
                          dailyUsage,
                        })}
                        className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded border border-purple-200 transition-colors cursor-pointer"
                        title="Explain risk with Gemini AI"
                      >
                        <Sparkles className="w-3 h-3 text-purple-600" />
                        Explain
                      </button>

                      <button
                        id={`btn-edit-${medicine.id}`}
                        onClick={() => handleOpenUpdate(medicine.id, quantity, expiryDate, batchNumber)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 rounded border border-teal-200 transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        Update
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Update Modal */}
      {isModalOpen && (
        <div 
          id="stock-update-modal" 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
        >
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Update Medicine Physical Stock</h3>
                <p className="text-xs text-slate-500">Facility: {activePhc.name}</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/60 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitStock} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Essential Medicine
                </label>
                <select
                  id="modal-medicine-select"
                  value={selectedMedId}
                  onChange={(e) => setSelectedMedId(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 font-medium focus:outline-teal-600"
                >
                  {DEMO_MEDICINES.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} — {m.category} ({m.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Verified Stock Quantity
                  </label>
                  <input
                    id="modal-quantity-input"
                    type="number"
                    min="0"
                    required
                    value={quantityInput}
                    onChange={(e) => setQuantityInput(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full text-sm font-mono font-bold bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-teal-600"
                  />
                  <span className="text-[11px] text-slate-400">
                    Enter base count in {DEMO_MEDICINES.find(m => m.id === selectedMedId)?.unit}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Batch Number
                  </label>
                  <input
                    id="modal-batch-input"
                    type="text"
                    required
                    value={batchInput}
                    onChange={(e) => setBatchInput(e.target.value)}
                    className="w-full text-xs font-mono bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-teal-600"
                  />
                  <span className="text-[11px] text-slate-400">Printed on box</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Batch Expiry Date
                </label>
                <input
                  id="modal-expiry-input"
                  type="date"
                  required
                  value={expiryInput}
                  onChange={(e) => setExpiryInput(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-teal-600"
                />
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5 mb-2">
                  <Activity className="w-3.5 h-3.5 text-teal-600" />
                  Instant Calculation Preview:
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <div className="text-[10px] text-slate-400 uppercase">Daily Burn</div>
                    <div className="font-mono font-bold text-slate-800 mt-0.5">
                      {modalLivePrediction.averageDailyUsage}/day
                    </div>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <div className="text-[10px] text-slate-400 uppercase">Days Left</div>
                    <div className="font-mono font-bold text-teal-700 mt-0.5">
                      {modalLivePrediction.daysToStockout} days
                    </div>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <div className="text-[10px] text-slate-400 uppercase">New Risk</div>
                    <div className={`font-bold mt-0.5 text-[11px] ${
                      modalLivePrediction.riskLevel === 'HIGH' ? 'text-red-700' :
                      modalLivePrediction.riskLevel === 'MEDIUM' ? 'text-amber-700' : 'text-emerald-700'
                    }`}>
                      {modalLivePrediction.riskLevel}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="btn-save-stock-record"
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Save & Recalculate Risk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Gemini AI Explanation Modal */}
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
    </div>
  );
};
