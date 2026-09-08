# Data assumptions

Fictional company (Nordlicht Handels GmbH). Invented vendors/customers, no real company.

- Account ranges invented: 1000s bank/receivables/tax, 3000s payables/accruals, 4000s revenue, 5000s cost of materials, 6000s opex, 7000 depreciation.
- `cost_center` only on P&L lines.
- Period: 2025-06-01 to 2025-07-31.

## Injected suspicious cases

- Typo near-duplicates: 1800000197/198, 199/200, 201/202
- Duplicate postings: 1800000203/204, 205/206, 207/208
- Unusual account (→ 6900): 1800000209, 210, 211
