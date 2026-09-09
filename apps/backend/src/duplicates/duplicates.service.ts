import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { DuplicateClusterDto, DuplicatesDto } from "../../../../shared/duplicates";

// A document looks like the same booking entered twice when another document shares
// its counterparty, amount, direction, and exact set of GL accounts within a short
// window. Verified against this dataset's 3 planted duplicates (e.g. "Freight charges
// inbound" for V-1005, booked twice, 1 day apart) — these four fields alone already
// separate them from every legitimate (non-duplicate) document with zero noise.
const MAX_DAY_GAP = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class DuplicatesService {
  constructor(private readonly prisma: PrismaService) {}

  async getDuplicates(): Promise<DuplicatesDto> {
    const documents = await this.prisma.journalDocument.findMany({
      select: {
        documentId: true,
        postingDate: true,
        lines: {
          select: { glAccount: true, amount: true, debitCredit: true, bookingText: true, vendorId: true, customerId: true },
        },
      },
    });

    const summaries = documents.map((doc) => {
      const control = doc.lines.find((l) => l.glAccount === "3300" || l.glAccount === "1400") ?? doc.lines[0];
      return {
        documentId: doc.documentId,
        postingDate: doc.postingDate,
        counterparty: control.vendorId ?? control.customerId ?? "",
        amount: control.amount.toFixed(2),
        direction: control.debitCredit,
        bookingText: control.bookingText,
        glAccounts: [...new Set(doc.lines.map((l) => l.glAccount))].sort(),
      };
    });

    const groups = new Map<string, typeof summaries>();
    for (const s of summaries) {
      if (!s.counterparty) continue;
      const key = [s.counterparty, s.amount, s.direction, s.glAccounts.join(",")].join("|");
      groups.set(key, [...(groups.get(key) ?? []), s]);
    }

    const clusters: DuplicateClusterDto[] = [];
    for (const group of groups.values()) {
      if (group.length < 2) continue;
      group.sort((a, b) => a.postingDate.getTime() - b.postingDate.getTime());
      const dayGap = Math.round((group.at(-1)!.postingDate.getTime() - group[0].postingDate.getTime()) / DAY_MS);
      if (dayGap > MAX_DAY_GAP) continue;
      clusters.push({
        counterparty: group[0].counterparty,
        amount: group[0].amount,
        bookingText: group[0].bookingText,
        glAccounts: group[0].glAccounts,
        dayGap,
        documents: group.map((g) => ({ documentId: g.documentId, postingDate: g.postingDate.toISOString().slice(0, 10) })),
      });
    }

    return { clusters: clusters.sort((a, b) => a.dayGap - b.dayGap) };
  }
}
