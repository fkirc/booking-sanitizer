"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { DuplicatesDto } from "@shared/duplicates";
import { formatEUR } from "../format";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export default function DuplicatesPage() {
  const [duplicates, setDuplicates] = useState<DuplicatesDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_URL}/duplicates`);
        if (!res.ok) throw new Error(`Backend returned ${res.status}`);
        setDuplicates(await res.json());
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

  return (
    <div>
      <h1 className="text-xl font-semibold">Duplicates</h1>
      <p className="mt-1 text-xs text-gray-500">
        Documents sharing the same counterparty, amount, and GL accounts within a short window — possibly the same
        booking entered twice.
      </p>

      {!duplicates || duplicates.clusters.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">No potential duplicates found.</p>
      ) : (
        <table className="mt-4 w-full text-left text-sm">
          <thead className="text-xs text-gray-500">
            <tr>
              <th className="px-2 py-1">Counterparty</th>
              <th className="px-2 py-1 text-right">Amount</th>
              <th className="px-2 py-1">Text</th>
              <th className="px-2 py-1">Accounts</th>
              <th className="px-2 py-1 text-right">Day gap</th>
              <th className="px-2 py-1">Documents</th>
            </tr>
          </thead>
          <tbody>
            {duplicates.clusters.map((c, i) => (
              <tr key={i} className="border-t border-gray-100">
                <td className="px-2 py-1 font-mono">{c.counterparty}</td>
                <td className="px-2 py-1 text-right">{formatEUR(c.amount)}</td>
                <td className="px-2 py-1">{c.bookingText}</td>
                <td className="px-2 py-1 font-mono text-xs">{c.glAccounts.join(", ")}</td>
                <td className="px-2 py-1 text-right">{c.dayGap}</td>
                <td className="px-2 py-1 font-mono text-xs">
                  {c.documents.map((d, idx, arr) => (
                    <span key={d.documentId}>
                      <Link
                        href={`/data-sources?document=${d.documentId}`}
                        className="text-blue-600 underline hover:text-blue-800"
                      >
                        {d.documentId}
                      </Link>
                      {idx < arr.length - 1 ? ", " : ""}
                    </span>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
