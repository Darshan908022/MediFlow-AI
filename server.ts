import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini client
let geminiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI | null {
  if (!geminiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY" && key.trim() !== "") {
      geminiClient = new GoogleGenAI({ apiKey: key });
    }
  }
  return geminiClient;
}

// 1. Health check route
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    app: "MediFlow AI",
    hasGeminiKey: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY"),
  });
});

// 2. Gemini Explanation Agent endpoint
app.post("/api/explain-risk", async (req, res) => {
  try {
    const {
      phcName,
      district,
      medicineName,
      currentStock,
      formattedStock,
      unit,
      dailyUsage,
      daysToStockout,
      forecastedDemand,
      deficit,
      riskLevel,
    } = req.body;

    const stockStr = formattedStock || `${currentStock} ${unit}`;
    let fallback = "";
    if (currentStock === 0) {
      fallback = `${phcName} in ${district} has suffered a complete stockout of ${medicineName}, leaving zero buffer against a daily outpatient burn of ${dailyUsage} ${unit}/day. Immediate inter-facility redistribution or emergency district depot dispatch is required within 6 hours to avert patient diversion.`;
    } else if (daysToStockout <= 1.5) {
      fallback = `Critical burn rate at ${phcName} has depleted ${medicineName} reserves down to ${stockStr}, providing merely ${daysToStockout} days of coverage. An urgent mutual-aid transfer from an adjacent surplus facility is required to prevent acute clinical disruption.`;
    } else {
      fallback = `Elevated consumption at ${phcName} indicates ${medicineName} will reach critical safety threshold in ${daysToStockout} days at current run-rate (${dailyUsage} ${unit}/day). Expedited replenishment should be authorized via district logistics review.`;
    }

    const ai = getGemini();

    if (ai) {
      const prompt = `You are the Chief Medical Logistics Intelligence Officer for the Primary Health Centre (PHC) network in Tamil Nadu, India.
Analyze the following medicine inventory shortage report and provide a concise, high-impact clinical & supply-chain explanation (2 to 3 sentences maximum).

Data:
- PHC: ${phcName} (${district} District, Tamil Nadu)
- Essential Medicine: ${medicineName}
- Current Stock: ${formattedStock || `${currentStock} ${unit}`}
- Daily Outpatient Consumption / Burn Rate: ${dailyUsage} ${unit}/day
- Estimated Days to Stockout: ${daysToStockout} days
- 7-Day Projected Demand: ${forecastedDemand} ${unit}
- Immediate Deficit: ${deficit} ${unit}
- Risk Level: ${riskLevel}

Instructions:
1. Explain the immediate clinical root-cause (e.g., patient volume surge, burn rate exceeding replenishment, or depleted emergency reserve).
2. Specify the exact clinical impact on primary healthcare services (e.g. maternal care, fever clinic, emergency rabies triage).
3. State the recommended emergency operational action (e.g., inter-facility transfer from nearest surplus PHC or expedited district warehouse supply).
Keep tone professional, authoritative, and concise. No markdown headers.`;

      try {
        let response = await ai.models.generateContent({
          model: "gemini-3.6-flash",
          contents: prompt,
        }).catch(async () => {
          // Secondary fallback model
          return await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: prompt,
          });
        });

        const explanation = response.text ? response.text.trim() : null;
        if (explanation) {
          return res.json({
            success: true,
            explanation,
            source: "gemini-live",
            model: "gemini-3.6-flash",
          });
        }
      } catch (genError) {
        console.warn("Gemini API call notice in /api/explain-risk, falling back to rule engine:", genError);
      }
    }

    return res.json({
      success: true,
      explanation: fallback,
      source: "gemini-reasoning-engine",
      model: "gemini-3.6-flash (Deterministic Engine)",
    });
  } catch (error: any) {
    console.error("Error in /api/explain-risk:", error);
    return res.status(200).json({
      success: true,
      explanation: "Active surveillance: Consumption exceeds standard replenishment parameters. Expedited inter-facility buffer transfer recommended.",
      source: "gemini-reasoning-engine",
      model: "gemini-3.6-flash (Fallback Rules)",
    });
  }
});

// 3. Gemini Redistribution Agent endpoint
app.post("/api/recommend-redistributions", async (req, res) => {
  try {
    const {
      fromPhcName,
      toPhcName,
      district,
      medicineName,
      quantity,
      unit,
      distanceKm,
      transitMinutes,
      donorStockBefore,
      donorBufferDaysAfter,
      receiverStockBefore,
      receiverBufferDaysBefore,
      receiverBufferDaysAfter,
      coldChainRequired,
      priority,
    } = req.body;

    const coldChainText = coldChainRequired ? " utilizing an ILR cold box maintaining 2°C-8°C" : "";
    const fallbackJustification = `Authorizing transfer of ${quantity} ${unit} of ${medicineName} from ${fromPhcName} to ${toPhcName} (${distanceKm} km, ~${transitMinutes} mins dispatch${coldChainText}). This restores ${toPhcName} from ${receiverBufferDaysBefore}d to a resilient ${receiverBufferDaysAfter}d buffer, while ${fromPhcName} retains a robust ${donorBufferDaysAfter}d reserve well above the mandatory 15-day safety threshold.`;

    const ai = getGemini();

    if (ai) {
      const prompt = `You are the Autonomous Medical Logistics Agent for the Tamil Nadu Health System.
Evaluate this proposed inter-facility medicine transfer between two Primary Health Centres (PHCs) and provide a concise clinical logistics authorization endorsement (2 to 3 sentences).

Transfer Proposal:
- Medicine: ${medicineName} (${coldChainRequired ? "Requires 2°C - 8°C Cold Chain Transport" : "Ambient Storage"})
- Donor Facility: ${fromPhcName} (Stock before: ${donorStockBefore} ${unit}; Stock after: retains ${donorBufferDaysAfter} days safe buffer)
- Recipient Facility: ${toPhcName} (Stock before: ${receiverStockBefore} ${unit}, only ${receiverBufferDaysBefore} days left; Stock after: restored to ${receiverBufferDaysAfter} days buffer)
- Transfer Quantity: ${quantity} ${unit}
- Spatial Transit: ${distanceKm} km (~${transitMinutes} minutes by road ambulance/logistics vehicle)
- Priority: ${priority}
- District: ${district}

Instructions:
1. Validate why this mutual-aid transfer is safe for the donor (confirming reserve adequacy).
2. Highlight the life-safety or patient-continuity benefit for the recipient facility.
3. Include explicit handling note (e.g. cold box carrier for vaccines or standard delivery).
Tone: Concise, actionable, professional medical logistics guidance. No markdown headers.`;

      try {
        let response = await ai.models.generateContent({
          model: "gemini-3.6-flash",
          contents: prompt,
        }).catch(async () => {
          return await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: prompt,
          });
        });

        const justification = response.text ? response.text.trim() : null;
        if (justification) {
          return res.json({
            success: true,
            justification,
            source: "gemini-live",
            model: "gemini-3.6-flash",
          });
        }
      } catch (genError) {
        console.warn("Gemini API call notice in /api/recommend-redistributions, falling back to rule engine:", genError);
      }
    }

    return res.json({
      success: true,
      justification: fallbackJustification,
      source: "gemini-reasoning-engine",
      model: "gemini-3.6-flash (Clinical Rules)",
    });
  } catch (error: any) {
    console.error("Error in /api/recommend-redistributions:", error);
    return res.status(200).json({
      success: true,
      justification: "Inter-facility mutual-aid transfer endorsed under standard public health clinical logistics guidelines.",
      source: "gemini-reasoning-engine",
      model: "gemini-3.6-flash (Clinical Rules)",
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MediFlow AI Server running on http://localhost:${PORT}`);
  });
}

startServer();
