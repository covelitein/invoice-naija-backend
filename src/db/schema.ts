import {
  boolean,
  decimal,
  index,
  int,
  json,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const workspaces = mysqlTable(
  "workspaces",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    ownerUserId: varchar("owner_user_id", { length: 255 }).notNull().unique(),
    businessName: varchar("business_name", { length: 255 }).notNull().default("Your business"),
    ownerName: varchar("owner_name", { length: 255 }).notNull().default("Owner"),
    email: varchar("email", { length: 255 }).notNull().default(""),
    phone: varchar("phone", { length: 50 }).notNull().default(""),
    bankName: varchar("bank_name", { length: 255 }).notNull().default(""),
    accountName: varchar("account_name", { length: 255 }).notNull().default(""),
    accountNumber: varchar("account_number", { length: 50 }).notNull().default(""),
    defaultTaxPercent: decimal("default_tax_percent", {
      precision: 5,
      scale: 2,
    })
      .notNull()
      .default("0.00"),
    plan: varchar("plan", { length: 50 }).notNull().default("free"),
    industry: varchar("industry", { length: 50 }).notNull().default("general"),
    aiProvider: varchar("ai_provider", { length: 50 }).notNull().default("gemini"),
    geminiEnabled: boolean("gemini_enabled").notNull().default(true),
    geminiAutoFillNotes: boolean("gemini_auto_fill_notes").notNull().default(true),
    samplePackId: varchar("sample_pack_id", { length: 100 }),
    invoiceTemplate: varchar("invoice_template", { length: 50 }).notNull().default("classic"),
    invoiceFont: varchar("invoice_font", { length: 50 }).notNull().default("sans"),
    accentColor: varchar("accent_color", { length: 50 }).notNull().default("#1f8f4e"),
    logoDataUrl: text("logo_data_url"),
    letterheadDataUrl: text("letterhead_data_url"),
    showLetterhead: boolean("show_letterhead").notNull().default(true),
    invoiceFooterNote: text("invoice_footer_note"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  },
);

export const customers = mysqlTable(
  "customers",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    workspaceId: varchar("workspace_id", { length: 36 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 50 }).notNull(),
    email: varchar("email", { length: 255 }),
    notes: text("notes"),
    documentsCount: int("documents_count").notNull().default(0),
    owedKobo: int("owed_kobo").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  },
  (table) => [
    index("customers_workspace_idx").on(table.workspaceId),
  ],
);

export type DocumentLineItem = {
  id: string;
  description: string;
  quantity: number;
  unitKobo: number;
};

export const documents = mysqlTable(
  "documents",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    workspaceId: varchar("workspace_id", { length: 36 }).notNull(),
    customerId: varchar("customer_id", { length: 36 }),
    number: varchar("number", { length: 100 }).notNull(),
    type: varchar("type", { length: 50 }).notNull(),
    customerName: varchar("customer_name", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 50 }).notNull(),
    notes: text("notes"),
    bankDetails: text("bank_details"),
    discountKobo: int("discount_kobo").notNull().default(0),
    taxPercent: decimal("tax_percent", { precision: 5, scale: 2 })
      .notNull()
      .default("0.00"),
    depositKobo: int("deposit_kobo").notNull().default(0),
    items: json("items").$type<DocumentLineItem[]>().notNull(),
    totalKobo: int("total_kobo").notNull().default(0),
    balanceKobo: int("balance_kobo").notNull().default(0),
    status: varchar("status", { length: 50 }).notNull().default("draft"),
    issueDate: varchar("issue_date", { length: 50 }).notNull(),
    dueDate: varchar("due_date", { length: 50 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  },
  (table) => [
    uniqueIndex("documents_workspace_number_uidx").on(
      table.workspaceId,
      table.number,
    ),
    index("documents_workspace_created_idx").on(
      table.workspaceId,
      table.createdAt,
    ),
  ],
);

export const featureRequests = mysqlTable("feature_requests", {
  id: varchar("id", { length: 36 }).primaryKey(),
  workspaceId: varchar("workspace_id", { length: 36 }),
  userId: varchar("user_id", { length: 255 }),
  text: text("text").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
