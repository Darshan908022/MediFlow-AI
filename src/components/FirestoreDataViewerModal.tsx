import React, { useState, useMemo } from 'react';
import { 
  Database, 
  X, 
  ExternalLink, 
  Search, 
  Copy, 
  Check, 
  Layers, 
  FileText, 
  Code, 
  RefreshCw,
  Table as TableIcon
} from 'lucide-react';
import { StockRecord, RedistributionRecommendation } from '../types';
import { DEMO_PHCS, DEMO_MEDICINES } from '../data/mockData';
import firebaseConfig from '../../firebase-applet-config.json';

interface FirestoreDataViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  stockRecords: StockRecord[];
  redistributions: RedistributionRecommendation[];
}

export const FirestoreDataViewerModal: React.FC<FirestoreDataViewerModalProps> = ({
  isOpen,
  onClose,
  stockRecords,
  redistributions,
}) => {
  const [selectedCollection, setSelectedCollection] = useState<'stock' | 'redistributions' | 'phcs'>('stock');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'json'>('table');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const databaseId = firebaseConfig.firestoreDatabaseId || 'ai-studio-mediflowai-cd7a35ad-c17f-4663-8d23-eebec3db0aee';
  const projectId = firebaseConfig.projectId || 'earnest-plasma-x14dk';

  const gcpConsoleUrl = `https://console.cloud.google.com/firestore/databases/${databaseId}/data/panel?project=${projectId}`;
  const firebaseConsoleUrl = `https://console.firebase.google.com/project/${projectId}/firestore`;

  // Filtered Stock Documents
  const filteredStock = useMemo(() => {
    return stockRecords.filter((r) => {
      const phc = DEMO_PHCS.find((p) => p.id === r.phcId);
      const med = DEMO_MEDICINES.find((m) => m.id === r.medicineId);
      const query = searchQuery.toLowerCase();
      return (
        r.phcId.toLowerCase().includes(query) ||
        r.medicineId.toLowerCase().includes(query) ||
        (phc?.name.toLowerCase().includes(query) ?? false) ||
        (med?.name.toLowerCase().includes(query) ?? false) ||
        (r.batchNumber?.toLowerCase().includes(query) ?? false)
      );
    });
  }, [stockRecords, searchQuery]);

  // Filtered Redistributions Documents
  const filteredRedistributions = useMemo(() => {
    return redistributions.filter((r) => {
      const donor = DEMO_PHCS.find((p) => p.id === r.fromPhcId);
      const recipient = DEMO_PHCS.find((p) => p.id === r.toPhcId);
      const med = DEMO_MEDICINES.find((m) => m.id === r.medicineId);
      const query = searchQuery.toLowerCase();
      return (
        r.id.toLowerCase().includes(query) ||
        r.status.toLowerCase().includes(query) ||
        (donor?.name.toLowerCase().includes(query) ?? false) ||
        (recipient?.name.toLowerCase().includes(query) ?? false) ||
        (med?.name.toLowerCase().includes(query) ?? false) ||
        (r.reviewNotes?.toLowerCase().includes(query) ?? false)
      );
    });
  }, [redistributions, searchQuery]);

  // Filtered PHC Documents
  const filteredPhcs = useMemo(() => {
    return DEMO_PHCS.filter((p) => {
      const query = searchQuery.toLowerCase();
      return (
        p.id.toLowerCase().includes(query) ||
        p.name.toLowerCase().includes(query) ||
        p.district.toLowerCase().includes(query)
      );
    });
  }, [searchQuery]);

  const activeJsonData = useMemo(() => {
    if (selectedCollection === 'stock') {
      if (selectedDocId) {
        return stockRecords.find((r) => `${r.phcId}_${r.medicineId}` === selectedDocId) || null;
      }
      return filteredStock;
    }
    if (selectedCollection === 'redistributions') {
      if (selectedDocId) {
        return redistributions.find((r) => r.id === selectedDocId) || null;
      }
      return filteredRedistributions;
    }
    if (selectedCollection === 'phcs') {
      if (selectedDocId) {
        return DEMO_PHCS.find((p) => p.id === selectedDocId) || null;
      }
      return filteredPhcs;
    }
    return [];
  }, [selectedCollection, selectedDocId, filteredStock, filteredRedistributions, filteredPhcs, stockRecords, redistributions]);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(activeJsonData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div 
      id="firestore-viewer-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-indigo-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight text-white">
                  Cloud Firestore Real-Time Database Explorer
                </h2>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  LIVE SYNC
                </span>
              </div>
              <p className="text-xs text-indigo-200/80 mt-0.5 font-mono">
                Database: <span className="text-amber-300">{databaseId}</span> • Project: <span className="text-slate-300">{projectId}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={gcpConsoleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs bg-indigo-800/80 hover:bg-indigo-700 text-indigo-100 border border-indigo-600/50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              title="Open Google Cloud Console"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>GCP Console</span>
            </a>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Controls & Navigation */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          {/* Collection Pills */}
          <div className="flex items-center bg-slate-200/80 p-1 rounded-lg text-xs font-semibold">
            <button
              onClick={() => {
                setSelectedCollection('stock');
                setSelectedDocId(null);
              }}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedCollection === 'stock'
                  ? 'bg-white text-indigo-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              <span>collection("stock")</span>
              <span className="bg-indigo-100 text-indigo-800 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                {stockRecords.length}
              </span>
            </button>

            <button
              onClick={() => {
                setSelectedCollection('redistributions');
                setSelectedDocId(null);
              }}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedCollection === 'redistributions'
                  ? 'bg-white text-indigo-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span>collection("redistributions")</span>
              <span className="bg-indigo-100 text-indigo-800 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                {redistributions.length}
              </span>
            </button>

            <button
              onClick={() => {
                setSelectedCollection('phcs');
                setSelectedDocId(null);
              }}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedCollection === 'phcs'
                  ? 'bg-white text-indigo-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-indigo-600" />
              <span>collection("phcs")</span>
              <span className="bg-indigo-100 text-indigo-800 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                {DEMO_PHCS.length}
              </span>
            </button>
          </div>

          {/* Search & View Mode Toggle */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
            <div className="relative flex-1 md:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search collection documents..."
                className="w-full text-xs pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-indigo-600 text-slate-800"
              />
            </div>

            <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg border border-slate-300 text-xs">
              <button
                onClick={() => setViewMode('table')}
                className={`px-2 py-1 rounded transition-colors cursor-pointer flex items-center gap-1 ${
                  viewMode === 'table' ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'text-slate-600'
                }`}
                title="Structured Table View"
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Table</span>
              </button>
              <button
                onClick={() => setViewMode('json')}
                className={`px-2 py-1 rounded transition-colors cursor-pointer flex items-center gap-1 ${
                  viewMode === 'json' ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'text-slate-600'
                }`}
                title="Raw JSON Document View"
              >
                <Code className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">JSON</span>
              </button>
            </div>

            <button
              onClick={handleCopyJson}
              className="p-1.5 bg-white border border-slate-300 text-slate-600 hover:text-slate-900 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs"
              title="Copy active documents as JSON"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Content Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {viewMode === 'table' ? (
            <div>
              {selectedCollection === 'stock' && (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-100 text-slate-700 font-semibold text-[11px] uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Document ID</th>
                        <th className="py-2.5 px-3">Primary Health Centre</th>
                        <th className="py-2.5 px-3">Medicine</th>
                        <th className="py-2.5 px-3 text-right">Quantity</th>
                        <th className="py-2.5 px-3">Expiry Date</th>
                        <th className="py-2.5 px-3">Batch Number</th>
                        <th className="py-2.5 px-3">Last Updated (ISO)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredStock.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-6 text-slate-400">
                            No documents matched query.
                          </td>
                        </tr>
                      ) : (
                        filteredStock.map((record) => {
                          const docId = `${record.phcId}_${record.medicineId}`;
                          const phc = DEMO_PHCS.find((p) => p.id === record.phcId);
                          const med = DEMO_MEDICINES.find((m) => m.id === record.medicineId);

                          return (
                            <tr key={docId} className="hover:bg-indigo-50/40 transition-colors">
                              <td className="py-2 px-3 font-mono text-[11px] text-indigo-700 font-medium">
                                {docId}
                              </td>
                              <td className="py-2 px-3 font-medium text-slate-900">
                                {phc?.name} <span className="text-[10px] text-slate-400">({phc?.district})</span>
                              </td>
                              <td className="py-2 px-3">
                                {med?.name} <span className="text-[10px] text-slate-400 font-mono">({med?.unit})</span>
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                                <span className={record.quantity === 0 ? 'text-red-600' : ''}>
                                  {record.quantity.toLocaleString()}
                                </span>
                              </td>
                              <td className="py-2 px-3 font-mono text-[11px] text-slate-600">
                                {record.expiryDate}
                              </td>
                              <td className="py-2 px-3 font-mono text-[11px] text-slate-500">
                                {record.batchNumber || '—'}
                              </td>
                              <td className="py-2 px-3 text-[10px] text-slate-400 font-mono">
                                {record.lastUpdated}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {selectedCollection === 'redistributions' && (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-100 text-slate-700 font-semibold text-[11px] uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Document ID</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Donor Facility</th>
                        <th className="py-2.5 px-3">Recipient Facility</th>
                        <th className="py-2.5 px-3">Medicine & Quantity</th>
                        <th className="py-2.5 px-3">Priority</th>
                        <th className="py-2.5 px-3">Officer Review Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredRedistributions.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-6 text-slate-400">
                            No redistribution recommendations logged yet. (Authorize a transfer in District Dashboard to view documents).
                          </td>
                        </tr>
                      ) : (
                        filteredRedistributions.map((rec) => {
                          const donor = DEMO_PHCS.find((p) => p.id === rec.fromPhcId);
                          const recipient = DEMO_PHCS.find((p) => p.id === rec.toPhcId);
                          const med = DEMO_MEDICINES.find((m) => m.id === rec.medicineId);

                          return (
                            <tr key={rec.id} className="hover:bg-indigo-50/40 transition-colors">
                              <td className="py-2 px-3 font-mono text-[11px] text-indigo-700 font-medium">
                                {rec.id}
                              </td>
                              <td className="py-2 px-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  rec.status === 'APPROVED'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : rec.status === 'REJECTED'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {rec.status}
                                </span>
                              </td>
                              <td className="py-2 px-3 font-medium text-slate-900">{donor?.name}</td>
                              <td className="py-2 px-3 font-medium text-slate-900">{recipient?.name}</td>
                              <td className="py-2 px-3 font-mono text-slate-800">
                                <strong>{rec.quantity}</strong> {med?.unit} of {med?.name}
                              </td>
                              <td className="py-2 px-3 font-semibold text-[11px] uppercase text-slate-700">
                                {rec.priority}
                              </td>
                              <td className="py-2 px-3 text-[11px] text-slate-500 italic">
                                {rec.reviewNotes || '—'}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {selectedCollection === 'phcs' && (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-100 text-slate-700 font-semibold text-[11px] uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Document ID</th>
                        <th className="py-2.5 px-3">Facility Name</th>
                        <th className="py-2.5 px-3">District</th>
                        <th className="py-2.5 px-3">Facility Type</th>
                        <th className="py-2.5 px-3">Coordinates (Lat, Lng)</th>
                        <th className="py-2.5 px-3">Bed Capacity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredPhcs.map((phc) => (
                        <tr key={phc.id} className="hover:bg-indigo-50/40 transition-colors">
                          <td className="py-2 px-3 font-mono text-[11px] text-indigo-700 font-medium">{phc.id}</td>
                          <td className="py-2 px-3 font-medium text-slate-900">{phc.name}</td>
                          <td className="py-2 px-3 text-slate-700">{phc.district}</td>
                          <td className="py-2 px-3 text-slate-600">{phc.type}</td>
                          <td className="py-2 px-3 font-mono text-[11px] text-slate-500">
                            {phc.lat.toFixed(4)}, {phc.lng.toFixed(4)}
                          </td>
                          <td className="py-2 px-3 text-slate-800 font-semibold">{phc.bedCapacity || 10}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-900 text-slate-100 rounded-xl p-4 font-mono text-xs overflow-x-auto">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-slate-400 text-[11px]">
                <span>
                  Showing {Array.isArray(activeJsonData) ? `${activeJsonData.length} records in collection("${selectedCollection}")` : 'Single Record'}
                </span>
                <button
                  onClick={handleCopyJson}
                  className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 cursor-pointer"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied to Clipboard' : 'Copy JSON'}</span>
                </button>
              </div>
              <pre className="text-[11px] leading-relaxed text-indigo-200">
                {JSON.stringify(activeJsonData, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Real-time snapshot listeners connected to collection: <strong>"{selectedCollection}"</strong></span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={firebaseConsoleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Open Firebase Console</span>
            </a>
            <button
              onClick={onClose}
              className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-md font-medium text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
