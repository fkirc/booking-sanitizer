// Shared endpoint schemas for the Insights page — used by both apps/backend and apps/frontend.
// Every figure here is a direct aggregation over stored journal lines. No account
// classification (revenue/expense/asset), no ratios, no cash flow — none of that
// is modeled, so none of it is computed.

export interface TrialBalanceRowDto {
  glAccount: string;
  totalDebit: string;
  totalCredit: string;
  netBalance: string; // totalDebit - totalCredit
}

export interface BalanceIntegrityDto {
  totalDocuments: number;
  balancedDocuments: number; // recomputed live from stored lines, not trusted from import time
}

export interface CostCenterActivityRowDto {
  costCenter: string;
  totalAmount: string;
  lineCount: number;
}

export interface CounterpartyConcentrationRowDto {
  id: string;
  // Sum of postings to the payable/receivable control account only — i.e. total
  // invoiced. Excludes payment-clearing lines, so invoice and payment amounts
  // are never blended into one number.
  totalInvoiced: string;
  documentCount: number;
}

export interface InsightsDto {
  trialBalance: TrialBalanceRowDto[];
  balanceIntegrity: BalanceIntegrityDto;
  costCenterActivity: CostCenterActivityRowDto[];
  topVendors: CounterpartyConcentrationRowDto[];
  topCustomers: CounterpartyConcentrationRowDto[];
}
