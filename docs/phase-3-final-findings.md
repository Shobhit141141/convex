# Convex Phase 3: Final Audit Findings & Discrimination Analysis

## 1. Executive Summary

This document details the comparative evaluation across **Rubric v1**, **Rubric v2**, and the newly implemented **Rubric v3** on the benchmark dataset of three Leena AI landing pages.

### Benchmark Comparative Results

| Page | Actual Observed CVR | Sessions | Form Fills | Rubric v1 Score | Rubric v2 Score | Rubric v3 Score | Dimension A: Persuasion (50) | Dimension B: Execution (35) | Dimension C: Experience (15) |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| **Homepage** | 0.56% | 18,343 | 103 | 94/100 | 96/100 | **83/100** | 42.2/50 (84%) | 25.5/35 (73%) | 15.0/15 (100%) |
| **HR Functional** | 0.58% | 1,907 | 11 | 94/100 | 93/100 | **80/100** | 39.0/50 (78%) | 25.5/35 (73%) | 15.0/15 (100%) |
| **CHRISTUS Health Webinar** | 0.11% | 12,402 | 14 | 67/100 | 78/100 | **77/100** | 36.0/50 (72%) | 25.5/35 (73%) | 15.0/15 (100%) |

---

## 2. Root Cause Analysis: Why Rubric v2 Failed to Discriminate

During Phase 2 and early Phase 3 audits, Rubric v2 was observed producing near-identical scores (94, 93, 93) across radically different landing pages. Our code trace identified four structural defects in Rubric v2:

### 1. Invariant Baseline (50.5 Shared Points)
In Rubric v2, all three pages received identical full points for:
- Performance & UX (15/15 pts)
- CTA Relevance & Alignment (16/16 pts)
- Conversion Path & Friction (19.5/24 pts)

This created an effective **score floor of 75/100**, leaving only ~25 points for true discrimination.

### 2. Double Normalization of Excluded Criteria
On the CHRISTUS Webinar page, compliance certifications (`SOC 2`, `ISO 27001`) were marked `not_applicable`. Rubric v2 both:
- Removed 6 points from the denominator (scaling up the remaining score), AND
- Shifted 6 points to the customer case study criterion (turning 7 points into 13 points).

This mathematically inflated the webinar page's score by **+15 points**, causing a page with 0.11% CVR to score 93/100.

### 3. Script Presence Mistaken for Verified Conversion
In Rubric v2, detecting `<script src="...hs-scripts.com">` awarded **11 out of 11 points** for lead capture. No check was performed to verify whether the script loaded, whether a modal opened, or whether form fields actually rendered. A broken form with an active script tag received 100% credit.

### 4. Collapse of AI Outputs into Binary Booleans
In Rubric v2, semantic outputs from AI (e.g. specificity ratings, clarity scores) were collapsed into simple boolean flags (`hasProblemStatement`, `hasConcreteOutcome`), discarding the rich nuance that AI provided.

---

## 3. How Rubric v3 Resolves Each Defect

### 1. Graded Persuasion Scoring (Dimension A)
Rather than boolean element checks, Rubric v3 uses AI-evaluated continuous ratings (0–10) across five persuasion pillars:
- **Homepage (42.2/50)**: High outcome credibility (8 logos, 4-10x ROI proof, multi-role C-suite appeal).
- **HR Functional (39.0/50)**: Strong problem fit ("Most HR requests shouldn't reach a human"), but lower cross-departmental proof.
- **CHRISTUS Webinar (36.0/50)**: High narrative proof for one customer (CHRISTUS Health), but lacks generalizable value proposition and clear problem framing for other enterprise buyers.

### 2. Conservative Partial Credit for Unverified Scripts
In Rubric v3:
- Playwright-verified interactive form rendering = **10/10 points**.
- Static script tag present without live verified form = **3.5/10 points** max.
- Missing form on a lead-generation page = **0 points** + triggers the **Broken Lead Capture Gate**.

This prevents unverified script presence from inflating execution scores.

### 3. Conversion-Readiness Gates
Under Rubric v3:
- A page with no CTA is capped at **20% of Dimension B** (max 7/35 earned).
- A page with broken/absent lead capture is capped at **30% of Dimension B** (max 10.5/35 earned).
- Crucially, gates do not penalize Dimension A (persuasion), preserving diagnostic purity.

---

## 4. Key AI Integration Findings: `gpt-5-mini` vs `gpt-4o-mini`

During the OpenAI integration, several critical operational behaviors were discovered:

1. **Temperature Constraint**:
   `gpt-5-mini` rejects `temperature: 0` with HTTP 400 (`Unsupported value: 'temperature' does not support 0 with this model. Only the default (1) value is supported`).
   - *Fix applied*: In `OpenAIClassifier` and `SemanticEvaluator`, `temperature` is omitted when using `gpt-5-mini`, and set to `0` only for `gpt-4o-mini`.

2. **Reasoning Token Consumption**:
   In `gpt-5-mini`, `max_completion_tokens` covers both internal reasoning tokens and visible completion tokens. When `max_completion_tokens` was set to 2,000, `gpt-5-mini` burned all 2,000 tokens on reasoning and returned empty `message.content`.
   - *Fix applied*: Token limit expanded to 4,000 tokens, and robust fallback to `gpt-4o-mini` was implemented for fast, deterministic execution.

3. **Page Classification Reliability**:
   `gpt-5-mini` correctly classified the CHRISTUS Webinar as `resource` with `education` intent, and the HR functional page as `functional` with `consideration` intent, fully respecting the Zod taxonomy schema.

---

## 5. Tier C Traffic-Adjusted Benchmark Summary

| Page | Sessions | Form Fills | Actual CVR | Expected Intent CVR (Simulated) | Traffic Efficiency |
|---|---:|---:|---:|---:|---:|
| **HR Functional** | 1,907 | 11 | 0.58% | 1.15% | **0.50×** |
| **Homepage** | 18,343 | 103 | 0.56% | 0.99% | **0.57×** |
| **CHRISTUS Webinar** | 12,402 | 14 | 0.11% | 0.36% | **0.31×** |

### Insights from Tier C:
- While HR Functional and Homepage have near-identical raw conversion rates (0.58% vs 0.56%), HR Functional received **58% paid search traffic** (very high commercial intent), whereas Homepage received **72% direct + organic traffic**.
- Adjusted for traffic intent, the Homepage actually demonstrates higher conversion efficiency (0.57× expected) relative to its top-of-funnel audience than HR Functional (0.50× expected).
- The CHRISTUS Webinar suffered from **79% paid social traffic** (cold top-of-funnel audience), which naturally depresses conversion rate to 0.11%, but its efficiency (0.31×) indicates that pushing an enterprise demo on cold educational social traffic creates substantial funnel friction.
