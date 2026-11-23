import { Router } from "express";
import { sql } from "drizzle-orm";
import { getDb } from "../db/client";

const router = Router();

router.get("/health", async (_req, res) => {
  let dbStatus = "unknown";
  try {
    const db = getDb();
    await db.execute(sql`SELECT 1`);
    dbStatus = "connected";
  } catch (err: any) {
    dbStatus = `disconnected: ${err?.message || "error"}`;
  }

  res.json({
    status: "ok",
    service: "invoice-naija-backend",
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    database: dbStatus,
  });
});

router.get("/", (_req, res) => {
  res.json({
    name: "Invoice Naija API (MySQL)",
    description: "Backend service for Invoice Naija invoicing & receipt platform",
    status: "healthy",
    endpoints: [
      "GET /health",
      "GET /api/customers",
      "POST /api/customers",
      "GET /api/documents",
      "POST /api/documents",
      "GET /api/documents/:id",
      "GET /api/settings",
      "PUT /api/settings",
      "POST /api/gemini/draft",
      "POST /api/feature-requests",
    ],
  });
});

export default router;
