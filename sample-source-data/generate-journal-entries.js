#!/usr/bin/env node
/**
 * Generates a fictional SAP-like Universal Journal (document + line items) dataset
 * for Task 0. No real company, vendor, or customer names are used.
 *
 * Run: node sample-source-data/generate-journal-entries.js
 * Output: sample-source-data/journal-entries.csv, sample-source-data/journal-entries.json
 */

const fs = require("fs");
const path = require("path");

// --- deterministic PRNG (mulberry32) so the dataset is reproducible ---
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20250601);
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const randInt = (min, max) => min + Math.floor(rnd() * (max - min + 1));
const round2 = (n) => Math.round(n * 100) / 100;
const randAmount = (min, max) => round2(min + rnd() * (max - min));

// --- fictional company ---
const COMPANY_CODE = "1000";
const COMPANY_NAME = "Nordlicht Handels GmbH"; // invented, not a real company
const CURRENCY = "EUR";

// --- chart of accounts (invented account ranges, loosely SAP-flavored) ---
const ACCOUNTS = {
  bank: [{ code: "1000", name: "Bank current account" }],
  receivable: [{ code: "1400", name: "Trade receivables domestic" }],
  payable: [{ code: "3300", name: "Trade payables domestic" }],
  taxIn: [{ code: "1576", name: "Input tax 20%" }],
  taxOut: [{ code: "1786", name: "Output tax 20%" }],
  accrual: [{ code: "3900", name: "Other accruals" }],
  asset: [
    { code: "0200", name: "Office equipment" },
    { code: "0420", name: "IT equipment" },
  ],
  revenue: [
    { code: "4000", name: "Revenue domestic 20%" },
    { code: "4010", name: "Revenue export 0%" },
    { code: "4020", name: "Revenue services" },
  ],
  expense: [
    { code: "5000", name: "Raw materials", cc: "CC-300", texts: ["Raw material purchase", "Material restock"] },
    { code: "5400", name: "Freight in", cc: "CC-300", texts: ["Freight charges inbound"] },
    { code: "6000", name: "Wages", cc: "CC-300", texts: ["Monthly wages"] },
    { code: "6010", name: "Salaries", cc: "CC-200", texts: ["Monthly salaries"] },
    { code: "6020", name: "Social security employer", cc: "CC-200", texts: ["Social security contribution"] },
    { code: "6700", name: "Rent expense", cc: "CC-500", texts: ["Office rent"] },
    { code: "6750", name: "Repairs & maintenance", cc: "CC-500", texts: ["Repair works", "Maintenance service"] },
    { code: "6800", name: "Office supplies", cc: "CC-200", texts: ["Office supplies", "Office supplies order"] },
    { code: "6810", name: "Telephone & internet", cc: "CC-400", texts: ["Telephone and internet"] },
    { code: "6820", name: "Cleaning services", cc: "CC-500", texts: ["Cleaning service"] },
    { code: "6830", name: "Software licenses", cc: "CC-400", texts: ["Software license fee"] },
    { code: "6840", name: "Travel expenses", cc: "CC-100", texts: ["Business travel"] },
    { code: "6850", name: "Vehicle expenses", cc: "CC-300", texts: ["Vehicle fleet service"] },
    { code: "6860", name: "Advertising", cc: "CC-100", texts: ["Advertising campaign"] },
    { code: "6870", name: "Legal & consulting", cc: "CC-200", texts: ["Legal consulting fee"] },
    { code: "6880", name: "Insurance", cc: "CC-200", texts: ["Insurance premium"] },
    { code: "6890", name: "Bank charges", cc: "CC-200", texts: ["Bank charges"] },
    { code: "6900", name: "Miscellaneous expenses", cc: "CC-200", texts: ["Miscellaneous expense"] },
  ],
  depreciation: [{ code: "7000", name: "Depreciation expense", cc: "CC-500" }],
};

const COST_CENTERS = ["CC-100", "CC-200", "CC-300", "CC-400", "CC-500"];
// CC-100 Sales, CC-200 Administration, CC-300 Production, CC-400 IT, CC-500 Facility

const VENDORS = [
  { id: "V-1001", name: "Alpenblick Bürobedarf GmbH", accounts: ["6800"] },
  { id: "V-1002", name: "Rheintal Reinigungsservice GmbH", accounts: ["6820"] },
  { id: "V-1003", name: "Nordpol IT Systeme GmbH", accounts: ["6830", "6810"] },
  { id: "V-1004", name: "Fixkosten Immobilien AG", accounts: ["6700"] },
  { id: "V-1005", name: "Blauwasser Spedition GmbH", accounts: ["5400"] },
  { id: "V-1006", name: "Sonnenschein Versicherung AG", accounts: ["6880"] },
  { id: "V-1007", name: "Kanzlei Berger & Partner", accounts: ["6870"] },
  { id: "V-1008", name: "Mobilcom Telekom AG", accounts: ["6810"] },
  { id: "V-1009", name: "Fuhrpark Service Weber GmbH", accounts: ["6850", "6750"] },
  { id: "V-1010", name: "MediaWerk Werbeagentur GmbH", accounts: ["6860"] },
  { id: "V-1011", name: "Kornfeld Rohstoffe GmbH", accounts: ["5000"] },
];

const CUSTOMERS = [
  { id: "C-2001", name: "Bergkristall Handels KG" },
  { id: "C-2002", name: "Seeblick Vertrieb GmbH" },
  { id: "C-2003", name: "Waldwiese Einzelhandel GmbH" },
  { id: "C-2004", name: "Feldstern Großhandel AG" },
  { id: "C-2005", name: "Talblick Export GmbH" },
];

const PERIOD_START = new Date("2025-06-01");
const PERIOD_END = new Date("2025-07-31");

function randomBusinessDate() {
  const days = Math.round((PERIOD_END - PERIOD_START) / 86400000);
  let d;
  do {
    d = new Date(PERIOD_START.getTime() + randInt(0, days) * 86400000);
  } while (d.getDay() === 0 || d.getDay() === 6); // skip weekends
  return d;
}
function fmtDate(d) {
  return d.toISOString().slice(0, 10);
}
function addDays(d, n) {
  return new Date(d.getTime() + n * 86400000);
}
function addDaysClamped(d, n) {
  const shifted = addDays(d, n);
  return shifted > PERIOD_END ? addDays(d, -n) : shifted;
}

let docSeq = 1800000001;
function nextDocId() {
  return String(docSeq++);
}

const documents = []; // each: { document_id, posting_date, lines: [...] }

function newDoc(postingDate) {
  const doc = { document_id: nextDocId(), posting_date: fmtDate(postingDate), lines: [] };
  documents.push(doc);
  return doc;
}
function addLine(doc, { gl_account, cost_center, amount, debit_credit, booking_text, vendor_id, customer_id, tax_code }) {
  doc.lines.push({
    company_code: COMPANY_CODE,
    posting_date: doc.posting_date,
    document_id: doc.document_id,
    line_id: doc.lines.length + 1,
    gl_account,
    cost_center: cost_center || "",
    amount: round2(amount),
    currency: CURRENCY,
    debit_credit,
    booking_text,
    vendor_id: vendor_id || "",
    customer_id: customer_id || "",
    tax_code: tax_code || "",
  });
}

// --- document pattern generators ---

function genVendorInvoice(date, opts) {
  opts = opts || {};
  const acc = opts.accountCode ? ACCOUNTS.expense.find((a) => a.code === opts.accountCode) : pick(ACCOUNTS.expense);
  const vendor = pick(VENDORS.filter((v) => v.accounts.includes(acc.code))) || pick(VENDORS);
  const net = randAmount(80, 4000);
  const taxCode = rnd() < 0.85 ? "V1" : "V0";
  const tax = taxCode === "V1" ? round2(net * 0.2) : 0;
  const text = opts.textOverride || pick(acc.texts);
  const doc = newDoc(date);
  addLine(doc, { gl_account: acc.code, cost_center: acc.cc, amount: net, debit_credit: "D", booking_text: text, vendor_id: vendor.id, tax_code: taxCode });
  if (tax > 0) {
    addLine(doc, { gl_account: ACCOUNTS.taxIn[0].code, amount: tax, debit_credit: "D", booking_text: `Input tax - ${text}`, vendor_id: vendor.id, tax_code: taxCode });
  }
  addLine(doc, { gl_account: ACCOUNTS.payable[0].code, amount: round2(net + tax), debit_credit: "C", booking_text: text, vendor_id: vendor.id, tax_code: taxCode });
  return doc;
}

function genVendorPayment(date, vendorId, amount, text) {
  const vendor = vendorId ? VENDORS.find((v) => v.id === vendorId) : pick(VENDORS);
  const amt = amount || randAmount(80, 4000);
  const doc = newDoc(date);
  addLine(doc, { gl_account: ACCOUNTS.payable[0].code, amount: amt, debit_credit: "D", booking_text: text || "Vendor payment", vendor_id: vendor.id });
  addLine(doc, { gl_account: ACCOUNTS.bank[0].code, amount: amt, debit_credit: "C", booking_text: text || "Vendor payment", vendor_id: vendor.id });
  return doc;
}

function genCustomerInvoice(date) {
  const customer = pick(CUSTOMERS);
  const net = randAmount(200, 6000);
  const revAcc = rnd() < 0.7 ? ACCOUNTS.revenue[0] : rnd() < 0.5 ? ACCOUNTS.revenue[1] : ACCOUNTS.revenue[2];
  const taxCode = revAcc.code === "4010" ? "A0" : "A1";
  const tax = taxCode === "A1" ? round2(net * 0.2) : 0;
  const text = `Sales invoice ${customer.name.split(" ")[0]}`;
  const doc = newDoc(date);
  addLine(doc, { gl_account: ACCOUNTS.receivable[0].code, amount: round2(net + tax), debit_credit: "D", booking_text: text, customer_id: customer.id, tax_code: taxCode });
  addLine(doc, { gl_account: revAcc.code, amount: net, debit_credit: "C", booking_text: text, customer_id: customer.id, tax_code: taxCode });
  if (tax > 0) {
    addLine(doc, { gl_account: ACCOUNTS.taxOut[0].code, amount: tax, debit_credit: "C", booking_text: `Output tax - ${text}`, customer_id: customer.id, tax_code: taxCode });
  }
  return doc;
}

function genCustomerPayment(date) {
  const customer = pick(CUSTOMERS);
  const amt = randAmount(200, 6000);
  const doc = newDoc(date);
  addLine(doc, { gl_account: ACCOUNTS.bank[0].code, amount: amt, debit_credit: "D", booking_text: "Customer payment received", customer_id: customer.id });
  addLine(doc, { gl_account: ACCOUNTS.receivable[0].code, amount: amt, debit_credit: "C", booking_text: "Customer payment received", customer_id: customer.id });
  return doc;
}

function genPayroll(date) {
  const doc = newDoc(date);
  const wages = randAmount(18000, 22000);
  const salaries = randAmount(14000, 17000);
  const socSec = round2((wages + salaries) * 0.21);
  addLine(doc, { gl_account: "6000", cost_center: "CC-300", amount: wages, debit_credit: "D", booking_text: "Monthly wages" });
  addLine(doc, { gl_account: "6010", cost_center: "CC-200", amount: salaries, debit_credit: "D", booking_text: "Monthly salaries" });
  addLine(doc, { gl_account: "6020", cost_center: "CC-200", amount: socSec, debit_credit: "D", booking_text: "Social security contribution" });
  addLine(doc, { gl_account: ACCOUNTS.bank[0].code, amount: round2(wages + salaries), debit_credit: "C", booking_text: "Payroll payment" });
  addLine(doc, { gl_account: ACCOUNTS.accrual[0].code, amount: socSec, debit_credit: "C", booking_text: "Social security accrual" });
  return doc;
}

function genRent(date) {
  const vendor = VENDORS.find((v) => v.id === "V-1004");
  const amt = randAmount(3200, 3400);
  const doc = newDoc(date);
  addLine(doc, { gl_account: "6700", cost_center: "CC-500", amount: amt, debit_credit: "D", booking_text: "Office rent", vendor_id: vendor.id });
  addLine(doc, { gl_account: ACCOUNTS.bank[0].code, amount: amt, debit_credit: "C", booking_text: "Office rent", vendor_id: vendor.id });
  return doc;
}

function genDepreciation(date) {
  const asset = pick(ACCOUNTS.asset);
  const amt = randAmount(400, 900);
  const doc = newDoc(date);
  addLine(doc, { gl_account: "7000", cost_center: "CC-500", amount: amt, debit_credit: "D", booking_text: `Depreciation - ${asset.name}` });
  addLine(doc, { gl_account: asset.code, amount: amt, debit_credit: "C", booking_text: `Depreciation - ${asset.name}` });
  return doc;
}

// --- generate the "normal" population of documents ---
const TARGET_DOCS = 190;
for (let i = 0; i < TARGET_DOCS; i++) {
  const date = randomBusinessDate();
  const r = rnd();
  if (r < 0.32) genVendorInvoice(date);
  else if (r < 0.52) genVendorPayment(date);
  else if (r < 0.77) genCustomerInvoice(date);
  else genCustomerPayment(date);
}

// recurring monthly documents: rent, payroll, depreciation (June + July)
[new Date("2025-06-01"), new Date("2025-07-01")].forEach((d) => genRent(d));
[new Date("2025-06-28"), new Date("2025-07-30")].forEach((d) => genPayroll(d));
[new Date("2025-06-30"), new Date("2025-07-31")].forEach((d) => genDepreciation(d));

// --- intentionally injected suspicious cases (for Task 2) ---
const suspiciousNotes = [];

// A) near-duplicate booking texts (typos), not necessarily financial duplicates
const typoPairs = [
  { accountCode: "6800", original: "Office supplies order", typo: "Office suplies order" },
  { accountCode: "6820", original: "Cleaning service", typo: "Cleaning servcie" },
  { accountCode: "6880", original: "Insurance premium", typo: "Insurence premium" },
];
typoPairs.forEach(({ accountCode, original, typo }) => {
  const base = genVendorInvoice(randomBusinessDate(), { accountCode, textOverride: original });
  const twin = genVendorInvoice(addDaysClamped(new Date(base.posting_date), randInt(5, 20)), { accountCode, textOverride: typo });
  suspiciousNotes.push(`Near-duplicate text: document ${twin.document_id} ("${typo}") is a typo variant of document ${base.document_id}'s "${original}".`);
});

// B) duplicate postings: same vendor + same amount, documents 1-2 days apart
for (let i = 0; i < 3; i++) {
  const original = genVendorInvoice(randomBusinessDate());
  const cloneDate = addDaysClamped(new Date(original.posting_date), randInt(1, 2));
  const clone = newDoc(cloneDate);
  original.lines.forEach((l) => addLine(clone, { ...l, gl_account: l.gl_account, cost_center: l.cost_center }));
  suspiciousNotes.push(`Possible duplicate posting: document ${clone.document_id} closely mirrors document ${original.document_id} (same vendor/amount, ${clone.posting_date} vs ${original.posting_date}).`);
}

// C) unusual combination: frequent text posted to a rare/unexpected account
for (let i = 0; i < 3; i++) {
  const doc = genVendorInvoice(randomBusinessDate());
  const expenseLine = doc.lines.find((l) => l.debit_credit === "D" && l.gl_account !== ACCOUNTS.taxIn[0].code);
  const originalAccount = expenseLine.gl_account;
  expenseLine.gl_account = "6900"; // Miscellaneous expenses - unusual target for this text
  suspiciousNotes.push(`Unusual account combination: document ${doc.document_id} posts "${expenseLine.booking_text}" (normally account ${originalAccount}) to 6900 Miscellaneous expenses instead.`);
}

// --- flatten, sort, validate ---
let lines = documents.flatMap((d) => d.lines);
lines.sort((a, b) => (a.posting_date + a.document_id).localeCompare(b.posting_date + b.document_id) || a.line_id - b.line_id);

// balance check per document
const byDoc = {};
lines.forEach((l) => {
  byDoc[l.document_id] = byDoc[l.document_id] || 0;
  byDoc[l.document_id] += l.debit_credit === "D" ? l.amount : -l.amount;
});
const unbalanced = Object.entries(byDoc).filter(([, sum]) => Math.abs(sum) > 0.01);
if (unbalanced.length > 0) {
  console.error("Unbalanced documents:", unbalanced);
  process.exit(1);
}

// --- write output ---
const outDir = __dirname;
const columns = ["company_code", "posting_date", "document_id", "line_id", "gl_account", "cost_center", "amount", "currency", "debit_credit", "booking_text", "vendor_id", "customer_id", "tax_code"];
const csvEscape = (v) => (typeof v === "string" && (v.includes(",") || v.includes('"')) ? `"${v.replace(/"/g, '""')}"` : v);
const csv = [columns.join(","), ...lines.map((l) => columns.map((c) => csvEscape(l[c])).join(","))].join("\n") + "\n";
fs.writeFileSync(path.join(outDir, "journal-entries.csv"), csv);
fs.writeFileSync(path.join(outDir, "journal-entries.json"), JSON.stringify(lines, null, 2) + "\n");

console.log(`Generated ${documents.length} documents / ${lines.length} lines.`);
console.log(`Distinct G/L accounts used: ${new Set(lines.map((l) => l.gl_account)).size}`);
console.log("\nInjected suspicious cases (ground truth, for verifying Task 2):");
suspiciousNotes.forEach((n) => console.log(" - " + n));
