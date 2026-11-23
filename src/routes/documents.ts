import { Router } from "express";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth";
import {
  listWorkspaceDocuments,
  getWorkspaceDocument,
  saveWorkspaceDocument,
  deleteWorkspaceDocument,
} from "../services/documentService";

const router = Router();

router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const { workspace } = req as unknown as AuthenticatedRequest;
    const documents = await listWorkspaceDocuments(workspace.id);
    res.json({ documents });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const { workspace } = req as unknown as AuthenticatedRequest;
    const document = await getWorkspaceDocument(workspace.id, req.params.id);
    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }
    res.json({ document });
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { workspace } = req as unknown as AuthenticatedRequest;
    const body = req.body || {};

    const saved = await saveWorkspaceDocument(workspace.id, {
      id: body.id,
      type: body.type === "receipt" ? "receipt" : "invoice",
      customer: String(body.customer || "").trim(),
      phone: String(body.phone || "").trim(),
      notes: String(body.notes || ""),
      bankDetails: String(body.bankDetails || ""),
      discountKobo: Number(body.discountKobo) || 0,
      taxPercent: Number(body.taxPercent) || 0,
      depositKobo: 0,
      items: Array.isArray(body.items) ? body.items : [],
      totalKobo: Number(body.totalKobo) || 0,
      balanceKobo: Number(body.totalKobo) || 0,
      status: body.status === "sent" ? "sent" : "draft",
    });

    res.json({ document: saved });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const { workspace } = req as unknown as AuthenticatedRequest;
    const success = await deleteWorkspaceDocument(workspace.id, req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Document not found." });
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
