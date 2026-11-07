import { calculateRubricV2 } from "../src/features/scoring/rubric-v2";
import { calculateRubricV1 } from "../src/features/scoring/rubric-v1";
import { compareRankings, BenchmarkPage } from "../src/features/benchmark/ranking-comparison";
import { analyzeTrafficPerformance } from "../src/features/benchmark/traffic-adjusted-benchmark";
import { deterministicClassify } from "../src/features/ai/classifier";
import { PageSignals } from "../src/types/analysis";
import {
  homepageFixture,
  hrFunctionalFixture,
  christusWebinarFixture
} from "../tests/fixtures/classification-fixtures";
import fs from "node:fs/promises";

interface BenchmarkItem {
  id: string;
  name: string;
  actualCvr: number;
  sessions: number;
  formFills: number;
  trafficSources: {
    paid_search?: number;
    organic_search?: number;
    direct?: number;
    email?: number;
    paid_social?: number;
    others?: number;
  };
  fixture: typeof homepageFixture;
  signals: PageSignals;
}

const BENCHMARK_PAGES: BenchmarkItem[] = [
  {
    id: "hr_functional",
    name: "HR Functional Page",
    actualCvr: 0.005768,
    sessions: 1907,
    formFills: 11,
    trafficSources: {
      paid_search: 0.58,
      organic_search: 0.17,
      direct: 0.14,
      paid_social: 0.07,
      email: 0.03,
      others: 0.01
    },
    fixture: hrFunctionalFixture,
    signals: {
      url: "https://leena.ai/function/hr",
      title: "Universal HR Assistant: Agentic AI for HR Ops | Leena AI",
      metaDescription: "Agentic AI for HR Operations. Automates 70%+ of HR tickets - benefits, letters, policy, records. Pre-integrated with Workday, ServiceNow & more. Live in 45 days.",
      headings: {
        h1: ["Most HR requests shouldn't reach a human. Now they don't."],
        h2: [
          "Multiple jobs. One AI Colleague. Zero queue.",
          "See what's live. See what's possible.",
          "Value unlocked with Harrison.",
          "Leaders on the record: From go-live to ROI."
        ]
      },
      wordCount: 1042,
      hasViewportMeta: true,
      performance: {
        mobileLighthouseScore: 75,
        lcpSeconds: 2.2,
        cls: 0.03,
        fcpSeconds: 1.7,
        source: "pagespeed_api"
      },
      conversion: {
        hasAboveTheFoldCta: true,
        primaryCtaText: "Book a demo",
        isActionOrientedCta: true,
        leadCaptureEngine: true,
        leadCaptureType: "HubSpot Modal Lead Capture",
        clarityOfNextStep: false
      },
      clarity: {
        hasClearH1: true,
        hasProblemStatement: true,
        problemStatementQuote: "Most HR requests shouldn't reach a human. Now they don't.",
        hasConcreteOutcome: true,
        concreteOutcomeQuote: "Harrison closes Tier-1 HR requests in seconds, not days.",
        isLowJargon: true
      },
      trust: {
        logoCount: 6,
        detectedLogos: ["Workday", "ServiceNow", "Oracle", "SAP"],
        complianceCertifications: ["SOC 2", "ISO 27001", "GDPR", "HIPAA"],
        hasQuantifiedCaseStudy: true,
        quantifiedCaseStudyQuote: "Automates 70%+ of HR tickets - benefits, letters, policy, records."
      }
    }
  },
  {
    id: "homepage",
    name: "Homepage",
    actualCvr: 0.005615,
    sessions: 18343,
    formFills: 103,
    trafficSources: {
      direct: 0.44,
      organic_search: 0.25,
      paid_search: 0.15,
      paid_social: 0.01,
      email: 0.03,
      others: 0.12
    },
    fixture: homepageFixture,
    signals: {
      url: "https://leena.ai/",
      title: "Agentic AI for the Enterprise Back Office | Leena AI",
      metaDescription: "Enterprise AI Platform with Pre-built AI Colleagues for HR, IT and Finance that go live in 45 days. 70%+ tickets auto-resolved, 4-10× ROI. Trusted by 500+ enterprises.",
      headings: {
        h1: ["Enterprise AI, live in 45 days"],
        h2: [
          "Most Agentic AI projects die within 14 months. Here's how ours go live in 45 days.",
          "Powering 20M+ employees across 500+ enterprises.",
          "Meet the three. Ready to work today."
        ]
      },
      wordCount: 987,
      hasViewportMeta: true,
      performance: {
        mobileLighthouseScore: 72,
        lcpSeconds: 2.4,
        cls: 0.04,
        fcpSeconds: 1.8,
        source: "pagespeed_api"
      },
      conversion: {
        hasAboveTheFoldCta: true,
        primaryCtaText: "Book a demo",
        isActionOrientedCta: true,
        leadCaptureEngine: true,
        leadCaptureType: "HubSpot Modal Lead Capture",
        clarityOfNextStep: false
      },
      clarity: {
        hasClearH1: true,
        hasProblemStatement: false,
        problemStatementQuote: undefined,
        hasConcreteOutcome: true,
        concreteOutcomeQuote: "Go live in 45 days. 70%+ tickets auto-resolved, 4-10x ROI.",
        isLowJargon: true
      },
      trust: {
        logoCount: 11,
        detectedLogos: ["Workday", "Oracle", "SAP", "ServiceNow", "Cencora", "Dr. Reddy's", "Slack", "Microsoft"],
        complianceCertifications: ["SOC 2", "ISO 27001", "GDPR", "HIPAA"],
        hasQuantifiedCaseStudy: true,
        quantifiedCaseStudyQuote: "Powering 20M+ employees across 500+ enterprises."
      }
    }
  },
  {
    id: "christus_webinar",
    name: "Christus Health Webinar",
    actualCvr: 0.001126,
    sessions: 12437,
    formFills: 14,
    trafficSources: {
      paid_social: 0.79,
      email: 0.18,
      others: 0.03
    },
    fixture: christusWebinarFixture,
    signals: {
      url: "https://leena.ai/resources/webinars/christus-health-hr-ai-rollout-webinar",
      title: "HR AI Rollout: Inside CHRISTUS Health's AI Launch | Leena AI",
      metaDescription: "Jessica Hendrix ran the HR AI rollout at CHRISTUS Health. Hear what it took: the security review, the content cleanup, and how they drove adoption. Sept 17.",
      headings: {
        h1: ["What It Really Takes to Get 51,000 Employees Using AI"],
        h2: [
          "Featured speakers",
          "What you'll walk away with"
        ]
      },
      wordCount: 409,
      hasViewportMeta: true,
      performance: {
        mobileLighthouseScore: 82,
        lcpSeconds: 1.8,
        cls: 0.02,
        fcpSeconds: 1.3,
        source: "pagespeed_api"
      },
      conversion: {
        hasAboveTheFoldCta: true,
        primaryCtaText: "Watch now",
        isActionOrientedCta: true,
        leadCaptureEngine: true,
        leadCaptureType: "HubSpot On-Demand Registration",
        clarityOfNextStep: false
      },
      clarity: {
        hasClearH1: true,
        hasProblemStatement: true,
        problemStatementQuote: "What it took: the security review, content cleanup, and driving adoption.",
        hasConcreteOutcome: true,
        concreteOutcomeQuote: "51,000 employees using AI.",
        isLowJargon: true
      },
      trust: {
        logoCount: 4,
        detectedLogos: ["Christus Health", "Partner Logo"],
        complianceCertifications: ["SOC 2", "ISO 27001", "GDPR", "HIPAA"],
        hasQuantifiedCaseStudy: true,
        quantifiedCaseStudyQuote: "Inside CHRISTUS Health's AI launch across 51,000 employees."
      }
    }
  }
];

async function main() {
  console.log("=================================================================");
  console.log("       CONVEX SCORING ENGINE BENCHMARK: RUBRIC V1 vs RUBRIC V2   ");
  console.log("=================================================================\n");

  const v1BenchmarkPages: BenchmarkPage[] = [];
  const v2BenchmarkPages: BenchmarkPage[] = [];
  const v2Reports = [];
  const tierCReports = [];

  for (const page of BENCHMARK_PAGES) {
    const classification = deterministicClassify(page.fixture);
    const v1Result = calculateRubricV1(page.signals);
    const v2Result = calculateRubricV2(page.signals, classification);
    const tierC = analyzeTrafficPerformance(
      page.id,
      page.name,
      page.sessions,
      page.formFills,
      page.trafficSources
    );

    v2Reports.push({ page: page.name, classification, v2Result });
    tierCReports.push(tierC);

    v1BenchmarkPages.push({
      id: page.id,
      name: page.name,
      url: page.signals.url,
      actualCvr: page.actualCvr,
      graderScore: v1Result.totalScore
    });

    v2BenchmarkPages.push({
      id: page.id,
      name: page.name,
      url: page.signals.url,
      actualCvr: page.actualCvr,
      graderScore: v2Result.totalScore
    });

    console.log(`--- [ ${page.name} ] ---`);
    console.log(`URL: ${page.signals.url}`);
    console.log(`Page Type: ${classification.pageType.toUpperCase()} | Intent: ${classification.visitorIntent}`);
    console.log(`Target Audience: ${classification.targetAudience.segments.join(", ") || "General"} (${classification.targetAudience.roles.join(", ") || "All roles"})`);
    console.log(`Actual CVR: ${(page.actualCvr * 100).toFixed(2)}% (${page.formFills} fills / ${page.sessions.toLocaleString()} sessions)`);
    console.log(`Traffic Intent Index: ${tierC.trafficIntentIndex}/1.0 | Diagnosis: ${tierC.diagnosis}`);
    console.log(`Rubric v1 Score: ${v1Result.totalScore}/100`);
    console.log(`Rubric v2 Score: ${v2Result.totalScore}/100`);
    console.log(`  ├─ Tier A (Page Quality):    ${v2Result.tierScores.quality.score}/60 (${v2Result.tierScores.quality.percentage}%)`);
    console.log(`  └─ Tier B (Conv Readiness):  ${v2Result.tierScores.readiness.score}/40 (${v2Result.tierScores.readiness.percentage}%)\n`);
  }

  const v1Comparison = compareRankings(v1BenchmarkPages);
  const v2Comparison = compareRankings(v2BenchmarkPages);

  console.log("=================================================================");
  console.log("                   RUBRIC V1 RANKING RESULTS                     ");
  console.log("=================================================================");
  console.log(`Pairwise Order Agreement: ${v1Comparison.pairAgreementPercentage}% (${v1Comparison.concordantPairs}/${v1Comparison.totalComparablePairs})`);
  console.log(`Summary: ${v1Comparison.summary}`);
  console.table(v1Comparison.pages.map(p => ({
    Page: p.name,
    "Actual CVR": `${((p.actualCvr ?? 0) * 100).toFixed(2)}%`,
    "Actual Rank": p.actualRank,
    "v1 Score": p.graderScore,
    "v1 Rank": p.graderRank,
    "Rank Delta": p.rankDelta,
    Status: p.status
  })));

  console.log("\n=================================================================");
  console.log("                   RUBRIC V2 RANKING RESULTS                     ");
  console.log("=================================================================");
  console.log(`Pairwise Order Agreement: ${v2Comparison.pairAgreementPercentage}% (${v2Comparison.concordantPairs}/${v2Comparison.totalComparablePairs})`);
  console.log(`Summary: ${v2Comparison.summary}`);
  console.table(v2Comparison.pages.map(p => ({
    Page: p.name,
    "Actual CVR": `${((p.actualCvr ?? 0) * 100).toFixed(2)}%`,
    "Actual Rank": p.actualRank,
    "v2 Score": p.graderScore,
    "v2 Rank": p.graderRank,
    "Rank Delta": p.rankDelta,
    Status: p.status
  })));

  console.log("\n=================================================================");
  console.log("        TIER C: TRAFFIC-ADJUSTED PERFORMANCE BENCHMARK          ");
  console.log("=================================================================");
  console.table(tierCReports.map(t => ({
    Page: t.name,
    "Actual CVR": `${(t.actualCvr * 100).toFixed(2)}%`,
    "Intent Index": `${(t.trafficIntentIndex * 100).toFixed(0)}%`,
    "Expected CVR": `${(t.expectedCvrByIntent * 100).toFixed(2)}%`,
    Efficiency: `${t.conversionEfficiency}x`,
    "Intent Driver": t.diagnosis.slice(0, 45) + "..."
  })));

  const output = {
    evaluatedAt: new Date().toISOString(),
    v1Comparison,
    v2Comparison,
    tierCReports,
    detailedReports: v2Reports
  };

  await fs.writeFile("data/phase3-rubric-v2-results.json", JSON.stringify(output, null, 2));
  console.log("\nResults saved to data/phase3-rubric-v2-results.json");
}

main();
