import { NextRequest, NextResponse } from "next/server";
import { getAuditById, listAuditHistory } from "@/features/storage/audit-history";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const idParam = searchParams.get("id");

    if (idParam) {
      const id = Number(idParam);
      if (Number.isNaN(id)) {
        return NextResponse.json({ error: "Invalid audit ID" }, { status: 400 });
      }
      const record = await getAuditById(id);
      if (!record) {
        return NextResponse.json({ error: "Audit record not found" }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        recordId: record.recordId,
        createdAt: record.createdAt,
        report: record.report
      });
    }

    const limit = Math.min(Number(searchParams.get("limit") || 30), 100);
    const filterUrl = searchParams.get("url") || undefined;
    const history = await listAuditHistory(limit, filterUrl);

    return NextResponse.json({
      success: true,
      history
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch audit history" },
      { status: 500 }
    );
  }
}
