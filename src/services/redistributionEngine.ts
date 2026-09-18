/**
 * MediFlow AI - Inter-Facility Redistribution & Spatial Distance Engine
 * Computes geographic proximity, donor capacity, receiver deficit,
 * and generates clinically sound transfer recommendations.
 */

import { PHC, Medicine, StockRecord, RedistributionRecommendation, RecommendationPriority } from '../types';
import { DEMO_PHCS, DEMO_MEDICINES, getDailyUsage, formatStockDisplay } from '../data/mockData';
import { calculateStockRisk } from './riskCalculator';

/**
 * Calculates Great-Circle distance between two coordinates in kilometers (Haversine formula)
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Estimates road transit time based on rural Indian district logistics speed (~35 km/h average)
 */
export function estimateTransitTimeMinutes(distanceKm: number): number {
  const transitMinutes = Math.round((distanceKm / 35) * 60) + 15; // 15 mins dispatch buffer
  return transitMinutes;
}

export interface EnrichedRedistributionRecommendation extends RedistributionRecommendation {
  fromPhc: PHC;
  toPhc: PHC;
  medicine: Medicine;
  distanceKm: number;
  estimatedTransitMinutes: number;
  donorCurrentStock: number;
  donorBufferDaysBefore: number;
  donorBufferDaysAfter: number;
  receiverCurrentStock: number;
  receiverBufferDaysBefore: number;
  receiverBufferDaysAfter: number;
  coldChainRequired: boolean;
  formattedQuantity: {
    primary: string;
    secondary?: string;
    combined: string;
  };
}

/**
 * Generates optimal candidate redistribution recommendations across PHCs based on live stock records
 */
export function generateRedistributionCandidates(
  stockRecords: StockRecord[],
  preferredDistrict?: string
): EnrichedRedistributionRecommendation[] {
  const recommendations: EnrichedRedistributionRecommendation[] = [];

  // Group inventory by medicine
  DEMO_MEDICINES.forEach((medicine) => {
    const isColdChain = medicine.category === 'Vaccine & Anti-serum';

    // Find all PHCs with deficit
    const deficits: Array<{
      phc: PHC;
      record: StockRecord;
      dailyUsage: number;
      daysToStockout: number;
      neededQuantity: number;
    }> = [];

    // Find all PHCs with surplus
    const surpluses: Array<{
      phc: PHC;
      record: StockRecord;
      dailyUsage: number;
      daysToStockout: number;
      availableSurplus: number;
    }> = [];

    DEMO_PHCS.forEach((phc) => {
      // If preferred district is set and not 'All', optionally prioritize or filter
      const record = stockRecords.find(
        (r) => r.phcId === phc.id && r.medicineId === medicine.id
      ) || {
        phcId: phc.id,
        medicineId: medicine.id,
        quantity: 0,
        lastUpdated: 'Out of Stock',
        expiryDate: 'Out of Stock',
        updatedBy: 'System',
      };

      const dailyUsage = getDailyUsage(phc.id, medicine.id);
      const prediction = calculateStockRisk({
        phcId: phc.id,
        medicineId: medicine.id,
        currentStock: record.quantity,
        averageDailyUsage: dailyUsage,
      });

      if (prediction.stockStatus === 'DEFICIT') {
        // Target is at least 14 days of supply
        const targetStock = dailyUsage * 14;
        const needed = Math.max(0, targetStock - record.quantity);
        deficits.push({
          phc,
          record,
          dailyUsage,
          daysToStockout: prediction.daysToStockout,
          neededQuantity: needed,
        });
      } else if (prediction.stockStatus === 'SURPLUS') {
        // Donor must retain at least 15 days of critical reserve
        const minBufferStock = dailyUsage * 15;
        const available = Math.max(0, record.quantity - minBufferStock);
        if (available > 0) {
          surpluses.push({
            phc,
            record,
            dailyUsage,
            daysToStockout: prediction.daysToStockout,
            availableSurplus: available,
          });
        }
      }
    });

    // Pair deficits with closest surplus donors
    deficits.forEach((deficit) => {
      // Sort surplus donors by distance to this deficit PHC
      const sortedSurpluses = [...surpluses]
        .map((s) => ({
          ...s,
          distanceKm: calculateHaversineDistance(
            deficit.phc.lat,
            deficit.phc.lng,
            s.phc.lat,
            s.phc.lng
          ),
        }))
        .filter((s) => s.phc.id !== deficit.phc.id)
        .sort((a, b) => {
          // If within same district, prioritize
          const aSameDistrict = a.phc.district === deficit.phc.district ? 1 : 0;
          const bSameDistrict = b.phc.district === deficit.phc.district ? 1 : 0;
          if (aSameDistrict !== bSameDistrict) return bSameDistrict - aSameDistrict;
          return a.distanceKm - b.distanceKm;
        });

      if (sortedSurpluses.length > 0) {
        const bestDonor = sortedSurpluses[0];

        // Determine transfer quantity
        const rawTransfer = Math.min(deficit.neededQuantity, bestDonor.availableSurplus);
        if (rawTransfer <= 0) return;

        // Normalize packaging size (e.g. round to nearest 10 units for tablets, 1 for vials)
        let normalizedQuantity = rawTransfer;
        if (medicine.unit.toLowerCase().includes('strips') || medicine.unit.toLowerCase().includes('pack')) {
          normalizedQuantity = Math.max(10, Math.round(rawTransfer / 10) * 10);
        } else {
          normalizedQuantity = Math.max(1, Math.round(rawTransfer));
        }

        // Cap to available surplus so donor never falls below 15 days
        normalizedQuantity = Math.min(normalizedQuantity, bestDonor.availableSurplus);
        if (normalizedQuantity <= 0) return;

        // Determine urgency priority
        let priority: RecommendationPriority = 'LOW';
        if (deficit.daysToStockout <= 1.0 || deficit.record.quantity === 0 || medicine.category === 'Emergency & Critical Care' || medicine.id === 'med_arv_vial') {
          priority = 'HIGH';
        } else if (deficit.daysToStockout <= 3.5) {
          priority = 'MEDIUM';
        }

        const transitMins = estimateTransitTimeMinutes(bestDonor.distanceKm);

        // Pre-compute post-transfer buffers
        const donorStockAfter = bestDonor.record.quantity - normalizedQuantity;
        const donorDaysAfter = Math.round((donorStockAfter / bestDonor.dailyUsage) * 10) / 10;
        const receiverStockAfter = deficit.record.quantity + normalizedQuantity;
        const receiverDaysAfter = Math.round((receiverStockAfter / deficit.dailyUsage) * 10) / 10;

        const recommendationId = `rec_${bestDonor.phc.id.slice(-4)}_${deficit.phc.id.slice(-4)}_${medicine.id.slice(-6)}_${Date.now() % 100000}`;

        const reason = `${deficit.phc.name} has critically low ${medicine.name} (${deficit.daysToStockout}d buffer remaining). Transferring ${normalizedQuantity} ${medicine.unit} from ${bestDonor.phc.name} (${bestDonor.distanceKm} km away) restores ${deficit.phc.name} to ${receiverDaysAfter}d buffer while donor retains safe ${donorDaysAfter}d reserve.`;

        recommendations.push({
          id: recommendationId,
          fromPhcId: bestDonor.phc.id,
          toPhcId: deficit.phc.id,
          medicineId: medicine.id,
          quantity: normalizedQuantity,
          priority,
          reason,
          status: 'PENDING',
          createdAt: new Date().toISOString(),
          fromPhc: bestDonor.phc,
          toPhc: deficit.phc,
          medicine,
          distanceKm: bestDonor.distanceKm,
          estimatedTransitMinutes: transitMins,
          donorCurrentStock: bestDonor.record.quantity,
          donorBufferDaysBefore: bestDonor.daysToStockout,
          donorBufferDaysAfter: donorDaysAfter,
          receiverCurrentStock: deficit.record.quantity,
          receiverBufferDaysBefore: deficit.daysToStockout,
          receiverBufferDaysAfter: receiverDaysAfter,
          coldChainRequired: isColdChain,
          formattedQuantity: formatStockDisplay(normalizedQuantity, medicine.id),
        });
      }
    });
  });

  // Filter by district if specified
  if (preferredDistrict && preferredDistrict !== 'All') {
    return recommendations.filter(
      (r) => r.fromPhc.district === preferredDistrict || r.toPhc.district === preferredDistrict
    );
  }

  // Sort by priority (HIGH first) and distance
  return recommendations.sort((a, b) => {
    const priorityWeight = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    const pDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
    if (pDiff !== 0) return pDiff;
    return a.distanceKm - b.distanceKm;
  });
}
