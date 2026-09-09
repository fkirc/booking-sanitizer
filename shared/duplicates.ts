// Duplicate booking detection — documents that share the same counterparty, amount,
// direction, and set of GL accounts within a short window are almost always the same
// invoice/payment entered twice. See apps/backend/src/duplicates/duplicates.service.ts.

export interface DuplicateClusterDto {
  counterparty: string;
  amount: string;
  bookingText: string;
  glAccounts: string[];
  dayGap: number;
  documents: { documentId: string; postingDate: string }[];
}

export interface DuplicatesDto {
  clusters: DuplicateClusterDto[];
}
