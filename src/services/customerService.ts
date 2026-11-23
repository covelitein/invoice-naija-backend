import crypto from "crypto";
import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "../db/client";
import { customers } from "../db/schema";
import type { Customer } from "../types";

function rowToCustomer(row: typeof customers.$inferSelect): Customer {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email || undefined,
    notes: row.notes || undefined,
    documentsCount: row.documentsCount,
    owedKobo: row.owedKobo,
  };
}

export async function listWorkspaceCustomers(workspaceId: string): Promise<Customer[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(customers)
    .where(eq(customers.workspaceId, workspaceId))
    .orderBy(desc(customers.createdAt));
  return rows.map(rowToCustomer);
}

export async function upsertWorkspaceCustomer(
  workspaceId: string,
  customer: Customer,
): Promise<Customer> {
  const db = getDb();
  const existing = await db
    .select()
    .from(customers)
    .where(
      and(
        eq(customers.workspaceId, workspaceId),
        sql`lower(${customers.name}) = lower(${customer.name})`,
      ),
    )
    .limit(1);

  if (existing[0]) {
    await db
      .update(customers)
      .set({
        name: customer.name,
        phone: customer.phone,
        email: customer.email || null,
        notes: customer.notes || null,
        documentsCount: customer.documentsCount ?? existing[0].documentsCount,
        owedKobo: customer.owedKobo ?? existing[0].owedKobo,
      })
      .where(eq(customers.id, existing[0].id));

    const updated = await db
      .select()
      .from(customers)
      .where(eq(customers.id, existing[0].id))
      .limit(1);
    return rowToCustomer(updated[0]);
  }

  const id = customer.id && !customer.id.startsWith("tmp-") ? customer.id : crypto.randomUUID();
  await db.insert(customers).values({
    id,
    workspaceId,
    name: customer.name,
    phone: customer.phone,
    email: customer.email || null,
    notes: customer.notes || null,
    documentsCount: customer.documentsCount || 0,
    owedKobo: customer.owedKobo || 0,
  });

  const created = await db
    .select()
    .from(customers)
    .where(eq(customers.id, id))
    .limit(1);

  return rowToCustomer(created[0]);
}

export async function deleteWorkspaceCustomer(
  workspaceId: string,
  customerId: string,
): Promise<boolean> {
  const db = getDb();
  const existing = await db
    .select()
    .from(customers)
    .where(and(eq(customers.workspaceId, workspaceId), eq(customers.id, customerId)))
    .limit(1);

  if (!existing[0]) return false;

  await db
    .delete(customers)
    .where(and(eq(customers.workspaceId, workspaceId), eq(customers.id, customerId)));
  return true;
}
