import React, { useState, useEffect } from 'react';
import { 
  X, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ShieldCheck, 
  Clock, 
  Truck, 
  ThermometerSnowflake, 
  MapPin, 
  Edit2, 
  Phone,
  RefreshCw
} from 'lucide-react';
import { EnrichedRedistributionRecommendation } from '../services/redistributionEngine';
import { fetchRedistributionJustification, RedistributionJustificationResult } from '../services/geminiService';
import { formatStockDisplay, getDailyUsage } from '../data/mockData';
import { UserProfile } from '../types';

interface RedistributionReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  recommendation: EnrichedRedistributionRecommendation;
  currentUser: UserProfile;
  onApprove: (
    recommendation: EnrichedRedistributionRecommendation,
    customQuantity: number,
    notes: string,
    executeStockTransfer: boolean
  ) => Promise<void>;
  onReject: (
    recommendation: EnrichedRedistributionRecommendation,
    notes: string
  ) => Promise<void>;
}

export const RedistributionReviewModal: React.FC<RedistributionReviewModalProps> = ({
  isOpen,
  onClose,
  recommendation,
  currentUser,
  onApprove,
  onReject,
}) => {
  const [transferQuantity, setTransferQuantity] = useState<number>(recommendation.quantity);
  const [isEditingQuantity, setIsEditingQuantity] = useState<boolean>(false);
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [executeStockAdjustment, setExecuteStockAdjustment] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  // Gemini reasoning state
  const [geminiResult, setGeminiResult] = useState<RedistributionJustificationResult | null>(null);
  const [isLoadingGemini, setIsLoadingGemini] = useState<boolean>(true);

  // Recalculate dynamic buffers based on edited transfer quantity
  const donorUsage = getDailyUsage(recommendation.fromPhcId, recommendation.medicineId);
  const receiverUsage = getDailyUsage(recommendation.toPhcId, recommendation.medicineId);

  const dynamicDonorStockAfter = recommendation.donorCurrentStock - transferQuantity;
  const dynamicDonorDaysAfter = donorUsage > 0 
    ? Math.round((dynamicDonorStockAfter / donorUsage) * 10) / 10 
    : 99;

  const dynamicReceiverStockAfter = recommendation.receiverCurrentStock + transferQuantity;
  const dynamicReceiverDaysAfter = receiverUsage > 0 
    ? Math.round((dynamicReceiverStockAfter / receiverUsage) * 10) / 10 
    : 99;

  const isDonorBufferSafe = dynamicDonorDaysAfter >= 15;

  useEffect(() => {
    let isMounted = true;
    setIsLoadingGemini(true);

    fetchRedistributionJustification({
      fromPhcName: recommendation.fromPhc.name,
      toPhcName: recommendation.toPhc.name,
      district: recommendation.toPhc.district,
      medicineName: recommendation.medicine.name,
      quantity: transferQuantity,
      unit: recommendation.medicine.unit,
      distanceKm: recommendation.distanceKm,
      transitMinutes: recommendation.estimatedTransitMinutes,
      donorStockBefore: recommendation.donorCurrentStock,
      donorBufferDaysAfter: dynamicDonorDaysAfter,
      receiverStockBefore: recommendation.receiverCurrentStock,
      receiverBufferDaysBefore: recommendation.receiverBufferDaysBefore,
      receiverBufferDaysAfter: dynamicReceiverDaysAfter,
      coldChainRequired: recommendation.coldChainRequired,
      priority: recommendation.priority,
    })
      .then((res) => {
        if (isMounted) {
          setGeminiResult(res);
          setIsLoadingGemini(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Failed to fetch Gemini redistribution justification:', err);
          setIsLoadingGemini(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [recommendation.id]);

  if (!isOpen) return null;

  const handleApproveAction = async () => {
    setIsSubmitting(true);
    try {
      await onApprove(
        recommendation,
        transferQuantity,
        reviewNotes || geminiResult?.justification || recommendation.reason,
        executeStockAdjustment
      );
      onClose();
    } catch (err) {
      console.error('Approval failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectAction = async () => {
    setIsSubmitting(true);
    try {
      await onReject(
        recommendation,
        reviewNotes || 'Alternative supply channel identified by district officer.'
      );
      onClose();
    } catch (err) {
      console.error('Rejection failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formattedTransfer = formatStockDisplay(transferQuantity, recommendation.medicine.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div 
        className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-3xl overflow-hidden my-6 transition-all"
        role="dialog"
        aria-modal="true"
        aria-labelledby="transfer-modal-title"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="transfer-modal-title" className="text-base font-bold text-white">
                  Inter-Facility Stock Redistribution Review
                </h2>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${
                  recommendation.priority === 'HIGH'
                    ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                    : recommendation.priority === 'MEDIUM'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                }`}>
                  {recommendation.priority} URGENCY
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Authorized District Officer Human-In-The-Loop Governance
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Close review modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[78vh] overflow-y-auto text-slate-800 text-xs">
          {/* Medicine & Cold Chain Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                Transferred Pharmaceutical
              </div>
              <div className="text-base font-bold text-slate-900 mt-0.5">
                {recommendation.medicine.name}
              </div>
              <div className="text-xs text-slate-600 mt-0.5">
                Category: <span className="font-medium text-slate-800">{recommendation.medicine.category}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {recommendation.coldChainRequired ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 font-semibold text-xs">
                  <ThermometerSnowflake className="w-4 h-4 text-blue-600 animate-pulse" />
                  <span>2°C - 8°C Cold Chain Carrier Box Mandatory</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                  <span>Ambient Storage</span>
                </div>
              )}
            </div>
          </div>

          {/* Donor vs Recipient Transfer Corridor */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
            {/* Donor PHC Card */}
            <div className="md:col-span-2 bg-emerald-50/70 p-4 rounded-xl border border-emerald-200">
              <div className="flex items-center justify-between text-[11px] text-emerald-800 font-bold uppercase mb-1">
                <span>DONOR FACILITY (Surplus)</span>
                <span className="text-emerald-700">Source</span>
              </div>
              <div className="font-bold text-sm text-slate-900">{recommendation.fromPhc.name}</div>
              <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-slate-400" />
                {recommendation.fromPhc.district} District • {recommendation.fromPhc.type}
              </div>

              <div className="mt-3 pt-3 border-t border-emerald-200/60 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-600">Current Stock:</span>
                  <span className="font-bold text-slate-900 font-mono">
                    {formatStockDisplay(recommendation.donorCurrentStock, recommendation.medicine.id).primary}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Current Run-rate:</span>
                  <span className="font-medium text-emerald-800 font-mono">
                    {recommendation.donorBufferDaysBefore} days reserve
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-emerald-100">
                  <span className="font-semibold text-slate-700">Post-Transfer Buffer:</span>
                  <span className={`font-bold font-mono ${isDonorBufferSafe ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {dynamicDonorDaysAfter} days {isDonorBufferSafe ? '(Safe Reserve)' : '(Caution)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Middle Transit Connector */}
            <div className="md:col-span-1 flex flex-col items-center justify-center p-2 text-center">
              <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center shadow-xs">
                <Truck className="w-4 h-4" />
              </div>
              <div className="font-bold text-xs text-purple-900 mt-1">
                {recommendation.distanceKm} km
              </div>
              <div className="text-[10px] text-slate-500 flex items-center gap-0.5">
                <Clock className="w-3 h-3 text-slate-400" /> ~{recommendation.estimatedTransitMinutes} mins
              </div>
              <ArrowRight className="w-4 h-4 text-purple-600 my-1 hidden md:block" />
            </div>

            {/* Recipient PHC Card */}
            <div className="md:col-span-2 bg-red-50/70 p-4 rounded-xl border border-red-200">
              <div className="flex items-center justify-between text-[11px] text-red-800 font-bold uppercase mb-1">
                <span>RECIPIENT FACILITY (Deficit)</span>
                <span className="text-red-700">Target</span>
              </div>
              <div className="font-bold text-sm text-slate-900">{recommendation.toPhc.name}</div>
              <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-slate-400" />
                {recommendation.toPhc.district} District • {recommendation.toPhc.type}
              </div>

              <div className="mt-3 pt-3 border-t border-red-200/60 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-600">Current Stock:</span>
                  <span className="font-bold text-red-700 font-mono">
                    {formatStockDisplay(recommendation.receiverCurrentStock, recommendation.medicine.id).primary}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Current Run-rate:</span>
                  <span className="font-bold text-red-600 font-mono">
                    {recommendation.receiverBufferDaysBefore} days (Critically Low)
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-red-100">
                  <span className="font-semibold text-slate-700">Restored Buffer:</span>
                  <span className="font-bold text-emerald-700 font-mono">
                    {dynamicReceiverDaysAfter} days coverage
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Transfer Quantity Adjuster */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-xs">Authorized Transfer Volume</span>
                <span className="text-[11px] text-slate-500">
                  (Standard packaging units)
                </span>
              </div>
              <button
                onClick={() => setIsEditingQuantity(!isEditingQuantity)}
                className="text-[11px] text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium cursor-pointer"
              >
                <Edit2 className="w-3 h-3" />
                {isEditingQuantity ? 'Done Editing' : 'Fine-Tune Quantity'}
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 font-mono">
                  {formattedTransfer.primary}
                </span>
                {formattedTransfer.secondary && (
                  <span className="text-xs text-slate-500 font-medium">
                    ({formattedTransfer.secondary})
                  </span>
                )}
              </div>

              {isEditingQuantity && (
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-300">
                  <label htmlFor="quantity-input" className="text-[11px] font-semibold text-slate-600">
                    Units:
                  </label>
                  <input
                    id="quantity-input"
                    type="number"
                    min={1}
                    max={recommendation.donorCurrentStock}
                    value={transferQuantity}
                    onChange={(e) => setTransferQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-24 px-2 py-1 text-xs font-mono font-bold border border-slate-300 rounded focus:outline-blue-600"
                  />
                  <span className="text-slate-500 text-[11px]">{recommendation.medicine.unit}</span>
                </div>
              )}
            </div>

            {!isDonorBufferSafe && (
              <div className="mt-2.5 flex items-center gap-1.5 p-2 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[11px]">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>
                  <strong>Buffer Advisory:</strong> This quantity leaves the donor facility with {dynamicDonorDaysAfter} days of supply (below the standard 15-day target). Consider reducing the quantity slightly.
                </span>
              </div>
            )}
          </div>

          {/* Gemini AI Clinical Logistics Endorsement Card */}
          <div className="bg-purple-50/60 p-4 rounded-xl border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-700" />
                <span className="font-bold text-xs text-purple-950">
                  Gemini AI Clinical Logistics Endorsement
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                {isLoadingGemini 
                  ? 'Analyzing...' 
                  : geminiResult?.source === 'gemini-live'
                  ? 'Gemini 3.6 Flash (Live Intelligence)' 
                  : 'Clinical Reasoning Engine'}
              </span>
            </div>

            {isLoadingGemini ? (
              <div className="flex items-center gap-2 text-purple-700 py-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Generating clinical impact rationale and transit compliance verification...</span>
              </div>
            ) : (
              <p className="text-xs text-purple-900 leading-relaxed font-sans">
                {geminiResult?.justification}
              </p>
            )}
          </div>

          {/* Reviewer Note Input */}
          <div className="space-y-1">
            <label htmlFor="reviewer-notes" className="font-bold text-xs text-slate-700">
              District Officer Dispatch Notes / Audit Log (Optional)
            </label>
            <textarea
              id="reviewer-notes"
              rows={2}
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="e.g., Authorized dispatch via Taluk Ambulance 108. Cold box verified by Dr. Arumugam."
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-blue-600"
            />
          </div>

          {/* Automated Real-time Stock Adjustment Toggle */}
          <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={executeStockAdjustment}
              onChange={(e) => setExecuteStockAdjustment(e.target.checked)}
              className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
            />
            <div>
              <span className="font-semibold text-slate-800 text-xs">
                Synchronize Stock Immediately in Cloud Firestore
              </span>
              <p className="text-[11px] text-slate-500">
                Deduct {formattedTransfer.primary} from {recommendation.fromPhc.name} and credit to {recommendation.toPhc.name} with real-time state sync.
              </p>
            </div>
          </label>
        </div>

        {/* Modal Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500">
            Reviewing as: <strong>{currentUser.name}</strong> ({currentUser.email})
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleRejectAction}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold text-red-700 bg-white hover:bg-red-50 border border-red-300 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              <XCircle className="w-3.5 h-3.5 inline mr-1" />
              Reject Proposal
            </button>

            <button
              onClick={handleApproveAction}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              Authorize & Dispatch Transfer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
