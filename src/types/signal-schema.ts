import { z } from "zod";

export const SignalStatusEnum = z.enum([
  "passed",
  "partial",
  "failed",
  "not_applicable",
  "not_detected",
  "not_tested"
]);
export type SignalStatus = z.infer<typeof SignalStatusEnum>;

export const SignalEvidenceSchema = z.object({
  source: z.enum(["dom", "browser", "pagespeed", "ai", "metadata"]),
  selector: z.string().optional(),
  excerpt: z.string().optional(),
  observedValue: z.union([z.string(), z.number(), z.boolean()]).optional()
});
export type SignalEvidence = z.infer<typeof SignalEvidenceSchema>;

export const EvaluationDimensionEnum = z.enum(["quality", "readiness"]);
export type EvaluationDimension = z.infer<typeof EvaluationDimensionEnum>;

export const EvaluationSignalSchema = z.object({
  id: z.string(),
  name: z.string(),
  dimension: EvaluationDimensionEnum,
  status: SignalStatusEnum,
  rawValue: z.unknown().optional(),
  normalizedScore: z.number().min(0).max(1),
  weight: z.number().min(0),
  maxPoints: z.number().min(0),
  earnedPoints: z.number().min(0),
  evidence: z.array(SignalEvidenceSchema),
  rationale: z.string(),
  confidence: z.number().min(0).max(1)
});
export type EvaluationSignal = z.infer<typeof EvaluationSignalSchema>;

export interface RubricV2Category {
  id: string;
  name: string;
  dimension: EvaluationDimension;
  score: number;
  maxScore: number;
  percentage: number;
  weight: number;
  signals: EvaluationSignal[];
}

export interface RubricV2Result {
  url: string;
  totalScore: number; // 0 - 100
  tierScores: {
    quality: { score: number; maxScore: number; percentage: number };
    readiness: { score: number; maxScore: number; percentage: number };
  };
  rubricVersion: "v2";
  pageType: string;
  targetAudience: {
    segments: string[];
    roles: string[];
    industries: string[];
  };
  visitorIntent: string;
  categories: RubricV2Category[];
  evaluatedAt: string;
}
