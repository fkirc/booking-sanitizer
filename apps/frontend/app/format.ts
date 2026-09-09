// German-language accounting number format (thousands dot, decimal comma, trailing €)
// e.g. "115.959,85 €" — matches what AT/DE accounting software (DATEV, SAP, BMD) shows.
const eurFormatter = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

export function formatEUR(value: string | number): string {
  return eurFormatter.format(Number(value));
}
