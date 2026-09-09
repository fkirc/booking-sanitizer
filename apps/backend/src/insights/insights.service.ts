import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type {
  BalanceIntegrityDto,
  CostCenterActivityRowDto,
  CounterpartyConcentrationRowDto,
  InsightsDto,
  TrialBalanceRowDto,
} from "../../../../shared/insights";

// This demo's fixed chart of accounts (see sample-source-data/DATA_ASSUMPTIONS.md):
// 3300 is the trade payables control account, 1400 the trade receivables control
// account. Vendor/customer concentration sums only postings to these accounts, so
// it means exactly one thing — total invoiced — and never blends in payment lines.
const PAYABLE_ACCOUNT = "3300";
const RECEIVABLE_ACCOUNT = "1400";

@Injectable()
export class InsightsService {
  constructor(private readonly prisma: PrismaService) {}

  async getInsights(): Promise<InsightsDto> {
    const [trialBalance, balanceIntegrity, costCenterActivity, topVendors, topCustomers] = await Promise.all([
      this.getTrialBalance(),
      this.getBalanceIntegrity(),
      this.getCostCenterActivity(),
      this.getVendorConcentration(),
      this.getCustomerConcentration(),
    ]);
    return { trialBalance, balanceIntegrity, costCenterActivity, topVendors, topCustomers };
  }

  private async getTrialBalance(): Promise<TrialBalanceRowDto[]> {
    const [debits, credits] = await Promise.all([
      this.prisma.journalLine.groupBy({ by: ["glAccount"], where: { debitCredit: "D" }, _sum: { amount: true } }),
      this.prisma.journalLine.groupBy({ by: ["glAccount"], where: { debitCredit: "C" }, _sum: { amount: true } }),
    ]);

    const byAccount = new Map<string, { debit: number; credit: number }>();
    for (const row of debits) byAccount.set(row.glAccount, { debit: Number(row._sum.amount ?? 0), credit: 0 });
    for (const row of credits) {
      const existing = byAccount.get(row.glAccount) ?? { debit: 0, credit: 0 };
      existing.credit = Number(row._sum.amount ?? 0);
      byAccount.set(row.glAccount, existing);
    }

    return [...byAccount.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([glAccount, { debit, credit }]) => ({
        glAccount,
        totalDebit: debit.toFixed(2),
        totalCredit: credit.toFixed(2),
        netBalance: (debit - credit).toFixed(2),
      }));
  }

  private async getBalanceIntegrity(): Promise<BalanceIntegrityDto> {
    const documents = await this.prisma.journalDocument.findMany({
      select: { lines: { select: { amount: true, debitCredit: true } } },
    });
    let balancedDocuments = 0;
    for (const doc of documents) {
      const sum = doc.lines.reduce(
        (acc, l) => acc + (l.debitCredit === "D" ? Number(l.amount) : -Number(l.amount)),
        0,
      );
      if (Math.abs(sum) < 0.01) balancedDocuments++;
    }
    return { totalDocuments: documents.length, balancedDocuments };
  }

  private async getCostCenterActivity(): Promise<CostCenterActivityRowDto[]> {
    const rows = await this.prisma.journalLine.groupBy({
      by: ["costCenter"],
      where: { costCenter: { not: null } },
      _sum: { amount: true },
      _count: { _all: true },
    });
    return rows
      .map((row) => ({
        costCenter: row.costCenter as string,
        totalAmount: Number(row._sum.amount ?? 0).toFixed(2),
        lineCount: row._count._all,
      }))
      .sort((a, b) => Number(b.totalAmount) - Number(a.totalAmount));
  }

  private async getVendorConcentration(): Promise<CounterpartyConcentrationRowDto[]> {
    const rows = await this.prisma.journalLine.groupBy({
      by: ["vendorId"],
      where: { glAccount: PAYABLE_ACCOUNT, debitCredit: "C", vendorId: { not: null } },
      _sum: { amount: true },
      _count: { _all: true },
    });
    return rows
      .map((row) => ({
        id: row.vendorId as string,
        totalInvoiced: Number(row._sum.amount ?? 0).toFixed(2),
        documentCount: row._count._all,
      }))
      .sort((a, b) => Number(b.totalInvoiced) - Number(a.totalInvoiced));
  }

  private async getCustomerConcentration(): Promise<CounterpartyConcentrationRowDto[]> {
    const rows = await this.prisma.journalLine.groupBy({
      by: ["customerId"],
      where: { glAccount: RECEIVABLE_ACCOUNT, debitCredit: "D", customerId: { not: null } },
      _sum: { amount: true },
      _count: { _all: true },
    });
    return rows
      .map((row) => ({
        id: row.customerId as string,
        totalInvoiced: Number(row._sum.amount ?? 0).toFixed(2),
        documentCount: row._count._all,
      }))
      .sort((a, b) => Number(b.totalInvoiced) - Number(a.totalInvoiced));
  }
}
