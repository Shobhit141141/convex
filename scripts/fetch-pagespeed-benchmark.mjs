import fs from "node:fs/promises";

const TARGETS = [
  { id: "homepage", url: "https://leena.ai/" },
  { id: "hr_functional", url: "https://leena.ai/function/hr" },
  { id: "christus_webinar", url: "https://leena.ai/resources/webinars/christus-health-hr-ai-rollout-webinar" }
];

async function run() {
  console.log("Fetching live Google PageSpeed Insights for all 3 pages...");
  const results = {};

  for (const t of TARGETS) {
    console.log(`Calling PageSpeed API for ${t.url} (mobile)...`);
    try {
      const endpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(t.url)}&strategy=mobile&category=performance`;
      const res = await fetch(endpoint);
      if (!res.ok) {
        console.warn(`PageSpeed returned ${res.status} for ${t.url}`);
        continue;
      }
      const data = await res.json();
      const lh = data.lighthouseResult;
      const audits = lh?.audits || {};
      const score = Math.round((lh?.categories?.performance?.score ?? 0) * 100);
      const lcp = (audits["largest-contentful-paint"]?.numericValue ?? 0) / 1000;
      const cls = audits["cumulative-layout-shift"]?.numericValue ?? 0;
      const fcp = (audits["first-contentful-paint"]?.numericValue ?? 0) / 1000;

      results[t.id] = {
        url: t.url,
        score,
        lcp: Number(lcp.toFixed(2)),
        cls: Number(cls.toFixed(3)),
        fcp: Number(fcp.toFixed(2)),
        fetchedAt: new Date().toISOString()
      };
      console.log(`Success ${t.id}: Score=${score}, LCP=${lcp.toFixed(2)}s, CLS=${cls.toFixed(3)}`);
    } catch (err) {
      console.error(`Error fetching ${t.url}:`, err);
    }
  }

  await fs.writeFile("data/phase2-pagespeed-live.json", JSON.stringify(results, null, 2));
  console.log("Saved live PageSpeed data to data/phase2-pagespeed-live.json");
}

run();
