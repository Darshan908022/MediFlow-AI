/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { PhcStaffDashboard } from './components/PhcStaffDashboard';
import { DistrictDashboard } from './components/DistrictDashboard';
import { ArchitectureView } from './components/ArchitectureView';
import { AuthModal } from './components/AuthModal';
import { FirestoreDataViewerModal } from './components/FirestoreDataViewerModal';
import { DemoScenarioBar } from './components/DemoScenarioBar';
import { DEMO_USERS, INITIAL_STOCK_RECORDS } from './data/mockData';
import { StockRecord, UserProfile, RedistributionRecommendation } from './types';
import { 
  testConnection, 
  seedInitialStockRecordsIfEmpty, 
  subscribeToStockRecords, 
  saveStockRecordToFirestore,
  subscribeToRedistributions,
  saveRedistributionToFirestore
} from './services/firebase';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('mediflow_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return DEMO_USERS[0];
  });

  const [activeView, setActiveView] = useState<'phc_portal' | 'district_dashboard' | 'architecture'>('district_dashboard');
  const [stockRecords, setStockRecords] = useState<StockRecord[]>(INITIAL_STOCK_RECORDS);
  const [redistributions, setRedistributions] = useState<RedistributionRecommendation[]>([]);
  const [isFirestoreConnected, setIsFirestoreConnected] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isFirestoreViewerOpen, setIsFirestoreViewerOpen] = useState<boolean>(false);
  const [scenarioNotice, setScenarioNotice] = useState<string | null>(null);

  // Initialize and synchronize with Firebase Firestore
  useEffect(() => {
    let unsubscribeStock: (() => void) | undefined;
    let unsubscribeRedists: (() => void) | undefined;

    async function initFirebase() {
      const connected = await testConnection();
      setIsFirestoreConnected(connected);

      // Seed baseline stock records if collection is completely empty
      await seedInitialStockRecordsIfEmpty();

      // Subscribe to real-time stock updates from Firestore
      unsubscribeStock = subscribeToStockRecords(
        (updatedRecords) => {
          if (updatedRecords && updatedRecords.length > 0) {
            setStockRecords(updatedRecords);
          }
        },
        (err) => {
          console.warn('Real-time stock sync notice:', err);
        }
      );

      // Subscribe to real-time redistribution updates from Firestore
      unsubscribeRedists = subscribeToRedistributions(
        (updatedRedists) => {
          if (updatedRedists && updatedRedists.length > 0) {
            setRedistributions(updatedRedists);
          }
        },
        (err) => {
          console.warn('Real-time redistribution sync notice:', err);
        }
      );
    }

    initFirebase();

    return () => {
      if (unsubscribeStock) unsubscribeStock();
      if (unsubscribeRedists) unsubscribeRedists();
    };
  }, []);

  const handleUpdateStock = async (updatedRecord: StockRecord) => {
    // 1. Optimistic local state update
    setStockRecords((prev) => {
      const filtered = prev.filter(
        (r) => !(r.phcId === updatedRecord.phcId && r.medicineId === updatedRecord.medicineId)
      );
      return [...filtered, updatedRecord];
    });

    // 2. Persist to Cloud Firestore
    try {
      await saveStockRecordToFirestore(updatedRecord);
    } catch (err) {
      console.error('Failed to sync updated stock record to Cloud Firestore:', err);
    }
  };

  const handleSaveRedistribution = async (rec: RedistributionRecommendation) => {
    // Optimistic local state update
    setRedistributions((prev) => {
      const filtered = prev.filter((r) => r.id !== rec.id);
      return [...filtered, rec];
    });

    try {
      await saveRedistributionToFirestore(rec);
    } catch (err) {
      console.error('Failed to sync redistribution to Cloud Firestore:', err);
    }
  };

  const handleConfirmReceipt = async (rec: RedistributionRecommendation) => {
    const updatedRec: RedistributionRecommendation = {
      ...rec,
      reviewNotes: rec.reviewNotes 
        ? `${rec.reviewNotes} (Receipt verified at recipient PHC)`
        : 'Receipt physically verified and accepted into cold-box / quarantine at PHC',
    };
    await handleSaveRedistribution(updatedRec);
  };

  const handleApplyScenario = async (newRecords: StockRecord[], scenarioName: string) => {
    setStockRecords(newRecords);
    setScenarioNotice(`Scenario Activated: "${scenarioName}"`);
    setTimeout(() => setScenarioNotice(null), 4000);

    // Save modified records to Cloud Firestore asynchronously
    for (const record of newRecords) {
      try {
        await saveStockRecordToFirestore(record);
      } catch (e) {
        // Continue to next record
      }
    }
  };

  const handleResetBaseline = async () => {
    setStockRecords(INITIAL_STOCK_RECORDS);
    setScenarioNotice('Pilot Baseline Inventory Restored');
    setTimeout(() => setScenarioNotice(null), 3000);

    for (const record of INITIAL_STOCK_RECORDS) {
      try {
        await saveStockRecordToFirestore(record);
      } catch (e) {
        // Continue
      }
    }
  };

  const handleNavigateToPhc = (phcId: string) => {
    setCurrentUser((prev) => ({
      ...prev,
      role: 'phc_staff',
      phcId: phcId,
    }));
    setActiveView('phc_portal');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Navbar
        currentUser={currentUser}
        onSelectUser={(user) => {
          setCurrentUser(user);
        }}
        activeView={activeView}
        onSelectView={setActiveView}
        isFirestoreConnected={isFirestoreConnected}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenFirestoreViewer={() => setIsFirestoreViewerOpen(true)}
      />

      {/* 1-Click Interactive Demo Simulation Bar */}
      <DemoScenarioBar
        stockRecords={stockRecords}
        onApplyScenario={handleApplyScenario}
        onResetBaseline={handleResetBaseline}
      />

      {scenarioNotice && (
        <div className="bg-indigo-600 text-white text-xs px-4 py-1.5 text-center font-medium shadow-inner animate-fade-in">
          {scenarioNotice} • Real-time risk recalculations live in Surveillance Matrix
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeView === 'phc_portal' && (
          <PhcStaffDashboard
            currentUser={currentUser}
            stockRecords={stockRecords}
            redistributions={redistributions}
            onUpdateStock={handleUpdateStock}
            onConfirmReceipt={handleConfirmReceipt}
          />
        )}

        {activeView === 'district_dashboard' && (
          <DistrictDashboard
            currentUser={currentUser}
            stockRecords={stockRecords}
            redistributions={redistributions}
            onUpdateStockRecord={handleUpdateStock}
            onSaveRedistribution={handleSaveRedistribution}
            onNavigateToPhc={handleNavigateToPhc}
          />
        )}

        {activeView === 'architecture' && <ArchitectureView />}
      </main>

      {/* Firebase Authentication & Role Manager Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onSelectUser={(user) => setCurrentUser(user)}
        isFirestoreConnected={isFirestoreConnected}
        totalSyncedRecords={stockRecords.length}
      />

      {/* Cloud Firestore Live Data & Collection Explorer Modal */}
      <FirestoreDataViewerModal
        isOpen={isFirestoreViewerOpen}
        onClose={() => setIsFirestoreViewerOpen(false)}
        stockRecords={stockRecords}
        redistributions={redistributions}
      />

      <footer className="border-t border-slate-200 bg-white py-5 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>MediFlow AI • Build with AI: Code for Communities Hackathon (GDG Chennai)</span>
          <span className="text-slate-500 font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Stages 1–8 Completed • Cloud Run Containerized • Real-Time Firestore &amp; Gemini 3.6 Flash
          </span>
        </div>
      </footer>
    </div>
  );
}


