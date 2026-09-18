import React, { useState } from 'react';
import { 
  Sparkles, 
  RotateCcw, 
  AlertOctagon, 
  ThermometerSnowflake, 
  CheckCircle2, 
  Zap,
  ChevronRight
} from 'lucide-react';
import { StockRecord } from '../types';
import { INITIAL_STOCK_RECORDS } from '../data/mockData';

interface DemoScenarioBarProps {
  stockRecords: StockRecord[];
  onApplyScenario: (records: StockRecord[], scenarioName: string) => Promise<void>;
  onResetBaseline: () => Promise<void>;
}

export const DemoScenarioBar: React.FC<DemoScenarioBarProps> = ({
  stockRecords,
  onApplyScenario,
  onResetBaseline,
}) => {
  const [activeScenario, setActiveScenario] = useState<string>('baseline');
  const [isApplying, setIsApplying] = useState<boolean>(false);

  const handleScenarioClick = async (
    scenarioKey: string,
    scenarioName: string,
    transformFn: (current: StockRecord[]) => StockRecord[]
  ) => {
    setIsApplying(true);
    setActiveScenario(scenarioKey);
    try {
      const updated = transformFn(stockRecords);
      await onApplyScenario(updated, scenarioName);
    } catch (err) {
      console.error('Failed to apply scenario:', err);
    } finally {
      setIsApplying(false);
    }
  };

  const handleReset = async () => {
    setIsApplying(true);
    setActiveScenario('baseline');
    try {
      await onResetBaseline();
    } catch (err) {
      console.error('Failed to reset baseline:', err);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-4 py-2.5 border-b border-indigo-800/40 shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
            <Zap className="w-3 h-3" />
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-bold text-indigo-200 tracking-wide uppercase text-[10px] bg-indigo-900/60 px-2 py-0.5 rounded border border-indigo-700/50">
              Evaluator Demo Simulator
            </span>
            <span className="text-slate-300 hidden sm:inline text-[11px]">
              1-Click Realistic Supply Shock Scenarios:
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Scenario A: Outbreak Surge */}
          <button
            onClick={() =>
              handleScenarioClick('dengue_surge', 'Fever & Dengue Outbreak at Medavakkam', (prev) =>
                prev.map((r) => {
                  if (r.phcId === 'phc-chen-01' && r.medicineId === 'med-01') {
                    // Paracetamol critical
                    return { ...r, quantity: 80, lastUpdated: new Date().toISOString() };
                  }
                  if (r.phcId === 'phc-chen-01' && r.medicineId === 'med-04') {
                    // ORS acute deficit
                    return { ...r, quantity: 40, lastUpdated: new Date().toISOString() };
                  }
                  return r;
                })
              )
            }
            disabled={isApplying}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 border ${
              activeScenario === 'dengue_surge'
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-xs'
                : 'bg-slate-800/80 text-amber-300 border-amber-500/30 hover:bg-slate-800'
            }`}
          >
            <AlertOctagon className="w-3 h-3 text-amber-400" />
            1. Medavakkam Outbreak Spike
          </button>

          {/* Scenario B: Rabies Vaccine Outage */}
          <button
            onClick={() =>
              handleScenarioClick('rabies_outage', 'Anti-Rabies Cold Chain Outage at Kelambakkam', (prev) =>
                prev.map((r) => {
                  if (r.phcId === 'phc-chen-03' && r.medicineId === 'med-05') {
                    // Anti-Rabies 0 stock
                    return { ...r, quantity: 0, lastUpdated: new Date().toISOString() };
                  }
                  return r;
                })
              )
            }
            disabled={isApplying}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 border ${
              activeScenario === 'rabies_outage'
                ? 'bg-red-500 text-white border-red-400 font-bold shadow-xs'
                : 'bg-slate-800/80 text-red-300 border-red-500/30 hover:bg-slate-800'
            }`}
          >
            <ThermometerSnowflake className="w-3 h-3 text-cyan-300" />
            2. Kelambakkam Rabies Depletion
          </button>

          {/* Scenario C: Full System Equilibrium */}
          <button
            onClick={() =>
              handleScenarioClick('equilibrium', 'System Safe Equilibrium', (prev) =>
                prev.map((r) => ({
                  ...r,
                  quantity: Math.max(r.quantity, 650),
                  lastUpdated: new Date().toISOString(),
                }))
              )
            }
            disabled={isApplying}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 border ${
              activeScenario === 'equilibrium'
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold shadow-xs'
                : 'bg-slate-800/80 text-emerald-300 border-emerald-500/30 hover:bg-slate-800'
            }`}
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            3. Resolved Equilibrium
          </button>

          {/* Reset button */}
          <button
            onClick={handleReset}
            disabled={isApplying}
            className="px-2 py-1 rounded text-[11px] font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
            title="Reset to initial pilot baseline"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};
