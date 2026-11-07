# Phase 1 Findings: Live Page Inspection & Evaluation Framework

**Candidate:** Shobhit Tiwari  
**Project:** Convex — Landing Page Grader  
**Target:** Leena AI Website Engineering Take-Home  
**Dataset Reference:** `Website Data - Summary.xlsx`

---

## 1. Executive Summary

In Phase 1, we executed an automated live HTTP fetch and DOM teardown across the three benchmark URLs from Leena AI's 90-day performance dataset. The objective was to inspect the real pages, understand why they convert at their respective rates, identify their conversion mechanics, and establish the measurable signal inventory for our grader.

```
  ┌─────────────────────────────────────────────────────────────┐
  │                 Live DOM Extraction Pipeline                │
  └──────────────────────────────┬──────────────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
  Homepage (0.56% CVR)    HR Ops (0.58% CVR)     Webinar (0.11% CVR)
  - Broad Enterprise      - Laser Pain Point     - Educational Asset
  - 69% Brand Pull        - 58% Paid Search      - 97% Cold Push Traffic
  - 11 Client Logos       - Concrete Benefit     - Low Form Urgency
```

---

## 2. Comparative Analysis of the 3 Live Pages

| Attribute | Homepage (`/`) | HR Functional (`/function/hr`) | Christus Webinar (`/resources/...`) |
| :--- | :--- | :--- | :--- |
| **Actual Conversion Rate** | **0.562%** (103 fills / 18,343 sessions) | **0.577%** (11 fills / 1,907 sessions) | **0.113%** (14 fills / 12,437 sessions) |
| **Actual Rank** | **#2** | **#1** | **#3** |
| **Dominant Traffic Channel** | Direct (44%) + Organic (25%) | **Paid Search (58%)** | **Paid Social (79%) + Email (18%)** |
| **Primary Audience** | C-Level / Cross-Functional (CIO/CHRO/CFO) | HR Operations Leaders & Specialists | Healthcare HR Leaders & Practitioners |
| **Hero Headline (`h1`)** | *"Enterprise AI, live in 45 days"* | *"Most HR requests shouldn't reach a human. Now they don't."* | *"What It Really Takes to Get 51,000 Employees Using AI"* |
| **Hero Subheader** | *(Visual interactive selector)* | *"Harrison closes Tier-1 HR requests - leave, letters, benefits, payroll - in seconds, not days."* | *"Proof in Production"* |
| **Primary CTA** | *"Book a demo"*, *"Watch product tour"* | *"Book a demo"*, *"Book a personalised demo"* | *"Watch now"*, *"Book a demo"* |
| **Lead Capture Method** | **HubSpot dynamic modal popup** | **HubSpot dynamic modal popup** | **HubSpot dynamic modal popup** |
| **Detected Client Logos** | 11 (Workday, Oracle, SAP, Cencora, Dr. Reddy's) | 6 (Workday, ServiceNow, Oracle, SAP) | 4 (Christus Health, Partner logos) |
| **Security & Compliance** | SOC2, ISO27001, GDPR, HIPAA | SOC2, ISO27001, GDPR, HIPAA | SOC2, ISO27001, GDPR, HIPAA |
| **Word Count** | 987 words | 1,042 words | 409 words |

---

## 3. Key Engineering Discoveries

### 3.1 The "Dynamic Lead Capture" Discovery (Crucial for Scraper Design)
A naive landing page scraper searches for `<form>` elements in the static DOM. Running `$('form')` across all three Leena AI pages yielded **zero standard HTML forms**.
- **Reality:** Leena AI embeds client-side HubSpot scripts (`hs-form`, `hbspt`) that render dynamic modal dialogs upon clicking primary buttons (`Book a demo`, `Watch now`).
- **Engine Rule:** Our crawler must detect lead capture mechanisms via:
  1. High-intent action buttons (`button[data-modal]`, `button:contains("demo")`).
  2. Third-party marketing automation fingerprints (`hubspot`, `hs-form`, `marketo`, `chilipiper`).
  3. Form fields within embedded iframes or dynamic shadow DOM.

### 3.2 Value Proposition Specificity & CVR Correlation
- **HR Functional (`/function/hr` - Highest CVR: 0.58%)**:
  The headline and subheader pair a **visceral negative pain point** (*"Most HR requests shouldn't reach a human"*) with an **immediate quantified outcome** (*"closes Tier-1 HR requests... in seconds, not days"*). Because 58% of visitors arrive via Paid Search with acute intent, this message converts at the highest rate.
- **Homepage (`/` - CVR: 0.56%)**:
  Strong speed-to-value proposition (*"live in 45 days"*) supported by broad social proof (*"500+ enterprises"*), but addresses a broader persona (CIO, CHRO, and CFO simultaneously).
- **Christus Webinar (`/resources/webinars/...` - Lowest CVR: 0.11%)**:
  The page functions as an on-demand case study video. Its low CVR is largely an **acquisition channel mismatch**: 97% of visitors were pushed from social feeds (LinkedIn/Meta) and email campaigns, representing low-intent passive browsers rather than active solution searchers.

---

## 4. The 4-Pillar Evaluation Framework

Based on our inspection, every evaluated URL will be graded across 4 pillars totaling 100 points:

```
                          Total Score: 100 Points
       ┌──────────────────┬──────────────────┬──────────────────┐
       ▼                  ▼                  ▼                  ▼
Performance & UX   Value Prop Clarity  Conversion Path    Trust & Social Proof
    (25 pts)           (25 pts)           (25 pts)             (25 pts)
```

### Pillar 1: Performance & UX (25 Points)
*Measurement: Google PageSpeed Insights REST API v5 + DOM*
1. **Mobile Lighthouse Score (10 pts):** Baseline performance index.
2. **Largest Contentful Paint / LCP (7 pts):** perceived load speed (< 2.5s = full marks, > 4.0s = 0).
3. **Cumulative Layout Shift / CLS (5 pts):** visual stability (< 0.1 = full marks).
4. **Mobile Viewport Optimization (3 pts):** verified `<meta name="viewport">` configuration.

### Pillar 2: Value Proposition & Clarity (25 Points)
*Measurement: DOM Hierarchy + LLM Semantic Sensor*
1. **Clear Hero Headline Structure (6 pts):** Exactly 1 distinct `h1` in hero viewport.
2. **Problem Statement Clarity (7 pts):** Explicitly states the customer pain point (with quoted text).
3. **Concrete Measurable Outcome (8 pts):** Quantified ROI, time savings, or percentage improvement.
4. **Jargon Density Check (4 pts):** Evaluates if the copy uses grounded business English vs. empty buzzwords.

### Pillar 3: Conversion Path & Friction (25 Points)
*Measurement: DOM Actionable Elements + LLM Semantic Sensor*
1. **Primary CTA Above the Fold (8 pts):** Clear conversion trigger visible without scrolling.
2. **Action-Oriented Copy (6 pts):** Uses high-intent action verbs (*"Book a demo"*, *"Watch now"*) instead of passive labels (*"Submit"*, *"Click here"*).
3. **Lead Capture Engine Integration (7 pts):** Verified presence of an active lead capture mechanism (native form, HubSpot modal, or calendar booking).
4. **Next-Step Expectation Clarity (4 pts):** Clearly communicates what happens next (e.g. "15-minute live walkthrough").

### Pillar 4: Trust & Social Proof (25 Points)
*Measurement: DOM Image/Alt Extractors + LLM Semantic Sensor*
1. **Enterprise Client Logos (8 pts):** Recognizable customer brand proof (count and alt-text verification).
2. **Security & Compliance Certifications (8 pts):** Explicit presence of SOC2, ISO27001, GDPR, or HIPAA seals.
3. **Quantified Case Studies & Proof Points (9 pts):** Customer testimonials or case outcomes featuring real metrics (e.g. *"70%+ auto-resolved"*, *"51,000 employees"*).

---

## 5. Traceability Matrix

Every single point awarded by the grader must link back to one of three immutable data sources:

| Evaluation Signal | Physical Proof / Traceability Source |
| :--- | :--- |
| Core Web Vitals | Google PageSpeed Insights REST API response payload |
| Headline & Structure | Verbatim text and CSS selector (`h1`, `header`, `meta`) |
| Lead Capture | Target element attributes (`form`, `data-modal`, `script[src*="hs-form"]`) |
| Client Logos | Verified `<img>` attributes (`alt`, `src`) and container context |
| Security Proof | Regex match on DOM body text (`SOC 2`, `ISO 27001`, `GDPR`, `HIPAA`) |
| Qualitative Reasoning | Verbatim excerpt quoted directly from live page by LLM Sensor |

---

## 6. Readiness for Phase 2

With Phase 1 complete and documented, we proceed to **Phase 2: Rubric v1 Design & Spearman Rank Correlation Baseline**.
