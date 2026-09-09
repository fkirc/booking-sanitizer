import { Injectable, NotFoundException } from "@nestjs/common";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { PrismaService } from "../prisma/prisma.service";
// Resolved relative to process.cwd() — nx/npm scripts always run from the repo root.
import type {
  ImportDetailDto,
  ImportSummaryDto,
  JournalDocumentDto,
  TriggerImportResponseDto,
} from "../../../../shared/data-sources";

interface RawJournalLine {
  company_code: string;
  posting_date: string;
  document_id: string;
  line_id: number;
  gl_account: string;
  cost_center: string;
  amount: number;
  currency: string;
  debit_credit: "D" | "C";
  booking_text: string;
  vendor_id: string;
  customer_id: string;
  tax_code: string;
}

const SAMPLE_DATA_PATH = join(process.cwd(), "sample-source-data/journal-entries.json");
const SAMPLE_DATA_FILENAME = "journal-entries.json";

@Injectable()
export class DataSourcesService {
  constructor(private readonly prisma: PrismaService) {}

  async listImports(): Promise<ImportSummaryDto[]> {
    const imports = await this.prisma.import.findMany({
      orderBy: { importedAt: "desc" },
      include: { _count: { select: { documents: true } } },
    });
    return imports.map((imp) => ({
      id: imp.id,
      filename: imp.filename,
      importedAt: imp.importedAt.toISOString(),
      documentCount: imp._count.documents,
    }));
  }

  async getImportDetail(id: string): Promise<ImportDetailDto> {
    const imp = await this.prisma.import.findUnique({
      where: { id },
      include: {
        documents: {
          orderBy: { postingDate: "asc" },
          include: { lines: { orderBy: { lineId: "asc" } } },
        },
      },
    });
    if (!imp) {
      throw new NotFoundException(`Import ${id} not found`);
    }
    const documents: JournalDocumentDto[] = imp.documents.map((doc) => ({
      companyCode: doc.companyCode,
      documentId: doc.documentId,
      postingDate: doc.postingDate.toISOString().slice(0, 10),
      importId: doc.importId,
      lines: doc.lines.map((line) => ({
        lineId: line.lineId,
        glAccount: line.glAccount,
        costCenter: line.costCenter,
        amount: line.amount.toString(),
        currency: line.currency,
        debitCredit: line.debitCredit as "D" | "C",
        bookingText: line.bookingText,
        vendorId: line.vendorId,
        customerId: line.customerId,
        taxCode: line.taxCode,
      })),
    }));
    return {
      id: imp.id,
      filename: imp.filename,
      importedAt: imp.importedAt.toISOString(),
      documentCount: documents.length,
      documents,
    };
  }

  /**
   * Deterministic import: parse the bundled sample journal dump, group rows into
   * balanced documents, and upsert into the relational schema. Idempotent end to
   * end — re-running with nothing new to import creates no Import batch row at
   * all, not just no duplicate documents.
   */
  async importSampleData(): Promise<TriggerImportResponseDto> {
    const raw = await readFile(SAMPLE_DATA_PATH, "utf-8");
    const lines: RawJournalLine[] = JSON.parse(raw);

    const byDocument = new Map<string, RawJournalLine[]>();
    for (const line of lines) {
      const key = `${line.company_code}|${line.document_id}`;
      const group = byDocument.get(key);
      if (group) group.push(line);
      else byDocument.set(key, [line]);
    }

    let documentsSkipped = 0;
    const toInsert: { sorted: RawJournalLine[]; sourceHash: string }[] = [];

    for (const group of byDocument.values()) {
      const sorted = [...group].sort((a, b) => a.line_id - b.line_id);
      if (!isBalanced(sorted) || sorted.length < 2) {
        documentsSkipped++;
        continue;
      }

      const sourceHash = computeSourceHash(sorted);
      const existing = await this.prisma.journalDocument.findUnique({ where: { sourceHash } });
      if (existing) {
        documentsSkipped++;
        continue;
      }

      toInsert.push({ sorted, sourceHash });
    }

    if (toInsert.length === 0) {
      return { importId: null, documentsImported: 0, documentsSkipped };
    }

    const importRecord = await this.prisma.import.create({
      data: { filename: SAMPLE_DATA_FILENAME },
    });

    for (const { sorted, sourceHash } of toInsert) {
      await this.upsertDimensions(sorted);

      const first = sorted[0];
      await this.prisma.journalDocument.create({
        data: {
          companyCode: first.company_code,
          documentId: first.document_id,
          postingDate: new Date(first.posting_date),
          sourceHash,
          importId: importRecord.id,
          lines: {
            create: sorted.map((line) => ({
              lineId: line.line_id,
              glAccount: line.gl_account,
              costCenter: line.cost_center || null,
              amount: line.amount,
              currency: line.currency,
              debitCredit: line.debit_credit,
              bookingText: line.booking_text,
              vendorId: line.vendor_id || null,
              customerId: line.customer_id || null,
              taxCode: line.tax_code || null,
            })),
          },
        },
      });
    }

    return { importId: importRecord.id, documentsImported: toInsert.length, documentsSkipped };
  }

  private async upsertDimensions(lines: RawJournalLine[]) {
    const glAccounts = new Set<string>();
    const costCenters = new Set<string>();
    const vendors = new Set<string>();
    const customers = new Set<string>();
    const taxCodes = new Set<string>();

    for (const line of lines) {
      glAccounts.add(line.gl_account);
      if (line.cost_center) costCenters.add(line.cost_center);
      if (line.vendor_id) vendors.add(line.vendor_id);
      if (line.customer_id) customers.add(line.customer_id);
      if (line.tax_code) taxCodes.add(line.tax_code);
    }

    await Promise.all([
      ...[...glAccounts].map((code) =>
        this.prisma.glAccount.upsert({ where: { code }, update: {}, create: { code } }),
      ),
      ...[...costCenters].map((code) =>
        this.prisma.costCenter.upsert({ where: { code }, update: {}, create: { code } }),
      ),
      ...[...vendors].map((id) =>
        this.prisma.vendor.upsert({ where: { id }, update: {}, create: { id } }),
      ),
      ...[...customers].map((id) =>
        this.prisma.customer.upsert({ where: { id }, update: {}, create: { id } }),
      ),
      ...[...taxCodes].map((code) =>
        this.prisma.taxCode.upsert({ where: { code }, update: {}, create: { code } }),
      ),
    ]);
  }
}

function isBalanced(lines: RawJournalLine[]): boolean {
  const sum = lines.reduce((acc, l) => acc + (l.debit_credit === "D" ? l.amount : -l.amount), 0);
  return Math.abs(sum) < 0.01;
}

function computeSourceHash(lines: RawJournalLine[]): string {
  const canonical = lines.map((l) => ({
    line_id: l.line_id,
    gl_account: l.gl_account,
    amount: l.amount,
    debit_credit: l.debit_credit,
    booking_text: l.booking_text,
  }));
  const first = lines[0];
  return createHash("sha256")
    .update(JSON.stringify({ company_code: first.company_code, document_id: first.document_id, lines: canonical }))
    .digest("hex");
}
