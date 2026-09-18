import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';

function geminiApiPlugin(): Plugin {
  return {
    name: 'gemini-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/api/explain-risk' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const data = JSON.parse(body || '{}');
              const apiKey = process.env.GEMINI_API_KEY;

              if (!apiKey) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(
                  JSON.stringify({
                    success: false,
                    reason: 'MISSING_API_KEY',
                    message: 'GEMINI_API_KEY is not configured in Secrets.',
                  })
                );
                return;
              }

              const { GoogleGenAI } = await import('@google/genai');
              const ai = new GoogleGenAI({ apiKey });
              const prompt = `You are the MediFlow AI Supply-Chain Intelligence Officer for Primary Health Centres (PHCs) in India.
Analyze the following critical medicine stock-out risk:
- Facility: ${data.phcName} (${data.district} District)
- Medicine: ${data.medicineName}
- Current Stock: ${data.formattedStock || data.currentStock}
- Daily Consumption Rate: ${data.dailyUsage} units/day
- Estimated Days to Stockout: ${data.daysToStockout} days
- 7-Day Forecasted Deficit: ${data.deficit} units
- Current Risk Classification: ${data.riskLevel}

Output format:
Write EXACTLY two concise sentences suitable for the District Health Officer.
Sentence 1: State the specific root cause explaining why this facility is running out of stock so rapidly relative to its daily burn rate.
Sentence 2: Recommend the immediate, actionable logistics or inter-PHC redistribution step to avoid a stock-out.
Do not include headings, bullet points, or markdown formatting. Keep it to exactly two sentences.`;

              const response = await ai.models.generateContent({
                model: 'gemini-3.6-flash',
                contents: prompt,
              }).catch(async () => {
                return await ai.models.generateContent({
                  model: 'gemini-3.8-flash',
                  contents: prompt,
                });
              });

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(
                JSON.stringify({
                  success: true,
                  explanation: response.text?.trim(),
                  model: 'gemini-3.6-flash',
                })
              );
            } catch (err: any) {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(
                JSON.stringify({
                  success: false,
                  error: err?.message || 'Failed to generate explanation',
                })
              );
            }
          });
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), geminiApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname || '.', '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
