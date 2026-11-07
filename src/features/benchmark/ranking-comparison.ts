export interface BenchmarkPage {
  id: string;
  name: string;
  url?: string;
  actualCvr?: number | null;
  graderScore: number;
}

export interface PageRankComparison {
  id: string;
  name: string;
  url?: string;
  actualCvr: number | null;
  actualRank: number | null;
  graderScore: number;
  graderRank: number;
  rankDelta: number | null;
  status: "agreement" | "mismatch" | "unranked";
}

export interface RankingComparisonReport {
  totalEvaluated: number;
  comparableCount: number;
  pages: PageRankComparison[];
  pairAgreementPercentage: number | null;
  concordantPairs: number;
  totalComparablePairs: number;
  largestDiscrepancy: PageRankComparison | null;
  summary: string;
}

export function assignRanks(values: number[], descending = true): number[] {
  const indexed = values.map((val, idx) => ({ val, idx }));
  indexed.sort((a, b) => descending ? b.val - a.val : a.val - b.val);

  const ranks = new Array<number>(values.length);
  let i = 0;
  while (i < indexed.length) {
    let j = i;
    while (j < indexed.length - 1 && indexed[j + 1].val === indexed[j].val) {
      j++;
    }
    const avgRank = (i + 1 + (j + 1)) / 2;
    for (let k = i; k <= j; k++) {
      ranks[indexed[k].idx] = avgRank;
    }
    i = j + 1;
  }
  return ranks;
}

export function compareRankings(pages: BenchmarkPage[]): RankingComparisonReport {
  const totalEvaluated = pages.length;

  // Separate valid CVR pages from missing data (do not treat null/undefined as 0)
  const validPages = pages.filter(p => p.actualCvr !== null && p.actualCvr !== undefined && !Number.isNaN(p.actualCvr));
  const unrankedPages = pages.filter(p => p.actualCvr === null || p.actualCvr === undefined || Number.isNaN(p.actualCvr));

  // Compute grader ranks for all pages
  const allGraderScores = pages.map(p => p.graderScore);
  const allGraderRanks = assignRanks(allGraderScores, true);

  // Compute actual CVR ranks only among valid pages
  const validActualCvrs = validPages.map(p => p.actualCvr as number);
  const validActualRanks = assignRanks(validActualCvrs, true);

  const validComparisonMap = new Map<string, { actualRank: number }>();
  validPages.forEach((p, idx) => {
    validComparisonMap.set(p.id, { actualRank: validActualRanks[idx] });
  });

  const comparedPages: PageRankComparison[] = pages.map((p, idx) => {
    const graderRank = allGraderRanks[idx];
    const validInfo = validComparisonMap.get(p.id);

    if (!validInfo) {
      return {
        id: p.id,
        name: p.name,
        url: p.url,
        actualCvr: null,
        actualRank: null,
        graderScore: p.graderScore,
        graderRank,
        rankDelta: null,
        status: "unranked"
      };
    }

    const actualRank = validInfo.actualRank;
    const rankDelta = actualRank - graderRank; // Positive = Grader ranked higher than real data
    const status = rankDelta === 0 ? "agreement" : "mismatch";

    return {
      id: p.id,
      name: p.name,
      url: p.url,
      actualCvr: p.actualCvr ?? null,
      actualRank,
      graderScore: p.graderScore,
      graderRank,
      rankDelta,
      status
    };
  });

  // Calculate pairwise ordering agreement across comparable pages
  let concordantPairs = 0;
  let totalComparablePairs = 0;

  for (let i = 0; i < validPages.length; i++) {
    for (let j = i + 1; j < validPages.length; j++) {
      const p1 = validPages[i];
      const p2 = validPages[j];

      const cvrDiff = (p1.actualCvr as number) - (p2.actualCvr as number);
      const scoreDiff = p1.graderScore - p2.graderScore;

      if (cvrDiff !== 0 && scoreDiff !== 0) {
        totalComparablePairs++;
        if ((cvrDiff > 0 && scoreDiff > 0) || (cvrDiff < 0 && scoreDiff < 0)) {
          concordantPairs++;
        }
      }
    }
  }

  const pairAgreementPercentage = totalComparablePairs > 0
    ? Number(((concordantPairs / totalComparablePairs) * 100).toFixed(1))
    : null;

  // Identify largest discrepancy
  const rankedOnly = comparedPages.filter(p => p.rankDelta !== null);
  rankedOnly.sort((a, b) => Math.abs(b.rankDelta!) - Math.abs(a.rankDelta!));
  const largestDiscrepancy = rankedOnly.length > 0 && Math.abs(rankedOnly[0].rankDelta!) > 0
    ? rankedOnly[0]
    : null;

  // Generate plain-English explanation
  let summary = "";
  if (validPages.length === 0) {
    summary = "No pages with conversion data available for ranking comparison.";
  } else if (largestDiscrepancy) {
    const direction = largestDiscrepancy.rankDelta! > 0 ? "higher" : "lower";
    summary = `Grader disagreed most on "${largestDiscrepancy.name}" (ranked #${largestDiscrepancy.graderRank} by score ${largestDiscrepancy.graderScore}, but #${largestDiscrepancy.actualRank} in actual conversion). Pairwise order agreement is ${pairAgreementPercentage ?? 0}%.`;
  } else {
    summary = `Perfect rank agreement across all ${validPages.length} comparable pages (100% pairwise order agreement).`;
  }

  return {
    totalEvaluated,
    comparableCount: validPages.length,
    pages: comparedPages,
    pairAgreementPercentage,
    concordantPairs,
    totalComparablePairs,
    largestDiscrepancy,
    summary
  };
}
