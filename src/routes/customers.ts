import { Router, type Request } from "express";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth";
import {
  listWorkspaceCustomers,
  upsertWorkspaceCustomer,
  deleteWorkspaceCustomer,
} from "../services/customerService";

const router = Router();

router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const { workspace } = req as unknown as AuthenticatedRequest;
    const customers = await listWorkspaceCustomers(workspace.id);
    res.json({ customers });
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { workspace } = req as unknown as AuthenticatedRequest;
    const body = req.body || {};

    const customer = await upsertWorkspaceCustomer(workspace.id, {
      id: String(body.id || `tmp-${Date.now()}`),
      name: String(body.name || "").trim(),
      phone: String(body.phone || "").trim(),
      email: body.email ? String(body.email).trim() : undefined,
      notes: body.notes ? String(body.notes).trim() : undefined,
      documentsCount: Number(body.documentsCount) || 0,
      owedKobo: Number(body.owedKobo) || 0,
    });

    res.json({ customer });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const { workspace } = req as unknown as AuthenticatedRequest;
    const success = await deleteWorkspaceCustomer(workspace.id, req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Customer not found." });
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
