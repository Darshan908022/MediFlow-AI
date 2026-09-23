import express from "express";
import { Request, Response } from "express";

const app = express();
app.use(express.json());

// ===== Your existing routes here =====
// Example:
app.post("/api/explain-risk", async (req, res) => {
  // your Gemini logic
});

app.post("/api/recommend-redistributions", async (req, res) => {
  // your Gemini logic
});

// Export for Vercel
export default app;