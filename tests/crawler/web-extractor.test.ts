import { describe, it, expect } from "vitest";
import { validateSafeUrl } from "@/features/crawler/web-extractor";

describe("WebExtractor SSRF & Security Validation", () => {
  it("allows valid public HTTPS and HTTP URLs", () => {
    const valid1 = validateSafeUrl("https://leena.ai/function/hr");
    expect(valid1.hostname).toBe("leena.ai");

    const valid2 = validateSafeUrl("http://example.com");
    expect(valid2.hostname).toBe("example.com");

    const valid3 = validateSafeUrl("stripe.com/pricing");
    expect(valid3.hostname).toBe("stripe.com");
  });

  it("blocks unsupported protocols like file://, ftp://, javascript:", () => {
    expect(() => validateSafeUrl("file:///etc/passwd")).toThrow(/Blocked unsupported protocol/);
    expect(() => validateSafeUrl("ftp://files.example.com")).toThrow(/Blocked unsupported protocol/);
    expect(() => validateSafeUrl("javascript:alert(1)")).toThrow(/Blocked unsupported protocol/);
  });

  it("blocks localhost, 127.0.0.1 and local loopback domains", () => {
    expect(() => validateSafeUrl("http://localhost:3000")).toThrow(/SSRF Protection/);
    expect(() => validateSafeUrl("http://127.0.0.1:8080")).toThrow(/SSRF Protection/);
    expect(() => validateSafeUrl("http://test.localhost")).toThrow(/SSRF Protection/);
  });

  it("blocks private IP ranges (10.x, 172.16-31.x, 192.168.x)", () => {
    expect(() => validateSafeUrl("http://10.0.0.1/admin")).toThrow(/SSRF Protection/);
    expect(() => validateSafeUrl("http://192.168.1.1/router")).toThrow(/SSRF Protection/);
    expect(() => validateSafeUrl("http://172.20.0.1")).toThrow(/SSRF Protection/);
  });

  it("blocks cloud metadata service IP 169.254.169.254", () => {
    expect(() => validateSafeUrl("http://169.254.169.254/latest/meta-data/")).toThrow(/SSRF Protection/);
  });
});
