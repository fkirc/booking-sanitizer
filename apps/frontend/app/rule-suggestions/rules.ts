// Hardcoded booking-manual rule suggestions, mined once from sample-source-data/journal-entries.json.
// See README.md "Shortcuts taken" — a real MVP would derive these live, not hardcode them.

export interface RuleExample {
  documentId: string;
  detail: string;
}

export interface RuleCheck {
  title: string;
  statement: string;
  support: string;
  evidence: RuleExample[];
  violations?: RuleExample[];
  explanation: string;
}

export const RULE_CHECKS: RuleCheck[] = [
  {
    title: "Tax accounts carry a single tax code",
    statement: "Accounts 1576, 1786, 4000, 4010 and 4020 each post with exactly one tax code, every time.",
    support: "154 / 154 postings across these 5 accounts (100%)",
    evidence: [
      { documentId: "1800000133", detail: "1576 — tax code V1" },
      { documentId: "1800000118", detail: "1786 / 4000 — tax code A1" },
      { documentId: "1800000159", detail: "4010 — tax code A0" },
      { documentId: "1800000117", detail: "4020 — tax code A1" },
    ],
    explanation: "Each of these accounts only ever appears with one specific tax code in the whole dataset — a posting with a different code would be a strong miscoding signal.",
  },
  {
    title: "Tax code marks the invoice side, not the payment side",
    statement:
      "On control accounts 1400 (receivable) and 3300 (payable), the invoice-side posting always carries a tax code; the payment-clearing posting never does.",
    support: "205 / 205 postings on 1400 and 3300 (100%)",
    evidence: [
      { documentId: "1800000118", detail: "1400 debit, tax A1 — invoice" },
      { documentId: "1800000136", detail: "1400 credit, no tax — payment received" },
      { documentId: "1800000133", detail: "3300 credit, tax V1 — invoice" },
      { documentId: "1800000013", detail: "3300 debit, no tax — payment made" },
    ],
    explanation: "Invoicing and paying are opposite postings on the same control account; only the invoice leg carries VAT, so a tax code on a clearing line (or a missing one on an invoice line) might be a red flag.",
  },
  {
    title: "Each expense account has one home cost center",
    statement: "Every opex (6xxx) account observed maps to exactly one cost center — except 6900.",
    support: "29 / 29 postings on 6010, 6800, 6820, 6850 (100%)",
    evidence: [
      { documentId: "1800000111", detail: "6010 — always CC-200" },
      { documentId: "1800000052", detail: "6800 — always CC-200" },
      { documentId: "1800000184", detail: "6820 — always CC-500" },
      { documentId: "1800000095", detail: "6850 — always CC-300" },
    ],
    explanation: "A stable account-to-cost-center mapping means a posting on a new cost center for one of these accounts is very likely a data-entry mistake, not a new legitimate case.",
  },
  {
    title: "Recurring vendor postings keep the same account",
    statement:
      "The same vendor + booking text combination recurs across both months of the period on the same GL account and cost center.",
    support: "e.g. 6 / 6 for V-1002 \"Cleaning service\", 6 / 6 for V-1009 \"Vehicle fleet service\"",
    evidence: [
      { documentId: "1800000184", detail: "V-1002, Cleaning service — 6820 / CC-500" },
      { documentId: "1800000114", detail: "V-1002, Cleaning service — 6820 / CC-500" },
      { documentId: "1800000095", detail: "V-1009, Vehicle fleet service — 6850 / CC-300" },
      { documentId: "1800000030", detail: "V-1009, Vehicle fleet service — 6850 / CC-300" },
    ],
    explanation: "Vendor relationships repeat monthly with a fixed coding — a good default suggestion for auto-completing new postings from the same vendor.",
  },
  {
    title: "Payment-clearing postings use a dedicated text and carry no cost center or tax code",
    statement: "\"Vendor payment\" and \"Customer payment received\" postings never have a cost center or tax code.",
    support: "158 / 158 postings with these texts (100%)",
    evidence: [
      { documentId: "1800000013", detail: "Vendor payment — no cost center, no tax code" },
      { documentId: "1800000136", detail: "Customer payment received — no cost center, no tax code" },
    ],
    explanation: "Payments only move cash and clear a control account — they carry none of the dimensions an invoice line needs, so any tax code or cost center on one of these would be suspicious.",
  },
  {
    title: "Suspicious: a booking text posted to the wrong account",
    statement:
      "Each recurring booking text is normally posted to one specific expense account by its vendor. Three postings instead used account 6900 (Miscellaneous expense).",
    support: "3 exceptions found",
    evidence: [
      { documentId: "1800000007", detail: "V-1010, Advertising campaign — usually 6860 / CC-100" },
      { documentId: "1800000025", detail: "V-1009, Vehicle fleet service — usually 6850 / CC-300" },
      { documentId: "1800000146", detail: "V-1007, Legal consulting fee — usually 6870 / CC-200" },
    ],
    violations: [
      { documentId: "1800000211", detail: "V-1010, Advertising campaign — posted to 6900 instead of 6860" },
      { documentId: "1800000209", detail: "V-1009, Vehicle fleet service — posted to 6900 instead of 6850" },
      { documentId: "1800000210", detail: "V-1007, Legal consulting fee — posted to 6900 instead of 6870" },
    ],
    explanation: "Same vendor, same cost center, same kind of expense — only the GL account changed to the catch-all 6900. That's a potential sign of someone picking the wrong account.",
  },
];
