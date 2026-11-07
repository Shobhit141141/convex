import { NextRequest, NextResponse } from "next/server";
import { gradeLandingPage } from "@/features/pipeline/grader-pipeline";
import { z } from "zod";

const GradeRequestSchema = z.object({
  url: z.string().min(3, "URL is required"),
  enablePlaywright: z.boolean().optional().default(false)
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = GradeRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message || "Invalid input payload"
        },
        { status: 400 }
      );
    }

    const { url, enablePlaywright } = parsed.data;

    const report = await gradeLandingPage(url, {
      enableLivePlaywright: enablePlaywright,
      pageSpeedApiKey: process.env.PAGESPEED_API_KEY
    });

    return NextResponse.json({
      success: true,
      report
    });
  } catch (err: any) {
    console.error("[/api/grade] Evaluation error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || "An unexpected error occurred while evaluating the page."
      },
      { status: 500 }
    );
  }
}
