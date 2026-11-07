export interface PageSpeedMetrics {
  lighthouseScore: number; // 0 - 100
  lcpSeconds: number;
  cls: number;
  fcpSeconds: number;
  strategy: "mobile" | "desktop";
  fetchedAt: string;
  screenshotDataUrl?: string;
}

export async function fetchPageSpeedMetrics(
  targetUrl: string,
  apiKey?: string,
  strategy: "mobile" | "desktop" = "mobile"
): Promise<PageSpeedMetrics> {
  const endpoint = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
  endpoint.searchParams.set("url", targetUrl);
  endpoint.searchParams.set("strategy", strategy);
  endpoint.searchParams.set("category", "performance");

  if (apiKey) {
    endpoint.searchParams.set("key", apiKey);
  }

  const response = await fetch(endpoint.toString(), {
    headers: {
      Accept: "application/json"
    },
    signal: AbortSignal.timeout(20000)
  });

  if (!response.ok) {
    throw new Error(`Google PageSpeed API failed with status ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  const lighthouse = data.lighthouseResult;
  const audits = lighthouse?.audits || {};
  const categories = lighthouse?.categories || {};

  const lighthouseScore = Math.round((categories.performance?.score ?? 0) * 100);
  const lcpSeconds = (audits["largest-contentful-paint"]?.numericValue ?? 3500) / 1000;
  const cls = audits["cumulative-layout-shift"]?.numericValue ?? 0.05;
  const fcpSeconds = (audits["first-contentful-paint"]?.numericValue ?? 2000) / 1000;
  const screenshotDataUrl: string | undefined =
    lighthouse?.fullPageScreenshot?.screenshot?.data ||
    audits["final-screenshot"]?.details?.data;

  return {
    lighthouseScore,
    lcpSeconds: Number(lcpSeconds.toFixed(2)),
    cls: Number(cls.toFixed(3)),
    fcpSeconds: Number(fcpSeconds.toFixed(2)),
    strategy,
    fetchedAt: new Date().toISOString(),
    screenshotDataUrl
  };
}
