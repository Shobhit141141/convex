import { describe, it, expect } from "vitest";
import { analyzeTrafficPerformance } from "@/features/benchmark/traffic-adjusted-benchmark";

describe("Tier C: Traffic-Adjusted Performance Benchmark", () => {
  it("diagnoses paid social push traffic as depressing observed conversion rates", () => {
    const webinar = analyzeTrafficPerformance(
      "christus_webinar",
      "Christus Health Webinar",
      12437,
      14,
      { paid_social: 0.79, email: 0.18, others: 0.03 }
    );

    expect(webinar.trafficIntentIndex).toBeLessThan(0.35); // Low intent push traffic
    expect(webinar.diagnosis).toContain("Paid Social");
    expect(webinar.actualCvr).toBeCloseTo(0.001126, 5);
  });

  it("identifies paid search as high commercial intent driver", () => {
    const hr = analyzeTrafficPerformance(
      "hr_functional",
      "HR Functional Page",
      1907,
      11,
      { paid_search: 0.58, organic_search: 0.17, direct: 0.14, paid_social: 0.07, email: 0.03, others: 0.01 }
    );

    expect(hr.trafficIntentIndex).toBeGreaterThan(0.75); // High commercial intent
    expect(hr.diagnosis).toContain("commercial search intent");
    expect(hr.actualCvr).toBeCloseTo(0.005768, 5);
  });

  it("handles balanced brand direct/organic traffic", () => {
    const home = analyzeTrafficPerformance(
      "homepage",
      "Homepage",
      18343,
      103,
      { direct: 0.44, organic_search: 0.25, paid_search: 0.15, paid_social: 0.01, email: 0.03, others: 0.12 }
    );

    expect(home.trafficIntentIndex).toBeGreaterThan(0.65);
    expect(home.actualCvr).toBeCloseTo(0.005615, 5);
  });
});
