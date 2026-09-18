import React, { useState } from 'react';
import { 
  ShieldCheck, 
  X, 
  Check, 
  UserCheck, 
  Building2, 
  Database, 
  Lock, 
  Mail, 
  Sparkles, 
  RefreshCw,
  LogOut
} from 'lucide-react';
import { UserProfile, UserRole } from '../types';
import { DEMO_USERS, DEMO_PHCS } from '../data/mockData';
import { auth, loginDemoUser, logoutUser } from '../services/firebase';
import firebaseConfig from '../../firebase-applet-config.json';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onSelectUser: (user: UserProfile) => void;
  isFirestoreConnected: boolean;
  totalSyncedRecords: number;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSelectUser,
  isFirestoreConnected,
  totalSyncedRecords,
}) => {
  const [activeTab, setActiveTab] = useState<'personas' | 'custom'>('personas');
  const [emailInput, setEmailInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('phc_staff');
  const [selectedPhcId, setSelectedPhcId] = useState<string>(DEMO_PHCS[0].id);
  const [nameInput, setNameInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectPersona = async (user: UserProfile) => {
    setLoading(true);
    try {
      await loginDemoUser(user);
      onSelectUser(user);
      setStatusMsg(`Authenticated as ${user.name}`);
      setTimeout(() => {
        setStatusMsg(null);
        onClose();
      }, 700);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const phc = DEMO_PHCS.find((p) => p.id === selectedPhcId);
      const customProfile: UserProfile = {
        uid: `user_${Date.now()}`,
        role: selectedRole,
        name: nameInput.trim() || (selectedRole === 'phc_staff' ? 'Staff Nurse' : 'District Officer'),
        email: emailInput.trim() || `${selectedRole}@mediflow.gov.in`,
        phcId: selectedRole === 'phc_staff' ? selectedPhcId : undefined,
        districtId: selectedRole === 'phc_staff' ? phc?.district : 'Chengalpattu',
      };

      await loginDemoUser(customProfile);
      onSelectUser(customProfile);
      setStatusMsg(`Signed in as ${customProfile.name}`);
      setTimeout(() => {
        setStatusMsg(null);
        onClose();
      }, 700);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      id="auth-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight text-white">
                Firebase Identity & Access Control
              </h3>
              <p className="text-xs text-slate-300/80">
                Role-Based Access Control for Primary Health Care & District Governance
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cloud Connection Badge */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isFirestoreConnected ? 'bg-emerald-400 opacity-75' : 'bg-amber-400 opacity-75'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isFirestoreConnected ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </span>
            <span className="font-semibold text-slate-700">
              {isFirestoreConnected ? 'Cloud Firestore Connected' : 'Connecting to Firestore...'}
            </span>
          </div>

          <div className="text-[11px] text-slate-500 font-mono">
            Database: {firebaseConfig.firestoreDatabaseId.slice(0, 22)}...
          </div>
        </div>

        {/* Tab Selection */}
        <div className="p-5 space-y-4">
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('personas')}
              className={`pb-2 text-xs font-semibold px-3 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'personas'
                  ? 'border-teal-600 text-teal-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              1-Click Verified Personas (Recommended)
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              className={`pb-2 text-xs font-semibold px-3 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'custom'
                  ? 'border-teal-600 text-teal-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Custom Credentials / Role
            </button>
          </div>

          {statusMsg && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-1.5 font-medium">
              <Check className="w-4 h-4 text-emerald-600" />
              {statusMsg}
            </div>
          )}

          {activeTab === 'personas' ? (
            <div className="space-y-2.5">
              <p className="text-xs text-slate-500 mb-1">
                Select a verified operational persona to immediately test role-specific workflows:
              </p>

              {DEMO_USERS.map((user) => {
                const isSelected = currentUser.uid === user.uid;
                const phc = DEMO_PHCS.find((p) => p.id === user.phcId);

                return (
                  <div
                    key={user.uid}
                    onClick={() => handleSelectPersona(user)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-teal-50/70 border-teal-400 ring-1 ring-teal-400/40'
                        : 'bg-white border-slate-200 hover:border-teal-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm ${
                        user.role === 'phc_staff'
                          ? 'bg-teal-100 text-teal-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role === 'phc_staff' ? '🏥' : '🏛️'}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{user.name}</span>
                          <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded uppercase ${
                            user.role === 'phc_staff'
                              ? 'bg-teal-100 text-teal-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {user.role === 'phc_staff' ? 'PHC Staff' : 'District Officer'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {user.email} • {user.role === 'phc_staff' && phc ? phc.name : `${user.districtId} District`}
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <form onSubmit={handleCustomLogin} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="e.g. Dr. K. Ramanathan"
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-teal-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    System Role
                  </label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-teal-600"
                  >
                    <option value="phc_staff">PHC Staff (Facility)</option>
                    <option value="district_officer">District Health Officer</option>
                  </select>
                </div>

                {selectedRole === 'phc_staff' ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Assigned PHC
                    </label>
                    <select
                      value={selectedPhcId}
                      onChange={(e) => setSelectedPhcId(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-teal-600"
                    >
                      {DEMO_PHCS.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      District Focus
                    </label>
                    <input
                      type="text"
                      disabled
                      value="Chengalpattu District"
                      className="w-full text-xs bg-slate-100 border border-slate-200 rounded-lg p-2 text-slate-600"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Official Email
                </label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="officer@mediflow.gov.in"
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-teal-600"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 px-3 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                  Sign In with Firebase Auth Session
                </button>
              </div>
            </form>
          )}

          {/* Sync Stats Footnote */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-teal-600" />
              Synced Inventory: <strong>{totalSyncedRecords}</strong> records
            </span>
            <span className="text-slate-400">Rules v2 ABAC Enabled</span>
          </div>
        </div>
      </div>
    </div>
  );
};
