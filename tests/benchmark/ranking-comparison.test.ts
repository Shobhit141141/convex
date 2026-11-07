import { describe, it, expect } from "vitest";
import { compareRankings, assignRanks, BenchmarkPage } from "@/features/benchmark/ranking-comparison";

describe("Ranking Comparison System", () => {
  it("assigns descending ranks and handles ties with average ranking", () => {
    const values = [100, 80, 80, 50];
    const ranks = assignRanks(values);
    expect(ranks).toEqual([1, 2.5, 2.5, 4]);
  });

  it("detects perfect rank agreement (100% pair agreement)", () => {
    const pages: BenchmarkPage[] = [
      { id: "p1", name: "Page A", actualCvr: 0.05, graderScore: 90 },
      { id: "p2", name: "Page B", actualCvr: 0.03, graderScore: 75 },
      { id: "p3", name: "Page C", actualCvr: 0.01, graderScore: 60 }
    ];

    const result = compareRankings(pages);
    expect(result.comparableCount).toBe(3);
    expect(result.pairAgreementPercentage).toBe(100);
    expect(result.concordantPairs).toBe(3);
    expect(result.totalComparablePairs).toBe(3);
    expect(result.largestDiscrepancy).toBeNull();
    expect(result.pages.every(p => p.status === "agreement")).toBe(true);
  });

  it("identifies ranking mismatches and highlights the largest discrepancy", () => {
    const pages: BenchmarkPage[] = [
      { id: "hr", name: "HR Functional", actualCvr: 0.0058, graderScore: 94 },
      { id: "home", name: "Homepage", actualCvr: 0.0056, graderScore: 86 },
      { id: "webinar", name: "Christus Webinar", actualCvr: 0.0011, graderScore: 95 }
    ];

    const result = compareRankings(pages);
    expect(result.comparableCount).toBe(3);

    // Webinar: Grader Rank 1, Actual Rank 3 -> Delta = +2
    const webinar = result.pages.find(p => p.id === "webinar");
    expect(webinar?.graderRank).toBe(1);
    expect(webinar?.actualRank).toBe(3);
    expect(webinar?.rankDelta).toBe(2);
    expect(webinar?.status).toBe("mismatch");

    expect(result.largestDiscrepancy?.id).toBe("webinar");
    expect(result.largestDiscrepancy?.rankDelta).toBe(2);
    expect(result.summary).toContain('Grader disagreed most on "Christus Webinar"');
  });

  it("handles missing conversion data without treating missing values as zero", () => {
    const pages: BenchmarkPage[] = [
      { id: "p1", name: "Live Tested Page", actualCvr: 0.04, graderScore: 85 },
      { id: "p2", name: "Unreleased Page", actualCvr: null, graderScore: 92 },
      { id: "p3", name: "Low Traffic Page", actualCvr: 0.01, graderScore: 65 }
    ];

    const result = compareRankings(pages);
    expect(result.totalEvaluated).toBe(3);
    expect(result.comparableCount).toBe(2); // Only p1 and p3 are comparable

    const unreleased = result.pages.find(p => p.id === "p2");
    expect(unreleased?.actualRank).toBeNull();
    expect(unreleased?.rankDelta).toBeNull();
    expect(unreleased?.status).toBe("unranked");
    expect(unreleased?.graderRank).toBe(1); // Still gets a grader rank

    // Between p1 (85 score, 0.04 CVR) and p3 (65 score, 0.01 CVR), they agree!
    expect(result.totalComparablePairs).toBe(1);
    expect(result.concordantPairs).toBe(1);
    expect(result.pairAgreementPercentage).toBe(100);
  });

  it("handles tied grader scores gracefully", () => {
    const pages: BenchmarkPage[] = [
      { id: "p1", name: "Page 1", actualCvr: 0.04, graderScore: 80 },
      { id: "p2", name: "Page 2", actualCvr: 0.02, graderScore: 80 }
    ];

    const result = compareRankings(pages);
    expect(result.pages[0].graderRank).toBe(1.5);
    expect(result.pages[1].graderRank).toBe(1.5);
    // Score is tied, so pairwise comparison is skipped from order agreement
    expect(result.totalComparablePairs).toBe(0);
    expect(result.pairAgreementPercentage).toBeNull();
  });
});
