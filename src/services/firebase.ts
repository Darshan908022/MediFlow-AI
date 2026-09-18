import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signOut as fbSignOut
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDocFromServer, 
  setDoc, 
  collection, 
  onSnapshot, 
  getDocs,
  writeBatch
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { StockRecord, UserProfile, RedistributionRecommendation } from '../types';
import { INITIAL_STOCK_RECORDS } from '../data/mockData';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore strictly matching skill instructions: getFirestore(app, firebaseConfig.firestoreDatabaseId)
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Auth
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Validate connection to Firestore at boot as mandated by Firebase architectural guidelines
 */
export async function testConnection(): Promise<boolean> {
  const pathForTest = 'test/connection';
  try {
    // Attempt fast server retrieval with timeout to avoid lingering unavailable warnings
    const serverCheckPromise = getDocFromServer(doc(db, 'test', 'connection'));
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('connection timeout')), 4000)
    );
    await Promise.race([serverCheckPromise, timeoutPromise]);
    return true;
  } catch (error: any) {
    if (error instanceof Error && (error.message.includes('the client is offline') || error.message.includes('unavailable') || error.message.includes('timeout'))) {
      console.info('Cloud Firestore connection in offline/cached mode or initializing in background.');
      return false;
    }
    if (error?.message?.includes('Missing or insufficient permissions')) {
      handleFirestoreError(error, OperationType.GET, pathForTest);
    }
    // Any other response indicates backend communication was established
    return true;
  }
}

/**
 * Seeds initial stock records if the Firestore collection is empty
 */
export async function seedInitialStockRecordsIfEmpty(): Promise<void> {
  const pathForGetDocs = 'stockRecords';
  try {
    const stockCollectionRef = collection(db, pathForGetDocs);
    const snapshot = await getDocs(stockCollectionRef);

    if (snapshot.empty) {
      console.log('Firestore stockRecords collection is empty. Seeding initial baseline...');
      const batch = writeBatch(db);
      INITIAL_STOCK_RECORDS.forEach((record) => {
        const docId = `${record.phcId}_${record.medicineId}`;
        const recordRef = doc(db, 'stockRecords', docId);
        batch.set(recordRef, record);
      });
      await batch.commit();
      console.log('Successfully seeded stock records to Firestore.');
    }
  } catch (err: any) {
    if (err?.message?.includes('Missing or insufficient permissions')) {
      handleFirestoreError(err, OperationType.LIST, pathForGetDocs);
    }
    console.warn('Could not seed initial stock records to Firestore (using local baseline):', err);
  }
}

/**
 * Subscribe to real-time stock records from Firestore
 */
export function subscribeToStockRecords(
  onRecordsUpdate: (records: StockRecord[]) => void,
  onError?: (err: Error) => void
): () => void {
  const pathForOnSnapshot = 'stockRecords';
  const stockCollectionRef = collection(db, pathForOnSnapshot);

  const unsubscribe = onSnapshot(
    stockCollectionRef,
    (snapshot) => {
      if (!snapshot.empty) {
        const records: StockRecord[] = [];
        snapshot.forEach((docSnap) => {
          records.push(docSnap.data() as StockRecord);
        });
        onRecordsUpdate(records);
      } else {
        // Empty snapshot, fallback to initial dataset
        onRecordsUpdate(INITIAL_STOCK_RECORDS);
      }
    },
    (err) => {
      console.warn('Firestore onSnapshot update notice (falling back to local cache):', err);
      if (err.message.includes('Missing or insufficient permissions')) {
        handleFirestoreError(err, OperationType.LIST, pathForOnSnapshot);
      }
      if (onError) onError(err);
    }
  );

  return unsubscribe;
}

/**
 * Persist an updated stock record to Firestore
 */
export async function saveStockRecordToFirestore(record: StockRecord): Promise<void> {
  const docId = `${record.phcId}_${record.medicineId}`;
  const pathForDoc = `stockRecords/${docId}`;
  try {
    const recordRef = doc(db, 'stockRecords', docId);
    await setDoc(recordRef, record, { merge: true });
  } catch (err: any) {
    if (err?.message?.includes('Missing or insufficient permissions')) {
      handleFirestoreError(err, OperationType.WRITE, pathForDoc);
    }
    throw err;
  }
}

/**
 * Sign in as a demo user or authenticate
 */
export async function loginDemoUser(profile: UserProfile): Promise<UserProfile> {
  try {
    // Establish Firebase Auth anonymous session if not signed in
    if (!auth.currentUser) {
      await signInAnonymously(auth);
    }
  } catch (err) {
    console.warn('Anonymous auth note (proceeding with profile):', err);
  }

  // Cache chosen demo user in localStorage
  localStorage.setItem('mediflow_current_user', JSON.stringify(profile));
  return profile;
}

/**
 * Sign out
 */
export async function logoutUser(): Promise<void> {
  try {
    await fbSignOut(auth);
  } catch (err) {
    console.warn('Error signing out:', err);
  }
  localStorage.removeItem('mediflow_current_user');
}

/**
 * Real-time listener for Redistribution Recommendations collection
 */
export function subscribeToRedistributions(
  onUpdate: (recommendations: RedistributionRecommendation[]) => void,
  onError?: (error: Error) => void
): () => void {
  const pathForOnSnapshot = 'redistributions';
  const redistsCollectionRef = collection(db, 'redistributions');

  const unsubscribe = onSnapshot(
    redistsCollectionRef,
    (snapshot) => {
      const list: RedistributionRecommendation[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as RedistributionRecommendation);
      });
      onUpdate(list);
    },
    (err) => {
      console.warn('Firestore onSnapshot redistributions notice:', err);
      if (err.message.includes('Missing or insufficient permissions')) {
        handleFirestoreError(err, OperationType.LIST, pathForOnSnapshot);
      }
      if (onError) onError(err);
    }
  );

  return unsubscribe;
}

/**
 * Persist or update a Redistribution Recommendation in Firestore
 */
export async function saveRedistributionToFirestore(
  recommendation: RedistributionRecommendation
): Promise<void> {
  const docId = recommendation.id;
  const pathForDoc = `redistributions/${docId}`;
  try {
    // Ensure reason conforms to firestore rule size limit <= 500
    const safeReason = recommendation.reason.slice(0, 490);
    const dataToSave: RedistributionRecommendation = {
      ...recommendation,
      reason: safeReason,
    };

    const redRef = doc(db, 'redistributions', docId);
    await setDoc(redRef, dataToSave, { merge: true });
  } catch (err: any) {
    if (err?.message?.includes('Missing or insufficient permissions')) {
      handleFirestoreError(err, OperationType.WRITE, pathForDoc);
    }
    throw err;
  }
}

