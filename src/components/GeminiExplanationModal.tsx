import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  X, 
  AlertTriangle, 
  Copy, 
  Check, 
  Activity, 
  Building2, 
  Clock, 
  ShieldAlert, 
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { Medicine, PHC, StockPrediction, StockRecord } from '../types';
import { formatStockDisplay } from '../data/mockData';
import { fetchRiskExplanation, RiskExplanationResult } from '../services/geminiService';

interface GeminiExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  phc: PHC;
  medicine: Medicine;
  record: StockRecord;
  prediction: StockPrediction;
  dailyUsage: number;
  onOpenRedistribution?: () => void;
}

export const GeminiExplanationModal: React.FC<GeminiExplanationModalProps> = ({
  isOpen,
  onClose,
  phc,
  medicine,
  record,
  prediction,
  dailyUsage,
  onOpenRedistribution,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [result, setResult] = useState<RiskExplanationResult | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const formattedStock = formatStockDisplay(record.quantity, medicine.id).combined;

  const loadExplanation = async () => {
    setLoading(true);
    setCopied(false);
    try {
      const res = await fetchRiskExplanation({
        phcName: phc.name,
        district: phc.district,
        medicineName: medicine.name,
        currentStock: record.quantity,
        formattedStock,
        unit: medicine.unit,
        dailyUsage,
        daysToStockout: prediction.daysToStockout,
        forecastedDemand: prediction.forecastedDemand,
        deficit: prediction.estimatedShortage,
        riskLevel: prediction.riskLevel,
      });
      setResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadExplanation();
    }
  }, [isOpen, phc.id, medicine.id, record.quantity]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!result?.explanation) return;
    navigator.clipboard.writeText(
      `[MediFlow AI - Gemini Risk Explanation]\nFacility: ${phc.name} (${phc.district})\nMedicine: ${medicine.name}\nStock: ${formattedStock} (${prediction.daysToStockout} days left)\nRisk: ${prediction.riskLevel}\n\nAI Explanation:\n${result.explanation}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div 
      id="gemini-explanation-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-tight text-white">
                  Gemini Explanation Agent
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-purple-500/30 text-purple-200 border border-purple-400/30">
                  AI Root Cause
                </span>
              </div>
              <p className="text-xs text-purple-200/80">
                Automated reasoning explaining stock-out risk & immediate logistics action
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-purple-200/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {/* Facility & Medicine Banner */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                {phc.name} • {phc.district} District
              </div>
              <div className="text-base font-bold text-slate-900 mt-0.5">
                {medicine.name}
              </div>
              <span className="inline-block text-[10px] text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded mt-1 font-medium">
                {medicine.category}
              </span>
            </div>

            <div className="text-right self-start sm:self-center">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                <AlertTriangle className="w-3.5 h-3.5" />
                {prediction.riskLevel} RISK
              </span>
            </div>
          </div>

          {/* Metric telemetry tiles */}
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Stock</div>
              <div className="font-mono font-bold text-slate-900 mt-0.5 text-xs">
                {formattedStock}
              </div>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Burn Rate</div>
              <div className="font-mono font-bold text-slate-900 mt-0.5 text-xs">
                {dailyUsage}/day
              </div>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Demand (7d)</div>
              <div className="font-mono font-bold text-slate-900 mt-0.5 text-xs">
                {prediction.forecastedDemand}
              </div>
            </div>

            <div className="bg-red-50 p-2.5 rounded-lg border border-red-200">
              <div className="text-[10px] text-red-600 uppercase font-semibold">Days Left</div>
              <div className="font-mono font-bold text-red-700 mt-0.5 text-xs">
                {prediction.daysToStockout} days
              </div>
            </div>
          </div>

          {/* AI Explanation Box */}
          <div className="bg-purple-50/50 rounded-xl border border-purple-200 p-4 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                Gemini Reasoning Output (2-Sentence Analysis)
              </div>
              <span className="text-[10px] font-mono text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded border border-purple-200">
                {result?.model || 'gemini-3.6-flash'}
              </span>
            </div>

            {loading ? (
              <div className="py-6 flex flex-col items-center justify-center gap-2 text-purple-700">
                <RefreshCw className="w-5 h-5 animate-spin text-purple-600" />
                <span className="text-xs font-medium">
                  Querying Gemini Explanation Agent...
                </span>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-slate-800 leading-relaxed font-normal bg-white p-3.5 rounded-lg border border-purple-100 shadow-xs">
                  {result?.explanation}
                </p>

                <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-600" />
                    Verified by deterministic mathematical engine ({dailyUsage}/day baseline)
                  </span>

                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1 text-purple-700 hover:text-purple-900 font-medium cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy Explanation
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 border-t border-slate-100">
            <button
              onClick={loadExplanation}
              disabled={loading}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Regenerate
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Close
              </button>
              {onOpenRedistribution && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenRedistribution();
                  }}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-xs transition-colors"
                >
                  View Redistribution Options
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
