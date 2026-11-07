export interface TrafficSourceDistribution {
  paid_search?: number;
  organic_search?: number;
  direct?: number;
  email?: number;
  paid_social?: number;
  others?: number;
}

export interface TrafficAdjustedPerformance {
  pageId: string;
  name: string;
  actualCvr: number; // e.g. 0.0058 (0.58%)
  sessions: number;
  formFills: number;
  trafficSources: TrafficSourceDistribution;
  trafficIntentIndex: number; // 0.0 to 1.0
  expectedCvrByIntent: number; // Baseline expected for this traffic mix
  conversionEfficiency: number; // actualCvr / expectedCvr
  diagnosis: string;
}

// Channel Intent Multipliers based on industry B2B SaaS conversion benchmarks:
// - Paid Search: High commercial intent (actively querying solution) -> baseline ~1.5%
// - Organic Search: High informational/commercial intent -> baseline ~1.2%
// - Direct: High brand awareness/navigational intent -> baseline ~1.0%
// - Email: Warm permission-based audience -> baseline ~0.8%
// - Paid Social: Passive push discovery (interruptive feed ads) -> baseline ~0.15%
const CHANNEL_BASELINES: Record<keyof TrafficSourceDistribution, { intentWeight: number; baselineCvr: number }> = {
  paid_search: { intentWeight: 1.0, baselineCvr: 0.015 },
  organic_search: { intentWeight: 0.85, baselineCvr: 0.012 },
  direct: { intentWeight: 0.75, baselineCvr: 0.010 },
  email: { intentWeight: 0.60, baselineCvr: 0.008 },
  paid_social: { intentWeight: 0.20, baselineCvr: 0.0015 },
  others: { intentWeight: 0.40, baselineCvr: 0.005 }
};

export function analyzeTrafficPerformance(
  pageId: string,
  name: string,
  sessions: number,
  formFills: number,
  trafficSources: TrafficSourceDistribution
): TrafficAdjustedPerformance {
  const actualCvr = sessions > 0 ? formFills / sessions : 0;

  let totalWeight = 0;
  let weightedIntentSum = 0;
  let expectedCvrSum = 0;

  for (const [channelKey, share] of Object.entries(trafficSources)) {
    const key = channelKey as keyof TrafficSourceDistribution;
    const config = CHANNEL_BASELINES[key] || { intentWeight: 0.5, baselineCvr: 0.005 };
    const pct = share ?? 0;

    totalWeight += pct;
    weightedIntentSum += pct * config.intentWeight;
    expectedCvrSum += pct * config.baselineCvr;
  }

  const trafficIntentIndex = totalWeight > 0 ? Number((weightedIntentSum / totalWeight).toFixed(3)) : 0.5;
  const expectedCvr = totalWeight > 0 ? Number((expectedCvrSum / totalWeight).toFixed(5)) : 0.005;

  const efficiency = expectedCvr > 0 ? Number((actualCvr / expectedCvr).toFixed(2)) : 1.0;

  let diagnosis = "";
  if (trafficSources.paid_social && trafficSources.paid_social >= 0.6) {
    diagnosis = `Traffic is heavily dominated by Paid Social (${Math.round((trafficSources.paid_social || 0) * 100)}%). Cold push traffic naturally yields low direct form conversion (~0.1%), masking solid underlying page construction.`;
  } else if (trafficSources.paid_search && trafficSources.paid_search >= 0.4) {
    diagnosis = `High conversion rate is accelerated by commercial search intent (${Math.round((trafficSources.paid_search || 0) * 100)}% Paid Search). Visitors arrive with active purchase motivation.`;
  } else {
    diagnosis = "Conversion rate is supported by healthy direct and organic brand navigation traffic.";
  }

  return {
    pageId,
    name,
    actualCvr: Number(actualCvr.toFixed(6)),
    sessions,
    formFills,
    trafficSources,
    trafficIntentIndex,
    expectedCvrByIntent: expectedCvr,
    conversionEfficiency: efficiency,
    diagnosis
  };
}
