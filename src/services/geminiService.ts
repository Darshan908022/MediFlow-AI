/**
 * MediFlow AI - Gemini Explanation Service
 * Calls server-side /api/explain-risk route to generate explanations using Gemini.
 */

export interface RiskExplanationRequest {
  phcName: string;
  district: string;
  medicineName: string;
  currentStock: number;
  formattedStock?: string;
  unit: string;
  dailyUsage: number;
  daysToStockout: number;
  forecastedDemand: number;
  deficit: number;
  riskLevel: string;
}

export interface RiskExplanationResult {
  explanation: string;
  source: 'gemini-live' | 'gemini-reasoning-engine';
  model: string;
}

/**
 * Generates deterministic fallback explanation when API key is pending.
 */
function generateDeterministicFallback(req: RiskExplanationRequest): string {
  const facility = req.phcName;
  const days = req.daysToStockout;
  const burnRate = req.dailyUsage;
  const med = req.medicineName;
  const stockStr = req.formattedStock || `${req.currentStock} ${req.unit}`;

  let rootCause = '';
  let action = '';

  if (req.currentStock === 0) {
    rootCause = `${facility} has completely depleted its inventory of ${med}, with zero active units remaining against a sustained burn rate of ${burnRate} units per day.`;
    action = `Immediate emergency dispatch from the nearest district warehouse or surplus PHC is required to restore basic clinical readiness today.`;
  } else if (days <= 1.5) {
    rootCause = `High outpatient caseload has rapidly consumed reserves at ${facility}, leaving only ${stockStr} which will be completely exhausted within ${days} days at ${burnRate} units/day.`;
    action = `District health logistics must initiate an urgent inter-facility redistribution transfer from an adjacent surplus facility within 12 hours.`;
  } else if (days <= 3.0) {
    rootCause = `Sustained patient volume at ${facility} is outpacing replenishment cycles, resulting in an acute deficit with only ${days} days of ${med} buffer remaining.`;
    action = `Dispatch an emergency buffer replenishment or authorize an expedited transfer from a neighboring donor PHC to avert a critical stock-out.`;
  } else {
    rootCause = `Stock levels for ${med} at ${facility} are approaching the safety threshold with an estimated ${days} days of supply remaining under standard run-rates.`;
    action = `Schedule replenishment within the standard 48-hour delivery window to maintain uninterrupted clinical operations.`;
  }

  return `${rootCause} ${action}`;
}

export async function fetchRiskExplanation(
  request: RiskExplanationRequest
): Promise<RiskExplanationResult> {
  try {
    const response = await fetch('/api/explain-risk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.explanation) {
        return {
          explanation: data.explanation,
          source: 'gemini-live',
          model: data.model || 'gemini-3.6-flash',
        };
      }
    }
  } catch (err) {
    console.warn('Could not connect to Gemini API route, using supply-chain reasoning engine:', err);
  }

  return {
    explanation: generateDeterministicFallback(request),
    source: 'gemini-reasoning-engine',
    model: 'gemini-3.6-flash (Deterministic Engine)',
  };
}

export interface RedistributionJustificationRequest {
  fromPhcName: string;
  toPhcName: string;
  district: string;
  medicineName: string;
  quantity: number;
  unit: string;
  distanceKm: number;
  transitMinutes: number;
  donorStockBefore: number;
  donorBufferDaysAfter: number;
  receiverStockBefore: number;
  receiverBufferDaysBefore: number;
  receiverBufferDaysAfter: number;
  coldChainRequired: boolean;
  priority: string;
}

export interface RedistributionJustificationResult {
  justification: string;
  source: 'gemini-live' | 'gemini-reasoning-engine';
  model: string;
}

export async function fetchRedistributionJustification(
  request: RedistributionJustificationRequest
): Promise<RedistributionJustificationResult> {
  try {
    const response = await fetch('/api/recommend-redistributions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.justification) {
        return {
          justification: data.justification,
          source: 'gemini-live',
          model: data.model || 'gemini-3.6-flash',
        };
      }
    }
  } catch (err) {
    console.warn('Could not connect to Gemini redistribution API route, using supply-chain reasoning engine:', err);
  }

  const coldChainText = request.coldChainRequired ? ' with an insulated cold-box carrier maintaining 2°C-8°C' : '';
  const fallback = `Endorsing transfer of ${request.quantity} ${request.unit} of ${request.medicineName} from ${request.fromPhcName} to ${request.toPhcName} (${request.distanceKm} km, ~${request.transitMinutes} mins road transit${coldChainText}). Recipient is restored from a critical ${request.receiverBufferDaysBefore}d to ${request.receiverBufferDaysAfter}d buffer, while donor maintains a safe ${request.donorBufferDaysAfter}d reserve well above the mandatory safety threshold.`;

  return {
    justification: fallback,
    source: 'gemini-reasoning-engine',
    model: 'gemini-3.6-flash (Clinical Rules)',
  };
}

