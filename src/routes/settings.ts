import { Router } from "express";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth";
import {
  updateWorkspaceSettings,
  workspaceToSettings,
} from "../services/workspaceService";

const router = Router();

router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const { workspace } = req as unknown as AuthenticatedRequest;
    res.json({
      settings: workspaceToSettings(workspace as any),
    });
  } catch (err) {
    next(err);
  }
});

router.put("/", async (req, res, next) => {
  try {
    const { workspace } = req as unknown as AuthenticatedRequest;
    const body = req.body || {};

    const updated = await updateWorkspaceSettings(workspace.id, body);
    res.json({ settings: workspaceToSettings(updated) });
  } catch (err) {
    next(err);
  }
});

export default router;
