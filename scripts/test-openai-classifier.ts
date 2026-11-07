import { classifyPage } from "../src/features/ai/classifier";
import { createOpenAIClassifier, buildUserPrompt } from "../src/features/ai/openai-classifier";
import {
  homepageFixture,
  hrFunctionalFixture,
  christusWebinarFixture
} from "../tests/fixtures/classification-fixtures";

async function main() {
  const aiClient = createOpenAIClassifier();
  if (!aiClient) {
    console.error("OPENAI_API_KEY not set in .env.local");
    process.exit(1);
  }

  console.log("OpenAI classifier wired up. Testing against Leena AI pages...\n");

  const fixtures = [
    { name: "Homepage", fixture: homepageFixture, expected: "homepage" },
    { name: "HR Functional", fixture: hrFunctionalFixture, expected: "functional" },
    { name: "Christus Webinar", fixture: christusWebinarFixture, expected: "resource" }
  ];

  for (const { name, fixture, expected } of fixtures) {
    console.log(`--- ${name} ---`);
    console.log(`Prompt:\n${buildUserPrompt(fixture)}\n`);

    try {
      const result = await classifyPage(fixture, aiClient);
      const match = result.pageType === expected ? "✅" : "❌";
      console.log(`${match} pageType: ${result.pageType} (expected: ${expected})`);
      console.log(`   intent: ${result.visitorIntent}`);
      console.log(`   confidence: ${result.confidence}`);
      console.log(`   primaryCTA: ${result.primaryCTA?.text || "none"} → ${result.primaryCTA?.action || "n/a"}`);
      console.log(`   audience: ${JSON.stringify(result.targetAudience)}`);
      console.log(`   objective: ${result.conversionObjectives.primary}`);
      console.log(`   evidence (${result.evidence.length} items):`);
      for (const e of result.evidence) {
        console.log(`     [${e.source}] ${e.excerpt}`);
      }
    } catch (err) {
      console.error(`   Error: ${err}`);
    }
    console.log();
  }
}

main();
