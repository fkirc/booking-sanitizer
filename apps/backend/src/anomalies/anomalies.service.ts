import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { AnomaliesDto, AnomalyFindingDto } from "../../../../shared/anomalies";

// Calibrated against this dataset's planted typos ("servcie"/"service",
// "suplies"/"supplies", "Insurence"/"Insurance"), which all sit at edit distance
// 1-2, while genuinely different texts (e.g. different customer names in
// "Sales invoice X") sit at 3+. A minimum length avoids noise on short strings.
const MAX_EDIT_DISTANCE = 2;
const MIN_TEXT_LENGTH = 6;
const SAMPLE_DOCUMENT_COUNT = 3;

function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[b.length];
}

@Injectable()
export class AnomaliesService {
  constructor(private readonly prisma: PrismaService) {}

  async getAnomalies(): Promise<AnomaliesDto> {
    const lines = await this.prisma.journalLine.findMany({
      select: { bookingText: true, documentId: true },
    });

    const byText = new Map<string, { count: number; documentIds: string[] }>();
    for (const line of lines) {
      const entry = byText.get(line.bookingText) ?? { count: 0, documentIds: [] };
      entry.count++;
      if (entry.documentIds.length < SAMPLE_DOCUMENT_COUNT && !entry.documentIds.includes(line.documentId)) {
        entry.documentIds.push(line.documentId);
      }
      byText.set(line.bookingText, entry);
    }

    const texts = [...byText.entries()]
      .map(([text, { count, documentIds }]) => ({ text, count, documentIds }))
      .filter((t) => t.text.length >= MIN_TEXT_LENGTH);

    const findings: AnomalyFindingDto[] = [];
    for (let i = 0; i < texts.length; i++) {
      for (let j = i + 1; j < texts.length; j++) {
        const editDistance = levenshtein(texts[i].text.toLowerCase(), texts[j].text.toLowerCase());
        if (editDistance > 0 && editDistance <= MAX_EDIT_DISTANCE) {
          findings.push({
            textA: texts[i].text,
            textB: texts[j].text,
            countA: texts[i].count,
            countB: texts[j].count,
            editDistance,
            documentIdsA: texts[i].documentIds,
            documentIdsB: texts[j].documentIds,
          });
        }
      }
    }

    return { findings: findings.sort((a, b) => a.editDistance - b.editDistance) };
  }
}
