import { NextRequest, NextResponse } from "next/server";
import { gradeLandingPage } from "@/features/pipeline/grader-pipeline";
import { getCachedAuditByUrl, saveAuditReport } from "@/features/storage/audit-history";
import { z } from "zod";

const GradeRequestSchema = z.object({
  url: z.string().min(3, "URL is required"),
  enablePlaywright: z.boolean().optional().default(true),
  stream: z.boolean().optional().default(false),
  forceRefresh: z.boolean().optional().default(false)
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

    const { url, enablePlaywright, stream, forceRefresh } = parsed.data;

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
            const startMs = Date.now();
            if (!forceRefresh) {
              const cached = await getCachedAuditByUrl(url);
              if (cached) {
                send({
                  type: "progress",
                  event: {
                    step: "complete",
                    percent: 100,
                    stageLabel: "Loaded from Supabase Audit Cache",
                    detail: `Restored saved record #${cached.recordId} (${cached.report.totalScore}/100, Grade ${cached.report.letterGrade}) without re-fetching`,
                    elapsedMs: Date.now() - startMs
                  }
                });
                send({
                  type: "result",
                  success: true,
                  cached: true,
                  recordId: cached.recordId,
                  cachedAt: cached.createdAt,
                  report: cached.report
                });
                return;
              }
            }

            const report = await gradeLandingPage(url, {
              enableLivePlaywright: enablePlaywright,
              pageSpeedApiKey: process.env.PAGESPEED_API_KEY,
              onProgress: (event) => {
                send({ type: "progress", event });
              }
            });

            const saved = await saveAuditReport(report);

            send({
              type: "result",
              success: true,
              cached: false,
              recordId: saved?.recordId,
              cachedAt: saved?.createdAt || report.evaluatedAt,
              report
            });
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

    if (!forceRefresh) {
      const cached = await getCachedAuditByUrl(url);
      if (cached) {
        return NextResponse.json({
          success: true,
          cached: true,
          recordId: cached.recordId,
          cachedAt: cached.createdAt,
          report: cached.report
        });
      }
    }

    const report = await gradeLandingPage(url, {
      enableLivePlaywright: enablePlaywright,
      pageSpeedApiKey: process.env.PAGESPEED_API_KEY
    });

    const saved = await saveAuditReport(report);

    return NextResponse.json({
      success: true,
      cached: false,
      recordId: saved?.recordId,
      cachedAt: saved?.createdAt || report.evaluatedAt,
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
