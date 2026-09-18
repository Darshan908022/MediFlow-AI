/**
 * MediFlow AI - Stock-Out Risk Calculation Engine
 * 
 * DESIGN PRINCIPLE: Transparent, auditable mathematical logic.
 * Do NOT use generative AI to guess numbers or simulate forecasting.
 * This MVP engine uses clear run-rate and demand formulas, designed to be 
 * swappable with Vertex AI Time-Series AutoML models in production.
 */

import { RiskLevel, StockPrediction, StockStatus } from '../types';

export interface CalculationInput {
  phcId: string;
  medicineId: string;
  currentStock: number;
  averageDailyUsage: number;
  forecastWindowDays?: number; // default: 7 days
}

/**
 * Calculates stock-out risks using transparent deterministic arithmetic.
 * 
 * Formula:
 * 1. Days to Stock-out = Current Stock / Average Daily Usage
 * 2. Forecasted Demand = Average Daily Usage * Forecast Window (7 days)
 * 3. Estimated Shortage = Math.max(0, Forecasted Demand - Current Stock)
 * 4. Risk Level:
 *    - HIGH: Days <= 3 days (or shortage > 0 within forecast window)
 *    - MEDIUM: 3 < Days <= 7 days
 *    - LOW: Days > 7 days
 * 5. Stock Status:
 *    - DEFICIT: Days <= 5 days
 *    - SURPLUS: Days >= 25 days (safe for redistribution without risking local supply)
 *    - NORMAL: 5 < Days < 25
 */
export function calculateStockRisk(input: CalculationInput): StockPrediction {
  const {
    phcId,
    medicineId,
    currentStock,
    averageDailyUsage,
    forecastWindowDays = 7,
  } = input;

  // Guard against zero or negative daily consumption to avoid division by zero
  const safeUsage = Math.max(0.1, averageDailyUsage);
  const safeStock = Math.max(0, currentStock);

  const rawDays = safeStock / safeUsage;
  const daysToStockout = Math.round(rawDays * 10) / 10; // 1 decimal place

  const forecastedDemand = Math.round(safeUsage * forecastWindowDays);
  const estimatedShortage = Math.max(0, forecastedDemand - safeStock);

  // Risk Level Classification
  let riskLevel: RiskLevel;
  let riskScore: number;

  if (daysToStockout <= 3 || safeStock === 0) {
    riskLevel = 'HIGH';
    // Score scaled between 75 and 100
    riskScore = Math.min(100, Math.round(100 - (daysToStockout / 3) * 25));
  } else if (daysToStockout <= 7) {
    riskLevel = 'MEDIUM';
    // Score scaled between 40 and 74
    riskScore = Math.round(74 - ((daysToStockout - 3) / 4) * 34);
  } else {
    riskLevel = 'LOW';
    // Score below 40
    riskScore = Math.max(5, Math.round(39 - Math.min(30, daysToStockout - 7)));
  }

  // Supply status classification (for redistribution matching)
  let stockStatus: StockStatus;
  if (daysToStockout <= 5) {
    stockStatus = 'DEFICIT';
  } else if (daysToStockout >= 25) {
    stockStatus = 'SURPLUS';
  } else {
    stockStatus = 'NORMAL';
  }

  return {
    phcId,
    medicineId,
    currentStock: safeStock,
    averageDailyUsage: safeUsage,
    forecastedDemand,
    daysToStockout,
    estimatedShortage,
    riskScore,
    riskLevel,
    stockStatus,
    calculationBreakdown: {
      formula: `${safeStock} current units ÷ ${safeUsage.toFixed(1)} units/day = ${daysToStockout} days remaining (${forecastWindowDays}-day demand: ${forecastedDemand})`,
      stock: safeStock,
      usagePerDay: safeUsage,
      forecastWindowDays,
    },
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Batch calculate predictions for a full list of stock items
 */
export function calculateBatchStockRisk(
  items: Array<{
    phcId: string;
    medicineId: string;
    currentStock: number;
    averageDailyUsage: number;
  }>
): StockPrediction[] {
  return items.map((item) => calculateStockRisk(item));
}
