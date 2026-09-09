// Shared endpoint schemas for the Data sources feature — used by both apps/backend and apps/frontend.

export interface ImportSummaryDto {
  id: string;
  filename: string;
  importedAt: string;
  documentCount: number;
}

export interface JournalLineDto {
  lineId: number;
  glAccount: string;
  costCenter: string | null;
  amount: string;
  currency: string;
  debitCredit: "D" | "C";
  bookingText: string;
  vendorId: string | null;
  customerId: string | null;
  taxCode: string | null;
}

export interface JournalDocumentDto {
  companyCode: string;
  documentId: string;
  postingDate: string;
  importId: string;
  lines: JournalLineDto[];
}

export interface ImportDetailDto extends ImportSummaryDto {
  documents: JournalDocumentDto[];
}

export interface TriggerImportResponseDto {
  // null when nothing new was found — no Import batch row was created.
  importId: string | null;
  documentsImported: number;
  documentsSkipped: number;
}
