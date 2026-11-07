# Convex — Audience-Aware Landing Page Conversion Grader

Convex is an evidence-based Conversion Rate Optimization (CRO) grader that evaluates any landing page across **Conversion Persuasion**, **Conversion Execution**, and **Supporting Experience**. It combines deterministic DOM extraction, AI semantic copy analysis, live headless browser verification, and interactive full-page screenshot hotspot pinning.

---

## Core Architecture & Pipeline

When a URL is submitted (`POST /api/grade`), Convex streams real-time server milestones (`application/x-ndjson`) across 6 stages:

1. **Supabase URL Cache Check**: Checks `public.landing_page_audits` by normalized URL. Previously audited pages load instantaneously without re-fetching unless a live re-run (`forceRefresh: true`) is requested.
2. **Safe DOM & Signal Extraction**: SSRF-guarded HTML fetch + Cheerio parsing for headings (`H1`–`H3`), CTAs, form fields, trust badges, customer quotes, and metadata.
3. **Audience & Intent Classification**: Classifies `pageType` (`homepage`, `product`, `functional`, `campaign`, `resource`, `case_study`), target ICP roles, and `visitorIntent` (`discovery`, `consideration`, `high_intent`, `education`).
4. **Semantic Persuasion Evaluation**: Evaluates copy specificity, quantified outcomes, speed-to-value, third-party credibility, and offer friction on a structured `0–10` scale (with deterministic heuristic fallback).
5. **Live Playwright Browser Verification**: Renders the page in headless Chromium, captures a full-page screenshot, discovers actual DOM section coordinates (`0%–100% Y`), clicks the primary CTA, and verifies whether an interactive lead-capture form or modal renders.
6. **Rubric v3 Scoring & Pin Mapping**: Computes the deterministic `0–100` score, applies Conversion-Readiness Gates, and maps evidence-backed issues and strengths onto the screenshot canvas.

---

## Rubric v3 Scoring Algorithm (`100 Points Max`)

> **Master Formula:**  
> $$\text{Total Score} = \operatorname{round}\!\Big(\text{Persuasion}_{/50} + \min(\text{Execution}_{/35},\, \text{GateCap}) + \text{Experience}_{/15}\Big)$$

LLMs never directly output the final score—deterministic TypeScript rules scale and gate all inputs.

### Dimension A: Conversion Persuasion (`50 pts`)
Each check is rated `0–10` against strict evidence criteria and scaled via $\operatorname{round}((\text{Rating}/10) \times \text{MaxPts}, 1)$:
| Check | Max Pts | What It Measures |
| :--- | :---: | :--- |
| **1. Audience-Problem Fit & Specificity** | `10` | Concrete buyer pain point articulated in hero/headings vs. generic fluff |
| **2. Value Proposition & Speed-to-Value** | `12` | Clear H1 outcome + quantified impact (`%`, `$`, `x`) + time-to-value |
| **3. Outcome Credibility & Verifiable Proof** | `10` | Customer-attributed case studies & metrics vs. unverified logo walls |
| **4. Audience-Message Alignment** | `10` | Role-specific workflow terminology aligned with the classified ICP |
| **5. Offer Attractiveness & Problem Match** | `8` | Relevance of the primary CTA offer to the problem & perceived friction |

### Dimension B: Conversion Execution (`35 pts`)
Evaluated via DOM rules + live Playwright click verification:
| Check | Max Pts | Scoring Formula |
| :--- | :---: | :--- |
| **6. CTA Prominence & Next-Step Clarity** | `10` | Above-the-fold (`+5`) + Action verb (`+3`) + Next-step microcopy (`+2`) |
| **7. Promise-Destination Consistency** | `8` | CTA action & modal/destination match headline promise (`7–8` pass, `3–4` gated mismatch, `0` missing) |
| **8. Lead Capture Usability & Verification** | `10` | Playwright live form verified (`10`) \| Static `<form>` inputs (`8`) \| Unverified script only (`3.5–4`) \| None (`0`) |
| **9. Conversion Friction & Simplicity** | `7` | `≤ 4` fields (`7`) \| `5–7` fields (`4.5`) \| `> 7` fields (`2`) |

#### Conversion-Readiness Gates (Applied to Dimension B)
High persuasive copy cannot convert if the capture mechanism is broken:
- **Missing Primary CTA Gate**: If no primary CTA exists, Execution is capped at **20%** (`7.0 / 35 pts`).
- **Missing / Unverified Lead Capture Gate**: If the page objective requires lead generation (`demo`, `trial`, `register`, `contact`) and no working form is detected, Execution is capped at **30%** (`10.5 / 35 pts`).

### Dimension C: Supporting Experience (`15 pts`)
| Check | Max Pts | Threshold Tiers |
| :--- | :---: | :--- |
| **10. Largest Contentful Paint (LCP)** | `5` | `≤ 2.5s` (`5`) \| `≤ 4.0s` (`2.5`) \| `> 4.0s` (`0`) |
| **11. Cumulative Layout Shift (CLS)** | `4` | `≤ 0.10` (`4`) \| `≤ 0.25` (`2`) \| `> 0.25` (`0`) |
| **12. Mobile Viewport Configuration** | `3` | `meta[name="viewport"]` present (`3`) \| absent (`0`) |
| **13. Text Readability & Structure** | `3` | Clear H1 + `≥ 100` words (`3`) \| H1 only (`1.5`) \| missing (`0`) |

**Letter Grades:** `A` (`≥ 85`) • `B` (`70–84`) • `C` (`55–69`) • `D` (`40–54`) • `F` (`< 40`)

---

## Key Features

- **Visual Audit Studio**: Full-page screenshot canvas with dynamic DOM-discovered hotspot pins (`#1`, `#2`, ...) linked to prioritized CRO fix cards.
- **Interactive `Algo & Why` Popovers**: Hover or click any score (Overall Hero, Category Header, or Criterion Row) to inspect the exact mathematical formula, live point substitution, evaluated sub-checks, and extracted evidence.
- **Supabase URL Cache & Audit History**: Stores every evaluation in `public.landing_page_audits` for instant retrieval without re-fetching, plus 1-click **Re-run Live Audit** to track score progression over time.
- **1-Click Exports**: Export the full report and prioritized recommendations as **Markdown (`.md`)**, **Recommendations CSV (`.csv`)**, or **Structured JSON (`.json`)**.

---

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment variables (.env.local)
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
OPENAI_API_KEY=sk-...          # Optional: falls back to deterministic evaluator if omitted
PAGESPEED_API_KEY=...          # Optional: falls back to synthetic Web Vitals if omitted

# 3. Start development server
pnpm dev

# 4. Run test suite (56 unit & scenario tests)
pnpm vitest run
```

---

## Project Structure

```text
src/
├── app/
│   ├── api/grade/route.ts         # NDJSON streaming evaluation & Supabase cache endpoint
│   ├── api/history/route.ts       # Saved audit history & snapshot retrieval endpoint
│   └── page.tsx                   # Visual Audit Studio UI, Score Breakdown & Export engine
├── features/
│   ├── ai/                        # Page classifier & semantic persuasion evaluator
│   ├── browser/                   # Playwright live CTA verifier & dynamic section discovery
│   ├── crawler/                   # SSRF-safe HTML extractor & DOM signal parser
│   ├── performance/               # Google PageSpeed / Core Web Vitals integration
│   ├── pipeline/                  # End-to-end orchestrator & hotspot pin mapper
│   ├── scoring/                   # Rubric v3 deterministic scoring engine & gates
│   └── storage/                   # Supabase PostgREST caching & audit history client
└── types/                         # Zod schemas & TypeScript contracts
```
