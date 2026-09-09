// Booking-text anomaly detection — pairs of distinct booking texts that differ by
// only 1-2 characters are almost always the same description, mistyped, rather
// than a genuinely different transaction. See apps/backend/src/anomalies/anomalies.service.ts.

export interface AnomalyFindingDto {
  textA: string;
  textB: string;
  countA: number;
  countB: number;
  editDistance: number;
  documentIdsA: string[];
  documentIdsB: string[];
}

export interface AnomaliesDto {
  findings: AnomalyFindingDto[];
}
