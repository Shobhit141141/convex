import * as cheerio from "cheerio";
import fs from "node:fs/promises";

const TARGET_URLS = [
  { id: "homepage", name: "Homepage", url: "https://leena.ai/" },
  { id: "hr_functional", name: "HR Functional Page", url: "https://leena.ai/function/hr" },
  { id: "christus_webinar", name: "Christus Health Webinar", url: "https://leena.ai/resources/webinars/christus-health-hr-ai-rollout-webinar" }
];

async function deepTeardown() {
  const reports = [];

  for (const target of TARGET_URLS) {
    const res = await fetch(target.url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
      }
    });
    const html = await res.text();
    const $ = cheerio.load(html);

    // Form and lead capture detection
    const directForms = $("form").length;
    const hasHubspot = html.includes("hs-form") || html.includes("hbspt") || html.includes("hubspot");
    const hasMarketo = html.includes("marketo") || html.includes("mkto");
    const hasChiliPiper = html.includes("chilipiper");
    const hasCalendly = html.includes("calendly");
    const hasTypeform = html.includes("typeform");
    const hasModalTrigger = $("[data-modal], [data-target*='modal'], [aria-haspopup='dialog']").length;

    // CTA analysis
    const ctaButtons = [];
    $("button, a").each((_, el) => {
      const text = $(el).text().replace(/\s+/g, " ").trim();
      const href = $(el).attr("href") || "";
      const isCta = /demo|tour|sales|talk|get started|register|watch|download|free/i.test(text);
      if (isCta && text.length < 40) {
        ctaButtons.push({ text, href, tag: el.tagName.toLowerCase() });
      }
    });

    // Content hierarchy
    const h1 = $("h1").first().text().replace(/\s+/g, " ").trim();
    const subheader = $("h1").next("p").text().replace(/\s+/g, " ").trim() ||
                      $("h1").parent().find("p").first().text().replace(/\s+/g, " ").trim();

    // Trust & proof
    const body = $("body").text();
    const metricMatches = body.match(/\b\d+(\.\d+)?%\b|\b\d+[xX]\b|\b\d+\+?\s*(days|weeks|enterprises|employees|hours)\b/gi) || [];
    const uniqueMetrics = [...new Set(metricMatches)].slice(0, 8);

    reports.push({
      id: target.id,
      name: target.name,
      url: target.url,
      title: $("title").text().trim(),
      hero: {
        h1,
        subheader: subheader.slice(0, 200)
      },
      conversionMechanisms: {
        directForms,
        hasHubspot,
        hasMarketo,
        hasChiliPiper,
        hasCalendly,
        hasModalTrigger,
        topCtas: ctaButtons.slice(0, 6)
      },
      quantifiedProof: uniqueMetrics,
      textLength: body.length
    });
  }

  await fs.writeFile("data/phase1-deep-teardown.json", JSON.stringify(reports, null, 2));
  console.log("Deep teardown complete. Saved to data/phase1-deep-teardown.json");
}

deepTeardown();
