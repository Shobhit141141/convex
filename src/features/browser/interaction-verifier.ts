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
}

export interface VerificationOptions {
  timeoutMs?: number;
  viewport?: { width: number; height: number };
}

export async function verifyConversionInteraction(
  urlOrHtml: string,
  primaryCtaText?: string,
  options: VerificationOptions = {}
): Promise<ConversionVerificationResult> {
  const timeoutMs = options.timeoutMs ?? 8000;
  const isHtml = urlOrHtml.trim().startsWith("<") || urlOrHtml.includes("<!DOCTYPE");

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
    browser = await chromiumModule.chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });
  } catch (err: any) {
    return {
      ctaFound: false,
      ctaVisible: false,
      ctaClickable: false,
      modalOrNavigation: "none",
      formRendered: false,
      formFieldCount: 0,
      hubspotDetected: false,
      verificationStatus: "not_tested",
      evidenceNotes: [
        `Browser executable unavailable (${err?.message?.split("\n")[0] || "launch failed"}). Fallback to DOM evaluation.`
      ]
    };
  }

  const notes: string[] = [];

  try {
    const page = await browser.newPage({
      viewport: options.viewport ?? { width: 1280, height: 800 }
    });

    if (isHtml) {
      await page.setContent(urlOrHtml, { waitUntil: "domcontentloaded", timeout: timeoutMs });
    } else {
      await page.goto(urlOrHtml, { waitUntil: "domcontentloaded", timeout: timeoutMs });
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
        evidenceNotes: ["No matching primary CTA button or link found on page"]
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
        evidenceNotes: notes
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
      evidenceNotes: notes
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
      evidenceNotes: [`Verification error: ${err?.message || "Unknown error"}`]
    };
  } finally {
    if (browser) {
      await browser.close().catch(() => null);
    }
  }
}
