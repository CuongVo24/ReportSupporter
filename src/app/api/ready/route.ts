import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { validateProductionConfig } from "@/lib/server/production-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const causes: string[] = [];

  const config = validateProductionConfig(process.env);
  if (!config.ok) {
    causes.push("config_missing");
    for (const problem of config.problems) causes.push(problem.code);
  }

  const isProduction = process.env.NODE_ENV === "production";
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (isProduction && redisUrl && redisToken) {
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
        redirect: "manual", // Reject redirects; do not follow or forward tokens to unapproved destinations
        signal: AbortSignal.timeout(3_000),
      });

      if (!probe.ok || (probe.status >= 300 && probe.status < 400)) {
        causes.push("renderer_unready");
      }
    } catch {
      causes.push("renderer_unready");
    }
  }

  const ready = causes.length === 0;

  // Check if caller is an authorized operator requesting detailed diagnostics
  const operatorToken = process.env.OPERATOR_DIAGNOSTICS_TOKEN?.trim();
  const reqOperatorToken = req.headers.get("x-operator-token")?.trim();
  const urlParams = new URL(req.url).searchParams;
  const isOperator =
    (!isProduction && urlParams.get("diagnostics") === "1") ||
    (operatorToken && reqOperatorToken === operatorToken);

  if (isOperator) {
    return NextResponse.json(
      { ready, causes: [...new Set(causes)], timestamp: new Date().toISOString() },
      { status: ready ? 200 : 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  // Generic public readiness response: minimalist ready boolean, no internal cause fingerprinting
  return NextResponse.json(
    { ready },
    { status: ready ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
