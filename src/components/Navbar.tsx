import React from 'react';
import { 
  Building2, 
  ShieldCheck, 
  User, 
  Layers, 
  Hospital, 
  LayoutDashboard,
  Sparkles,
  ChevronDown,
  Database,
  Lock
} from 'lucide-react';
import { UserProfile, UserRole } from '../types';
import { DEMO_USERS, DEMO_PHCS } from '../data/mockData';

interface NavbarProps {
  currentUser: UserProfile;
  onSelectUser: (user: UserProfile) => void;
  activeView: 'phc_portal' | 'district_dashboard' | 'architecture';
  onSelectView: (view: 'phc_portal' | 'district_dashboard' | 'architecture') => void;
  isFirestoreConnected?: boolean;
  onOpenAuth?: () => void;
  onOpenFirestoreViewer?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onSelectUser,
  activeView,
  onSelectView,
  isFirestoreConnected = true,
  onOpenAuth,
  onOpenFirestoreViewer,
}) => {
  const currentPhc = DEMO_PHCS.find((p) => p.id === currentUser.phcId);

  return (
    <header id="mediflow-navbar" className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      {/* Top Banner: AI Safety & Hackathon Context */}
      <div className="bg-slate-900 text-slate-300 text-xs px-4 py-1.5 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1.5">
          <div className="flex items-center gap-2">
            <span className="bg-teal-600/30 text-teal-300 border border-teal-500/40 text-[10px] font-semibold px-2 py-0.5 rounded">
              HACKATHON MVP
            </span>
            <span className="text-slate-300 font-medium">
              MediFlow AI — Primary Health Centre Supply-Chain Intelligence (India)
            </span>
          </div>
          <div className="flex items-center gap-3 text-slate-400 text-[11px]">
            <button 
              onClick={onOpenFirestoreViewer}
              className="inline-flex items-center gap-1.5 text-emerald-300 hover:text-emerald-200 transition-colors cursor-pointer"
              title="Click to view raw Cloud Firestore collections and JSON data"
            >
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isFirestoreConnected ? 'bg-emerald-400 opacity-75' : 'bg-amber-400 opacity-75'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isFirestoreConnected ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
              </span>
              <span>{isFirestoreConnected ? 'Firestore Real-Time Sync Active (Click to View Data)' : 'Connecting to Cloud Database...'}</span>
            </button>
            <span className="hidden md:inline text-slate-500">•</span>
            <span className="hidden md:inline">Tamil Nadu Pilot (Chengalpattu, Kanchipuram, Tiruvallur)</span>
          </div>
        </div>
      </div>

      {/* Main Nav Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          
          {/* Brand & Active Facility / District */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => onSelectView('district_dashboard')}>
              <div className="w-9 h-9 rounded-lg bg-teal-600 flex items-center justify-center text-white font-bold text-lg shadow-xs">
                M
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold tracking-tight text-slate-900">MediFlow AI</span>
                  <span className="text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded">
                    Supply Intelligence
                  </span>
                </div>
                <div className="text-xs text-slate-500">
                  {currentUser.role === 'phc_staff' && currentPhc ? (
                    <span>Station: <strong>{currentPhc.name}</strong> ({currentPhc.district})</span>
                  ) : (
                    <span>District Jurisdiction: <strong>{currentUser.districtId || 'All Districts'}</strong></span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Center: View Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-medium self-start lg:self-auto">
            <button
              id="nav-tab-phc"
              onClick={() => onSelectView('phc_portal')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                activeView === 'phc_portal'
                  ? 'bg-white text-teal-800 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Hospital className="w-3.5 h-3.5 text-teal-600" />
              PHC Staff Portal
            </button>

            <button
              id="nav-tab-district"
              onClick={() => onSelectView('district_dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                activeView === 'district_dashboard'
                  ? 'bg-white text-blue-800 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-blue-600" />
              District Officer Dashboard
            </button>

            <button
              id="nav-tab-architecture"
              onClick={() => onSelectView('architecture')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                activeView === 'architecture'
                  ? 'bg-white text-purple-800 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-purple-600" />
              Architecture & Roadmap
            </button>
          </div>

          {/* Right: Firestore Data Viewer & Quick Role Switcher */}
          <div className="flex items-center gap-2 self-end lg:self-auto">
            <button
              id="firestore-data-button"
              onClick={onOpenFirestoreViewer}
              className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg px-2.5 py-1.5 transition-colors cursor-pointer text-xs font-semibold shadow-xs"
              title="Open Live Cloud Firestore Database Inspector"
            >
              <Database className="w-3.5 h-3.5 text-amber-600" />
              <span>Firestore DB</span>
            </button>

            <button
              id="auth-manager-button"
              onClick={onOpenAuth}
              className="flex items-center gap-2 text-left bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg px-2.5 py-1.5 transition-colors cursor-pointer"
              title="Open Firebase Role & Security Manager"
            >
              <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${
                currentUser.role === 'phc_staff' ? 'bg-teal-100 text-teal-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {currentUser.role === 'phc_staff' ? '🏥' : '🏛️'}
              </div>
              <div className="hidden sm:block">
                <div className="text-xs font-semibold text-slate-800 leading-tight">{currentUser.name}</div>
                <div className="text-[10px] text-slate-500 capitalize flex items-center gap-1">
                  <span>{currentUser.role === 'phc_staff' ? 'PHC Staff' : 'District Officer'}</span>
                  <span className="text-teal-600 font-mono text-[9px] bg-teal-50 px-1 rounded">RBAC</span>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
