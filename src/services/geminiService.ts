import type { Industry } from "../types";
import { config } from "../config/env";

export type GeminiDraftLine = {
  description: string;
  quantity: number;
  unitNaira: number;
};

export type GeminiDraftResult = {
  source: "gemini" | "local";
  type: "invoice" | "receipt";
  customerName: string;
  phone?: string;
  notes?: string;
  discountNaira: number;
  taxPercent: number;
  depositNaira: number;
  items: GeminiDraftLine[];
  summary: string;
};

type Phase = { label: string; weight: number };

const PHASES: Record<Exclude<Industry, "general"> | "project", Phase[]> = {
  software: [
    { label: "Core Platform Setup & Discovery Workshop", weight: 0.15 },
    { label: "UI/UX Design & User Role Provisioning", weight: 0.15 },
    { label: "Core Platform Licensing & Implementation", weight: 0.35 },
    { label: "Integration, Module Setup & Testing", weight: 0.20 },
    { label: "Staff Training & 60-day Support SLA", weight: 0.15 },
  ],
  fashion: [
    { label: "Fabric Consultation & Measurement", weight: 0.15 },
    { label: "Bespoke Pattern Drafting & Cutting", weight: 0.35 },
    { label: "Construction, Embroidery & Fitting", weight: 0.30 },
    { label: "Hand Finishing, Pressing & Packaging", weight: 0.20 },
  ],
  retail: [
    { label: "Primary Inventory / Product Supply", weight: 0.70 },
    { label: "Protective Packaging & Branding", weight: 0.10 },
    { label: "Express Logistics & Doorstep Delivery", weight: 0.20 },
  ],
  construction: [
    { label: "Site Mobilization & Demarcation", weight: 0.15 },
    { label: "Building Materials & Structural Supplies", weight: 0.40 },
    { label: "Skilled Labour, Fabrication & Installation", weight: 0.35 },
    { label: "Finishing, Clean-up & Project Handover", weight: 0.10 },
  ],
  beauty: [
    { label: "Primary Beauty / Glam Service Package", weight: 0.50 },
    { label: "Specialty Products, Hair & Accessories", weight: 0.30 },
    { label: "Session Booking & Finishing Touch Fee", weight: 0.20 },
  ],
  education: [
    { label: "Tuition / Institutional Subscription Fee", weight: 0.60 },
    { label: "Curriculum Materials & Digital Course Packs", weight: 0.25 },
    { label: "Student Registration, Portal & Admin Setup", weight: 0.15 },
  ],
  professional: [
    { label: "Initial Scoping & Business Diagnostic", weight: 0.20 },
    { label: "Strategic Advisory & Execution Deliverables", weight: 0.50 },
    { label: "Documentation, Regulatory Filing & Handover", weight: 0.30 },
  ],
  project: [
    { label: "Initial Requirements & Architecture Planning", weight: 0.20 },
    { label: "Core Implementation & Development", weight: 0.45 },
    { label: "Testing, Revisions & Configuration", weight: 0.20 },
    { label: "Deployment, Training & Handover SLA", weight: 0.15 },
  ],
};

const DEFAULT_MODELS = [
  "gemini-2.5-flash",
  "gemini-1.5-flash",
  "gemini-2.0-flash",
  "gemini-3.1-flash-lite",
];

export function sanitizeOptionalPhone(raw: string | undefined | null): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  if (!trimmed || /^n\/?a$/i.test(trimmed) || trimmed === "-") return "";
  return trimmed;
}

export function geminiSystemPrompt(industry: Industry): string {
  return [
    "You are an expert Nigerian commercial billing specialist drafting professional invoices and receipts for InvoiceNaija.",
    "Output MUST be strict JSON with no markdown fences, no explanatory text, and keys matching the schema exactly.",
    `The user's business industry is: "${industry}". Tailor line items, terminology, and payment terms to Nigerian commerce conventions.`,
    "",
    "CRITICAL REQUIREMENT - STARTER BREAKDOWN OF LINE ITEMS:",
    "- You MUST ALWAYS provide a comprehensive, multi-line starter breakdown consisting of 3 to 6 distinct, professional line items.",
    "- NEVER return a single plain or vague lump-sum line item (such as 'Platform Subscription and Implementation ₦1,200,000' or 'Project Fee ₦1,000,000').",
    "- Even if the user prompt only mentions a single title or high-level package, YOU MUST decompose it into realistic constituent milestones or components.",
    "Examples of mandatory breakdown by domain:",
    "  * Software/EdTech/Tech: (1) Core Platform License & Workspace Setup, (2) User Management & Role Configuration, (3) Custom Modules & Data Migration, (4) User & Admin Training Workshops, (5) Post-deployment Support & Maintenance (SLA).",
    "  * Fashion: (1) Fabric Sourcing & Inspection, (2) Bespoke Pattern Design & Cutting, (3) Construction & Embroidery / Embellishment, (4) Fitting, Alteration & Final Pressing.",
    "  * Construction/Artisans: (1) Site Mobilization & Safety Setup, (2) Primary Materials & Supplies, (3) Skilled Fabrication & Labour, (4) Finishing, Quality Inspection & Site Cleanup.",
    "  * Retail/Trading: Itemize by individual products/cartons/SKUs with realistic quantities and unit prices, plus delivery/logistics.",
    "  * Professional/Consulting: (1) Initial Diagnostic & Scoping Review, (2) Core Advisory & Strategic Execution, (3) Deliverable Documentation & CAC/Regulatory Support, (4) Review & Executive Presentation.",
    "  * Beauty/Wellness: Itemize core service package, premium product add-ons, and booking/finishing fees.",
    "- The sum of (quantity * unitNaira) across all line items must equal the total budget mentioned by the user.",
    "- Amounts must be in whole Naira (integers).",
    "- Always set depositNaira to 0 (InvoiceNaija bills the full amount due; payment terms or mobilization advances go into notes).",
    "- Tax (VAT): set taxPercent to 7.5 if VAT/tax is mentioned or if standard for B2B corporate contracts, otherwise 0.",
    "",
    "Schema:",
    JSON.stringify(
      {
        type: "invoice or receipt",
        customerName: "string",
        phone: "string or empty",
        notes: "string payment terms or delivery notes",
        discountNaira: 0,
        taxPercent: 0,
        depositNaira: 0,
        items: [
          {
            description: "string",
            quantity: 1,
            unitNaira: 50000,
          },
        ],
        summary: "One short sentence summarizing the draft",
      },
      null,
      2,
    ),
  ].join("\n");
}

export function isUsableGeminiDraft(val: unknown): val is GeminiDraftResult {
  if (!val || typeof val !== "object") return false;
  const obj = val as Record<string, unknown>;
  return (
    (obj.type === "invoice" || obj.type === "receipt") &&
    typeof obj.customerName === "string" &&
    Array.isArray(obj.items) &&
    obj.items.length > 0
  );
}

function autoBreakdownSingleItem(
  single: GeminiDraftLine,
  industry: Industry,
  prompt: string,
): GeminiDraftLine[] {
  const total = single.quantity * single.unitNaira;
  if (total <= 0) return [single];

  const lower = `${prompt} ${single.description}`.toLowerCase();

  if (
    lower.includes("edtech") ||
    lower.includes("software") ||
    lower.includes("app") ||
    lower.includes("platform") ||
    lower.includes("website") ||
    industry === "software"
  ) {
    return [
      {
        description: `${single.description} - Core Platform License & Initial Setup`,
        quantity: 1,
        unitNaira: Math.round(total * 0.4),
      },
      {
        description: "Custom Configuration, Module Setup & User Provisioning",
        quantity: 1,
        unitNaira: Math.round(total * 0.25),
      },
      {
        description: "Data Integration, Content Deployment & Security Testing",
        quantity: 1,
        unitNaira: Math.round(total * 0.2),
      },
      {
        description: "Staff Onboarding Training & 60-day Technical Support SLA",
        quantity: 1,
        unitNaira: Math.round(total * 0.15),
      },
    ];
  }

  if (
    lower.includes("cloth") ||
    lower.includes("dress") ||
    lower.includes("tailor") ||
    lower.includes("fashion") ||
    industry === "fashion"
  ) {
    return [
      {
        description: "Premium Fabric Consultation & Sourcing",
        quantity: 1,
        unitNaira: Math.round(total * 0.35),
      },
      {
        description: "Pattern Drafting, Cutting & Bespoke Tailoring",
        quantity: 1,
        unitNaira: Math.round(total * 0.4),
      },
      {
        description: "Hand Finishing, Fitting Alterations & Luxury Packaging",
        quantity: 1,
        unitNaira: Math.round(total * 0.25),
      },
    ];
  }

  if (
    lower.includes("build") ||
    lower.includes("renovat") ||
    lower.includes("construct") ||
    industry === "construction"
  ) {
    return [
      {
        description: "Site Mobilization & Surface Preparation",
        quantity: 1,
        unitNaira: Math.round(total * 0.15),
      },
      {
        description: "Direct Materials & Quality Hardware Supplies",
        quantity: 1,
        unitNaira: Math.round(total * 0.45),
      },
      {
        description: "Skilled Labour, Fabrication & Installation",
        quantity: 1,
        unitNaira: Math.round(total * 0.3),
      },
      {
        description: "Final Inspection, Detailing & Site Handover",
        quantity: 1,
        unitNaira: Math.round(total * 0.1),
      },
    ];
  }

  // General professional services breakdown
  return [
    {
      description: `${single.description} - Scoping & Strategy Setup`,
      quantity: 1,
      unitNaira: Math.round(total * 0.25),
    },
    {
      description: `${single.description} - Primary Delivery & Implementation`,
      quantity: 1,
      unitNaira: Math.round(total * 0.5),
    },
    {
      description: "Review, Quality Assurance & Handover Documentation",
      quantity: 1,
      unitNaira: Math.round(total * 0.25),
    },
  ];
}

export function normalizeGeminiDraft(
  parsed: any,
  prompt: string,
  industry: Industry,
): GeminiDraftResult {
  let items: GeminiDraftLine[] = Array.isArray(parsed.items)
    ? parsed.items.map((it: any) => ({
        description: String(it.description || "Service item").trim(),
        quantity: Math.max(1, Number(it.quantity) || 1),
        unitNaira: Math.max(0, Number(it.unitNaira) || 0),
      }))
    : [];

  // Guarantee starter breakdown if only a single line item is returned
  if (items.length === 1 && items[0].unitNaira >= 5000) {
    items = autoBreakdownSingleItem(items[0], industry, prompt);
  }

  return {
    source: "gemini",
    type: parsed.type === "receipt" ? "receipt" : "invoice",
    customerName: String(parsed.customerName || "Customer").trim(),
    phone: sanitizeOptionalPhone(parsed.phone),
    notes: String(parsed.notes || "").trim(),
    discountNaira: Number(parsed.discountNaira) || 0,
    taxPercent: Number(parsed.taxPercent) || 0,
    depositNaira: 0,
    items,
    summary: String(parsed.summary || "Drafted via Gemini AI with starter breakdown"),
  };
}

export function draftInvoiceLocally(
  prompt: string,
  industry: Industry,
): GeminiDraftResult {
  const isReceipt = /receipt|paid|received/i.test(prompt);
  const phases =
    industry in PHASES
      ? PHASES[industry as Exclude<Industry, "general">]
      : PHASES.project;

  const baseTotal = 150000;
  const items: GeminiDraftLine[] = phases.map((phase) => ({
    description: phase.label,
    quantity: 1,
    unitNaira: Math.round(baseTotal * phase.weight),
  }));

  return {
    source: "local",
    type: isReceipt ? "receipt" : "invoice",
    customerName: "Valued Customer",
    phone: "",
    notes: "Thank you for your business. Payment due as agreed.",
    discountNaira: 0,
    taxPercent: 0,
    depositNaira: 0,
    items,
    summary: `Structured local starter breakdown based on ${industry} industry standards.`,
  };
}

export async function generateGeminiDraft(
  prompt: string,
  industry: Industry = "general",
): Promise<GeminiDraftResult & { notice?: string }> {
  const apiKey = config.geminiApiKey;
  if (!apiKey) {
    const local = draftInvoiceLocally(prompt, industry);
    return {
      ...local,
      notice:
        "GEMINI_API_KEY is not set on the backend. Local smart draft used. Add the key in Render environment variables to activate live Gemini AI.",
    };
  }

  const preferred = config.geminiModel;
  const models = preferred
    ? [preferred, ...DEFAULT_MODELS.filter((m) => m !== preferred)]
    : DEFAULT_MODELS;

  let lastError = "Gemini request failed.";

  for (const model of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: `${geminiSystemPrompt(industry)}\n\nDraft invoice with a detailed starter breakdown from this note:\n${prompt}`,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.35,
              responseMimeType: "application/json",
            },
          }),
        },
      );

      const payload = (await response.json()) as any;
      if (!response.ok) {
        lastError = payload?.error?.message || `HTTP ${response.status}`;
        continue;
      }

      const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) continue;

      const parsed = JSON.parse(text);
      if (!isUsableGeminiDraft(parsed)) continue;

      return normalizeGeminiDraft(parsed, prompt, industry);
    } catch (err: any) {
      lastError = err?.message || "Connection error";
    }
  }

  const fallback = draftInvoiceLocally(prompt, industry);
  return {
    ...fallback,
    notice: `${lastError} Local template used instead.`,
  };
}
