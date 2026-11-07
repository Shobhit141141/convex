import { calculateRubricV1 } from "../src/features/scoring/rubric-v1";
import { compareRankings, BenchmarkPage } from "../src/features/benchmark/ranking-comparison";
import { PageSignals } from "../src/types/analysis";
import fs from "node:fs/promises";

const BENCHMARK_SIGNALS: { meta: { id: string; name: string; actualCvr: number }; signals: PageSignals }[] = [
  {
    meta: {
      id: "hr_functional",
      name: "HR Functional Page",
      actualCvr: 0.005768
    },
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
    meta: {
      id: "homepage",
      name: "Homepage",
      actualCvr: 0.005615
    },
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
    meta: {
      id: "christus_webinar",
      name: "Christus Health Webinar",
      actualCvr: 0.001126
    },
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
        clarityOfNextStep: true
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

async function run() {
  console.log("=== Running Deterministic Ranking Comparison (Rubric v1) ===");
  const benchmarkPages: BenchmarkPage[] = [];
  const detailedReports = [];

  for (const page of BENCHMARK_SIGNALS) {
    const evalResult = calculateRubricV1(page.signals);
    detailedReports.push(evalResult);

    benchmarkPages.push({
      id: page.meta.id,
      name: page.meta.name,
      url: page.signals.url,
      actualCvr: page.meta.actualCvr,
      graderScore: evalResult.totalScore
    });

    console.log(`\nPage: ${page.meta.name}`);
    console.log(`URL: ${page.signals.url}`);
    console.log(`Grader Score: ${evalResult.totalScore}/100`);
  }

  const comparison = compareRankings(benchmarkPages);

  console.log("\n=== Ranking Comparison Report ===");
  console.log(`Pairwise Order Agreement: ${comparison.pairAgreementPercentage}% (${comparison.concordantPairs}/${comparison.totalComparablePairs} pairs)`);
  console.log(`Summary: ${comparison.summary}`);

  console.table(comparison.pages.map(p => ({
    Page: p.name,
    "Actual CVR": p.actualCvr ? `${(p.actualCvr * 100).toFixed(2)}%` : "N/A",
    "Actual Rank": p.actualRank ?? "N/A",
    "Grader Score": p.graderScore,
    "Grader Rank": p.graderRank,
    "Rank Delta": p.rankDelta ?? "N/A",
    Status: p.status
  })));

  const output = {
    evaluatedAt: new Date().toISOString(),
    rubricVersion: "v1",
    comparison,
    detailedReports
  };

  await fs.writeFile("data/phase2-rubric-v1-results.json", JSON.stringify(output, null, 2));
  console.log("\nSaved updated results to data/phase2-rubric-v1-results.json");
}

run();
