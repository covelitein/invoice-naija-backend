import type { Request, Response, NextFunction } from "express";
import { ensureWorkspace } from "../services/workspaceService";
import type { AuthenticatedWorkspace } from "../types";

export interface AuthenticatedRequest extends Request {
  workspace: AuthenticatedWorkspace;
  userId: string;
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    // 1. Check custom headers (useful when frontend forwards user/workspace info)
    const headerUserId = req.headers["x-user-id"] as string | undefined;
    const headerUserEmail = req.headers["x-user-email"] as string | undefined;
    const headerUserName = req.headers["x-user-name"] as string | undefined;

    // 2. Check Authorization Bearer header
    const authHeader = req.headers.authorization;
    let tokenUserId: string | undefined;

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7).trim();
      // If token is a direct user id or simple token
      if (token && token.length > 3) {
        tokenUserId = token;
      }
    }

    // Determine effective user ID
    const effectiveUserId =
      headerUserId ||
      tokenUserId ||
      (process.env.NODE_ENV !== "production" ? "default-local-user" : undefined);

    if (!effectiveUserId) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Missing authorization or x-user-id header.",
      });
    }

    const workspace = await ensureWorkspace({
      id: effectiveUserId,
      email: headerUserEmail || "owner@example.com",
      name: headerUserName || "Business Owner",
    });

    (req as AuthenticatedRequest).workspace = workspace;
    (req as AuthenticatedRequest).userId = effectiveUserId;

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({
      error: "Authentication failed",
      message: error instanceof Error ? error.message : "Internal auth error",
    });
  }
}
