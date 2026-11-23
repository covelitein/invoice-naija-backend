import crypto from "crypto";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../db/client";
import { documents, type DocumentLineItem } from "../db/schema";
import type { SavedDocument } from "../types";

function rowToSaved(row: typeof documents.$inferSelect): SavedDocument {
  return {
    id: row.id,
    number: row.number,
    type: row.type === "receipt" ? "receipt" : "invoice",
    customer: row.customerName,
    phone: row.phone,
    notes: row.notes || "",
    bankDetails: row.bankDetails || "",
    discountKobo: row.discountKobo,
    taxPercent: Number(row.taxPercent) || 0,
    depositKobo: row.depositKobo,
    items: (row.items || []) as DocumentLineItem[],
    totalKobo: row.totalKobo,
    balanceKobo: row.balanceKobo,
    status: row.status === "sent" ? "sent" : "draft",
    issueDate: row.issueDate,
    createdAt: row.createdAt ? row.createdAt.toISOString() : new Date().toISOString(),
  };
}

export async function listWorkspaceDocuments(workspaceId: string): Promise<SavedDocument[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(documents)
    .where(eq(documents.workspaceId, workspaceId))
    .orderBy(desc(documents.createdAt));
  return rows.map(rowToSaved);
}

export async function getWorkspaceDocument(
  workspaceId: string,
  documentId: string,
): Promise<SavedDocument | null> {
  const db = getDb();
  const rows = await db
    .select()
    .from(documents)
    .where(
      and(eq(documents.workspaceId, workspaceId), eq(documents.id, documentId)),
    )
    .limit(1);
  return rows[0] ? rowToSaved(rows[0]) : null;
}

export async function saveWorkspaceDocument(
  workspaceId: string,
  input: Omit<SavedDocument, "id" | "number" | "createdAt" | "issueDate"> & {
    id?: string;
  },
): Promise<SavedDocument> {
  const db = getDb();
  const existing = input.id
    ? await getWorkspaceDocument(workspaceId, input.id)
    : null;

  const all = await listWorkspaceDocuments(workspaceId);
  const seq = all.length + 1;
  const number =
    existing?.number ||
    `${input.type === "receipt" ? "REC" : "INV"}-${String(seq).padStart(4, "0")}`;
  const issueDate =
    existing?.issueDate ||
    new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  if (existing) {
    await db
      .update(documents)
      .set({
        type: input.type,
        customerName: input.customer,
        phone: input.phone,
        notes: input.notes,
        bankDetails: input.bankDetails,
        discountKobo: input.discountKobo,
        taxPercent: String(input.taxPercent ?? 0),
        depositKobo: 0,
        items: input.items,
        totalKobo: input.totalKobo,
        balanceKobo: input.totalKobo,
        status: input.status,
      })
      .where(
        and(
          eq(documents.workspaceId, workspaceId),
          eq(documents.id, existing.id),
        ),
      );

    const updated = await getWorkspaceDocument(workspaceId, existing.id);
    return updated!;
  }

  const id = input.id || crypto.randomUUID();
  await db.insert(documents).values({
    id,
    workspaceId,
    number,
    type: input.type,
    customerName: input.customer,
    phone: input.phone,
    notes: input.notes,
    bankDetails: input.bankDetails,
    discountKobo: input.discountKobo,
    taxPercent: String(input.taxPercent ?? 0),
    depositKobo: 0,
    items: input.items,
    totalKobo: input.totalKobo,
    balanceKobo: input.totalKobo,
    status: input.status,
    issueDate,
  });

  const created = await getWorkspaceDocument(workspaceId, id);
  return created!;
}

export async function deleteWorkspaceDocument(
  workspaceId: string,
  documentId: string,
): Promise<boolean> {
  const db = getDb();
  const existing = await db
    .select()
    .from(documents)
    .where(and(eq(documents.workspaceId, workspaceId), eq(documents.id, documentId)))
    .limit(1);

  if (!existing[0]) return false;

  await db
    .delete(documents)
    .where(and(eq(documents.workspaceId, workspaceId), eq(documents.id, documentId)));
  return true;
}
