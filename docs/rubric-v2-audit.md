# Full Audit: Rubric v2 Scoring Logic, Discrimination & Validity

**Project:** Convex — Landing Page Grader  
**Auditor:** AntiGravity Agentic Engineering  
**Scope:** Complete architectural, algorithmic, and empirical audit of Rubric v2, Page Classification, and Tier C Benchmarking  
**Status:** Audit Complete — Significant Methodological & Discriminative Deficits Identified  
**Date:** 2026-11-07  

---

## 1. Executive Summary

Rubric v2 was conceived to solve the inverted ranking of Rubric v1, where a low-converting webinar (0.11% CVR) outscored high-converting commercial pages (0.58% and 0.56% CVR). On the surface, Rubric v2 appears to have resolved this: Homepage scores 94, HR Functional scores 93, and Christus Webinar scores 93.

However, this audit reveals that **the 93–94 score clustering is a symptom of severe score inflation, structural compression, and lack of functional verification**, not genuine parity between the pages.

### Key Audit Findings:
1. **Severe Score Floor & Compression:** The effective score range for any page with standard metadata and decent PageSpeed is **75 to 100**. A landing page with *no call to action at all* still scores **75/100**; a page with a *completely broken lead form* scores **89/100**.
2. **Identical Scores Across 55% of the Rubric:** Three of the five scoring categories (**Performance & UX** [15 pts], **CTA Relevance & Visibility** [20 pts], and **Conversion Path & Friction** [20 pts]) award **identical scores (50.5 out of 55 points)** to all three benchmark pages.
3. **No Real Functional Verification:** Conversion readiness is inferred from static string presence. The presence of an external script tag (`hs-scripts.com`) is rewarded as a "verified functional lead engine" (11/11 points), despite zero verification of modal rendering, input interactivity, form submission, or network delivery.
4. **Hardcoded Benchmark Inputs:** The benchmark evaluation (`scripts/evaluate-rubric-v2.ts`) does not execute live website extraction or AI classification; it runs on curated, hardcoded in-memory fixtures.
5. **Tier C Relies on External Assumptions Presented as Empirical Findings:** The claim that all three pages have "nearly identical conversion efficiency (~0.41× to 0.53×)" is entirely derived from hardcoded channel baseline multipliers (`0.015`, `0.0015`), not from measured Leena AI data.
6. **Normalization Distorts Weaknesses:** Marking enterprise compliance `not_applicable` on the webinar page does not withhold points—it scales up the remaining signals, effectively awarding the webinar **17.5/20 on Trust** despite having only 4 logos and zero verified certifications.

---

## 2. Complete Scoring Pipeline Trace

The complete scoring pipeline flows across multiple modules:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CONVEX SCORING PIPELINE                         │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 1. Extraction Layer (scripts/inspect-pages.mjs)                        │
│    Input: URL string                                                   │
│    Execution: Cheerio static HTTP fetch. (No headless browser/JS exec) │
│    Output: Raw DOM elements (title, meta, h1, h2, buttons, script tags)│
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 2. Signal Generation (MANUAL / CURATED FIXTURES in Benchmark)           │
│    Actual benchmark runner (scripts/evaluate-rubric-v2.ts) uses        │
│    pre-built JavaScript objects in BENCHMARK_PAGES, NOT live output.   │
│    Signals like 'clarityOfNextStep', 'isLowJargon' are manually curated│
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 3. Page Classification (src/features/ai/classifier.ts)                 │
│    Input: RawPageInput (url, title, headings, ctas)                    │
│    Execution: Deterministic regex heuristics.                          │
│    (OpenAI client is NOT wired into the benchmark evaluation loop;     │
│    it was tested in an isolated script but evaluate-rubric-v2 calls    │
│    deterministicClassify directly)                                     │
│    Output: PageClassification (pageType, visitorIntent, targetAudience)│
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 4. Deterministic Scoring Engine (src/features/scoring/rubric-v2.ts)    │
│    Input: PageSignals + PageClassification                             │
│    Execution:                                                          │
│    - Tier A: Quality (60 pts max: Perf 15, Messaging 25, Trust 20)    │
│    - Tier B: Readiness (40 pts max: CTA 20, Path 20)                   │
│    - Normalization: buildCategoryV2() filters out 'not_applicable'     │
│      signals and scales remaining earned points to fill category weight│
│    Output: RubricV2Result (totalScore: 0-100, tierScores, categories)  │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 5. Tier C Diagnostic (src/features/benchmark/traffic-adjusted.ts)      │
│    Input: sessions, formFills, trafficSources distribution             │
│    Execution: Hardcoded channel baseline calculation                   │
│    Output: TrafficIntentIndex, expectedCvr, conversionEfficiency       │
└────────────────────────────────────────────────────────────────────────┘
```

### Pipeline Reality Check:
- **Live extraction vs Fixtures:** The benchmark runner (`evaluate-rubric-v2.ts`) does **not** fetch URLs live; it reads from hardcoded in-memory objects (`BENCHMARK_PAGES`).
- **AI Execution:** The benchmark runner calls `deterministicClassify()`, not `classifyPage(..., aiClient)`. AI was tested in `scripts/test-openai-classifier.ts`, but the scoring engine benchmark does not invoke the LLM.
- **Signal Derivation:** Critical CRO signals (`hasConcreteOutcome`, `isLowJargon`, `leadCaptureEngine`) were boolean flags set by human curation during Phase 1/2 teardowns.

---

## 3. Criterion-Level Scoring Breakdown

Below is the complete, criterion-level breakdown of every single point awarded to each of the three Leena AI benchmark pages.

### A. HR Functional Page (`https://leena.ai/function/hr`) — Total Score: 93/100

| Criterion | Tier | Max Pts | Earned | Signal Value | Status | Extracted Evidence | Scoring Rule | Normalization Applied |
| :--- | :---: | :---: | :---: | :--- | :---: | :--- | :--- | :--- |
| `perf_lcp_speed` | A | 6.0 | 6.0 | `2.20s` | `passed` | LCP: 2.20s (Good <= 2.5s) | `lcpSeconds <= 2.5` | None (Direct) |
| `perf_cls_stability` | A | 5.0 | 5.0 | `0.030` | `passed` | CLS: 0.030 (Good <= 0.100) | `cls <= 0.10` | None (Direct) |
| `ux_mobile_responsiveness` | A | 4.0 | 4.0 | `true` | `passed` | Viewport meta configured | `hasViewportMeta === true` | None (Direct) |
| **Category: Performance & UX** | **A** | **15.0** | **15.0** | | | | | **15.0 / 15.0 (100%)** |
| `msg_headline_clarity` | A | 6.0 | 6.0 | 1 H1 detected | `passed` | "Most HR requests shouldn't reach a human..." | `h1.length === 1` | None (Direct) |
| `msg_concrete_value_prop` | A | 9.0 | 9.0 | Quote present | `passed` | "Harrison closes Tier-1 HR requests in seconds..." | `hasConcreteOutcome === true` | None (Direct) |
| `msg_problem_fit` | A | 6.0 | 6.0 | Quote present | `passed` | "Most HR requests shouldn't reach a human..." | `hasProblem && isFunctionalPage` | None (Adaptive weight 6) |
| `msg_plain_language` | A | 4.0 | 4.0 | `true` | `passed` | Copy uses clear operational terminology | `isLowJargon === true` | None (Adaptive weight 4) |
| **Category: Messaging & Prop** | **A** | **25.0** | **25.0** | | | | | **25.0 / 25.0 (100%)** |
| `trust_customer_proof` | A | 7.0 | 4.5 | 6 logos | `partial` | Workday, ServiceNow, Oracle, SAP | `logoCount >= 3 && logoCount < 8` | Awarded 65% of weight |
| `trust_compliance_security` | A | 6.0 | 6.0 | 4 certs | `passed` | SOC 2, ISO 27001, GDPR, HIPAA | `complianceCertifications.length >= 2` | None (Direct) |
| `trust_quantified_case_proof`| A | 7.0 | 7.0 | Quote present | `passed` | "Automates 70%+ of HR tickets..." | `hasQuantifiedCaseStudy === true` | None (Direct) |
| **Category: Trust & Credibility**| **A** | **20.0** | **17.5** | | | | | **17.5 / 20.0 (87.5%)** |
| `cta_above_fold_placement` | B | 7.0 | 7.0 | `true` | `passed` | CTA in hero: "Book a demo" | `hasAboveTheFoldCta === true` | None (Direct) |
| `cta_intent_alignment` | B | 8.0 | 8.0 | "Book a demo" | `passed` | Matches functional demo objective | `/demo\|trial\|start/i.test(cta)` | None (Direct) |
| `cta_action_verb_copy` | B | 5.0 | 5.0 | "Book a demo" | `passed` | Active imperative verb | `isActionOrientedCta === true` | None (Direct) |
| **Category: CTA Relevance** | **B** | **20.0** | **20.0** | | | | | **20.0 / 20.0 (100%)** |
| `conv_lead_capture_mechanism`| B | 11.0 | 11.0 | HubSpot script | `passed` | HubSpot dynamic script verified | `leadCaptureEngine === true` | None (Direct) |
| `conv_next_step_transparency`| B | 9.0 | 4.5 | `false` | `partial` | Next steps are implicit | Default fallback to partial | Awarded 50% of weight |
| **Category: Path & Friction** | **B** | **20.0** | **15.5** | | | | | **15.5 / 20.0 (77.5%)** |
| **TOTAL TIER A (Quality)** | | **60.0** | **57.5** | | | | | **58 / 60 (Rounded)** |
| **TOTAL TIER B (Readiness)** | | **40.0** | **35.5** | | | | | **36 / 40 (Rounded)** |
| **OVERALL RUBRIC V2 SCORE** | | **100.0** | **93.0** | | | | | **93 / 100** |

---

### B. Homepage (`https://leena.ai/`) — Total Score: 94/100

| Criterion | Tier | Max Pts | Earned | Signal Value | Status | Extracted Evidence | Scoring Rule | Normalization Applied |
| :--- | :---: | :---: | :---: | :--- | :---: | :--- | :--- | :--- |
| `perf_lcp_speed` | A | 6.0 | 6.0 | `2.40s` | `passed` | LCP: 2.40s (Good <= 2.5s) | `lcpSeconds <= 2.5` | None (Direct) |
| `perf_cls_stability` | A | 5.0 | 5.0 | `0.040` | `passed` | CLS: 0.040 (Good <= 0.100) | `cls <= 0.10` | None (Direct) |
| `ux_mobile_responsiveness` | A | 4.0 | 4.0 | `true` | `passed` | Viewport meta configured | `hasViewportMeta === true` | None (Direct) |
| **Category: Performance & UX** | **A** | **15.0** | **15.0** | | | | | **15.0 / 15.0 (100%)** |
| `msg_headline_clarity` | A | 6.0 | 6.0 | 1 H1 detected | `passed` | Primary H1: "Enterprise AI, live in 45 days" | `h1.length === 1` | None (Direct) |
| `msg_concrete_value_prop` | A | 9.0 | 9.0 | Quote present | `passed` | "Go live in 45 days. 70%+ tickets..." | `hasConcreteOutcome === true` | None (Direct) |
| `msg_problem_fit` | A | 4.0 | 2.8 | `undefined` | `partial` | No explicit problem; positive assertion | Non-functional page gets 70% | Awarded 70% of 4 pts (2.8) |
| `msg_plain_language` | A | 6.0 | 6.0 | `true` | `passed` | Copy uses clear operational terminology | `isLowJargon === true` | None (Adaptive weight 6) |
| **Category: Messaging & Prop** | **A** | **25.0** | **23.8** | | | | | **23.8 / 25.0 (95.2%)** |
| `trust_customer_proof` | A | 7.0 | 7.0 | 11 logos | `passed` | Workday, Oracle, SAP, ServiceNow, Cencora... | `logoCount >= 8` | None (Direct) |
| `trust_compliance_security` | A | 6.0 | 6.0 | 4 certs | `passed` | SOC 2, ISO 27001, GDPR, HIPAA | `complianceCertifications.length >= 2` | None (Direct) |
| `trust_quantified_case_proof`| A | 7.0 | 7.0 | Quote present | `passed` | "Powering 20M+ employees..." | `hasQuantifiedCaseStudy === true` | None (Direct) |
| **Category: Trust & Credibility**| **A** | **20.0** | **20.0** | | | | | **20.0 / 20.0 (100%)** |
| `cta_above_fold_placement` | B | 7.0 | 7.0 | `true` | `passed` | CTA in hero: "Book a demo" | `hasAboveTheFoldCta === true` | None (Direct) |
| `cta_intent_alignment` | B | 8.0 | 8.0 | "Book a demo" | `passed` | Matches discovery/demo objective | `/demo\|trial\|start/i.test(cta)` | None (Direct) |
| `cta_action_verb_copy` | B | 5.0 | 5.0 | "Book a demo" | `passed` | Active imperative verb | `isActionOrientedCta === true` | None (Direct) |
| **Category: CTA Relevance** | **B** | **20.0** | **20.0** | | | | | **20.0 / 20.0 (100%)** |
| `conv_lead_capture_mechanism`| B | 11.0 | 11.0 | HubSpot script | `passed` | HubSpot dynamic script verified | `leadCaptureEngine === true` | None (Direct) |
| `conv_next_step_transparency`| B | 9.0 | 4.5 | `false` | `partial` | Next steps are implicit | Default fallback to partial | Awarded 50% of weight |
| **Category: Path & Friction** | **B** | **20.0** | **15.5** | | | | | **15.5 / 20.0 (77.5%)** |
| **TOTAL TIER A (Quality)** | | **60.0** | **58.8** | | | | | **59 / 60 (Rounded)** |
| **TOTAL TIER B (Readiness)** | | **40.0** | **35.5** | | | | | **36 / 40 (Rounded)** |
| **OVERALL RUBRIC V2 SCORE** | | **100.0** | **94.3** | | | | | **94 / 100** |

---

### C. Christus Health Webinar (`https://leena.ai/.../webinar`) — Total Score: 93/100

| Criterion | Tier | Max Pts | Earned | Signal Value | Status | Extracted Evidence | Scoring Rule | Normalization Applied |
| :--- | :---: | :---: | :---: | :--- | :---: | :--- | :--- | :--- |
| `perf_lcp_speed` | A | 6.0 | 6.0 | `1.80s` | `passed` | LCP: 1.80s (Good <= 2.5s) | `lcpSeconds <= 2.5` | None (Direct) |
| `perf_cls_stability` | A | 5.0 | 5.0 | `0.020` | `passed` | CLS: 0.020 (Good <= 0.100) | `cls <= 0.10` | None (Direct) |
| `ux_mobile_responsiveness` | A | 4.0 | 4.0 | `true` | `passed` | Viewport meta configured | `hasViewportMeta === true` | None (Direct) |
| **Category: Performance & UX** | **A** | **15.0** | **15.0** | | | | | **15.0 / 15.0 (100%)** |
| `msg_headline_clarity` | A | 6.0 | 6.0 | 1 H1 detected | `passed` | "What It Really Takes to Get 51,000 Employees..." | `h1.length === 1` | None (Direct) |
| `msg_concrete_value_prop` | A | 9.0 | 9.0 | Quote present | `passed` | "51,000 employees using AI." | `hasConcreteOutcome === true` | None (Direct) |
| `msg_problem_fit` | A | 4.0 | 4.0 | Quote present | `passed` | "Security review, content cleanup, adoption." | `hasProblem && !isFunctionalPage`| Adaptive weight 4 |
| `msg_plain_language` | A | 6.0 | 6.0 | `true` | `passed` | Copy uses clear operational terminology | `isLowJargon === true` | Adaptive weight 6 |
| **Category: Messaging & Prop** | **A** | **25.0** | **25.0** | | | | | **25.0 / 25.0 (100%)** |
| `trust_customer_proof` | A | 7.0 | 4.5 | 4 logos | `partial` | Christus Health, Partner Logo | `logoCount >= 3 && logoCount < 8` | Raw 4.5 earned |
| `trust_compliance_security` | A | 0.0 | 0.0 | Excluded | `not_applicable` | Not applicable for educational content | `isEducationalPage === true` | **Excluded from denominator** |
| `trust_quantified_case_proof`| A | 13.0 | 13.0 | Quote present | `passed` | "Inside CHRISTUS Health launch across 51,000..."| `hasQuantifiedCaseStudy === true` | **Weight inflated 7 → 13** |
| **Category: Trust & Credibility**| **A** | **20.0** | **17.5** | | | | | **Scaled: (17.5/20) = 87.5%** |
| `cta_above_fold_placement` | B | 7.0 | 7.0 | `true` | `passed` | CTA in hero: "Watch now" | `hasAboveTheFoldCta === true` | None (Direct) |
| `cta_intent_alignment` | B | 8.0 | 8.0 | "Watch now" | `passed` | Matches educational content objective | `/watch\|register\|access/i.test(cta)`| None (Direct) |
| `cta_action_verb_copy` | B | 5.0 | 5.0 | "Watch now" | `passed` | Active imperative verb | `isActionOrientedCta === true` | None (Direct) |
| **Category: CTA Relevance** | **B** | **20.0** | **20.0** | | | | | **20.0 / 20.0 (100%)** |
| `conv_lead_capture_mechanism`| B | 11.0 | 11.0 | HubSpot script | `passed` | HubSpot dynamic script verified | `leadCaptureEngine === true` | None (Direct) |
| `conv_next_step_transparency`| B | 9.0 | 4.5 | `false` | `partial` | GATING FRICTION: 'Watch now' gates form | `isGatedUnexpectedly === true` | Awarded 50% of weight |
| **Category: Path & Friction** | **B** | **20.0** | **15.5** | | | | | **15.5 / 20.0 (77.5%)** |
| **TOTAL TIER A (Quality)** | | **60.0** | **57.5** | | | | | **58 / 60 (Rounded)** |
| **TOTAL TIER B (Readiness)** | | **40.0** | **35.5** | | | | | **36 / 40 (Rounded)** |
| **OVERALL RUBRIC V2 SCORE** | | **100.0** | **93.0** | | | | | **93 / 100** |

---

## 4. Score Inflation and Normalization Analysis

### A. The Inherent Score Floor: 75/100
Because Tier A (Quality) represents 60 points, any website that possesses standard SEO tags, decent PageSpeed, and readable English copy receives **55–60 points before a single conversion element is evaluated**.

In Tier B, the presence of an active verb on a button ("Book", "Watch", "Get") and placing any button above the fold automatically awards **12 out of 40 readiness points**. Even with no next-step information and a vague CTA destination, a page receives partial credit (4.5 pts).

**Result:** The effective mathematical floor for a live SaaS page is **75/100**. A catastrophic failure in conversion readiness can only dock a page 25 points.

### B. Normalization Distortion via `not_applicable`
In `rubric-v2.ts` (lines 351–369):
```typescript
function buildCategoryV2(
  id: string, name: string, dimension: "quality" | "readiness",
  weight: number, signals: EvaluationSignal[]
): RubricV2Category {
  const applicableSignals = signals.filter(s => s.status !== "not_applicable");
  const maxPossible = applicableSignals.reduce((sum, s) => sum + s.maxPoints, 0);
  const earned = applicableSignals.reduce((sum, s) => sum + s.earnedPoints, 0);

  const percentage = maxPossible > 0 ? (earned / maxPossible) : 1;
  const scaledScore = Number((percentage * weight).toFixed(1));
  // ...
}
```

When `trust_compliance_security` is marked `not_applicable` on the webinar page:
- The compliance signal weight (6 pts) is removed from the denominator (`maxPossible = 20 - 6 = 14`).
- But in `rubric-v2.ts` lines 215–216, the code **also reallocated the 6 points into `trust_quantified_case_proof`** (`weight = isEducationalPage ? 13 : 7`)!
- This was a **double-adjustment**: the weight was explicitly inflated from 7 to 13, AND the category percentage was normalized over applicable signals.
- As a result, the webinar page earned **17.5 / 20 points on Trust**, identical to the HR Functional page which actually possesses 4 verified enterprise security certifications!

### C. Breakdown of Score Sources Across the Three Pages

| Score Source | Homepage (94) | HR Functional (93) | Christus Webinar (93) |
| :--- | :---: | :---: | :---: |
| **Verified Measured Performance** (LCP, CLS, Viewport) | 15.0 pts (16%) | 15.0 pts (16%) | 15.0 pts (16%) |
| **Verified Content Hierarchy** (Single H1) | 6.0 pts (6%) | 6.0 pts (6%) | 6.0 pts (6%) |
| **Element Presence Only** (Script tag, button above fold, active verb) | 23.0 pts (24%) | 23.0 pts (25%) | 23.0 pts (25%) |
| **Subjective / Unverified String Matching** (Outcome quote, problem quote) | 21.0 pts (22%) | 21.0 pts (23%) | 19.0 pts (20%) |
| **Default Partial Credit** (Implicit next steps, problem fit) | 7.3 pts (8%) | 4.5 pts (5%) | 8.5 pts (9%) |
| **Trust Evidence (Logos + Certs)** | 19.0 pts (20%) | 17.5 pts (19%) | 4.5 pts (5%) |
| **Normalization Scaling / Exclusion Inflation** | 3.0 pts (3%) | 6.0 pts (6%) | **17.0 pts (18%)** |

> [!WARNING]
> On the Christus Webinar page, **18% of the total awarded score (17 points)** is generated by mathematical scaling and signal exclusion rather than direct evidence.

---

## 5. Page-Type Adaptation Analysis

Did classifying the pages actually change how they were graded?

### Universal vs Context-Dependent Criteria

| Category | Criteria Count | Universal Criteria | Context-Adaptive Criteria |
| :--- | :---: | :---: | :---: |
| Performance & UX | 3 | 3 (100%) | 0 (0%) |
| Messaging & Value Prop | 4 | 2 (50%) | 2 (50%) [`msg_problem_fit`, `msg_plain_language`] |
| Trust & Credibility | 3 | 1 (33%) | 2 (67%) [`trust_compliance_security`, `trust_quantified_case_proof`] |
| CTA Relevance & Visibility | 3 | 2 (67%) | 1 (33%) [`cta_intent_alignment`] |
| Conversion Path & Friction | 2 | 1 (50%) | 1 (50%) [`conv_next_step_transparency`] |
| **Total Criteria** | **15** | **9 (60%)** | **6 (40%)** |

### Where Adaptation Worked:
- **Homepage Outcome Assertion:** The Homepage did not lose 7 points for lacking a problem statement (as it did in Rubric v1). It received 2.8/4 points for positive platform outcome assertions.
- **Webinar Compliance Gating:** The webinar did not fail for lacking SOC 2 badges.

### Where Adaptation Failed:
- **No Penalty for Competing Sales CTAs on Educational Pages:** The Christus Webinar page features 5 separate enterprise demo CTAs in its header and body ("Book a demo", "Schedule demo", "Talk to sales") competing with "Watch now". Rubric v2 evaluated only the primary CTA ("Watch now") and gave it **20/20 on CTA relevance**, completely ignoring the severe conversion dilution caused by conflicting secondary sales actions.
- **Identical Conversion Path Expectations:** Both an enterprise sales demo and an educational webinar were evaluated using the identical 11-point lead capture check. A webinar gated by a heavy enterprise qualification modal should have been flagged for severe friction, but received 11/11.

---

## 6. Conversion-Path Verification Audit

This is the most critical vulnerability in the current grader.

| Conversion Step | Claimed by Grader | What the Code Actually Checks | Real-World Verification Status |
| :--- | :--- | :--- | :--- |
| **CTA Above Fold** | "Immediate visual availability" | `signals.conversion.hasAboveTheFoldCta === true` (Boolean flag from fixture) | ❌ **Unverified.** No viewport bounding rect or pixel coordinates measured. |
| **CTA Clickability** | "Action-oriented interactive commitment" | Checks if `<button>` or `<a>` tag has text matching active verb regex | ❌ **Unverified.** Does not check for CSS `pointer-events: none`, z-index overlay, or disabled state. |
| **CTA Destination** | "Clear next-step action" | Reads `href` attribute string | ❌ **Unverified.** If `href="#"`, assumes JS modal handles it without checking event listeners. |
| **Dynamic Modal Rendering** | "Verified lead engine: HubSpot Modal" | Checks if HTML string contains `js.hs-scripts.com` or `hbspt` | ❌ **Unverified.** The presence of an analytics/tracking script is assumed to be an active, working modal dialog. |
| **Form Interactivity** | "Functional lead capture engine" | `signals.conversion.leadCaptureEngine === true` | ❌ **Unverified.** Zero forms rendered in DOM; no inputs tested for autofocus, validation, or keystrokes. |
| **Form Submittability** | "Captured visitor intent" | Inferred from script presence | ❌ **Unverified.** Network requests (`POST /submissions/v3/...`) are never executed or monitored. |
| **Post-Submission Confirmation** | "Expectation setting & next step clarity" | String regex on body text for next-step sentences | ❌ **Unverified.** Thank-you state, redirect URL, or confirmation email triggers are completely unverified. |

> [!CAUTION]
> **Convex currently grades the *appearance of conversion infrastructure*, not actual conversion functionality.** A website with a completely broken HubSpot API key or a JavaScript syntax error that prevents the modal from opening receives a **perfect 11/11 on lead capture**.

---

## 7. Tier C Methodology Audit

In `src/features/benchmark/traffic-adjusted-benchmark.ts`, the diagnostic reports:
- HR Functional: Intent Index 87%, Efficiency 0.46×
- Homepage: Intent Index 76%, Efficiency 0.53×
- Christus Webinar: Intent Index 28%, Efficiency 0.41×

### Audit of Data Origins:

```typescript
// From src/features/benchmark/traffic-adjusted-benchmark.ts (lines 28-35)
const CHANNEL_BASELINES: Record<keyof TrafficSourceDistribution, { intentWeight: number; baselineCvr: number }> = {
  paid_search:   { intentWeight: 1.00, baselineCvr: 0.0150 }, // 1.5% assumed
  organic_search:{ intentWeight: 0.85, baselineCvr: 0.0120 }, // 1.2% assumed
  direct:        { intentWeight: 0.75, baselineCvr: 0.0100 }, // 1.0% assumed
  email:         { intentWeight: 0.60, baselineCvr: 0.0080 }, // 0.8% assumed
  paid_social:   { intentWeight: 0.20, baselineCvr: 0.0015 }, // 0.15% assumed
  others:        { intentWeight: 0.40, baselineCvr: 0.0050 }  // 0.5% assumed
};
```

### Critical Deficits in Tier C:
1. **The Baselines are Arbitrary Hardcoded Constants:** The baseline CVR numbers (`1.5%` for paid search, `0.15%` for paid social) are external assumptions written into the codebase. They were **not measured or present in Leena AI's `Website Data - Summary.xlsx`**.
2. **Circular Validation:** Because the baseline for Paid Social was set to `0.0015` (0.15%) and the webinar's observed CVR was `0.0011` (0.11%), the calculated efficiency mathematically came out to `0.11 / 0.28 = 0.41×`. If we had set the paid social baseline to `0.0030` (a common B2B benchmark for high-value assets), the efficiency would have been `0.20×` (poor).
3. **Leena AI Data Contains No Channel-Level Conversions:** The spreadsheet provided total form fills per page (103, 11, 14), but **zero data on which channels produced those form fills**. Claiming that the webinar converted with "0.41× efficiency" assumes uniform drop-off across channels without data.
4. **Conclusion on Tier C:** While the conceptual hypothesis (cold social traffic converts lower than commercial search) is sound CRO theory, **presenting 0.41× vs 0.46× as an empirical proof is scientifically invalid**. It is a model output reflecting the model's own hardcoded assumptions.

---

## 8. Sensitivity and Discrimination Test Results

To test whether Rubric v2 actually discriminates, we ran 8 controlled scenarios through the live `calculateRubricV2()` function:

```
========================================================================================
                         SENSITIVITY & DISCRIMINATION RESULTS
========================================================================================
Scenario                                     Score    Tier A (Quality)  Tier B (Readiness)
----------------------------------------------------------------------------------------
0. Baseline High Quality & Readiness        100/100   60/60 (100%)      40/40 (100%)
1. Vague Messaging (no outcome, high jargon) 80/100   40/60 (67%)       40/40 (100%)
2. NO CALL TO ACTION AT ALL (0 CTAs, 0 Form) 75/100   60/60 (100%)      15/40 (38%)
3. BROKEN Lead Form (leadCapture = false)    89/100   60/60 (100%)      29/40 (73%)
4. Webinar with Misleading Sales CTA         96/100   60/60 (100%)      36/40 (90%)
5. Functional Page with ZERO Trust Proof     83/100   43/60 (72%)       40/40 (100%)
6. Heavy Not-Applicable Exclusions           96/100   60/60 (100%)      36/40 (90%)
7. Failed Performance (LCP 6.0s, CLS 0.45)   85/100   45/60 (75%)       40/40 (100%)
8. Completely Broken Conversion Readiness    75/100   60/60 (100%)      15/40 (38%)
========================================================================================
```

### Analysis of Sensitivity Results:
1. **Scenario 2 (No CTA At All): Scores 75/100 ("C" Grade)**  
   A landing page that literally cannot convert a single visitor receives a 75/100. Why? Because Tier A gives it 60/60, and in Tier B it still receives **15 out of 40 points** because partial-credit defaults award points even when the CTA string is empty.
2. **Scenario 3 (Broken Lead Form): Scores 89/100 ("B+" Grade)**  
   If a company's lead form fails to render or submit, the page loses only 11 points out of 100. A score of 89 indicates to an executive that the page is in "excellent condition," when it is generating zero leads.
3. **Scenario 4 (Misleading CTA on Webinar): Scores 96/100**  
   Putting a "Book enterprise sales demo" CTA on an educational webinar yields 96/100 because the rubric awards points for having an action-oriented verb without penalizing intent mismatch severely.
4. **Scenario 5 (Zero Trust Signals): Scores 83/100**  
   An enterprise B2B page with zero logos, zero compliance certifications, and zero customer case studies only drops to 83.

---

## 9. Root Causes of the 93–94 Score Clustering

Why did the Homepage (94), HR Functional (93), and Christus Webinar (93) score almost identically?

```
┌────────────────────────────────────────────────────────────────────────┐
│               THE 4 DRIVERS OF 93–94 SCORE CLUSTERING                  │
├────────────────────────────────────────────────────────────────────────┤
│ 1. 55% of the Rubric is Invariant:                                     │
│    Perf & UX (15 pts), CTA Relevance (20 pts), and Path & Friction     │
│    (20 pts) awarded 50.5 identical points to all three pages.          │
│                                                                        │
│ 2. Generous Partial Credit:                                            │
│    Every failure state (e.g. implicit next steps, missing problem fit) │
│    awards 50% to 70% of the available points rather than zero.         │
│                                                                        │
│ 3. Category Scaling Compensates for Missing Signals:                   │
│    Removing compliance certs from the webinar scaled up its case study │
│    points, giving it 17.5/20 on Trust (identical to HR Functional).    │
│                                                                        │
│ 4. Compressed Dynamic Range:                                           │
│    The scoring scale only operates between 75 and 100. A 1-point delta │
│    is noise within a 25-point effective bandwidth.                     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 10. Prioritized Recommendations

### Critical Priority (Immediate Architectural Fixes)

#### Finding C-1: Conversion Readiness Has No Veto Power (Gating)
- **Code Reference:** `src/features/scoring/rubric-v2.ts` (lines 323–345)
- **Problem:** Tier A (Quality) can carry a page to 60–75 points even if conversion is impossible (0 CTAs or broken form).
- **Recommendation:** Implement **Gating Multipliers**. If `leadCaptureEngine` is `failed` or no CTA exists, Tier B readiness must multiply total score by `0.3×` or cap the total score at `45/100`. A page that cannot convert is not a B-grade page; it is a failed landing page.

#### Finding C-2: Inferred Script Presence Substituted for Functional Verification
- **Code Reference:** `src/features/scoring/rubric-v2.ts` (lines 280–298)
- **Problem:** `leadCaptureEngine` awards 11/11 points merely because `hs-scripts.com` appears in the HTML.
- **Recommendation:** Reclassify this signal status to `not_tested` unless verified via headless browser (Playwright) or DOM form inspector. Award a maximum of 3 points for "Script Detected" and reserve 8 points for verified input rendering and submission event readiness.

---

### High Priority (Scoring & Normalization Refinements)

#### Finding H-1: Double Normalization on Excluded Signals
- **Code Reference:** `src/features/scoring/rubric-v2.ts` (lines 215–216 and lines 352–365)
- **Problem:** Compliance certs are marked `not_applicable` AND their weight is shifted to case study proof, inflating the webinar's trust score to 17.5/20.
- **Recommendation:** Choose ONE normalization method: either dynamically reweight applicable signals OR exclude the criterion from the denominator without manual weight reallocation.

#### Finding H-2: CTA Objective Dilution Ignored
- **Code Reference:** `src/features/scoring/rubric-v2.ts` (lines 228–245)
- **Problem:** The grader only evaluates the primary CTA, ignoring competing CTAs that distract from the page's core objective (e.g., 5 demo buttons on an educational webinar).
- **Recommendation:** Add a `cta_focus_ratio` signal (5 pts) measuring what percentage of rendered buttons support the primary conversion objective.

#### Finding H-3: De-link Tier C Assumptions from Empirical Claims
- **Code Reference:** `src/features/benchmark/traffic-adjusted-benchmark.ts` (lines 28–35)
- **Problem:** Hardcoded channel multipliers (`0.015`, `0.0015`) are presented as evidence that the pages convert with equal efficiency.
- **Recommendation:** Explicitly document Tier C as a **Simulated Traffic Sensitivity Model**, not an empirical finding. Clearly state that Leena AI's dataset lacks channel-level conversion attribution.

---

### Medium Priority (Signal Quality & Granularity)

#### Finding M-1: Excessive Partial Credit Defaults
- **Code Reference:** `src/features/scoring/rubric-v2.ts` (lines 142, 305)
- **Problem:** Failing `clarityOfNextStep` or `problem_fit` awards 50%–70% of points by default.
- **Recommendation:** Tighten partial credit to 25% or 0% unless positive secondary evidence is verified.

#### Finding M-2: Live Pipeline Integration
- **Code Reference:** `scripts/evaluate-rubric-v2.ts` (lines 27–163)
- **Problem:** The benchmark script evaluates hardcoded fixture objects rather than running the Cheerio extractor and OpenAI classifier dynamically.
- **Recommendation:** Wire `evaluate-rubric-v2.ts` to execute `inspectPage()` and `classifyPage()` dynamically, writing live extracted signals to disk.

---

### Low Priority (Documentation & Cleanup)

#### Finding L-1: Vitest Configuration Warning
- **Code Reference:** `vitest.config.ts` (line 1)
- **Problem:** ESM syntax in CommonJS config loader outputs non-blocking CLI warnings.
- **Recommendation:** Rename `vitest.config.ts` to `vitest.config.mts` or set `"type": "module"` in `package.json`.
