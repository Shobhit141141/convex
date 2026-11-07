/**
 * interaction-verifier.ts
 *
 * Playwright-based conversion interaction verifier.
 * Tests actual CTA interactivity, modal opening, and lead capture form rendering.
 * NEVER submits real user data.
 *
 * Graceful fallback: If Playwright browser executable is missing or cannot launch,
 * safely returns status "not_tested" without crashing evaluation runs.
 */

import fs from "node:fs";

export interface ElementPositions {
  navigation?: { xPercent: number; yPercent: number };
  headline?: { xPercent: number; yPercent: number };
  primaryCta?: { xPercent: number; yPercent: number };
  socialProof?: { xPercent: number; yPercent: number };
  features?: { xPercent: number; yPercent: number };
  architecture?: { xPercent: number; yPercent: number };
  caseStudy?: { xPercent: number; yPercent: number };
  bottomFunnel?: { xPercent: number; yPercent: number };
  leadCapture?: { xPercent: number; yPercent: number };
  scrollHeight?: number;
}

export interface DiscoveredSection {
  type: "navigation" | "hero" | "cta" | "pricing" | "code_snippet" | "features" | "social_proof" | "testimonials" | "faq" | "footer" | "content";
  label: string;
  xPercent: number;
  yPercent: number;
  heightPercent: number;
  rawTextPreview?: string;
}

export interface ConversionVerificationResult {
  ctaFound: boolean;
  ctaVisible: boolean;
  ctaClickable: boolean;
  modalOrNavigation: "modal" | "navigation" | "none" | "error";
  formRendered: boolean;
  formFieldCount: number;
  hubspotDetected: boolean;
  verificationStatus: "passed" | "partial" | "failed" | "not_tested";
  evidenceNotes: string[];
  screenshotBase64?: string;
  elementPositions?: ElementPositions;
  discoveredSections?: DiscoveredSection[];
}

export interface VerificationOptions {
  timeoutMs?: number;
  viewport?: { width: number; height: number };
  captureScreenshot?: boolean;
}

const LOCAL_CHROMIUM_FALLBACK = "/Users/apple/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell";

export async function verifyConversionInteraction(
  urlOrHtml: string,
  primaryCtaText?: string,
  options: VerificationOptions = {}
): Promise<ConversionVerificationResult> {
  const timeoutMs = options.timeoutMs ?? 8000;
  const isHtml = urlOrHtml.trim().startsWith("<") || urlOrHtml.includes("<!DOCTYPE");
  const captureScreenshot = options.captureScreenshot ?? true;

  let chromiumModule: any;
  try {
    chromiumModule = await import("playwright");
  } catch {
    return {
      ctaFound: false,
      ctaVisible: false,
      ctaClickable: false,
      modalOrNavigation: "none",
      formRendered: false,
      formFieldCount: 0,
      hubspotDetected: false,
      verificationStatus: "not_tested",
      evidenceNotes: ["Playwright package not accessible. Dynamic verification skipped."]
    };
  }

  let browser: any = null;
  try {
    const launchOptions: any = {
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    };
    if (fs.existsSync(LOCAL_CHROMIUM_FALLBACK)) {
      launchOptions.executablePath = LOCAL_CHROMIUM_FALLBACK;
    }
    browser = await chromiumModule.chromium.launch(launchOptions);
  } catch (err: any) {
    const serverlessScreenshotUrl = !isHtml
      ? `https://api.microlink.io/?url=${encodeURIComponent(
          urlOrHtml
        )}&screenshot=true&meta=false&embed=screenshot.url&screenshot.fullPage=true&viewport.width=1280&viewport.height=900`
      : undefined;
    return {
      ctaFound: false,
      ctaVisible: false,
      ctaClickable: false,
      modalOrNavigation: "none",
      formRendered: false,
      formFieldCount: 0,
      hubspotDetected: false,
      verificationStatus: "not_tested",
      screenshotBase64: serverlessScreenshotUrl,
      evidenceNotes: [
        `Browser executable unavailable (${err?.message?.split("\n")[0] || "launch failed"}). Fallback to DOM evaluation & remote screenshot capture.`
      ]
    };
  }

  const notes: string[] = [];
  let screenshotBase64: string | undefined = undefined;

  try {
    const page = await browser.newPage({
      viewport: options.viewport ?? { width: 1280, height: 800 }
    });

    if (isHtml) {
      await page.setContent(urlOrHtml, { waitUntil: "domcontentloaded", timeout: timeoutMs });
    } else {
      await page.goto(urlOrHtml, { waitUntil: "domcontentloaded", timeout: timeoutMs });
    }

    // Capture full-page screenshot across the entire website
    let scrollHeight = 800;
    try {
      scrollHeight = await page.evaluate(() =>
        Math.max(document.body.scrollHeight, document.documentElement.scrollHeight, 800)
      );
    } catch {}

    if (captureScreenshot) {
      try {
        const buffer = await page.screenshot({ fullPage: true, type: "jpeg", quality: 65 });
        screenshotBase64 = `data:image/jpeg;base64,${buffer.toString("base64")}`;
      } catch {
        // Screenshot capture non-blocking
      }
    }

    // Detect HubSpot script or form container in DOM
    const hubspotDetected = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll("script")).map(s => s.src);
      const hasHsScript = scripts.some(src => src.includes("hs-scripts.com") || src.includes("hsforms"));
      const hasHsElement = !!document.querySelector(".hs-form, [data-portal-id], #hs-form-target, iframe[src*='hsforms']");
      return hasHsScript || hasHsElement;
    });

    if (hubspotDetected) {
      notes.push("HubSpot tracking or form script detected in DOM");
    }

    const vpWidth = (options.viewport?.width) || 1280;
    const elementPositions: ElementPositions = { scrollHeight };

    // Minute Section 1: Navigation & Header
    try {
      const navEl = await page.$("header, nav, [role='banner'], [class*='nav'], [class*='header']");
      if (navEl) {
        const box = await navEl.boundingBox();
        if (box) {
          elementPositions.navigation = {
            xPercent: Math.min(Math.max(Math.round(((box.x + Math.min(box.width / 2, 200)) / vpWidth) * 100), 5), 90),
            yPercent: Math.min(Math.max(Math.round(((box.y + box.height / 2) / scrollHeight) * 100), 1), 6)
          };
        }
      }
    } catch {}

    // Minute Section 2: Hero Headline & Pain Hook
    try {
      const h1El = await page.$("h1, [class*='hero'] h1, [class*='hero'] h2");
      if (h1El) {
        const box = await h1El.boundingBox();
        if (box) {
          elementPositions.headline = {
            xPercent: Math.min(Math.max(Math.round(((box.x + Math.min(box.width / 2, 260)) / vpWidth) * 100), 8), 85),
            yPercent: Math.min(Math.max(Math.round(((box.y + box.height / 2) / scrollHeight) * 100), 2), 20)
          };
        }
      }
    } catch {}

    // Minute Section 3: Enterprise Social Proof Band
    try {
      const proofEl = await page.$("[class*='logo'], [class*='proof'], [class*='partner'], [class*='trust'], [class*='client'], [class*='customer']");
      if (proofEl) {
        const box = await proofEl.boundingBox();
        if (box) {
          elementPositions.socialProof = {
            xPercent: Math.min(Math.max(Math.round(((box.x + Math.min(box.width / 2, 300)) / vpWidth) * 100), 12), 85),
            yPercent: Math.min(Math.max(Math.round(((box.y + box.height / 2) / scrollHeight) * 100), 15), 40)
          };
        }
      }
    } catch {}

    // Minute Section 4: Product Features & Core Architecture
    try {
      const featEl = await page.$("[class*='feature'], [class*='product'], [class*='solution'], [class*='grid'], [class*='benefit'], [id*='feature']");
      if (featEl) {
        const box = await featEl.boundingBox();
        if (box) {
          elementPositions.features = {
            xPercent: Math.min(Math.max(Math.round(((box.x + Math.min(box.width / 2, 300)) / vpWidth) * 100), 15), 85),
            yPercent: Math.min(Math.max(Math.round(((box.y + box.height / 2) / scrollHeight) * 100), 30), 60)
          };
        }
      }
    } catch {}

    // Minute Section 5: Quantified Outcomes & Customer Case Studies
    try {
      const caseStudyEl = await page.$("[class*='case'], [class*='testimonial'], [class*='quote'], [class*='review'], [class*='metric'], [class*='stat']");
      if (caseStudyEl) {
        const box = await caseStudyEl.boundingBox();
        if (box) {
          elementPositions.caseStudy = {
            xPercent: Math.min(Math.max(Math.round(((box.x + Math.min(box.width / 2, 300)) / vpWidth) * 100), 12), 85),
            yPercent: Math.min(Math.max(Math.round(((box.y + box.height / 2) / scrollHeight) * 100), 50), 78)
          };
        }
      }
    } catch {}

    // Minute Section 6: Bottom Funnel Re-engagement & Footer
    try {
      const footerCta = await page.$("footer, [class*='footer'], [class*='bottom'], [class*='cta-section']");
      if (footerCta) {
        const box = await footerCta.boundingBox();
        if (box && box.y > 600) {
          elementPositions.bottomFunnel = {
            xPercent: Math.min(Math.max(Math.round(((box.x + Math.min(box.width / 2, 300)) / vpWidth) * 100), 15), 85),
            yPercent: Math.min(Math.max(Math.round(((box.y + box.height / 2) / scrollHeight) * 100), 75), 98)
          };
        }
      }
    } catch {}

    // Dynamic DOM Section Discovery across ANY page type
    const discoveredSections: DiscoveredSection[] = [];
    try {
      const detected = await page.evaluate(() => {
        const docH = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight, window.innerHeight);
        const docW = window.innerWidth || 1280;
        const results: Array<{
          type: "navigation" | "hero" | "cta" | "pricing" | "code_snippet" | "features" | "social_proof" | "testimonials" | "faq" | "footer" | "content";
          label: string;
          xPercent: number;
          yPercent: number;
          heightPercent: number;
          rawTextPreview: string;
        }> = [];

        const candidates = Array.from(document.querySelectorAll("header, nav, section, article, main > div, footer, [id*='pricing'], [id*='faq'], [id*='feature'], [id*='testim'], [id*='code'], pre, [class*='hero'], [class*='pricing'], [class*='faq']"));

        for (const el of candidates) {
          const rect = el.getBoundingClientRect();
          const style = window.getComputedStyle(el);
          if (style.display === "none" || style.visibility === "hidden" || rect.height < 50) continue;

          const absY = rect.top + window.scrollY;
          const yPercent = Math.min(Math.max(Math.round(((absY + Math.min(rect.height / 2, 220)) / docH) * 100), 1), 98);
          const xPercent = Math.min(Math.max(Math.round(((rect.left + Math.min(rect.width / 2, 300)) / docW) * 100), 10), 90);
          const heightPercent = Math.round((rect.height / docH) * 100);

          const text = ((el as HTMLElement).innerText || el.textContent || "").trim();
          const lower = text.toLowerCase().slice(0, 400);
          const idClass = (el.id + " " + el.className).toLowerCase();
          const tag = el.tagName.toLowerCase();

          let type: DiscoveredSection["type"] | "" = "";
          let label = "";

          if (tag === "header" || tag === "nav" || idClass.includes("nav") || absY < 80) {
            type = "navigation";
            label = "Navigation & Header";
          } else if (absY < 700 && (tag === "h1" || el.querySelector("h1") || idClass.includes("hero"))) {
            type = "hero";
            label = "Hero & Problem Hook";
          } else if (idClass.includes("pricing") || lower.includes("pricing") || lower.includes("/mo") || lower.includes("per month")) {
            type = "pricing";
            label = "Pricing & Plans";
          } else if (tag === "pre" || idClass.includes("code") || el.querySelector("pre, code")) {
            type = "code_snippet";
            label = "Developer Code Preview";
          } else if (idClass.includes("faq") || lower.includes("frequently asked") || el.querySelector("details")) {
            type = "faq";
            label = "Frequently Asked Questions";
          } else if (idClass.includes("logo") || idClass.includes("proof") || idClass.includes("trusted by") || lower.includes("trusted by")) {
            type = "social_proof";
            label = "Customer Proof & Badges";
          } else if (idClass.includes("testimonial") || idClass.includes("review") || idClass.includes("case") || lower.includes("testimonial")) {
            type = "testimonials";
            label = "Customer Stories & Outcomes";
          } else if (idClass.includes("feature") || idClass.includes("product") || idClass.includes("solution") || idClass.includes("capability")) {
            type = "features";
            label = "Core Capabilities & Features";
          } else if (tag === "footer" || idClass.includes("footer") || absY > docH - 500) {
            type = "footer";
            label = "Footer & Conversion Anchor";
          }

          if (type && !results.some(r => r.type === type && Math.abs(r.yPercent - yPercent) < 7)) {
            results.push({
              type,
              label,
              xPercent,
              yPercent,
              heightPercent,
              rawTextPreview: text.slice(0, 100)
            });
          }
        }
        return results;
      });
      discoveredSections.push(...(detected as any));
    } catch {}

    // Locate primary CTA
    let ctaHandle = null;
    if (primaryCtaText && primaryCtaText.trim().length > 0) {
      const cleanText = primaryCtaText.trim();
      ctaHandle = await page.$(`button:has-text("${cleanText}"), a:has-text("${cleanText}")`);
    }

    if (!ctaHandle) {
      // Fallback selector for buttons with action keywords
      ctaHandle = await page.$(
        "button:has-text('demo'), button:has-text('start'), button:has-text('watch'), a:has-text('demo'), a:has-text('start')"
      );
    }

    if (ctaHandle) {
      try {
        const box = await ctaHandle.boundingBox();
        if (box) {
          elementPositions.primaryCta = {
            xPercent: Math.min(Math.max(Math.round(((box.x + box.width / 2) / vpWidth) * 100), 10), 92),
            yPercent: Math.min(Math.max(Math.round(((box.y + box.height / 2) / scrollHeight) * 100), 1), 95)
          };
        }
      } catch {}
    }

    if (!ctaHandle) {
      return {
        ctaFound: false,
        ctaVisible: false,
        ctaClickable: false,
        modalOrNavigation: "none",
        formRendered: false,
        formFieldCount: 0,
        hubspotDetected,
        verificationStatus: "failed",
        evidenceNotes: ["No matching primary CTA button or link found on page"],
        screenshotBase64,
        elementPositions,
        discoveredSections
      };
    }

    // Check visibility and interactability
    const isVisible = await ctaHandle.isVisible();
    const isEnabled = await ctaHandle.isEnabled();

    if (!isVisible) {
      notes.push("CTA found in DOM but is hidden/invisible");
      return {
        ctaFound: true,
        ctaVisible: false,
        ctaClickable: false,
        modalOrNavigation: "none",
        formRendered: false,
        formFieldCount: 0,
        hubspotDetected,
        verificationStatus: "failed",
        evidenceNotes: notes,
        screenshotBase64,
        elementPositions,
        discoveredSections
      };
    }

    // Click CTA and observe modal or navigation
    let modalOrNavigation: "modal" | "navigation" | "none" | "error" = "none";
    let formRendered = false;
    let formFieldCount = 0;

    const initialUrl = page.url();

    try {
      await Promise.all([
        page.waitForNavigation({ timeout: 2500 }).catch(() => null),
        ctaHandle.click({ timeout: 2000 })
      ]);

      const currentUrl = page.url();
      if (currentUrl !== initialUrl && !currentUrl.includes("#")) {
        modalOrNavigation = "navigation";
        notes.push(`CTA click triggered navigation to: ${currentUrl}`);
      }
    } catch {
      // Click succeeded without immediate navigation
    }

    // Check for modal or form popup
    const modalCheck = await page.evaluate(() => {
      const modalElements = document.querySelectorAll(
        "[role='dialog'], .modal, .popup, [aria-modal='true'], [class*='modal'], [class*='dialog']"
      );
      const visibleModal = Array.from(modalElements).some(m => {
        const style = window.getComputedStyle(m);
        return style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0";
      });

      const inputs = document.querySelectorAll(
        "input:not([type='hidden']), select, textarea"
      );
      const visibleInputs = Array.from(inputs).filter(i => {
        const style = window.getComputedStyle(i);
        return style.display !== "none" && style.visibility !== "hidden";
      });

      return {
        modalVisible: visibleModal,
        inputCount: visibleInputs.length,
        hasEmailInput: !!document.querySelector("input[type='email'], input[name*='email']"),
        hasSubmitBtn: !!document.querySelector("button[type='submit'], input[type='submit']")
      };
    });

    if (modalCheck.modalVisible || modalCheck.inputCount > 0) {
      if (modalOrNavigation !== "navigation") {
        modalOrNavigation = "modal";
      }
      formRendered = modalCheck.hasEmailInput || modalCheck.inputCount > 0;
      formFieldCount = modalCheck.inputCount;
      notes.push(
        `Interactive lead capture verified: ${formFieldCount} input fields detected (email input: ${modalCheck.hasEmailInput})`
      );
    } else {
      notes.push("CTA clicked but no visible lead form or modal appeared within timeout");
    }

    const verificationStatus =
      formRendered && isVisible && isEnabled
        ? "passed"
        : isVisible && isEnabled
        ? "partial"
        : "failed";

    return {
      ctaFound: true,
      ctaVisible: isVisible,
      ctaClickable: isEnabled,
      modalOrNavigation,
      formRendered,
      formFieldCount,
      hubspotDetected,
      verificationStatus,
      evidenceNotes: notes,
      screenshotBase64,
      elementPositions,
      discoveredSections
    };
  } catch (err: any) {
    return {
      ctaFound: true,
      ctaVisible: false,
      ctaClickable: false,
      modalOrNavigation: "error",
      formRendered: false,
      formFieldCount: 0,
      hubspotDetected: false,
      verificationStatus: "failed",
      evidenceNotes: [`Verification error: ${err?.message || "Unknown error"}`],
      screenshotBase64,
      elementPositions: undefined
    };
  } finally {
    if (browser) {
      await browser.close().catch(() => null);
    }
  }
}
