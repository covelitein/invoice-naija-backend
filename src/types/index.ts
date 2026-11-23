export type Industry =
  | "general"
  | "fashion"
  | "software"
  | "retail"
  | "construction"
  | "beauty"
  | "education"
  | "professional";

export type InvoiceTemplate = "classic" | "modern" | "minimal";
export type InvoiceFont = "sans" | "serif";
export type AiProvider = "off" | "gemini";

export type AppSettings = {
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  defaultTaxPercent: number;
  plan: "free" | "pro";
  industry: Industry;
  aiProvider: AiProvider;
  geminiEnabled: boolean;
  geminiAutoFillNotes: boolean;
  samplePackId: string | null;
  invoiceTemplate: InvoiceTemplate;
  invoiceFont: InvoiceFont;
  accentColor: string;
  logoDataUrl: string | null;
  letterheadDataUrl: string | null;
  showLetterhead: boolean;
  invoiceFooterNote: string;
};

export const defaultSettings: AppSettings = {
  businessName: "Your business",
  ownerName: "Owner",
  email: "",
  phone: "",
  bankName: "",
  accountName: "",
  accountNumber: "",
  defaultTaxPercent: 0,
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
};

export type Customer = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  documentsCount: number;
  owedKobo: number;
};

export type SavedDocument = {
  id: string;
  number: string;
  type: "invoice" | "receipt";
  customer: string;
  phone: string;
  notes: string;
  bankDetails: string;
  discountKobo: number;
  taxPercent: number;
  depositKobo: number;
  items: Array<{
    id: string;
    description: string;
    quantity: number;
    unitKobo: number;
  }>;
  totalKobo: number;
  balanceKobo: number;
  status: "draft" | "sent";
  issueDate: string;
  createdAt: string;
};

export type AuthenticatedWorkspace = {
  id: string;
  ownerUserId: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  defaultTaxPercent: string;
  plan: string;
  industry: string;
  aiProvider: string;
  geminiEnabled: boolean;
  geminiAutoFillNotes: boolean;
  samplePackId: string | null;
  invoiceTemplate: string;
  invoiceFont: string;
  accentColor: string;
  logoDataUrl: string | null;
  letterheadDataUrl: string | null;
  showLetterhead: boolean;
  invoiceFooterNote: string;
  createdAt: Date;
  updatedAt: Date;
};
