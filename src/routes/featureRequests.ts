import { Router } from "express";
import { getDb } from "../db/client";
import { featureRequests } from "../db/schema";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth";
import crypto from "crypto";

const router = Router();

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { workspace, userId } = req as unknown as AuthenticatedRequest;
    const text = String(req.body?.text || "").trim();

    if (!text) {
      return res.status(400).json({ error: "Text is required." });
    }

    const db = getDb();
    const id = crypto.randomUUID();
    await db.insert(featureRequests).values({
      id,
      workspaceId: workspace.id,
      userId,
      text,
    });

    res.json({
      success: true,
      featureRequest: { id, workspaceId: workspace.id, userId, text },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
