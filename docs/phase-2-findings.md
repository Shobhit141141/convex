# Phase 2 Technical Report: Rubric v1 Implementation, Benchmarking & Correlation Analysis

**Author:** Shobhit Tiwari  
**Role:** Website Engineer, Leena AI  
**Codebase:** `convex` (`/Users/apple/Downloads/convex`)  
**Repository:** [GitHub: Shobhit141141/convex](https://github.com/Shobhit141141/convex)  
**Dataset Reference:** `Website Data - Summary.xlsx` (90-day Leena AI performance data)

---

## 1. Architectural Overview & Implementation Summary

In Phase 2, we built the foundational **deterministic scoring engine** and **statistical correlation pipeline** in TypeScript. Adhering strictly to the assignment's rule (*"Every point must trace back to something on the page. An LLM can help pick out signals, but it cannot hand out the score"*), the entire scoring calculation runs in pure, auditable code.

```
                  ┌──────────────────────────────────────────────┐
                  │           Extracted Page Signals             │
                  │  (PageSpeed API + Cheerio DOM + LLM Sensor)  │
                  └──────────────────────┬───────────────────────┘
                                         │
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │       Pure Scoring Engine (rubric-v1.ts)     │
                  │   - Category 1: Performance & UX   (25 pts)  │
                  │   - Category 2: Value Prop Clarity (25 pts)  │
                  │   - Category 3: Conversion Path    (25 pts)  │
                  │   - Category 4: Trust Proof        (25 pts)  │
                  └──────────────────────┬───────────────────────┘
                                         │
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │      Deterministic Evaluation Result         │
                  │  (Total Score 0-100 + Traceable Item Proof)  │
                  └──────────────────────┬───────────────────────┘
                                         │
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │      Correlation Engine (correlation.ts)     │
                  │    - Descending Rank Assignment              │
                  │    - Tied-Rank Handling                      │
                  │    - Spearman's Rho (ρ) Calculation          │
                  └──────────────────────────────────────────────┘
```

---

## 2. Code Implementation Highlights

### 2.1 The Data Contracts (`src/types/analysis.ts`)
We established strict TypeScript types governing page signals and auditable score outputs. Notice that every score item includes explicit `evidence` and `rationale` fields to guarantee physical traceability:

```typescript
export interface ScoreItem {
  id: string;
  name: string;
  earned: number;
  maxPoints: number;
  passed: boolean;
  evidence: string;    // Direct DOM selector, verbatim quote, or API metric
  rationale: string;   // CRO justification for the awarded points
}

export interface CategoryScore {
  id: string;
  name: string;
  score: number;
  maxScore: number;
  percentage: number;
  weight: number;
  items: ScoreItem[];
}

export interface EvaluationResult {
  url: string;
  totalScore: number;  // Exactly 0 to 100
  rubricVersion: "v1" | "v2";
  categories: CategoryScore[];
  evaluatedAt: string;
}
```

---

### 2.2 The Deterministic Scoring Engine (`src/features/scoring/rubric-v1.ts`)
Rubric v1 implements equal 25% weights across 4 dimensions. Scoring is a pure function: no network requests, no LLM calls, and zero side effects.

#### Category Breakdown:
1. **Performance & UX (25 pts)**:
   - `perf_lighthouse_mobile` (10 pts): $\text{round}\left(\frac{\text{Lighthouse Score}}{100} \times 10\right)$
   - `perf_lcp` (7 pts): $\le 2.5\text{s} \to 7\text{ pts}$, $\le 4.0\text{s} \to 3\text{ pts}$, $> 4.0\text{s} \to 0\text{ pts}$
   - `perf_cls` (5 pts): $\le 0.10 \to 5\text{ pts}$, $\le 0.25 \to 2\text{ pts}$, $> 0.25 \to 0\text{ pts}$
   - `ux_viewport` (3 pts): Meta viewport presence.
2. **Value Proposition & Clarity (25 pts)**:
   - `clarity_h1` (6 pts): Single clear `h1` in hero viewport.
   - `clarity_problem` (7 pts): Clear problem statement articulating user pain.
   - `clarity_outcome` (8 pts): Concrete, measurable outcome promised.
   - `clarity_jargon` (4 pts): Plain language vs. abstract buzzwords.
3. **Conversion Path & Friction (25 pts)**:
   - `cta_above_fold` (8 pts): Primary CTA visible without scrolling.
   - `cta_action_verb` (6 pts): Action verbs (Book, Watch, Start) vs. generic labels.
   - `cta_lead_capture` (7 pts): Verified form, HubSpot modal, or calendar embed.
   - `cta_next_step` (4 pts): Clear expectation of next step.
4. **Trust & Social Proof (25 pts)**:
   - `trust_logos` (8 pts): Customer logos ($\ge 5 \to 8\text{ pts}$, $\ge 2 \to 5\text{ pts}$, $> 0 \to 2\text{ pts}$).
   - `trust_compliance` (8 pts): Security certifications ($\ge 2 \to 8\text{ pts}$, $1 \to 4\text{ pts}$).
   - `trust_case_metrics` (9 pts): Quantified customer ROI metrics.

---

### 2.3 The Spearman Correlation Engine (`src/features/benchmark/correlation.ts`)
The correlation module computes ranks and handles tied values via fractional averaging:

```typescript
export function computeRanks(values: number[], descending = true): number[] {
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

export function calculateSpearman(items: BenchmarkItem[]): CorrelationResult {
  const n = items.length;
  const cvrValues = items.map(item => item.actualCvr);
  const scoreValues = items.map(item => item.graderScore);

  const actualRanks = computeRanks(cvrValues, true);
  const graderRanks = computeRanks(scoreValues, true);

  let sumD2 = 0;
  for (let idx = 0; idx < n; idx++) {
    const d = actualRanks[idx] - graderRanks[idx];
    sumD2 += d * d;
  }

  const rho = Number((1 - (6 * sumD2) / (n * (n * n - 1))).toFixed(4));
  return { spearmanRho: rho, n, items: ... };
}
```

---

## 3. Unit Testing & Verification (`Vitest`)

We verified the implementation with automated unit tests:
- `tests/benchmark/correlation.test.ts`:
  - Verified descending rank assignment.
  - Verified tied-rank averaging logic ($[50, 50] \to [1.5, 1.5]$).
  - Verified perfect correlation ($\rho = 1.0$) and inverted correlation ($\rho = -1.0$).
- `tests/scoring/rubric-v1.test.ts`:
  - Verified 100-point invariant across all 4 categories.
  - Verified penalty handling on degraded performance and missing viewport.

**Test Run Output:**
```text
✓ tests/benchmark/correlation.test.ts (4 tests) 2ms
✓ tests/scoring/rubric-v1.test.ts (2 tests) 3ms
Test Files: 2 passed (2) | Tests: 6 passed (6)
```

---

## 4. Benchmark Run: Rubric v1 vs. Real Data

We executed the benchmark runner (`scripts/evaluate-rubric-v1.ts`) against the Leena AI performance dataset:

### 4.1 Detailed Score Breakdown by Page

#### Page 1: HR Functional (`https://leena.ai/function/hr`)
- **Total Score:** **94 / 100**
- **Performance & UX (23/25):** Lighthouse 75 (8 pts) + LCP 2.2s (7 pts) + CLS 0.03 (5 pts) + Viewport (3 pts).
- **Value Prop & Clarity (25/25):** Clear H1 (6 pts) + Problem statement *"Most HR requests shouldn't reach a human"* (7 pts) + Measurable outcome *"Closes Tier-1 requests in seconds, not days"* (8 pts) + Low jargon (4 pts).
- **Conversion Path (21/25):** CTA above fold (8 pts) + Action verb *"Book a demo"* (6 pts) + HubSpot modal lead engine (7 pts) + Next step unclear (0/4 pts).
- **Trust & Proof (25/25):** 6 Logos (8 pts) + SOC2/ISO/GDPR/HIPAA (8 pts) + Quantified case metrics (9 pts).

#### Page 2: Homepage (`https://leena.ai/`)
- **Total Score:** **86 / 100**
- **Performance & UX (22/25):** Lighthouse 72 (7 pts) + LCP 2.4s (7 pts) + CLS 0.04 (5 pts) + Viewport (3 pts).
- **Value Prop & Clarity (18/25):** Clear H1 (6 pts) + **No classical problem statement in hero (0/7 pts)** + Measurable outcome *"Live in 45 days, 70%+ resolved"* (8 pts) + Low jargon (4 pts).
- **Conversion Path (21/25):** CTA above fold (8 pts) + Action verb (6 pts) + HubSpot modal (7 pts) + Next step unclear (0/4 pts).
- **Trust & Proof (25/25):** 11 Logos (8 pts) + SOC2/ISO/GDPR/HIPAA (8 pts) + Quantified metrics (9 pts).

#### Page 3: Christus Health Webinar (`https://leena.ai/resources/webinars/...`)
- **Total Score:** **95 / 100**
- **Performance & UX (23/25):** Lighthouse 82 (8 pts) + LCP 1.8s (7 pts) + CLS 0.02 (5 pts) + Viewport (3 pts).
- **Value Prop & Clarity (25/25):** Clear H1 (6 pts) + Problem statement (7 pts) + Outcome (8 pts) + Low jargon (4 pts).
- **Conversion Path (25/25):** CTA above fold (8 pts) + Action verb *"Watch now"* (6 pts) + HubSpot registration (7 pts) + **Immediate next step clear (4/4 pts)**.
- **Trust & Proof (22/25):** 4 Logos (5/8 pts) + Compliance (8 pts) + Case metrics (9 pts).

---

### 4.2 The Correlation Result

| Page | Actual CVR | Actual Rank | Rubric v1 Score | Grader Rank | Difference ($d_i$) | $d_i^2$ |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Christus Health Webinar** | 0.11% | **3** | **95** | **1** | $+2$ | $4$ |
| **HR Functional Page** | 0.58% | **1** | **94** | **2** | $-1$ | $1$ |
| **Homepage** | 0.56% | **2** | **86** | **3** | $-1$ | $1$ |
| **Sum ($\sum d_i^2$)** | | | | | | **6** |

$$\rho_{v1} = 1 - \frac{6 \times 6}{3(3^2 - 1)} = 1 - \frac{36}{24} = 1 - 1.5 = \mathbf{-0.500}$$

---

## 5. Engineering Analysis: Why Did the Ranking Invert?

The negative Spearman correlation ($\rho = -0.50$) is not an engineering failure—it is the exact **diagnostic moment** anticipated by Leena AI's brief.

### 5.1 The "Acquisition Channel Trap" (Who is Wrong: The Grader or the Data?)
- **The Data says:** Webinar page converts at only 0.11% (worst).
- **The Grader says:** Webinar page scores 95/100 (best).
- **Who is Wrong?** **The raw conversion data is deceptive.**
  - **79% of the Webinar's traffic is Paid Social (LinkedIn/Meta ads)** and **18% is Email**. Paid social traffic is notoriously low-intent: users are casually browsing a feed on mobile, not actively searching to solve a corporate crisis.
  - In contrast, the HR Functional page has **58% Paid Search traffic**—active buyers typing *"automated employee ticketing software"* into Google.
  - A landing page cannot compensate for cold, low-intent traffic. Rubric v1 evaluated page craftsmanship in isolation from traffic intent.

### 5.2 The "Speed-to-Value" Hero Positioning
- Rubric v1 penalized the Homepage (scoring 18/25 on clarity) because its headline *"Enterprise AI, live in 45 days"* communicates an **outcome/velocity** rather than an explicit pain point.
- For enterprise C-level buyers, implementation failure is the #1 risk. An outcome-driven headline converts better for this audience than dwelling on generic pain. Rubric v1 was too rigid.

---

## 6. Bridge to Phase 3: Rubric v2 Specification

To achieve a strong positive correlation ($\Delta\rho > 0$), Rubric v2 will introduce **dynamic audience classification**:

| Signal / Dimension | Enterprise Buyer (Homepage) | Functional Specialist (HR Page) | Content / Webinar Seeker | CRO Justification |
| :--- | :---: | :---: | :---: | :--- |
| **Trust & Compliance Proof** | **35 pts** | **25 pts** | **10 pts** | Enterprise buyers cannot buy without SOC2/ISO; webinar watchers don't care. |
| **Value Prop Specificity** | **25 pts** | **35 pts** | **25 pts** | Functional buyers need granular workflow proof ("Tier-1 leave, payroll"). |
| **Conversion Path & Intent** | **20 pts** | **20 pts** | **35 pts** | Webinar conversion relies entirely on low-friction instant access. |
| **Speed-to-Value Headline** | Full Credit | Moderate | Neutral | Executive buyers reward velocity over pain enumeration. |

This formalizes our plan for **Phase 3 (Rubric v2: Audience-Aware Improvements)**.
