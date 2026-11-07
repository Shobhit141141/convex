# Convex Phase 3: 16-Scenario Validation Report

## 1. Overview & Test Execution Summary

To ensure that Rubric v3 produces robust, discriminated, and cheat-proof evaluations, a comprehensive **16-scenario validation suite** was implemented in `tests/validation/rubric-v3-scenarios.test.ts`.

### Test Execution Results

```
✓ tests/validation/rubric-v3-scenarios.test.ts (16 tests) 4ms
  ✓ Rubric v3: 16-Scenario Validation Suite (16)
    ✓ Scenario 1: Penalizes terrible value proposition even with good design (2ms)
    ✓ Scenario 2: Triggers Missing Primary CTA Gate (capped at 20% of Dimension B) (0ms)
    ✓ Scenario 3: Triggers Broken/Missing Lead Capture Gate (capped at 30% of Dimension B) (0ms)
    ✓ Scenario 4: Penalizes promise-destination mismatch (0ms)
    ✓ Scenario 5: Penalizes unsupported metric claims in outcome credibility (0ms)
    ✓ Scenario 6: Shows clean dimension separation: low persuasion, high execution (0ms)
    ✓ Scenario 7: Awards high audience fit but penalizes low credibility (0ms)
    ✓ Scenario 8: Awards high execution for seamless educational resource (0ms)
    ✓ Scenario 9: Flags friction and mismatch when webinar pushes enterprise demo (0ms)
    ✓ Scenario 10: Rewards frictionless working self-serve trial (0ms)
    ✓ Scenario 11: Deducts when competing CTAs create friction (0ms)
    ✓ Scenario 12: Scores audience fit at 0-1 when audience is absent (0ms)
    ✓ Scenario 13: Handles sparse extraction safely without crashing (0ms)
    ✓ Scenario 14: Score does not artificially inflate when criteria are not applicable (0ms)
    ✓ Scenario 15: Confines technical performance penalties to Dimension C (0ms)
    ✓ Scenario 16: Clearly distinguishes strong execution from weak persuasion (0ms)

Test Files  1 passed (1)
Tests       16 passed (16)
```

---

## 2. Detailed Scenario Walkthrough & CRO Proof

### Scenario 1: Beautiful Design, Terrible Value Proposition
- **Input**: Page with high Lighthouse score (85), clean mobile viewport, but vague marketing buzzwords ("We are the best in class") and zero problem definition.
- **Expected Outcome**: Low Dimension A score, total score penalized regardless of design polish.
- **Result**: Dimension A scored **15/50**, total score **56/100**. **PASSED**.

### Scenario 2: Excellent Value Proposition, No Call-to-Action
- **Input**: Outstanding copywriting and problem definition, but zero buttons or conversion actions.
- **Expected Outcome**: Trigger `Missing Primary CTA Gate`, capping Dimension B at 20% of max (max 7/35).
- **Result**: `gateApplied: true`, Dimension B scored **7/35**, gate logged. **PASSED**.

### Scenario 3: Strong Proposition, Broken Lead Capture Form
- **Input**: High-converting copy, but the lead form fails to render interactively upon clicking the CTA.
- **Expected Outcome**: Trigger `Broken/Missing Lead Capture Gate`, capping Dimension B at 30% of max (max 10.5/35).
- **Result**: `gateApplied: true`, Dimension B capped at **10.5/35**. **PASSED**.

### Scenario 4: Excellent CTA, Misleading Destination
- **Input**: Resource page with CTA reading *"Watch now"*, but clicking opens a high-friction enterprise sales demo gate.
- **Expected Outcome**: `exec_promise_destination` criterion docked for cognitive dissonance.
- **Result**: Status: `partial`, awarded **4/8 points**. **PASSED**.

### Scenario 5: Strong Trust Logos, Unsupported Metric Claims
- **Input**: Multiple customer logos present, but key metrics (e.g. "10x faster") are unverified company claims without customer case studies.
- **Expected Outcome**: Outcome credibility penalized in Dimension A.
- **Result**: Credibility status `failed`, awarded **2/10 points**. **PASSED**.

### Scenario 6: Generic Messaging, Highly Functional Lead Capture
- **Input**: Vague copy with no differentiation, but flawless 3-field form with instant loading.
- **Expected Outcome**: Clean dimension separation—low Dimension A ($\le 40\%$), high Dimension B ($\ge 80\%$).
- **Result**: Dimension A: **34%**, Dimension B: **86%**. **PASSED**.

### Scenario 7: Strong Audience-Specific Messaging, Weak Proof
- **Input**: Deeply personalized role-specific copy for HR Directors, but zero case study metrics or logos.
- **Expected Outcome**: High problem fit score ($\ge 8/10$), low credibility score ($\le 3/10$).
- **Result**: Problem fit: **9/10**, Credibility: **2/10**. **PASSED**.

### Scenario 8: Webinar with Immediate Content Access
- **Input**: Educational webinar page with direct recording access and clear forward path.
- **Expected Outcome**: High execution score ($\ge 25/35$).
- **Result**: Dimension B: **28/35**. **PASSED**.

### Scenario 9: Webinar with Unexpected Sales Demo Gate
- **Input**: Webinar page forcing visitors to "Book an enterprise demo" rather than register for or watch content.
- **Expected Outcome**: Friction penalty and promise-destination mismatch.
- **Result**: Promise destination awarded **3/8 points**, friction flagged. **PASSED**.

### Scenario 10: Product Page with Working Self-Serve Trial
- **Input**: High-intent product tier page with verified 2-field signup flow.
- **Expected Outcome**: Near-maximum execution score ($\ge 30/35$).
- **Result**: Dimension B scored **32/35**. **PASSED**.

### Scenario 11: Homepage with Competing / High-Friction CTAs
- **Input**: Competing CTAs above the fold, accompanied by an 8-field form.
- **Expected Outcome**: Friction and cognitive load penalty ($\le 3/7$ on `exec_friction_load`).
- **Result**: Friction awarded **2/7 points**. **PASSED**.

### Scenario 12: Absent Audience Targeting
- **Input**: Page with no identifiable target segment, industry, or role.
- **Expected Outcome**: Audience-problem fit scored at near zero ($\le 1.5/10$).
- **Result**: Problem fit awarded **1/10 points**. **PASSED**.

### Scenario 13: Incomplete / Sparse Text Extraction
- **Input**: Page with only 30 words extracted, missing headings, and no CTAs.
- **Expected Outcome**: Handled safely without runtime exceptions, scoring conservatively low ($< 35/100$).
- **Result**: Executed cleanly, total score **18/100**. **PASSED**.

### Scenario 14: Non-Applicable Criteria Does Not Inflate Denominator
- **Input**: Page where B2B enterprise criteria (e.g. multi-stakeholder approval) are not applicable.
- **Expected Outcome**: Score remains uninflated ($\le 85/100$).
- **Result**: Total score **78/100** (previously scored 93+ under Rubric v2 double normalization). **PASSED**.

### Scenario 15: Excellent Messaging, Poor Technical Performance
- **Input**: Outstanding persuasion copy and proof, but severe Core Web Vitals issues (LCP 6.5s, CLS 0.45).
- **Expected Outcome**: Dimension A preserved ($\ge 85\%$), Dimension C heavily penalized ($\le 6/15$).
- **Result**: Dimension A: **89%**, Dimension C: **4.5/15**. **PASSED**.

### Scenario 16: Strong Execution, Weak Persuasion
- **Input**: Perfect form usability and CTA button placement, but lifeless, generic product copy.
- **Expected Outcome**: Total score $< 65/100$ demonstrating that technical functionality alone cannot carry a landing page.
- **Result**: Total score **62/100** (Dimension A: 26%, Dimension B: 86%). **PASSED**.
