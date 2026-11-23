import { Router } from "express";
import { generateGeminiDraft } from "../services/geminiService";
import type { Industry } from "../types";

const router = Router();

router.post("/draft", async (req, res, next) => {
  try {
    const body = req.body || {};
    const prompt = String(body.prompt || "").trim();

    if (!prompt) {
      return res.status(400).json({
        error: "Describe the invoice so Gemini can draft it.",
      });
    }

    const industry = (body.industry || "general") as Industry;
    const draft = await generateGeminiDraft(prompt, industry);

    res.json(draft);
  } catch (err) {
    next(err);
  }
});

export default router;
