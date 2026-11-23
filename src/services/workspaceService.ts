import crypto from "crypto";
import fs from "fs";
import path from "path";
import { eq } from "drizzle-orm";
import { getDb } from "../db/client";
import { workspaces } from "../db/schema";
import type { AppSettings, AuthenticatedWorkspace } from "../types";
import { defaultSettings } from "../types";
import { config } from "../config/env";

const DATA_DIR = path.resolve(__dirname, "../../data");
const WORKSPACES_FILE = path.join(DATA_DIR, "workspaces.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readLocalWorkspaces(): Record<string, AuthenticatedWorkspace> {
  ensureDataDir();
  try {
    if (fs.existsSync(WORKSPACES_FILE)) {
      const content = fs.readFileSync(WORKSPACES_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error("Error reading local workspaces file:", err);
  }
  return {};
}

function writeLocalWorkspaces(data: Record<string, AuthenticatedWorkspace>) {
  ensureDataDir();
  try {
    fs.writeFileSync(WORKSPACES_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing local workspaces file:", err);
  }
}

export function workspaceToSettings(row: any): AppSettings {
  return {
    businessName: row.businessName || defaultSettings.businessName,
    ownerName: row.ownerName || defaultSettings.ownerName,
    email: row.email || "",
    phone: row.phone || "",
    bankName: row.bankName || "",
    accountName: row.accountName || "",
    accountNumber: row.accountNumber || "",
    defaultTaxPercent: Number(row.defaultTaxPercent) || 0,
    plan: row.plan === "pro" ? "pro" : "free",
    industry: (row.industry as AppSettings["industry"]) || "general",
    aiProvider: row.aiProvider === "off" ? "off" : "gemini",
    geminiEnabled: Boolean(row.geminiEnabled ?? true),
    geminiAutoFillNotes: Boolean(row.geminiAutoFillNotes ?? true),
    samplePackId: row.samplePackId || null,
    invoiceTemplate:
      (row.invoiceTemplate as AppSettings["invoiceTemplate"]) || "classic",
    invoiceFont: row.invoiceFont === "serif" ? "serif" : "sans",
    accentColor: row.accentColor || defaultSettings.accentColor,
    logoDataUrl: row.logoDataUrl || null,
    letterheadDataUrl: row.letterheadDataUrl || null,
    showLetterhead: Boolean(row.showLetterhead ?? true),
    invoiceFooterNote: row.invoiceFooterNote || "",
  };
}

export async function ensureWorkspace(user: {
  id: string;
  email?: string | null;
  name?: string | null;
}): Promise<AuthenticatedWorkspace> {
  if (config.databaseUrl) {
    try {
      const db = getDb();
      const existing = await db
        .select()
        .from(workspaces)
        .where(eq(workspaces.ownerUserId, user.id))
        .limit(1);

      if (existing[0]) return existing[0] as AuthenticatedWorkspace;

      const id = crypto.randomUUID();
      await db.insert(workspaces).values({
        id,
        ownerUserId: user.id,
        email: user.email || "",
        ownerName: user.name || "Owner",
        businessName: user.name ? `${user.name}'s business` : "Your business",
      });

      const created = await db
        .select()
        .from(workspaces)
        .where(eq(workspaces.id, id))
        .limit(1);

      return created[0] as AuthenticatedWorkspace;
    } catch (err) {
      console.warn("Database query failed, using persistent file storage:", err);
    }
  }

  // File-based persistence
  const localMap = readLocalWorkspaces();
  let found = Object.values(localMap).find((w) => w.ownerUserId === user.id);
  if (!found) {
    const id = crypto.randomUUID();
    found = {
      id,
      ownerUserId: user.id,
      email: user.email || "",
      ownerName: user.name || "Owner",
      businessName: user.name ? `${user.name}'s business` : "Your business",
      phone: "",
      bankName: "",
      accountName: "",
      accountNumber: "",
      defaultTaxPercent: "0.00",
      plan: "free",
      industry: "general",
      aiProvider: "gemini",
      geminiEnabled: true,
      geminiAutoFillNotes: true,
      samplePackId: null,
      invoiceTemplate: "classic",
      invoiceFont: "sans",
      accentColor: "#1f8f4e",
      logoDataUrl: null,
      letterheadDataUrl: null,
      showLetterhead: true,
      invoiceFooterNote: "",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    localMap[id] = found;
    writeLocalWorkspaces(localMap);
  }

  return found;
}

export async function getWorkspaceForUser(userId: string) {
  if (config.databaseUrl) {
    try {
      const db = getDb();
      const rows = await db
        .select()
        .from(workspaces)
        .where(eq(workspaces.ownerUserId, userId))
        .limit(1);
      if (rows[0]) return rows[0];
    } catch (err) {
      console.warn("Database lookup error:", err);
    }
  }

  const localMap = readLocalWorkspaces();
  return Object.values(localMap).find((w) => w.ownerUserId === userId) ?? null;
}

export async function updateWorkspaceSettings(
  workspaceId: string,
  settings: Partial<AppSettings>,
): Promise<any> {
  if (config.databaseUrl) {
    try {
      const db = getDb();
      await db
        .update(workspaces)
        .set({
          businessName: settings.businessName,
          ownerName: settings.ownerName,
          email: settings.email,
          phone: settings.phone,
          bankName: settings.bankName,
          accountName: settings.accountName,
          accountNumber: settings.accountNumber,
          defaultTaxPercent:
            settings.defaultTaxPercent !== undefined
              ? String(settings.defaultTaxPercent)
              : undefined,
          plan: settings.plan,
          industry: settings.industry,
          aiProvider: settings.aiProvider,
          geminiEnabled: settings.geminiEnabled,
          geminiAutoFillNotes: settings.geminiAutoFillNotes,
          samplePackId: settings.samplePackId,
          invoiceTemplate: settings.invoiceTemplate,
          invoiceFont: settings.invoiceFont,
          accentColor: settings.accentColor,
          logoDataUrl: settings.logoDataUrl,
          letterheadDataUrl: settings.letterheadDataUrl,
          showLetterhead: settings.showLetterhead,
          invoiceFooterNote: settings.invoiceFooterNote,
        })
        .where(eq(workspaces.id, workspaceId));

      const rows = await db
        .select()
        .from(workspaces)
        .where(eq(workspaces.id, workspaceId))
        .limit(1);

      if (rows[0]) return rows[0];
    } catch (err) {
      console.warn("MySQL update error, persisting locally:", err);
    }
  }

  // Persistent file update
  const localMap = readLocalWorkspaces();
  const current = localMap[workspaceId] || (await ensureWorkspace({ id: "default-local-user" }));
  const updated = {
    ...current,
    ...settings,
    defaultTaxPercent:
      settings.defaultTaxPercent !== undefined
        ? String(settings.defaultTaxPercent)
        : current.defaultTaxPercent,
    updatedAt: new Date(),
  };

  localMap[workspaceId] = updated;
  writeLocalWorkspaces(localMap);
  return updated;
}
