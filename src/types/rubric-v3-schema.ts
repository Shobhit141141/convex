import { z } from "zod";
import { SignalStatusEnum } from "./signal-schema";

export const V3DimensionEnum = z.enum([
  "persuasion", // Dimension A (50 pts)
  "execution",  // Dimension B (35 pts)
  "experience"  // Dimension C (15 pts)
]);
export type V3Dimension = z.infer<typeof V3DimensionEnum>;

export const V3CriterionScoreSchema = z.object({
  id: z.string(),
  name: z.string(),
  dimension: V3DimensionEnum,
  status: SignalStatusEnum,
  maxPoints: z.number().min(0),
  earnedPoints: z.number().min(0),
  evidence: z.string(),
  scoringRule: z.string(),
  confidence: z.number().min(0).max(1),
  source: z.enum(["ai_semantic", "browser_playwright", "dom_extraction", "pagespeed"]),
  notes: z.string().optional()
});
export type V3CriterionScore = z.infer<typeof V3CriterionScoreSchema>;

export const V3DimensionSummarySchema = z.object({
  dimension: V3DimensionEnum,
  name: z.string().optional(),
  score: z.number().min(0),
  maxScore: z.number().min(0),
  percentage: z.number().min(0).max(100),
  gateApplied: z.boolean().default(false),
  gateReason: z.string().optional(),
  criteria: z.array(V3CriterionScoreSchema)
});
export type V3DimensionSummary = z.infer<typeof V3DimensionSummarySchema>;

export interface RubricV3Result {
  url: string;
  totalScore: number; // 0 - 100
  dimensions: {
    persuasion: V3DimensionSummary;
    execution: V3DimensionSummary;
    experience: V3DimensionSummary;
  };
  rubricVersion: "v3";
  pageType: string;
  targetAudience: {
    segments: string[];
    roles: string[];
    industries: string[];
  };
  visitorIntent: string;
  evaluatedAt: string;
  gatesTriggered: string[];
  persuasionWeaknesses: string[];
  conversionBlockers: string[];
  playwrightVerified: boolean;
}
