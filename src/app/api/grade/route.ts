import { NextRequest, NextResponse } from "next/server";
import { gradeLandingPage } from "@/features/pipeline/grader-pipeline";
import { z } from "zod";

const GradeRequestSchema = z.object({
  url: z.string().min(3, "URL is required"),
  enablePlaywright: z.boolean().optional().default(true),
  stream: z.boolean().optional().default(false)
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

    const { url, enablePlaywright, stream } = parsed.data;

    if (stream) {
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          const send = (payload: Record<string, unknown>) => {
            try {
              controller.enqueue(encoder.encode(JSON.stringify(payload) + "\n"));
            } catch {
              // Stream closed by client
            }
          };

          try {
            const report = await gradeLandingPage(url, {
              enableLivePlaywright: enablePlaywright,
              pageSpeedApiKey: process.env.PAGESPEED_API_KEY,
              onProgress: (event) => {
                send({ type: "progress", event });
              }
            });

            send({ type: "result", success: true, report });
          } catch (err: any) {
            send({
              type: "error",
              success: false,
              error: err.message || "Failed to evaluate page."
            });
          } finally {
            try {
              controller.close();
            } catch {}
          }
        }
      });

      return new Response(readable, {
        headers: {
          "Content-Type": "application/x-ndjson; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive"
        }
      });
    }

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
