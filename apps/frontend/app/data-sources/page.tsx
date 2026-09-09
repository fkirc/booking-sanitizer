"use client";

import { Fragment, useEffect, useState } from "react";
import type { ImportDetailDto, ImportSummaryDto, TriggerImportResponseDto } from "@shared/data-sources";
import { formatEUR } from "../format";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export default function DataSourcesPage() {
  const [imports, setImports] = useState<ImportSummaryDto[]>([]);
  const [details, setDetails] = useState<Record<string, ImportDetailDto>>({});
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastImportResult, setLastImportResult] = useState<TriggerImportResponseDto | null>(null);

  async function loadImports() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/data-sources/imports`);
      if (!res.ok) throw new Error(`Backend returned ${res.status}`);
      setImports(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to reach backend");
    } finally {
      setLoading(false);
    }
  }

  async function loadDetail(id: string) {
    if (details[id]) return;
    const res = await fetch(`${API_URL}/data-sources/imports/${id}`);
    if (!res.ok) return;
    const detail: ImportDetailDto = await res.json();
    setDetails((prev) => ({ ...prev, [id]: detail }));
  }

  async function triggerImport() {
    setImporting(true);
    setError(null);
    setLastImportResult(null);
    try {
      const res = await fetch(`${API_URL}/data-sources/import`, { method: "POST" });
      if (!res.ok) throw new Error(`Backend returned ${res.status}`);
      const result: TriggerImportResponseDto = await res.json();
      setLastImportResult(result);
      await loadImports();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }

  useEffect(() => {
    loadImports();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Data sources</h1>
        <button
          onClick={triggerImport}
          disabled={importing}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {importing ? "Importing…" : "Import sample data"}
        </button>
      </div>

      {error && (
        <p className="mt-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {lastImportResult && (
        <p className="mt-4 rounded border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600">
          {lastImportResult.documentsImported === 0
            ? `Nothing new to import — all ${lastImportResult.documentsSkipped} documents already present.`
            : `Imported ${lastImportResult.documentsImported} new document${lastImportResult.documentsImported === 1 ? "" : "s"}${lastImportResult.documentsSkipped > 0 ? ` (${lastImportResult.documentsSkipped} already present, skipped)` : ""}.`}
        </p>
      )}

      {loading ? (
        <p className="mt-6 text-sm text-gray-500">Loading…</p>
      ) : imports.length === 0 ? (
        <p className="mt-6 text-sm text-gray-500">No imports yet. Click "Import sample data" to get started.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {imports.map((imp) => (
            <details
              key={imp.id}
              className="rounded border border-gray-200 bg-white"
              onToggle={(e) => e.currentTarget.open && loadDetail(imp.id)}
            >
              <summary className="cursor-pointer px-4 py-3 text-sm">
                <span className="font-medium">{imp.filename}</span>{" "}
                <span className="text-gray-500">
                  — {imp.documentCount} document{imp.documentCount === 1 ? "" : "s"} — imported{" "}
                  {new Date(imp.importedAt).toLocaleString()}
                </span>
              </summary>
              <div className="border-t border-gray-100 px-4 py-3">
                {details[imp.id] ? (
                  <DocumentTable importDetail={details[imp.id]} />
                ) : (
                  <p className="text-sm text-gray-500">Loading documents…</p>
                )}
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}

function DocumentTable({ importDetail }: { importDetail: ImportDetailDto }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <table className="w-full text-left text-sm">
      <thead className="text-xs text-gray-500">
        <tr>
          <th className="px-2 py-1">Document</th>
          <th className="px-2 py-1">Posting date</th>
          <th className="px-2 py-1 text-right">Lines</th>
        </tr>
      </thead>
      <tbody>
        {importDetail.documents.map((doc) => {
          const isExpanded = expandedId === doc.documentId;
          return (
            <Fragment key={doc.documentId}>
              <tr
                onClick={() => setExpandedId(isExpanded ? null : doc.documentId)}
                className="cursor-pointer border-t border-gray-100 hover:bg-gray-50"
              >
                <td className="px-2 py-1 font-mono">
                  {isExpanded ? "▾" : "▸"} {doc.documentId}
                </td>
                <td className="px-2 py-1">{doc.postingDate}</td>
                <td className="px-2 py-1 text-right">{doc.lines.length}</td>
              </tr>
              {isExpanded && (
                <tr className="border-t border-gray-100 bg-gray-50">
                  <td colSpan={3} className="px-2 py-2">
                    <LineTable lines={doc.lines} />
                  </td>
                </tr>
              )}
            </Fragment>
          );
        })}
      </tbody>
    </table>
  );
}

function LineTable({ lines }: { lines: ImportDetailDto["documents"][number]["lines"] }) {
  return (
    <table className="w-full text-left text-xs">
      <thead className="text-gray-500">
        <tr>
          <th className="px-2 py-1">Line</th>
          <th className="px-2 py-1">G/L account</th>
          <th className="px-2 py-1">Cost center</th>
          <th className="px-2 py-1">D/C</th>
          <th className="px-2 py-1 text-right">Amount</th>
          <th className="px-2 py-1">Text</th>
          <th className="px-2 py-1">Vendor / Customer</th>
          <th className="px-2 py-1">Tax code</th>
        </tr>
      </thead>
      <tbody>
        {lines.map((line) => (
          <tr key={line.lineId} className="border-t border-gray-100">
            <td className="px-2 py-1">{line.lineId}</td>
            <td className="px-2 py-1 font-mono">{line.glAccount}</td>
            <td className="px-2 py-1">{line.costCenter ?? "—"}</td>
            <td className="px-2 py-1">{line.debitCredit}</td>
            <td className="px-2 py-1 text-right">{formatEUR(line.amount)}</td>
            <td className="px-2 py-1">{line.bookingText}</td>
            <td className="px-2 py-1">{line.vendorId ?? line.customerId ?? "—"}</td>
            <td className="px-2 py-1">{line.taxCode ?? "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
