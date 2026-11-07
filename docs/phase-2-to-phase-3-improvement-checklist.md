# Phase 2 → Phase 3: Improvement Checklist & Methodological Blueprint

**Project:** Convex — Landing Page Grader  
**Author:** Shobhit Tiwari  
**Objective:** Fix methodological weaknesses identified in Phase 2 before implementing Rubric v2, ensuring the scoring engine measures genuine conversion readiness rather than rewarding superficial marketing artifacts.

---

## 1. Architectural Foundation: The 3 Evaluation Tiers

Instead of conflating page construction, conversion mechanics, and external traffic into a single arbitrary number, Convex strictly separates evaluation into three distinct layers:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CONVEX EVALUATION TIERS                         │
├────────────────────────────────────────────────────────────────────────┤
│  Tier A: Landing Page Quality (Craftsmanship)                          │
│  - Performance & Core Web Vitals (de-duplicated)                       │
│  - Content hierarchy & structural readability                          │
│  - Messaging clarity & proposition coherence                           │
│  - Verifiable institutional trust & credibility                        │
├────────────────────────────────────────────────────────────────────────┤
│  Tier B: Conversion Readiness (Action Facilitation)                    │
│  - CTA relevance relative to page intent & audience                    │
│  - Path friction & form complexity                                     │
│  - Value-to-friction ratio                                             │
│  - Next-step expectation clarity                                       │
├────────────────────────────────────────────────────────────────────────┤
│  Tier C: Traffic-Adjusted Performance (Analytics Benchmark)           │
│  - Acquisition channel split (Search vs Social vs Direct vs Email)     │
│  - Baseline visitor intent qualification                               │
│  - Historical conversion rates & confidence bounds                     │
│  * KEPT AS A SEPARATE BENCHMARK — Does not distort page grade *        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Page Classification Taxonomy (`classification-schema.ts`)

A landing page cannot be graded fairly without understanding its purpose. A webinar registration page is not a failed enterprise demo page, and a product tour is not an e-commerce checkout.

| Page Type | Primary Objective | Expected Visitor Intent | Primary Conversion Action | Acceptable Friction |
| :--- | :--- | :--- | :--- | :--- |
| **Homepage** | Platform discovery & brand positioning | Broad / Exploratory to High | Book Demo / Explore Solutions | Medium (Demo form / SSO tour) |
| **Functional Page** | Departmental solution evaluation (HR, IT) | High (Pain-driven search) | Book Tailored Demo | Medium-High (Role qualification) |
| **Campaign Page** | Dedicated lead generation | Focused / Paid ad landing | Submit form / Trial access | Low-Medium (Matched to ad offer) |
| **Webinar / Resource**| Educational content consumption | Low-Medium (Social/Email push)| Watch now / Register | Minimal (1–2 fields or 1-click) |
| **Case Study** | Proof & validation | Mid-Funnel consideration | Read / Download PDF | Low (Ungated or single-field) |
| **Product / Pricing** | Commercial evaluation | Very High (Buying mode) | Start Free / Talk to Sales | Low (Instant access / transparent) |

---

## 3. Signal & Evidence Contracts (`signal-schema.ts`)

Every signal must adhere to a strict, typed contract with status nuance, multi-source evidence, and confidence ratings:

```typescript
export type SignalStatus =
  | "passed"          // Criteria fully met with direct evidence
  | "partial"         // Substantially met but with measurable friction
  | "failed"          // Criteria failed
  | "not_applicable"  // Irrelevant for this page type (e.g. demo form on webinar)
  | "not_detected"    // Could not be located in static DOM
  | "not_tested";     // Dynamic element could not be executed without interaction

export interface SignalEvidence {
  source: "dom" | "browser" | "pagespeed" | "ai";
  selector?: string;
  excerpt?: string;
  observedValue?: string;
}

export interface EvaluationSignal {
  id: string;
  dimension: "quality" | "readiness";
  name: string;
  status: SignalStatus;
  rawValue?: unknown;
  normalizedScore: number; // 0 to 1
  weight: number;
  evidence: SignalEvidence[];
  rationale: string;
  confidence: number; // 0.0 to 1.0
}
```

### Signal Nuances Enforced:
1. **De-duplicating Performance:** We do not stack Lighthouse overall + LCP + CLS in a way that triple-penalizes the same slowdown. LCP measures speed; CLS measures layout stability; TTFB measures server responsiveness.
2. **Quality of Evidence over Quantity:** 3 verified Fortune 500 customer case studies with hard ROI metrics outrank 20 unverified decorative SVG logos.
3. **No False Negatives on Dynamic Modals:** If a third-party lead capture trigger (HubSpot/Marketo) is verified, it is marked `passed` or `not_tested`, never falsely penalized as `0 forms found`.

---

## 4. Statistical Correction: True Pearson on Ranks

Our Phase 2 shortcut formula assumed no tied ranks:
$$\rho_{\text{shortcut}} = 1 - \frac{6 \sum d_i^2}{n(n^2 - 1)}$$

In Phase 3, we implement the **true Pearson correlation over rank vectors**:
$$\rho = \frac{\sum (R_{x,i} - \bar{R}_x)(R_{y,i} - \bar{R}_y)}{\sqrt{\sum (R_{x,i} - \bar{R}_x)^2 \sum (R_{y,i} - \bar{R}_y)^2}}$$

### Additional Statistical Safeguards:
- Explicit average rank calculation for ties.
- Small-sample warning flag ($n < 10$ flagged as exploratory, not predictive).
- Zero weight overfitting against small row samples.

---

## 5. Execution Order & Prioritized Backlog (14 Items)

```
  Step 1: Statistical Engine Correction (correlation.ts + Vitest)
     │
     ▼
  Step 2: Type Contracts & Classification Schema (classification-schema.ts, signal-schema.ts)
     │
     ▼
  Step 3: Signal Applicability Matrix & Scoring Weights (rubric-v2.ts)
     │
     ▼
  Step 4: Synthetic Page Archetypes & Calibration Suite (tests/synthetic/)
     │
     ▼
  Step 5: Full Benchmark Execution & Phase 3 Technical Findings (PHASE_3_FINDINGS.md)
```
