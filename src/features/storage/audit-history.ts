import { GraderReport } from "@/features/pipeline/grader-pipeline";

export interface AuditHistoryItem {
  id: number;
  url: string;
  normalized_url: string;
  page_type: string;
  total_score: number;
  letter_grade: string;
  persuasion_score: number;
  execution_score: number;
  experience_score: number;
  summary: string;
  created_at: string;
}

const DEFAULT_SUPABASE_URL = "https://bkenheizxrsjhuekgfzz.supabase.co";
const DEFAULT_SUPABASE_KEY = "sb_publishable_dJrhk5XBwxLD1akfBGsiyw_DeYgfk1j";

function getSupabaseConfig() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL).replace(/\/$/, "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || DEFAULT_SUPABASE_KEY;
  return { url, key };
}

export function normalizeAuditUrl(rawUrl: string): string {
  try {
    const trimmed = rawUrl.trim();
    const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const parsed = new URL(withProto);
    parsed.hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");
    parsed.hash = "";
    if (parsed.pathname.length > 1 && parsed.pathname.endsWith("/")) {
      parsed.pathname = parsed.pathname.slice(0, -1);
    }
    return parsed.toString();
  } catch {
    return rawUrl.trim().toLowerCase().replace(/\/+$/, "");
  }
}

export async function getCachedAuditByUrl(
  rawUrl: string
): Promise<{ recordId: number; createdAt: string; report: GraderReport } | null> {
  try {
    const { url, key } = getSupabaseConfig();
    const normalized = normalizeAuditUrl(rawUrl);
    const endpoint = `${url}/rest/v1/landing_page_audits?normalized_url=eq.${encodeURIComponent(
      normalized
    )}&select=id,created_at,report&order=created_at.desc&limit=1`;

    const res = await fetch(endpoint, {
      method: "GET",
      headers: {
        apikey: key,
        Accept: "application/json"
      },
      cache: "no-store"
    });

    if (!res.ok) return null;
    const rows = await res.json();
    if (!Array.isArray(rows) || rows.length === 0 || !rows[0]?.report) {
      return null;
    }

    return {
      recordId: Number(rows[0].id),
      createdAt: String(rows[0].created_at),
      report: rows[0].report as GraderReport
    };
  } catch (err) {
    console.warn("[audit-history] Failed to read cached audit:", err);
    return null;
  }
}

export async function getAuditById(
  id: number
): Promise<{ recordId: number; createdAt: string; report: GraderReport } | null> {
  try {
    const { url, key } = getSupabaseConfig();
    const endpoint = `${url}/rest/v1/landing_page_audits?id=eq.${encodeURIComponent(
      String(id)
    )}&select=id,created_at,report&limit=1`;

    const res = await fetch(endpoint, {
      method: "GET",
      headers: {
        apikey: key,
        Accept: "application/json"
      },
      cache: "no-store"
    });

    if (!res.ok) return null;
    const rows = await res.json();
    if (!Array.isArray(rows) || rows.length === 0 || !rows[0]?.report) {
      return null;
    }

    return {
      recordId: Number(rows[0].id),
      createdAt: String(rows[0].created_at),
      report: rows[0].report as GraderReport
    };
  } catch (err) {
    console.warn("[audit-history] Failed to fetch audit by ID:", err);
    return null;
  }
}

export async function saveAuditReport(
  report: GraderReport
): Promise<{ recordId: number; createdAt: string } | null> {
  try {
    const { url, key } = getSupabaseConfig();
    const normalized = normalizeAuditUrl(report.url);
    const payload = {
      url: report.url,
      normalized_url: normalized,
      page_type: report.pageType,
      total_score: report.totalScore,
      letter_grade: report.letterGrade,
      persuasion_score: report.dimensions.persuasion.score,
      execution_score: report.dimensions.execution.score,
      experience_score: report.dimensions.experience.score,
      summary: report.summary,
      report
    };

    const res = await fetch(`${url}/rest/v1/landing_page_audits`, {
      method: "POST",
      headers: {
        apikey: key,
        "Content-Type": "application/json",
        Prefer: "return=representation"
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.warn("[audit-history] Supabase insert failed:", res.status, errText);
      return null;
    }

    const inserted = await res.json();
    const row = Array.isArray(inserted) ? inserted[0] : inserted;
    if (!row?.id) return null;

    return {
      recordId: Number(row.id),
      createdAt: String(row.created_at || new Date().toISOString())
    };
  } catch (err) {
    console.warn("[audit-history] Failed to save audit report:", err);
    return null;
  }
}

export async function listAuditHistory(
  limit = 30,
  filterUrl?: string
): Promise<AuditHistoryItem[]> {
  try {
    const { url, key } = getSupabaseConfig();
    const params = new URLSearchParams({
      select:
        "id,url,normalized_url,page_type,total_score,letter_grade,persuasion_score,execution_score,experience_score,summary,created_at",
      order: "created_at.desc",
      limit: String(limit)
    });

    if (filterUrl) {
      params.set("normalized_url", `eq.${normalizeAuditUrl(filterUrl)}`);
    }

    const res = await fetch(`${url}/rest/v1/landing_page_audits?${params.toString()}`, {
      method: "GET",
      headers: {
        apikey: key,
        Accept: "application/json"
      },
      cache: "no-store"
    });

    if (!res.ok) return [];
    const rows = await res.json();
    return Array.isArray(rows) ? (rows as AuditHistoryItem[]) : [];
  } catch (err) {
    console.warn("[audit-history] Failed to list audit history:", err);
    return [];
  }
}
