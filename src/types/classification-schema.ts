import { z } from "zod";

export const PageTypeEnum = z.enum([
  "homepage",
  "product",
  "functional",
  "campaign",
  "resource",
  "case_study",
  "unknown"
]);
export type PageType = z.infer<typeof PageTypeEnum>;

export const VisitorIntentEnum = z.enum([
  "discovery",
  "consideration",
  "high_intent",
  "education",
  "unknown"
]);
export type VisitorIntent = z.infer<typeof VisitorIntentEnum>;

export const ClassificationEvidenceSchema = z.object({
  source: z.enum(["dom", "ai", "metadata"]),
  excerpt: z.string().min(1),
  selector: z.string().optional()
});
export type ClassificationEvidence = z.infer<typeof ClassificationEvidenceSchema>;

export const TargetAudienceSchema = z.object({
  segments: z.array(z.string()).default([]),
  roles: z.array(z.string()).default([]),
  industries: z.array(z.string()).default([])
});
export type TargetAudience = z.infer<typeof TargetAudienceSchema>;

export const ConversionObjectivesSchema = z.object({
  primary: z.string().min(1),
  secondary: z.array(z.string()).optional()
});
export type ConversionObjectives = z.infer<typeof ConversionObjectivesSchema>;

export const PrimaryCTASchema = z.object({
  text: z.string().min(1),
  action: z.string().min(1)
});
export type PrimaryCTA = z.infer<typeof PrimaryCTASchema>;

export const PageClassificationSchema = z.object({
  pageType: PageTypeEnum,
  targetAudience: TargetAudienceSchema,
  conversionObjectives: ConversionObjectivesSchema,
  primaryCTA: PrimaryCTASchema.optional(),
  visitorIntent: VisitorIntentEnum,
  confidence: z.number().min(0).max(1),
  evidence: z.array(ClassificationEvidenceSchema).min(1)
});
export type PageClassification = z.infer<typeof PageClassificationSchema>;

export interface RawPageInput {
  url: string;
  title?: string;
  metaDescription?: string;
  headings?: {
    h1?: string[];
    h2?: string[];
  };
  ctas?: {
    text: string;
    href?: string;
    tag?: string;
  }[];
  bodyExcerpt?: string;
}
