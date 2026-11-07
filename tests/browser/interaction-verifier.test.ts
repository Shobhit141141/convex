import { describe, it, expect } from "vitest";
import { verifyConversionInteraction } from "@/features/browser/interaction-verifier";

describe("InteractionVerifier Tests", () => {
  it("safely handles offline/unsupported environment without throwing", async () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head><title>Test Page</title></head>
        <body>
          <h1>Welcome</h1>
          <button id="cta">Book a demo</button>
        </body>
      </html>
    `;

    // Testing with short timeout so it doesn't block
    const result = await verifyConversionInteraction(html, "Book a demo", { timeoutMs: 1500 });

    expect(result).toBeDefined();
    expect(typeof result.formRendered).toBe("boolean");
    expect(Array.isArray(result.evidenceNotes)).toBe(true);
    expect(["passed", "partial", "failed", "not_tested"]).toContain(result.verificationStatus);
  });

  it("handles empty or missing CTA gracefully", async () => {
    const html = `<html><body><p>No buttons here</p></body></html>`;
    const result = await verifyConversionInteraction(html, undefined, { timeoutMs: 1500 });

    expect(result).toBeDefined();
    expect(result.formRendered).toBe(false);
  });
});
