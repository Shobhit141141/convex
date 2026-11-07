# Scoring Note — Landing Page Grader

**Live Tool (Cloudflare Workers):** https://convex-landing-page-grader.familiar-oboe.workers.dev  
**Interactive Algorithm:** https://convex-landing-page-grader.familiar-oboe.workers.dev/algorithm  
**Direct App (Vercel):** https://convex-rosy.vercel.app  
**Code:** https://github.com/Shobhit141141/convex

## How the Rubric Works (100 Points)

I split the score into three parts so a page with great copy but a broken form (or vice versa) is easy to spot:

- **Persuasion (50 pts):** Does the copy make a clear case to the buyer?
  - Problem Fit (10 pts): Names a specific problem in the hero instead of generic slogans.
  - Value & Speed-to-Value (12 pts): States a clear outcome with numbers (e.g., `70%+ tickets resolved`, `4–10x ROI`) and how long setup takes (`45 days`).
  - Proof & Credibility (10 pts): Backs claims with named customer stories and metrics rather than just a logo bar.
  - Audience Fit (10 pts): Uses terms that match the buyer's actual workflow (`Workday`, `ServiceNow`, `Tier-1 HR requests`).
  - Offer Appeal (8 pts): The CTA offer matches what the visitor came for.
- **Execution (35 pts):** Can the visitor actually convert without friction?
  - CTA Placement & Text (10 pts): Visible above the fold (`+5`), uses an action verb (`+3`), and sets expectations on what happens next (`+2`).
  - Promise Match (8 pts): Clicking the button delivers what the button text promised.
  - Working Form (10 pts): Playwright clicks the main CTA in a headless browser to check if a real form or modal opens (`10 pts` if verified live, `8 pts` for a static form, `3.5 pts` if only an unverified script tag is found).
  - Form Length (7 pts): `<= 4` fields gets full points (`7 pts`), `5–7` fields gets `4.5 pts`, `> 7` fields gets `2 pts`.
  - **Hard Caps:** If a page has no primary CTA, Execution is capped at `7/35`. If it is meant to capture leads and no working form opens, Execution is capped at `10.5/35`.
- **Experience (15 pts):** Pulled live from Google's PageSpeed Insights API.
  - Mobile LCP (5 pts), Layout Shift / CLS (4 pts), Mobile Viewport tag (3 pts), and basic H1/copy structure (3 pts).

*(Note: OpenAI `gpt-4o-mini` helps rate the 5 copy checks from 0–10 using quotes from the page, but the final score is calculated in TypeScript so the LLM never makes up a total score.)*

## How It Changes by Audience

First, the grader detects who the page is built for (an enterprise buyer, a functional team lead, a self-serve/PLG user, or someone reading/watching content) and shifts the weights so it generalizes across any SaaS site:

| Signal | Enterprise Buyer (`leena.ai`, `okta.com`) | Functional Lead (`leena.ai/function/hr`) | Self-Serve / Dev (`twelvelabs.io`, `linear.app`) | Content / Webinar (`christus-webinar`) | Why |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Customer ROI & Security (`SOC2` / `ISO`)** | **1.5x weight** | 1.0x weight | 0.7x weight | 0.5x weight | An executive booking a sales call needs ROI proof and security badges; a self-serve user or webinar viewer does not. |
| **Daily Tool Integrations (`Workday`, `Slack`)** | 1.0x weight | **1.5x weight** | 1.2x weight | 0.7x weight | Functional leads care most about whether the product plugs into the systems they already use every day. |
| **Self-Serve Trial / Sandbox (`Try Free`)** | 0.7x weight | 0.9x weight | **1.5x weight** | 0.6x weight | Developers and PLG users want to test the product or API immediately rather than book a 30-minute sales call. |
| **Short Form (`<= 3` Fields) & Direct Access** | 0.8x weight | 1.0x weight | 1.3x weight | **1.6x weight** | Visitors clicking "Watch now" or "Try free" drop off if you put a 7-field enterprise sales form in front of them. |

## What Changed After Checking Against the Real Data

| Page | Sessions | Submits | Raw CVR | Main Traffic Source | Rubric v1 | Rubric v2 | Final Rubric |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`leena.ai/` (Homepage)** | 18,343 | 103 | 0.56% | 69% Direct + Organic | 86 | 94 | **83 / 100** |
| **`leena.ai/function/hr`** | 1,907 | 11 | 0.58% | 58% Paid Search | 94 | 93 | **80 / 100** |
| **`christus-health-webinar`** | 12,437 | 14 | 0.11% | 79% Paid Social | 95 | 93 | **77 / 100** |

1. **Rubric v1 (`86, 94, 95`):** My first version mostly checked if tags existed in the HTML (is there an H1? a button? customer logos?). Because all three pages had those elements, v1 actually scored the CHRISTUS webinar page highest (`95/100`) even though it converted worst (`0.11%`).
2. **Rubric v2 (`94, 93, 93`):** I added audience rules in v2 so webinar pages weren't penalized for missing SOC2 badges. However, v2 gave full credit just for finding a HubSpot `<script>` tag in the HTML and scaled up the remaining points when compliance checks were skipped—clustering all three pages at `93–94`.
3. **Final Rubric (`83, 80, 77`):** I stopped giving full credit for unverified script tags, added a real Playwright click check to verify the modal/form, and graded copy on how specific the numbers and problem statements are (`42.2/50` on Homepage vs `39.0/50` on HR vs `36.0/50` on the Webinar page).

## Biggest Disagreement: Who Is Wrong — My Grader or the Data?

- **Homepage (`83` score, `0.56%` CVR) vs. HR Page (`80` score, `0.58%` CVR) — The raw CVR ranking is misleading:**
  In raw conversion rate, `/function/hr` beats the homepage by `0.02%`. Looking at the traffic split in the sheet, `/function/hr` got **58% Paid Search traffic** (high-intent Google ads, 11 form submits total), while the homepage got **69% Direct and Organic traffic** (103 submits across 18,343 visits, including casual browsers and job seekers). When you adjust for traffic source, the homepage actually converts better than expected (`0.57x` vs `0.50x`), so I trust the grader's `83 vs 80` order here.
- **CHRISTUS Webinar (`77` score vs. `0.11%` CVR) — Both the data and my grader share blame:**
  The `0.11%` CVR looks terrible partly because **79% of its 12,437 visits came from cold Paid Social ads** (`0%` search traffic). That said, `77/100` from my grader is still a bit too generous: clicking "Watch now" opens a HubSpot lead form instead of letting cold social visitors preview a 60-second clip first, which hurts conversions.

## What I Left Out on Purpose

- **Visual design / color / font scoring:** Subjective design preferences are noisy and don't reliably predict B2B form fills compared to clear copy and low-friction forms.
- **Word count & SEO keyword density:** Longer pages often convert worse on paid traffic. After checking that a page has at least 100 words of real content, I grade clarity rather than length.
- **Traffic channel split inside the page score:** Even though traffic source explains the spreadsheet's raw CVR, the grader shouldn't require private analytics data to score a public URL—it should grade the page itself.
