import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { validateProductionConfig } from "@/lib/server/production-config";

// W24-H readiness smoke. Returns safe status + cause codes only — never a secret.
// Causes: config_missing | redis_unreachable | renderer_unready.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const causes: string[] = [];

  const config = validateProductionConfig(process.env);
  if (!config.ok) {
    // Surface the safe cause codes (variable names, not values).
    causes.push("config_missing");
    for (const problem of config.problems) causes.push(problem.code);
  }

  const isProduction = process.env.NODE_ENV === "production";
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (isProduction && redisUrl && redisToken) {
    // A cheap PING — does not consume rate-limit quota.
    try {
      await new Redis({ url: redisUrl, token: redisToken }).ping();
    } catch {
      causes.push("redis_unreachable");
    }
  }

  const pdfUrl = process.env.PDF_RENDERER_URL?.trim();
  if (pdfUrl) {
    try {
      const probe = await fetch(`${pdfUrl.replace(/\/$/u, "")}/ready`, {
        headers: process.env.PDF_RENDERER_TOKEN
          ? { "x-render-token": process.env.PDF_RENDERER_TOKEN }
          : {},
        signal: AbortSignal.timeout(3_000),
      });
      if (!probe.ok) causes.push("renderer_unready");
    } catch {
      causes.push("renderer_unready");
    }
  }

  const ready = causes.length === 0;
  return NextResponse.json(
    { ready, causes: [...new Set(causes)] },
    { status: ready ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
