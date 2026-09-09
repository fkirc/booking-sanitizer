"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { AnomaliesDto } from "@shared/anomalies";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export default function AnomaliesPage() {
  const [anomalies, setAnomalies] = useState<AnomaliesDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_URL}/anomalies`);
        if (!res.ok) throw new Error(`Backend returned ${res.status}`);
        setAnomalies(await res.json());
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
      <h1 className="text-xl font-semibold">Anomalies</h1>
      <p className="mt-1 text-xs text-gray-500">
        Booking texts differing by only 1-2 characters — possibly the same description, potentially mistyped.
      </p>

      {!anomalies || anomalies.findings.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">No suspicious booking texts found.</p>
      ) : (
        <table className="mt-4 w-full text-left text-sm">
          <thead className="text-xs text-gray-500">
            <tr>
              <th className="px-2 py-1">Text A</th>
              <th className="px-2 py-1">Text B</th>
              <th className="px-2 py-1 text-right">Text difference</th>
              <th className="px-2 py-1">Documents</th>
            </tr>
          </thead>
          <tbody>
            {anomalies.findings.map((f, i) => (
              <tr key={i} className="border-t border-gray-100">
                <td className="px-2 py-1">
                  {f.textA} <span className="text-gray-400">({f.countA})</span>
                </td>
                <td className="px-2 py-1">
                  {f.textB} <span className="text-gray-400">({f.countB})</span>
                </td>
                <td className="px-2 py-1 text-right">{f.editDistance}</td>
                <td className="px-2 py-1 font-mono text-xs">
                  {[...f.documentIdsA, ...f.documentIdsB].map((id, idx, arr) => (
                    <span key={id}>
                      <Link href={`/data-sources?document=${id}`} className="text-blue-600 underline hover:text-blue-800">
                        {id}
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
