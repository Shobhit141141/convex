import { calculateRubricV3 } from "../src/features/scoring/rubric-v3";
import { calculateRubricV2 } from "../src/features/scoring/rubric-v2";
import { calculateRubricV1 } from "../src/features/scoring/rubric-v1";
import { compareRankings } from "../src/features/benchmark/ranking-comparison";
import { analyzeTrafficPerformance } from "../src/features/benchmark/traffic-adjusted-benchmark";
import { classifyPage } from "../src/features/ai/classifier";
import { createOpenAIClassifier } from "../src/features/ai/openai-classifier";
import { SemanticEvaluator } from "../src/features/ai/semantic-evaluator";
import { verifyConversionInteraction } from "../src/features/browser/interaction-verifier";
import { PageSignals } from "../src/types/analysis";
import {
  homepageFixture,
  hrFunctionalFixture,
  christusWebinarFixture
} from "../tests/fixtures/classification-fixtures";
import fs from "node:fs/promises";
import path from "node:path";

interface BenchmarkPageData {
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

const BENCHMARK_PAGES: BenchmarkPageData[] = [
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
      direct: 0.38,
      organic_search: 0.34,
      paid_search: 0.15,
      paid_social: 0.07,
      email: 0.04,
      others: 0.02
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
          "Meet the three. Ready to work today.",
          "Leaders on the record: From go-live to ROI.",
          "A platform that earns the room from CIO to CHRO to CFO."
        ]
      },
      wordCount: 1480,
      hasViewportMeta: true,
      performance: {
        mobileLighthouseScore: 78,
        lcpSeconds: 2.1,
        cls: 0.04,
        fcpSeconds: 1.6,
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
        problemStatementQuote: "Most Agentic AI projects die within 14 months. Here's how ours go live in 45 days.",
        hasConcreteOutcome: true,
        concreteOutcomeQuote: "70%+ tickets auto-resolved, 4-10× ROI. Live in 45 days.",
        isLowJargon: true
      },
      trust: {
        logoCount: 8,
        detectedLogos: ["Nestle", "Coca-Cola", "Puma", "Sony", "Workday", "ServiceNow", "SAP", "Oracle"],
        complianceCertifications: ["SOC 2", "ISO 27001", "GDPR", "HIPAA"],
        hasQuantifiedCaseStudy: true,
        quantifiedCaseStudyQuote: "4-10× ROI, 70%+ tickets auto-resolved across 500+ enterprises."
      }
    }
  },
  {
    id: "christus_webinar",
    name: "CHRISTUS Health Webinar",
    actualCvr: 0.001129,
    sessions: 12402,
    formFills: 14,
    trafficSources: {
      paid_social: 0.79,
      paid_search: 0.09,
      direct: 0.06,
      organic_search: 0.04,
      email: 0.01,
      others: 0.01
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
          "What you'll walk away with",
          "Ready to accelerate your Agentic AI journey?"
        ]
      },
      wordCount: 820,
      hasViewportMeta: true,
      performance: {
        mobileLighthouseScore: 72,
        lcpSeconds: 2.4,
        cls: 0.05,
        fcpSeconds: 1.8,
        source: "pagespeed_api"
      },
      conversion: {
        hasAboveTheFoldCta: true,
        primaryCtaText: "Watch now",
        isActionOrientedCta: true,
        leadCaptureEngine: true,
        leadCaptureType: "HubSpot Modal Lead Capture",
        clarityOfNextStep: false
      },
      clarity: {
        hasClearH1: true,
        hasProblemStatement: false,
        hasConcreteOutcome: false,
        isLowJargon: true
      },
      trust: {
        logoCount: 2,
        detectedLogos: ["CHRISTUS Health", "Leena AI"],
        complianceCertifications: [],
        hasQuantifiedCaseStudy: true,
        quantifiedCaseStudyQuote: "Inside CHRISTUS Health's AI Launch for 51,000 Employees"
      }
    }
  }
];

async function runBenchmark() {
  console.log("==================================================================");
  console.log("   CONVEX PHASE 3 BENCHMARK: RUBRIC V1 vs V2 vs V3 EVALUATION    ");
  console.log("==================================================================\n");

  const apiKey = process.env.OPENAI_API_KEY;
  let aiClassifier = undefined;
  let semanticEvaluator: SemanticEvaluator | null = null;

  if (apiKey) {
    console.log("OpenAI API key detected. Initializing gpt-5-mini Semantic Evaluator...");
    try {
      aiClassifier = createOpenAIClassifier(apiKey, "gpt-5-mini");
      semanticEvaluator = new SemanticEvaluator(apiKey, "gpt-5-mini", "gpt-4o-mini");
      console.log("Semantic Evaluator successfully initialized.\n");
    } catch (err: any) {
      console.warn("Failed to initialize OpenAI client:", err?.message);
    }
  } else {
    console.log("No OPENAI_API_KEY found in environment. Using deterministic fallback.\n");
  }

  const results: any[] = [];

  for (const page of BENCHMARK_PAGES) {
    console.log(`------------------------------------------------------------------`);
    console.log(`Evaluating: ${page.name} (${page.fixture.url})`);
    console.log(`Actual CVR: ${(page.actualCvr * 100).toFixed(2)}% | Sessions: ${page.sessions.toLocaleString()}`);

    // Step 1: Classification
    const classification = await classifyPage(page.fixture, aiClassifier);
    console.log(`Page Type: ${classification.pageType} | Intent: ${classification.visitorIntent}`);

    // Step 2: Semantic Evaluation
    let semanticEval = undefined;
    if (semanticEvaluator) {
      try {
        const evalResult = await semanticEvaluator.evaluate(page.fixture);
        semanticEval = evalResult;
        console.log(`AI Semantic Evaluation: Grade=${evalResult.overallPersuasionGrade} (Confidence: ${evalResult.evaluationConfidence})`);
      } catch (err: any) {
        console.warn(`AI Semantic evaluation failed for ${page.id}:`, err?.message);
      }
    }

    // Step 3: Interaction Verification (with timeout)
    let verification = undefined;
    try {
      verification = await verifyConversionInteraction(
        page.fixture.url,
        page.signals.conversion.primaryCtaText,
        { timeoutMs: 6000 }
      );
      console.log(`Playwright Verification Status: ${verification.verificationStatus} (Form rendered: ${verification.formRendered})`);
    } catch (err: any) {
      console.warn(`Playwright verification error for ${page.id}:`, err?.message);
    }

    // Step 4: Rubric v1 calculation
    const v1Result = calculateRubricV1(page.signals);

    // Step 5: Rubric v2 calculation
    const v2Result = calculateRubricV2(page.signals, classification);

    // Step 6: Rubric v3 calculation
    const v3Result = calculateRubricV3({
      signals: page.signals,
      classification,
      semanticEval,
      verification
    });

    // Step 7: Tier C Traffic-Adjusted Benchmark (SIMULATED)
    const trafficAnalysis = analyzeTrafficPerformance(
      page.id,
      page.name,
      page.sessions,
      page.formFills,
      page.trafficSources
    );

    console.log(`\nScores:`);
    console.log(`  Rubric v1: ${v1Result.totalScore}/100`);
    console.log(`  Rubric v2: ${v2Result.totalScore}/100 (Tier A: ${v2Result.tierScores.quality.score}/60, Tier B: ${v2Result.tierScores.readiness.score}/40)`);
    console.log(`  Rubric v3: ${v3Result.totalScore}/100`);
    console.log(`    - Dim A (Persuasion): ${v3Result.dimensions.persuasion.score}/${v3Result.dimensions.persuasion.maxScore} (${v3Result.dimensions.persuasion.percentage}%)`);
    console.log(`    - Dim B (Execution):  ${v3Result.dimensions.execution.score}/${v3Result.dimensions.execution.maxScore} (${v3Result.dimensions.execution.percentage}%) [Gate: ${v3Result.dimensions.execution.gateApplied}]`);
    console.log(`    - Dim C (Experience): ${v3Result.dimensions.experience.score}/${v3Result.dimensions.experience.maxScore} (${v3Result.dimensions.experience.percentage}%)`);

    if (v3Result.gatesTriggered.length > 0) {
      console.log(`    - Gates Triggered: ${v3Result.gatesTriggered.join("; ")}`);
    }
    if (v3Result.persuasionWeaknesses.length > 0) {
      console.log(`    - Weaknesses: ${v3Result.persuasionWeaknesses.slice(0, 2).join("; ")}`);
    }

    results.push({
      pageId: page.id,
      name: page.name,
      url: page.fixture.url,
      actualCvr: page.actualCvr,
      sessions: page.sessions,
      classification,
      v1Score: v1Result.totalScore,
      v2Score: v2Result.totalScore,
      v3Result,
      trafficAnalysis
    });
  }

  // Summary ranking comparison
  console.log(`\n==================================================================`);
  console.log(`                 FINAL DISCRIMINATION COMPARISON                  `);
  console.log(`==================================================================`);
  console.table(
    results.map(r => ({
      Page: r.name,
      "Actual CVR": `${(r.actualCvr * 100).toFixed(2)}%`,
      "V1 Score": r.v1Score,
      "V2 Score": r.v2Score,
      "V3 Score": r.v3Result.totalScore,
      "V3 Persuasion (50)": r.v3Result.dimensions.persuasion.score,
      "V3 Execution (35)": r.v3Result.dimensions.execution.score,
      "V3 Experience (15)": r.v3Result.dimensions.experience.score
    }))
  );

  const outputPath = path.resolve(process.cwd(), "data/phase-3-final-results.json");
  await fs.writeFile(outputPath, JSON.stringify(results, null, 2), "utf8");
  console.log(`\nBenchmark completed. Results written to ${outputPath}`);
}

runBenchmark().catch(err => {
  console.error("Benchmark failed with error:", err);
  process.exit(1);
});
