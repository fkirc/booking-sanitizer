"use client";

import { useEffect, useState } from "react";
import type { InsightsDto } from "@shared/insights";
import { formatEUR } from "./format";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export default function InsightsPage() {
  const [insights, setInsights] = useState<InsightsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_URL}/insights`);
        if (!res.ok) throw new Error(`Backend returned ${res.status}`);
        setInsights(await res.json());
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to reach backend");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>;
  if (error) {
    return <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>;
  }
  if (!insights || insights.trialBalance.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        No data yet. Go to <span className="font-medium">Data sources</span> and import the sample data first.
      </p>
    );
  }

  return (
    <div className="space-y-10">
      <h1 className="text-xl font-semibold">Insights</h1>

      <Section
        title="Balance integrity"
        subtitle="Every document should have debits equal credits."
      >
        <p className="text-sm">
          <span className="font-semibold">
            {insights.balanceIntegrity.balancedDocuments} / {insights.balanceIntegrity.totalDocuments}
          </span>{" "}
          documents balance.
        </p>
      </Section>

      <Section title="Trial balance" subtitle="Sum of debits and credits per G/L account.">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-gray-500">
            <tr>
              <th className="px-2 py-1">G/L account</th>
              <th className="px-2 py-1 text-right">Total debit</th>
              <th className="px-2 py-1 text-right">Total credit</th>
              <th className="px-2 py-1 text-right">Net balance</th>
            </tr>
          </thead>
          <tbody>
            {insights.trialBalance.map((row) => (
              <tr key={row.glAccount} className="border-t border-gray-100">
                <td className="px-2 py-1 font-mono">{row.glAccount}</td>
                <td className="px-2 py-1 text-right">{formatEUR(row.totalDebit)}</td>
                <td className="px-2 py-1 text-right">{formatEUR(row.totalCredit)}</td>
                <td className="px-2 py-1 text-right font-medium">{formatEUR(row.netBalance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Activity by cost center" subtitle="Total posted amount per cost center.">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-gray-500">
            <tr>
              <th className="px-2 py-1">Cost center</th>
              <th className="px-2 py-1 text-right">Total amount</th>
              <th className="px-2 py-1 text-right">Lines</th>
            </tr>
          </thead>
          <tbody>
            {insights.costCenterActivity.map((row) => (
              <tr key={row.costCenter} className="border-t border-gray-100">
                <td className="px-2 py-1 font-mono">{row.costCenter}</td>
                <td className="px-2 py-1 text-right">{formatEUR(row.totalAmount)}</td>
                <td className="px-2 py-1 text-right">{row.lineCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        <Section title="Top vendors" subtitle="Total invoiced per vendor.">
          <ConcentrationTable rows={insights.topVendors} idLabel="Vendor" />
        </Section>
        <Section title="Top customers" subtitle="Total invoiced per customer.">
          <ConcentrationTable rows={insights.topCustomers} idLabel="Customer" />
        </Section>
      </div>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>
      <div className="mt-3 rounded border border-gray-200 bg-white p-3">{children}</div>
    </section>
  );
}

function ConcentrationTable({
  rows,
  idLabel,
}: {
  rows: InsightsDto["topVendors"];
  idLabel: string;
}) {
  return (
    <table className="w-full text-left text-sm">
      <thead className="text-xs text-gray-500">
        <tr>
          <th className="px-2 py-1">{idLabel}</th>
          <th className="px-2 py-1 text-right">Total invoiced</th>
          <th className="px-2 py-1 text-right">Documents</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id} className="border-t border-gray-100">
            <td className="px-2 py-1 font-mono">{row.id}</td>
            <td className="px-2 py-1 text-right">{formatEUR(row.totalInvoiced)}</td>
            <td className="px-2 py-1 text-right">{row.documentCount}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
