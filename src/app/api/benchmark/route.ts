import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

export async function GET() {
  try {
    const dataPath = path.resolve(process.cwd(), "data/phase-3-final-results.json");
    const content = await fs.readFile(dataPath, "utf8");
    const benchmark = JSON.parse(content);

    return NextResponse.json({
      success: true,
      benchmark
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to load benchmark results: " + err.message
      },
      { status: 500 }
    );
  }
}
