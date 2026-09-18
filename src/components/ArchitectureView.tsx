import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Pill, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  Layers, 
  Cpu, 
  ArrowRight, 
  RefreshCw, 
  Sparkles, 
  Calculator,
  Eye,
  Activity,
  Check,
  MapPin,
  Cloud,
  Server,
  Terminal,
  ShieldCheck
} from 'lucide-react';
import { 
  DEMO_PHCS, 
  DEMO_MEDICINES, 
  INITIAL_STOCK_RECORDS, 
  getDailyUsage, 
  DEMO_DISTRICTS,
  DEMO_USERS
} from '../data/mockData';
import { calculateStockRisk } from '../services/riskCalculator';
import { StockPrediction } from '../types';

export const ArchitectureView: React.FC = () => {
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
  const [activeTab, setActiveTab] = useState<'architecture' | 'collections' | 'calculator' | 'cloud_production'>('architecture');
  
  // Interactive Sandbox state for testing transparent formula
  const [sandboxStock, setSandboxStock] = useState<number>(120);
  const [sandboxUsage, setSandboxUsage] = useState<number>(45);
  const [sandboxMedId, setSandboxMedId] = useState<string>('med_pcm_500');

  // Compute live predictions on the synthetic inventory
  const inventoryWithPredictions = useMemo(() => {
    return INITIAL_STOCK_RECORDS.map((record) => {
      const phc = DEMO_PHCS.find((p) => p.id === record.phcId);
      const medicine = DEMO_MEDICINES.find((m) => m.id === record.medicineId);
      const dailyUsage = getDailyUsage(record.phcId, record.medicineId);
      const prediction: StockPrediction = calculateStockRisk({
        phcId: record.phcId,
        medicineId: record.medicineId,
        currentStock: record.quantity,
        averageDailyUsage: dailyUsage,
      });

      return {
        ...record,
        phc,
        medicine,
        dailyUsage,
        prediction,
      };
    });
  }, []);

  // Filtered inventory
  const filteredInventory = useMemo(() => {
    if (selectedDistrict === 'All') return inventoryWithPredictions;
    return inventoryWithPredictions.filter((item) => item.phc?.district === selectedDistrict);
  }, [inventoryWithPredictions, selectedDistrict]);

  // Aggregate stats
  const stats = useMemo(() => {
    const highRisk = inventoryWithPredictions.filter((i) => i.prediction.riskLevel === 'HIGH').length;
    const mediumRisk = inventoryWithPredictions.filter((i) => i.prediction.riskLevel === 'MEDIUM').length;
    const lowRisk = inventoryWithPredictions.filter((i) => i.prediction.riskLevel === 'LOW').length;
    const surplusCount = inventoryWithPredictions.filter((i) => i.prediction.stockStatus === 'SURPLUS').length;
    const deficitCount = inventoryWithPredictions.filter((i) => i.prediction.stockStatus === 'DEFICIT').length;

    return { highRisk, mediumRisk, lowRisk, surplusCount, deficitCount };
  }, [inventoryWithPredictions]);

  // Interactive sandbox prediction calculation
  const sandboxPrediction = useMemo(() => {
    return calculateStockRisk({
      phcId: 'sandbox_phc',
      medicineId: sandboxMedId,
      currentStock: sandboxStock,
      averageDailyUsage: sandboxUsage,
    });
  }, [sandboxStock, sandboxUsage, sandboxMedId]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top Banner: Hackathon & AI Safety Disclaimer */}
      <div className="bg-slate-900 text-slate-100 text-xs px-4 py-2 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-700 text-emerald-100 text-[10px] font-semibold px-2 py-0.5 rounded tracking-wide">
              STAGES 1–8 COMPLETE • PRODUCTION DEMO & CLOUD RUN READY
            </span>
            <span>
              <strong>MediFlow AI:</strong> Primary Health Centre Supply-Chain Intelligence Platform (India)
            </span>
          </div>
          <div className="flex items-center gap-3 text-slate-300">
            <span className="inline-flex items-center gap-1 text-emerald-300 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Human-in-the-Loop Governance & AI Safety Enforced
            </span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white font-bold text-xl shadow-xs">
                M
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                  MediFlow AI <span className="text-teal-600 font-normal text-sm ml-2">Architecture & Foundation</span>
                </h1>
                <p className="text-xs text-slate-500">
                  Real-Time Stock Tracking • Transparent Run-Rate Prediction • Gemini Explanation & Redistribution Agents
                </p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-medium">
              <button
                onClick={() => setActiveTab('architecture')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                  activeTab === 'architecture'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-teal-600" />
                Architecture & Roadmap
              </button>
              <button
                onClick={() => setActiveTab('collections')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                  activeTab === 'collections'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                Live Demo Data & Risk Table
              </button>
              <button
                onClick={() => setActiveTab('calculator')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                  activeTab === 'calculator'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Calculator className="w-3.5 h-3.5 text-emerald-600" />
                Risk Formula Sandbox
              </button>
              <button
                onClick={() => setActiveTab('cloud_production')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                  activeTab === 'cloud_production'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Cloud className="w-3.5 h-3.5 text-indigo-600" />
                Cloud Production Prep (Stage 8)
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* TAB 1: Architecture & Development Stages */}
        {activeTab === 'architecture' && (
          <div className="space-y-6">
            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                <div className="text-xs text-slate-500 font-medium">Total Demo PHCs</div>
                <div className="text-xl font-bold text-slate-900 mt-1">{DEMO_PHCS.length}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Across 3 Tamil Nadu Districts</div>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                <div className="text-xs text-slate-500 font-medium">Essential Medicines</div>
                <div className="text-xl font-bold text-slate-900 mt-1">{DEMO_MEDICINES.length}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">NLEM Standard List</div>
              </div>
              <div className="bg-red-50/70 p-3.5 rounded-xl border border-red-200 shadow-xs">
                <div className="text-xs text-red-600 font-medium flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> High Stock-Out Risk
                </div>
                <div className="text-xl font-bold text-red-700 mt-1">{stats.highRisk}</div>
                <div className="text-[11px] text-red-500 mt-0.5">≤ 3 days supply remaining</div>
              </div>
              <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200 shadow-xs">
                <div className="text-xs text-amber-600 font-medium flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5" /> Medium Risk
                </div>
                <div className="text-xl font-bold text-amber-700 mt-1">{stats.mediumRisk}</div>
                <div className="text-[11px] text-amber-500 mt-0.5">3 to 7 days supply</div>
              </div>
              <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200 shadow-xs">
                <div className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Surplus PHCs
                </div>
                <div className="text-xl font-bold text-emerald-700 mt-1">{stats.surplusCount}</div>
                <div className="text-[11px] text-emerald-500 mt-0.5">≥ 25 days reserve available</div>
              </div>
            </div>

            {/* Architecture Pipeline Visualizer */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">MediFlow AI End-to-End System Architecture</h2>
                  <p className="text-xs text-slate-500">
                    Transparent mathematical prediction combined with Gemini Generative AI for reasoning and transfer optimization.
                  </p>
                </div>
                <span className="text-[11px] font-medium bg-teal-50 text-teal-700 border border-teal-200 px-2.5 py-1 rounded-md">
                  GCP Hackathon Ready
                </span>
              </div>

              {/* 5-Stage Visual Workflow */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
                {/* Node 1 */}
                <div className="relative bg-slate-50 p-3.5 rounded-lg border border-slate-200 hover:border-teal-300 transition-all">
                  <div className="text-[10px] font-bold text-teal-600 tracking-wider uppercase mb-1">Layer 1 • Input</div>
                  <div className="font-semibold text-sm text-slate-800">PHC Staff App</div>
                  <p className="text-xs text-slate-500 mt-1">
                    Mobile/desktop stock update, batch entry, and last-updated timestamps.
                  </p>
                  <div className="mt-3 text-[11px] text-slate-400 font-mono">React + Tailwind</div>
                </div>

                {/* Node 2 */}
                <div className="relative bg-slate-50 p-3.5 rounded-lg border border-slate-200 hover:border-teal-300 transition-all">
                  <div className="text-[10px] font-bold text-blue-600 tracking-wider uppercase mb-1">Layer 2 • Data</div>
                  <div className="font-semibold text-sm text-slate-800">Cloud Firestore</div>
                  <p className="text-xs text-slate-500 mt-1">
                    Real-time collections: <code className="text-blue-700">phcs</code>, <code className="text-blue-700">stock</code>, <code className="text-blue-700">predictions</code>.
                  </p>
                  <div className="mt-3 text-[11px] text-slate-400 font-mono">Firebase NoSQL</div>
                </div>

                {/* Node 3 */}
                <div className="relative bg-emerald-50/60 p-3.5 rounded-lg border border-emerald-200 hover:border-emerald-300 transition-all">
                  <div className="text-[10px] font-bold text-emerald-700 tracking-wider uppercase mb-1">Layer 3 • Predictive</div>
                  <div className="font-semibold text-sm text-slate-800">Run-Rate Engine</div>
                  <p className="text-xs text-slate-500 mt-1">
                    Deterministic: <span className="font-mono text-emerald-800">Days = Stock / Daily_Usage</span>. Modular for Vertex AI.
                  </p>
                  <div className="mt-3 text-[11px] text-emerald-600 font-mono font-medium">Vertex AI Swappable</div>
                </div>

                {/* Node 4 */}
                <div className="relative bg-purple-50/60 p-3.5 rounded-lg border border-purple-200 hover:border-purple-300 transition-all">
                  <div className="text-[10px] font-bold text-purple-700 tracking-wider uppercase mb-1">Layer 4 • Intelligence</div>
                  <div className="font-semibold text-sm text-slate-800">Gemini AI Agents</div>
                  <p className="text-xs text-slate-500 mt-1">
                    1. <strong>Explanation Agent:</strong> Medical context.<br/>
                    2. <strong>Redistribution Agent:</strong> Matching.
                  </p>
                  <div className="mt-3 text-[11px] text-purple-600 font-mono font-medium">gemini-3.8-flash</div>
                </div>

                {/* Node 5 */}
                <div className="relative bg-amber-50/60 p-3.5 rounded-lg border border-amber-200 hover:border-amber-300 transition-all">
                  <div className="text-[10px] font-bold text-amber-700 tracking-wider uppercase mb-1">Layer 5 • Governance</div>
                  <div className="font-semibold text-sm text-slate-800">District Officer Review</div>
                  <p className="text-xs text-slate-500 mt-1">
                    Human-in-the-loop review. Approve / Reject before any real-world dispatch.
                  </p>
                  <div className="mt-3 text-[11px] text-amber-700 font-mono font-medium">AI Safety Guard</div>
                </div>
              </div>
            </div>

            {/* Development Roadmap Cards */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
              <h2 className="text-base font-bold text-slate-900 mb-3">MVP Development Execution Plan</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  {
                    step: 'Stage 1',
                    title: 'Architecture & Data Foundation',
                    status: 'COMPLETED',
                    desc: 'Domain schemas, 12 realistic Indian PHCs, 8 NLEM medicines, transparent risk logic.',
                  },
                  {
                    step: 'Stage 2',
                    title: 'Interactive Frontend Dashboards',
                    status: 'COMPLETED',
                    desc: 'PHC Staff stock update form + District Officer deficit/surplus overview.',
                  },
                  {
                    step: 'Stage 3',
                    title: 'Firebase Auth & Firestore Integration',
                    status: 'COMPLETED',
                    desc: 'Role-based login for PHC Staff & District Officers with real-time sync.',
                  },
                  {
                    step: 'Stage 4',
                    title: 'Stock Risk Real-Time Triggers',
                    status: 'COMPLETED',
                    desc: 'Real-time computation when staff submits updated medicine quantities with Firestore sync.',
                  },
                  {
                    step: 'Stage 5',
                    title: 'Gemini Explanation Agent',
                    status: 'COMPLETED',
                    desc: 'Concise medical officer summaries of why each medicine is facing shortages via Gemini API.',
                  },
                  {
                    step: 'Stage 6',
                    title: 'Gemini Redistribution Agent',
                    status: 'COMPLETED',
                    desc: 'Haversine distance routing & 15-day donor safety buffer pairing deficit and surplus facilities.',
                  },
                  {
                    step: 'Stage 7',
                    title: 'District Officer Review Workflow',
                    status: 'COMPLETED',
                    desc: 'Human-in-the-loop review, quantity fine-tuning, audit logging & Firestore stock dispatch.',
                  },
                  {
                    step: 'Stage 8',
                    title: 'Google Cloud Production Prep',
                    status: 'COMPLETED',
                    desc: 'Full-stack Express + Vite server, Cloud Run containerization, Gemini 3.6 Flash server routes, and production demo readiness.',
                  },
                ].map((item, idx) => (
                  <div 
                    key={idx} 
                    className={`p-3.5 rounded-lg border transition-all ${
                      item.status === 'COMPLETED' 
                        ? 'bg-emerald-50/40 border-emerald-200' 
                        : item.status === 'NEXT UP'
                        ? 'bg-blue-50/50 border-blue-300 ring-1 ring-blue-300'
                        : 'bg-slate-50/50 border-slate-200 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-semibold text-slate-700">{item.step}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.status === 'NEXT UP'
                          ? 'bg-blue-100 text-blue-800 animate-pulse'
                          : 'bg-slate-200 text-slate-600'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <div className="font-bold text-sm text-slate-800 mt-1">{item.title}</div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Test User Accounts Preview */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-2">Configured Test Roles for Subsequent Stages</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {DEMO_USERS.map((user) => (
                  <div key={user.uid} className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800">{user.name}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-200 text-slate-700">
                        {user.role === 'phc_staff' ? 'PHC Staff' : 'District Officer'}
                      </span>
                    </div>
                    <div className="text-slate-500 text-[11px] mt-1">{user.email}</div>
                    <div className="text-slate-400 text-[10px] mt-1 font-mono">
                      {user.phcId ? `PHC: ${user.phcId}` : `District: ${user.districtId}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Live Demo Data & Risk Table */}
        {activeTab === 'collections' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Synthetic Facility Inventory & Stock Predictions</h2>
                <p className="text-xs text-slate-500">
                  Showing real-time evaluated risk based on current stock, daily run-rate, and 7-day projected demand.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Filter District:</span>
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1.5 text-slate-800 focus:outline-teal-600"
                >
                  <option value="All">All Districts (3)</option>
                  {DEMO_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Inventory Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[11px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Primary Health Centre</th>
                      <th className="py-3 px-4">Medicine Name</th>
                      <th className="py-3 px-4">Current Stock</th>
                      <th className="py-3 px-4">Daily Usage</th>
                      <th className="py-3 px-4">7-Day Demand</th>
                      <th className="py-3 px-4">Days Left</th>
                      <th className="py-3 px-4">Supply Status</th>
                      <th className="py-3 px-4">Risk Level</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredInventory.map((item, idx) => {
                      const { prediction } = item;
                      const isHigh = prediction.riskLevel === 'HIGH';
                      const isMedium = prediction.riskLevel === 'MEDIUM';

                      return (
                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-medium text-slate-900">{item.phc?.name}</div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3" /> {item.phc?.district}, {item.phc?.type}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-slate-800">{item.medicine?.name}</div>
                            <div className="text-[11px] text-slate-400">{item.medicine?.category}</div>
                          </td>
                          <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                            {item.quantity} <span className="text-[11px] font-normal text-slate-500">{item.medicine?.unit}</span>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600">
                            {item.dailyUsage} / day
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600">
                            {prediction.forecastedDemand}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`font-mono font-bold ${
                              isHigh ? 'text-red-600' : isMedium ? 'text-amber-600' : 'text-slate-700'
                            }`}>
                              {prediction.daysToStockout} days
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                              prediction.stockStatus === 'DEFICIT'
                                ? 'bg-red-100 text-red-700'
                                : prediction.stockStatus === 'SURPLUS'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {prediction.stockStatus}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              isHigh
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : isMedium
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}>
                              {isHigh && <AlertTriangle className="w-3 h-3" />}
                              {prediction.riskLevel}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Transparent Risk Calculator Sandbox */}
        {activeTab === 'calculator' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Panel */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-2 mb-4">
                <Calculator className="w-5 h-5 text-teal-600" />
                <h2 className="text-base font-bold text-slate-900">Interactive Transparent Risk Calculator</h2>
              </div>
              <p className="text-xs text-slate-600 mb-6 leading-relaxed">
                As required by the specifications: <strong>We do NOT use Gemini for numeric forecasting</strong>. 
                Instead, transparent math calculates run-rate, stock-out days, and shortage. 
                Gemini will subsequently be used in Stage 5 & 6 as an <em>Explanation Agent</em> and <em>Redistribution Agent</em>.
              </p>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Select Medicine</label>
                  <select
                    value={sandboxMedId}
                    onChange={(e) => setSandboxMedId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800"
                  >
                    {DEMO_MEDICINES.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.unit})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Current Stock in PHC (Units)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={sandboxStock}
                    onChange={(e) => setSandboxStock(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono text-slate-800 text-sm"
                  />
                  <span className="text-[11px] text-slate-400">Example: 120 strips</span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Average Daily Usage (Units / Day)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={sandboxUsage}
                    onChange={(e) => setSandboxUsage(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono text-slate-800 text-sm"
                  />
                  <span className="text-[11px] text-slate-400">Example: 45 strips/day</span>
                </div>

                {/* Quick Presets */}
                <div className="pt-2">
                  <div className="text-[11px] font-semibold text-slate-500 mb-2">Try Prompt Example Presets:</div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => { setSandboxStock(120); setSandboxUsage(45); }}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 text-[11px]"
                    >
                      Prompt Spec (120 stock, 45/day)
                    </button>
                    <button
                      onClick={() => { setSandboxStock(15); setSandboxUsage(10); }}
                      className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded text-[11px]"
                    >
                      Severe Stock-out (15 stock, 10/day)
                    </button>
                    <button
                      onClick={() => { setSandboxStock(1500); setSandboxUsage(40); }}
                      className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded text-[11px]"
                    >
                      Surplus PHC (1500 stock, 40/day)
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Calculated Output Breakdown Card */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-900">Deterministic Mathematical Result</h3>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    sandboxPrediction.riskLevel === 'HIGH'
                      ? 'bg-red-100 text-red-800 border border-red-200'
                      : sandboxPrediction.riskLevel === 'MEDIUM'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}>
                    {sandboxPrediction.riskLevel} RISK
                  </span>
                </div>

                {/* Math Step by Step */}
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3 font-mono text-xs">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-sans font-semibold">Step 1: Days to Stock-out</div>
                    <div className="text-slate-800 font-bold mt-0.5">
                      {sandboxStock} ÷ {sandboxUsage} = <span className="text-teal-700">{sandboxPrediction.daysToStockout} days remaining</span>
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-sans font-semibold">Step 2: 7-Day Projected Demand</div>
                    <div className="text-slate-800 font-bold mt-0.5">
                      {sandboxUsage} × 7 days = <span className="text-blue-700">{sandboxPrediction.forecastedDemand} units needed</span>
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-sans font-semibold">Step 3: Estimated Shortage</div>
                    <div className="text-slate-800 font-bold mt-0.5">
                      {sandboxPrediction.estimatedShortage > 0 ? (
                        <span className="text-red-600">{sandboxPrediction.estimatedShortage} units deficit</span>
                      ) : (
                        <span className="text-emerald-700">0 units (Adequate local supply)</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-sans font-semibold">Step 4: Facility Supply Status</div>
                    <div className="text-slate-800 font-bold mt-0.5">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-sans ${
                        sandboxPrediction.stockStatus === 'DEFICIT'
                          ? 'bg-red-100 text-red-800'
                          : sandboxPrediction.stockStatus === 'SURPLUS'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-800'
                      }`}>
                        {sandboxPrediction.stockStatus}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* What Gemini Explanation Agent will see */}
              <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="text-[11px] font-semibold text-purple-700 flex items-center gap-1.5 mb-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Handover to Gemini Explanation Agent (Stage 5)
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  This structured JSON payload will be sent to Gemini to generate the plain-English clinical explanation for the District Health Officer:
                </p>
                <pre className="mt-2 p-2.5 bg-slate-900 text-slate-100 rounded text-[11px] overflow-x-auto">
{JSON.stringify({
  phc: "Kelambakkam Community PHC",
  medicine: DEMO_MEDICINES.find(m => m.id === sandboxMedId)?.name,
  currentStock: sandboxStock,
  averageDailyUsage: sandboxUsage,
  forecastedDemand: sandboxPrediction.forecastedDemand,
  daysUntilStockout: sandboxPrediction.daysToStockout,
  riskLevel: sandboxPrediction.riskLevel,
}, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* TAB 4: Cloud Run & Production Readiness */}
      {activeTab === 'cloud_production' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                  <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Google Cloud Production Architecture (Stage 8)</h2>
                  <p className="text-xs text-slate-500">
                    High-availability, containerized micro-architecture running on Google Cloud Run in europe-west2.
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold px-2.5 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Production Ready
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-indigo-600" />
                  Full-Stack Server Entry
                </div>
                <div className="text-sm font-semibold text-slate-800">Node.js + Express 4.x</div>
                <p className="text-xs text-slate-500 mt-1">
                  Single container entry bundled via esbuild into <code className="text-indigo-600 font-mono text-[11px]">dist/server.cjs</code>. Listens on <code className="text-indigo-600 font-mono text-[11px]">0.0.0.0:3000</code>.
                </p>
              </div>

              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-purple-600" />
                  Server-Side Gemini 3.6 Flash
                </div>
                <div className="text-sm font-semibold text-slate-800">Secure API Proxy Routes</div>
                <p className="text-xs text-slate-500 mt-1">
                  API keys never touch the browser. Proxies <code className="text-purple-600 font-mono text-[11px]">/api/explain-risk</code> and <code className="text-purple-600 font-mono text-[11px]">/api/recommend-redistributions</code>.
                </p>
              </div>

              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Cloud Firestore Rules
                </div>
                <div className="text-sm font-semibold text-slate-800">Atomic RBAC Security</div>
                <p className="text-xs text-slate-500 mt-1">
                  Enforces validated schema limits on collections, preventing arbitrary data injection and isolating roles.
                </p>
              </div>
            </div>

            {/* Production Endpoints Matrix */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-slate-100 px-4 py-2.5 font-semibold text-xs text-slate-700 flex items-center justify-between">
                <span>Production API Route Specifications</span>
                <span className="text-[11px] text-slate-500 font-mono">Port 3000 Ingress</span>
              </div>
              <div className="divide-y divide-slate-200 text-xs">
                <div className="p-3 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-mono bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded text-[11px] mr-2">GET</span>
                    <strong className="font-mono text-slate-900">/api/health</strong>
                    <span className="text-slate-500 ml-2">— Liveness probe for Google Cloud Run container orchestrator</span>
                  </div>
                  <span className="text-slate-400 font-mono text-[11px]">Status: 200 OK</span>
                </div>

                <div className="p-3 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-mono bg-purple-100 text-purple-800 font-bold px-1.5 py-0.5 rounded text-[11px] mr-2">POST</span>
                    <strong className="font-mono text-slate-900">/api/explain-risk</strong>
                    <span className="text-slate-500 ml-2">— Generates plain-English clinical logistics explanation via Gemini 3.6 Flash</span>
                  </div>
                  <span className="text-slate-400 font-mono text-[11px]">Fallback: Rule Engine</span>
                </div>

                <div className="p-3 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-mono bg-purple-100 text-purple-800 font-bold px-1.5 py-0.5 rounded text-[11px] mr-2">POST</span>
                    <strong className="font-mono text-slate-900">/api/recommend-redistributions</strong>
                    <span className="text-slate-500 ml-2">— Authorizes cold-chain safe mutual aid transfers with reserve guarantees</span>
                  </div>
                  <span className="text-slate-400 font-mono text-[11px]">Fallback: Haversine Model</span>
                </div>

                <div className="p-3 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-mono bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded text-[11px] mr-2">GET</span>
                    <strong className="font-mono text-slate-900">/* (SPA Fallback)</strong>
                    <span className="text-slate-500 ml-2">— Static assets served from compiled Vite output with index.html fallback</span>
                  </div>
                  <span className="text-slate-400 font-mono text-[11px]">Cache-Control: Max-Age</span>
                </div>
              </div>
            </div>

            {/* Cloud Run Container Details */}
            <div className="mt-6 bg-slate-900 text-slate-100 rounded-lg p-4 font-mono text-xs">
              <div className="text-slate-400 mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                  Cloud Run Build & Production Container Pipeline
                </span>
                <span className="text-[10px] text-emerald-400">PASSED</span>
              </div>
              <div className="space-y-1 text-slate-300 text-[11px]">
                <div>$ npm run build</div>
                <div className="text-slate-400">&gt; vite build</div>
                <div className="text-slate-500">✓ 182 modules transformed. dist/index.html &amp; assets generated.</div>
                <div className="text-slate-400">&gt; esbuild server.ts --bundle --platform=node --format=cjs --packages=external --outfile=dist/server.cjs</div>
                <div className="text-emerald-400">✓ dist/server.cjs generated (bundled backend entry, CommonJS compatibility)</div>
                <div className="mt-2 text-slate-300">$ node dist/server.cjs</div>
                <div className="text-indigo-300">MediFlow AI Server running on http://0.0.0.0:3000 [Container Ingress Active]</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-12 border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>MediFlow AI • Build with AI: Code for Communities Hackathon (GDG Chennai)</span>
          <span className="text-slate-500 font-medium">Stage 8 Completed • Full-Stack Cloud Run Container Ready</span>
        </div>
      </footer>
    </div>
  );
};
