# Phase 3 Technical Report: Page Classification System

**Author:** Shobhit Tiwari  
**Role:** Website Engineer, Leena AI  
**Codebase:** `convex` (`/Users/apple/Downloads/convex`)  
**Repository:** [GitHub: Shobhit141141/convex](https://github.com/Shobhit141141/convex)

---

## 1. Objective & Motivation

Phase 2 exposed that landing pages cannot be evaluated with identical scoring expectations:
- A **Homepage** introduces the company's platform across multiple enterprise departments.
- A **Functional/Solution Page** speaks to a specific department leader (e.g. HR Ops) solving an immediate operational bottleneck.
- A **Webinar / Resource Page** promotes educational consumption, where aggressive demo booking forms kill conversion.

The **Page Classification System** (`src/features/ai/classifier.ts`) identifies what a webpage is designed to achieve *before* evaluating its conversion readiness.

---

## 2. Architecture & Data Contracts

All classification outputs are strictly validated at runtime using **Zod** (`src/types/classification-schema.ts`):

```typescript
export const PageTypeEnum = z.enum([
  "homepage",
  "product",
  "functional",
  "campaign",
  "resource",
  "case_study",
  "unknown"
]);

export const VisitorIntentEnum = z.enum([
  "discovery",
  "consideration",
  "high_intent",
  "education",
  "unknown"
]);

export const PageClassificationSchema = z.object({
  pageType: PageTypeEnum,
  targetAudience: z.object({
    segments: z.array(z.string()),
    roles: z.array(z.string()),
    industries: z.array(z.string())
  }),
  conversionObjectives: z.object({
    primary: z.string().min(1),
    secondary: z.array(z.string()).optional()
  }),
  primaryCTA: z.object({
    text: z.string(),
    action: z.string()
  }).optional(),
  visitorIntent: VisitorIntentEnum,
  confidence: z.number().min(0).max(1),
  evidence: z.array(z.object({
    source: z.enum(["dom", "ai", "metadata"]),
    excerpt: z.string(),
    selector: z.string().optional()
  })).min(1)
});
```

---

## 3. Classification Methodology & Safeguards

The classification engine synthesizes multiple signals rather than relying on brittle heuristics:

1. **Multi-Signal Synthesis:** Combines URL path segmentation, `<title>`, `<meta name="description">`, `<h1>` hero text, `<h2>` section headers, and primary CTA action semantics.
2. **Conflict Resolution:** If the URL path contradicts the hero and body content (e.g., an ad campaign path `/resources/archive` hosting an enterprise pricing page), **page content overrides the URL**, and confidence is penalized.
3. **Traceable Evidence Citation:** Every classification decision includes verbatim excerpts with selectors or metadata keys. No arbitrary claims are permitted.
4. **Resilience & Fallback:** If an AI provider returns malformed JSON or times out, the classifier seamlessly falls back to the deterministic rule engine, guaranteeing zero application crashes.
5. **No Forced Guesses:** If a page lacks headings, titles, and CTAs, the classifier outputs `pageType: "unknown"`, `visitorIntent: "unknown"`, and low confidence ($\le 0.3$).

---

## 4. Benchmark Results on Real Leena AI Pages

Tested against stored live extraction fixtures:

| URL | Classified Type | Visitor Intent | Primary Conversion Objective | Target Audience Roles | Confidence |
| :--- | :---: | :---: | :--- | :--- | :---: |
| **`https://leena.ai/`** | `homepage` | `discovery` | Enterprise platform discovery and demo booking | IT Leadership, HR Leadership, Finance Leadership | **0.94** |
| **`https://leena.ai/function/hr`** | `functional` | `consideration` | Functional solution evaluation and demo booking | HR Leadership | **0.88** |
| **`https://leena.ai/resources/webinars/...`** | `resource` | `education` | Educational content consumption and webinar access | Healthcare (Industry) | **0.90** |

---

## 5. Automated Test Coverage (10/10 Vitest Tests Passing)

The test suite (`tests/classification/classifier.test.ts`) validates:
1. **Benchmark accuracy:** 100% correct classification of Homepage, HR functional, and Webinar pages.
2. **Ambiguity handling:** `unknown` status and low confidence on content-deficient pages.
3. **Signal conflict resolution:** Content overrides URL path when conflicting, with confidence penalty.
4. **Missing CTA tolerance:** Graceful omission of `primaryCTA` without runtime failure.
5. **Multiple CTA resolution:** Correctly isolates the highest-intent commercial action (*"Book a demo"* over secondary links).
6. **Audience integrity:** Does not fabricate roles or industries when unstated.
7. **AI failure recovery:** Safe fallback to deterministic classification upon AI schema violation or network failure.
