import { classifyPage, deterministicClassify } from "../src/features/ai/classifier";
import { OpenAIClassifier } from "../src/features/ai/openai-classifier";
import { calculateRubricV2 } from "../src/features/scoring/rubric-v2";
import {
  homepageFixture,
  hrFunctionalFixture,
  christusWebinarFixture
} from "../tests/fixtures/classification-fixtures";
import { PageSignals } from "../src/types/analysis";
import fs from "node:fs/promises";

// Load benchmark signals
const BENCHMARK_SIGNALS: Record<string, { name: string; fixture: typeof homepageFixture; signals: PageSignals }> = {
  homepage: {
    name: "Homepage",
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
  hr_functional: {
    name: "HR Functional Page",
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
  christus_webinar: {
    name: "Christus Health Webinar",
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
};

async function runComparison() {
  console.log("=================================================================");
  console.log("   CONTROLLED EXPERIMENT: OPENAI vs DETERMINISTIC CLASSIFICATION ");
  console.log("=================================================================\n");

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("ERROR: OPENAI_API_KEY not found in environment.");
    process.exit(1);
  }

  const aiClient = new OpenAIClassifier(apiKey, "gpt-4o-mini");

  const results: Record<string, {
    page: string;
    deterministic: {
      classification: unknown;
      score: unknown;
    };
    ai: {
      classification: unknown;
      score: unknown;
    };
    delta: {
      pageTypeMatch: boolean;
      intentMatch: boolean;
      confidenceDelta: number;
      scoreDelta: number;
    };
  }> = {};

  for (const [key, item] of Object.entries(BENCHMARK_SIGNALS)) {
    console.log(`\nEvaluating: ${item.name} (${item.signals.url})...`);

    // Track A: Deterministic
    const detClassification = deterministicClassify(item.fixture);
    const detScore = calculateRubricV2(item.signals, detClassification);

    // Track B: OpenAI
    console.log(`  Calling OpenAI (gpt-4o-mini) for semantic interpretation...`);
    const aiClassification = await classifyPage(item.fixture, aiClient);
    const aiScore = calculateRubricV2(item.signals, aiClassification);

    const pageTypeMatch = detClassification.pageType === aiClassification.pageType;
    const intentMatch = detClassification.visitorIntent === aiClassification.visitorIntent;
    const confidenceDelta = Number((aiClassification.confidence - detClassification.confidence).toFixed(2));
    const scoreDelta = aiScore.totalScore - detScore.totalScore;

    results[key] = {
      page: item.name,
      deterministic: {
        classification: detClassification,
        score: detScore
      },
      ai: {
        classification: aiClassification,
        score: aiScore
      },
      delta: {
        pageTypeMatch,
        intentMatch,
        confidenceDelta,
        scoreDelta
      }
    };

    console.log(`  [Track A - Deterministic]`);
    console.log(`    PageType: ${detClassification.pageType} (Conf: ${detClassification.confidence}) | Intent: ${detClassification.visitorIntent}`);
    console.log(`    Audience: Segments=[${detClassification.targetAudience.segments.join(", ")}], Roles=[${detClassification.targetAudience.roles.join(", ")}]`);
    console.log(`    Primary Objective: "${detClassification.conversionObjectives.primary}"`);
    console.log(`    Rubric v2 Score: ${detScore.totalScore}/100 (Tier A: ${detScore.tierScores.quality.score}/60, Tier B: ${detScore.tierScores.readiness.score}/40)`);

    console.log(`  [Track B - OpenAI]`);
    console.log(`    PageType: ${aiClassification.pageType} (Conf: ${aiClassification.confidence}) | Intent: ${aiClassification.visitorIntent}`);
    console.log(`    Audience: Segments=[${aiClassification.targetAudience.segments.join(", ")}], Roles=[${aiClassification.targetAudience.roles.join(", ")}], Ind=[${aiClassification.targetAudience.industries.join(", ")}]`);
    console.log(`    Primary Objective: "${aiClassification.conversionObjectives.primary}"`);
    console.log(`    Business Problem: ${aiClassification.businessProblem?.identified ? `"${aiClassification.businessProblem.statement}" (Specificity: ${aiClassification.businessProblem.specificity})` : "None identified"}`);
    console.log(`    Value Prop: "${aiClassification.valueProposition?.statement}" (Metric: ${aiClassification.valueProposition?.speedToValueMetric || "N/A"})`);
    console.log(`    Messaging Quality: Clarity ${aiClassification.messagingQuality?.clarityScore}/10 | Low Jargon: ${aiClassification.messagingQuality?.isLowJargon} | ${aiClassification.messagingQuality?.summary}`);
    console.log(`    Rubric v2 Score: ${aiScore.totalScore}/100 (Tier A: ${aiScore.tierScores.quality.score}/60, Tier B: ${aiScore.tierScores.readiness.score}/40)`);

    console.log(`  [Comparison Delta]`);
    console.log(`    PageType Match: ${pageTypeMatch ? "YES" : "NO"} | Intent Match: ${intentMatch ? "YES" : "NO"} | Conf Delta: ${confidenceDelta} | Score Delta: ${scoreDelta > 0 ? `+${scoreDelta}` : scoreDelta}`);
  }

  const outputPayload = {
    evaluatedAt: new Date().toISOString(),
    model: "gpt-4o-mini",
    results
  };

  await fs.writeFile("data/ai-vs-deterministic-comparison.json", JSON.stringify(outputPayload, null, 2));
  console.log("\nSaved detailed comparison JSON to data/ai-vs-deterministic-comparison.json");
}

runComparison();
