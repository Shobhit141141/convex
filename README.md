# Convex — Audience-Aware Landing Page Conversion Grader

**Live Production App:** [https://convex-rosy.vercel.app](https://convex-rosy.vercel.app) • **Interactive Algorithm Guide:** [https://convex-rosy.vercel.app/algorithm](https://convex-rosy.vercel.app/algorithm)

Convex is an evidence-based Conversion Rate Optimization (CRO) grader that evaluates any landing page across **Conversion Persuasion**, **Conversion Execution**, and **Supporting Experience**. It combines deterministic DOM extraction, AI semantic copy analysis, live headless browser verification, and interactive full-page screenshot hotspot pinning.

---

## Visual Walkthrough & Product Interface

### 1. Executive Score Hero & Minimal Audience Context Strip
![Executive Score Hero & Context Strip](docs/screenshots/01-report-hero-and-context.png)
- **Overall Conversion Score Pod**: Displays the final `0–100` score (`79 / 100`), letter grade (`Grade B`), mini dimension gauges (`Persuasion 37/50`, `Execution 27/35`, `Experience 15/15`), and the **`Algo & Formula`** popover trigger showing the master Rubric v3 equation.
- **Minimal 4-Column Context Strip**: Summarizes **Who This Page Is For** (`HR Manager • HR Director`), **Main Action Button (CTA)** (`"Book a demo"` above the fold), **Visitor Buying Stage** (`Consideration`), and **Sign-Up / Lead Form** (`Working On-Page Form`).

---

### 2. "In a Nutshell" — 10-Second Plain-English Summary Card
![In a Nutshell 10-Second Plain-English Summary Card](docs/screenshots/06-plain-english-summary.jpg)
- **Bottom Line (Plain-English Verdict)**: Translates the entire multi-stage audit into a 2-sentence, jargon-free takeaway explaining who the page targets, its overall readiness, and the primary reason visitors hesitate to convert.
- **Three Crisp Takeaway Columns**:
  1. **What's Working Well**: Highlights the strongest passed signals in everyday language (e.g., measurable headline outcome, fast `2.3s` mobile load speed).
  2. **What's Hurting Sign-Ups**: Pinpoints the exact conversion leaks (e.g., generic headline copy, passive logo walls without customer quotes/ROI metrics).
  3. **Top 3 Quick Wins (Do First)**: Lists the 3 highest-leverage fixes paired with 1-click **`Pin #N`** jump buttons that scroll directly to that exact hotspot on the full-page screenshot canvas.

---

### 3. Full-Page Visual Audit Studio & 1-to-1 Section Hotspot Pins
![Full-Page Visual Audit & Hotspot Annotations](docs/screenshots/02-visual-audit-studio.jpg)
- **Dynamic Full-Page Canvas (Left)**: Renders the live Playwright full-page capture and overlays numbered, color-coded pins (`#1..#N`) anchored to actual DOM section coordinates (`0%–100% Y`), sorted top-to-bottom. Hovering or clicking any pin opens an edge-aware diagnostic card on the canvas.
- **1-to-1 Synchronized Annotation & Fix Cards (Right)**: Every pin `#1..#N` on the screenshot canvas matches Card `#1..#N` on the right with the exact page zone, concrete **Direct Fix** instructions, expected conversion lift, and a **`Locate Pin #N`** button.

---

### 4. Lighthouse Core Web Vitals & Dimension Summary
![Lighthouse Core Web Vitals & Dimension Overview](docs/screenshots/03-lighthouse-and-dimensions.png)
- **Core Web Vitals Gauges**: Evaluates mobile **Overall Speed** (`75 / 100`), **Main Content Load (LCP)** (`2.2s` vs. `< 2.5s` target), **Layout Stability (CLS)** (`0.03` vs. `< 0.10` target), and **First Visual (FCP)** (`1.7s` vs. `< 1.8s` target) using uniform circular SVG rings and plain-English `(?)` tooltips.

---

### 5. Three-Pillar Rubric v3 Dimension Cards
![Rubric v3 Dimension Summary Cards](docs/screenshots/04-dimension-cards.png)
- Breaks the `100`-point rubric into three intuitive pillars:
  1. **Message & Copy Persuasion (`50 pts max`)**: *Does the copy convince the buyer?* Checks if the headline names a real problem, promises a clear result, and proves it with customer stats.
  2. **Button & Form Execution (`35 pts max`)**: *How easy is it to take action?* Checks if the main button is easy to spot at the top and opens a quick, working sign-up form with minimal fields.
  3. **Speed & Mobile Experience (`15 pts max`)**: *Is it fast & phone-friendly?* Checks if the page loads quickly, stays visually steady, and is formatted cleanly for mobile phones.

---

### 6. Aligned Score Breakdown & Interactive `Algo & Why` Popovers
![Score Breakdown & Algorithm Tooltip Popovers](docs/screenshots/05-score-breakdown-and-algo.jpg)
- **Pixel-Aligned 7-Column Grid**: Category headers (`CONVERSION PERSUASION — 37 / 50 pts`) and individual criterion rows share the exact same grid columns for status icons, measurement source tags (`AI copy review`, `Live browser test`, `Page structure check`, `Lighthouse`), **`Category Algo` / `Algo & Why`** triggers, circular percentage rings, and point totals.
- **Transparent Math & Evidence**: Clicking or hovering **`Algo & Why`** reveals the exact mathematical formula, live point substitution, evaluated sub-check pass/fail inputs, and verbatim evidence extracted from the page.

---

### 7. Interactive Algorithm & Pipeline Explorer (`/algorithm`)
![Interactive Algorithm & Pipeline Explorer](docs/screenshots/07-interactive-algorithm-page.jpg)
- **1. 6-Step Analysis Pipeline (Walkthrough on `leena.ai/function/hr`)**: Click any step (`STEP 01 URL Cache & Fetch` through `STEP 06 Score & 1-to-1 Pins`) or use `← Prev` / `Next →` to see the exact data extracted from `leena.ai/function/hr` alongside a live visual callout on the page screenshot.
- **2. Interactive Score Simulator (With Real `leena.ai` Presets)**: Load 1-click presets (`leena.ai/function/hr — 81/100`, `leena.ai Homepage — 76/100`, `CHRISTUS Webinar — 71/100`, or `Broken Form Gate — 54/100`), drag the 3 dimension sliders, and toggle Conversion-Readiness Gates to watch the master equation compute the `0–100` score live.
- **3. Interactive 13-Check Visual Inspector**: Click any of the 13 Rubric v3 checks (`#1–#13`) to inspect the exact `leena.ai/function/hr` screenshot region, pin location, verbatim extracted quote, formula, and math calculation.
- **4. Audience Switcher & Grader vs. Real Data Disagreement**: Toggle between 4 buyer personas (`HR Leader`, `IT Director`, `C-Suite`, `Webinar`) and inspect where the automated grader diverges from actual conversion telemetry.

---

## Core Architecture & 6-Stage Pipeline

When a URL is submitted (`POST /api/grade`), Convex streams real-time server milestones (`application/x-ndjson`) across 6 stages:

1. **Supabase URL Cache Check**: Queries `public.landing_page_audits` by normalized URL. Previously audited pages load instantaneously without re-fetching unless a live re-run (`forceRefresh: true`) is requested.
2. **Safe DOM & Signal Extraction**: SSRF-guarded HTML fetch + Cheerio parsing for headings (`H1`–`H3`), CTAs, form fields, trust badges, customer quotes, and metadata.
3. **Audience & Intent Classification**: Classifies `pageType` (`homepage`, `product`, `functional`, `campaign`, `resource`, `case_study`), target ICP roles, and `visitorIntent` (`discovery`, `consideration`, `high_intent`, `education`).
4. **Semantic Persuasion Evaluation**: Evaluates copy specificity, quantified outcomes, speed-to-value, third-party credibility, and offer friction on a structured `0–10` scale (with deterministic heuristic fallback).
5. **Live Playwright Browser Verification**: Renders the page in headless Chromium, captures a full-page screenshot, discovers actual DOM section coordinates (`0%–100% Y`), clicks the primary CTA, and verifies whether an interactive lead-capture form or modal renders.
6. **Rubric v3 Scoring & Pin Mapping**: Computes the deterministic `0–100` score, applies Conversion-Readiness Gates, and maps evidence-backed issues and strengths onto the screenshot canvas.

---

## Rubric v3 Scoring Algorithm (`100 Points Max`)

```text
Total Score = round( Persuasion [0–50] + min(Execution [0–35], GateCap) + Experience [0–15] )
```

LLMs never directly output the final score—deterministic TypeScript rules scale and gate all inputs.

### Dimension A: Conversion Persuasion (`50 pts`)
Each check is rated `0–10` against strict evidence criteria and scaled via `round((Rating / 10) * MaxPoints, 1)`:
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

## Supabase Caching, Live Re-Run Telemetry, Plain-English UX & Exports

- **"In a Nutshell" 10-Second Plain-English Summary Card**: Highlighted with a subtle emerald glow right below the score hero, giving a jargon-free **Bottom Line** verdict alongside **What's Working Well**, **What's Hurting Sign-Ups**, and **Top 3 Quick Wins (Do First)** with 1-click **`Pin #N`** jump links.
- **1-to-1 Synchronized Screenshot Pins & Cards**: Every numbered hotspot pin (`#1..#N`) on the left full-page canvas is sorted top-to-bottom (`yPercent`) and strictly 1-to-1 matched with Card `#1..#N` on the right (covering both Actionable CRO Fixes and Verified Page Strengths).
- **Plain-English Tooltips (`?`) Across All Metrics**: Every section—including the 4 Context Strip cards, 4 Core Web Vitals gauges, 3 Dimension Summary Cards (`Message & Copy Persuasion`, `Button & Form Execution`, `Speed & Mobile Experience`), measurement method badges, and all 13 Rubric v3 checks—includes hoverable/clickable **`(?)` Plain-English Tooltips** with everyday explanations and concrete examples alongside the mathematical **`Algo & Why`** formulas.
- **Instant URL Cache (`public.landing_page_audits`)**: Stores every evaluation keyed by normalized URL so repeat visits load immediately without re-running Playwright or LLM calls.
- **Historical Audit Timeline**: Browse all saved website evaluations from the homepage or top **History** drawer.
- **Live Re-Run Audit Telemetry**: Clicking **Re-run Live Audit** (`forceRefresh: true`) bypasses the Supabase cache, smoothly scrolls to the top, displays a spinning active indicator (`Re-running Live Audit (68%)...`), and opens a live NDJSON server milestone progress banner directly above the report while streaming fresh DOM, AI, and Playwright steps.
- **1-Click Exports**: Export any audit report and its prioritized recommendations as **Markdown (`.md`)**, **Recommendations CSV (`.csv`)**, or **Structured JSON (`.json`)**.

---

## Deployment Architecture

Because Convex runs **live headless Chromium via Playwright** (`playwright` full-page screenshot capture, DOM section coordinate discovery, and interactive CTA click verification) alongside streaming NDJSON responses (`maxDuration = 60s`), deployment can follow either of two paths:

1. **Container / Full-Runtime Hosting (Recommended for Full Live Playwright Support)**:
   - **Railway / Render / Fly.io / Cloud Run**: Supports standard Node.js + Playwright Chromium binaries out of the box (`npx playwright install --with-deps chromium`), full 60s+ streaming, and zero serverless binary size limits.
2. **Vercel / Netlify Serverless**:
   - Works instantaneously for DOM extraction, AI copy evaluation, PageSpeed Insights API, and Supabase caching/history. Note that standard serverless functions have a 50MB/250MB bundle limit where local `playwright` Chromium binaries are unavailable unless paired with `@sparticuz/chromium` or a remote browser WS endpoint (Convex automatically gracefully falls back to static DOM & heuristic verification when local Chromium is unavailable).

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
