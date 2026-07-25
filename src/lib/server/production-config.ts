// W24-H & W25-J: Production deployment config contract — server-only.
//
// Turns "tribal knowledge" env requirements into a checkable contract that fails
// EARLY (predeploy / readiness) instead of after a user hits a 503. Pure and
// dependency-free so it runs in `next build`, a predeploy script, and the
// readiness route. NEVER echoes a secret value — diagnostics carry the variable
// NAME and a cause code only.
//
// Do NOT import this into client code: it reads secrets from the environment.

export type ConfigProblemCode =
  | "redis_missing"
  | "redis_incomplete"
  | "redis_url_format"
  | "proxy_mode_invalid"
  | "proxy_mode_shared_bucket"
  | "pdf_url_format"
  | "pdf_url_credentials"
  | "pdf_token_missing"
  | "pdf_token_insecure"
  | "numeric_config_invalid"
  | "deadline_hierarchy_invalid";

export type ConfigProblem = {
  code: ConfigProblemCode;
  variable: string;
  message: string;
};

export type ConfigReport = {
  ok: boolean;
  problems: ConfigProblem[];
  warnings: ConfigProblem[];
};

export type ConfigEnv = Record<string, string | undefined>;

const PROXY_MODES = ["none", "vercel", "forwarded", "cloudflare", "x-real-ip"] as const;
// Local-only default token shipped in docker-compose for dev; must never reach production.
const LOCAL_DEFAULT_PDF_TOKEN = "local-render-token";

function trimmed(env: ConfigEnv, key: string): string {
  return (env[key] ?? "").trim();
}

function parseBoundedInt(
  valStr: string,
  min: number,
  max: number,
): { valid: boolean; value: number } {
  if (!valStr) return { valid: false, value: 0 };
  const num = Number(valStr);
  if (!Number.isInteger(num) || num < min || num > max) {
    return { valid: false, value: 0 };
  }
  return { valid: true, value: num };
}

/**
 * Validate the deployment config. `target` decides which surfaces are required:
 *  - production=true  → the rate limiter uses Redis, so Upstash pairing is required.
 *  - pdfEnabled       → PDF_RENDERER_URL/TOKEN pairing is required.
 */
export function validateProductionConfig(
  env: ConfigEnv,
  options: { production?: boolean; pdfEnabled?: boolean } = {},
): ConfigReport {
  const production = options.production ?? env.NODE_ENV === "production";
  const pdfUrl = trimmed(env, "PDF_RENDERER_URL");
  const pdfEnabled = options.pdfEnabled ?? pdfUrl.length > 0;

  const problems: ConfigProblem[] = [];
  const warnings: ConfigProblem[] = [];

  // --- Redis / rate-limit backend ---
  const redisUrl = trimmed(env, "UPSTASH_REDIS_REST_URL");
  const redisToken = trimmed(env, "UPSTASH_REDIS_REST_TOKEN");
  if (production) {
    if (!redisUrl && !redisToken) {
      problems.push({
        code: "redis_missing",
        variable: "UPSTASH_REDIS_REST_URL",
        message: "Production rate limiter cần Upstash Redis; đặt UPSTASH_REDIS_REST_URL và UPSTASH_REDIS_REST_TOKEN.",
      });
    } else if (!redisUrl || !redisToken) {
      problems.push({
        code: "redis_incomplete",
        variable: redisUrl ? "UPSTASH_REDIS_REST_TOKEN" : "UPSTASH_REDIS_REST_URL",
        message: "UPSTASH_REDIS_REST_URL và UPSTASH_REDIS_REST_TOKEN phải đi thành cặp.",
      });
    } else if (!/^https:\/\//u.test(redisUrl)) {
      problems.push({
        code: "redis_url_format",
        variable: "UPSTASH_REDIS_REST_URL",
        message: "UPSTASH_REDIS_REST_URL phải là URL https.",
      });
    }
  }

  // --- Trusted proxy mode ---
  const proxyMode = trimmed(env, "TRUSTED_PROXY_MODE").toLowerCase() || "none";
  if (!PROXY_MODES.includes(proxyMode as (typeof PROXY_MODES)[number])) {
    problems.push({
      code: "proxy_mode_invalid",
      variable: "TRUSTED_PROXY_MODE",
      message: `TRUSTED_PROXY_MODE phải thuộc: ${PROXY_MODES.join(", ")}.`,
    });
  } else if (production && proxyMode === "none") {
    problems.push({
      code: "proxy_mode_shared_bucket",
      variable: "TRUSTED_PROXY_MODE",
      message: "TRUSTED_PROXY_MODE=none trong production khiến rate-limit dùng chung bucket 'direct'. Chọn đúng mode theo host (vercel/cloudflare/x-real-ip).",
    });
  }

  // --- PDF renderer pairing & URL security ---
  if (pdfEnabled) {
    if (pdfUrl) {
      if (!/^https?:\/\//u.test(pdfUrl)) {
        problems.push({
          code: "pdf_url_format",
          variable: "PDF_RENDERER_URL",
          message: "PDF_RENDERER_URL phải là URL http(s).",
        });
      }
      if (/^https?:\/\/[^/]+@/u.test(pdfUrl)) {
        problems.push({
          code: "pdf_url_credentials",
          variable: "PDF_RENDERER_URL",
          message: "PDF_RENDERER_URL không được chứa user credentials trong URL.",
        });
      }
    }
    const pdfToken = trimmed(env, "PDF_RENDERER_TOKEN");
    if (!pdfToken) {
      problems.push({
        code: "pdf_token_missing",
        variable: "PDF_RENDERER_TOKEN",
        message: "Bật PDF renderer thì PDF_RENDERER_TOKEN không được rỗng.",
      });
    } else if (production && pdfToken === LOCAL_DEFAULT_PDF_TOKEN) {
      problems.push({
        code: "pdf_token_insecure",
        variable: "PDF_RENDERER_TOKEN",
        message: "PDF_RENDERER_TOKEN đang là token mặc định local trong production. Cấp token bí mật riêng.",
      });
    }
  }

  // --- Numeric Range & Deadline Hierarchy Validation ---
  const renderDeadlineStr = trimmed(env, "PDF_RENDER_DEADLINE_MS");
  const gatewayDeadlineStr = trimmed(env, "PDF_GATEWAY_DEADLINE_MS");
  const clientDeadlineStr = trimmed(env, "PDF_CLIENT_DEADLINE_MS");

  const renderDeadline = renderDeadlineStr
    ? parseBoundedInt(renderDeadlineStr, 5_000, 120_000)
    : { valid: true, value: 40_000 };
  const gatewayDeadline = gatewayDeadlineStr
    ? parseBoundedInt(gatewayDeadlineStr, 5_000, 120_000)
    : { valid: true, value: 45_000 };
  const clientDeadline = clientDeadlineStr
    ? parseBoundedInt(clientDeadlineStr, 5_000, 120_000)
    : { valid: true, value: 50_000 };

  if (renderDeadlineStr && !renderDeadline.valid) {
    problems.push({
      code: "numeric_config_invalid",
      variable: "PDF_RENDER_DEADLINE_MS",
      message: "PDF_RENDER_DEADLINE_MS phải là số nguyên dương từ 5000ms đến 120000ms.",
    });
  }
  if (gatewayDeadlineStr && !gatewayDeadline.valid) {
    problems.push({
      code: "numeric_config_invalid",
      variable: "PDF_GATEWAY_DEADLINE_MS",
      message: "PDF_GATEWAY_DEADLINE_MS phải là số nguyên dương từ 5000ms đến 120000ms.",
    });
  }
  if (clientDeadlineStr && !clientDeadline.valid) {
    problems.push({
      code: "numeric_config_invalid",
      variable: "PDF_CLIENT_DEADLINE_MS",
      message: "PDF_CLIENT_DEADLINE_MS phải là số nguyên dương từ 5000ms đến 120000ms.",
    });
  }

  // Hierarchy check: render < gateway < client
  if (
    renderDeadline.valid &&
    gatewayDeadline.valid &&
    clientDeadline.valid &&
    (gatewayDeadline.value <= renderDeadline.value || clientDeadline.value <= gatewayDeadline.value)
  ) {
    problems.push({
      code: "deadline_hierarchy_invalid",
      variable: "PDF_GATEWAY_DEADLINE_MS",
      message: "Bắt buộc tuân thủ thứ tự deadline: PDF_RENDER_DEADLINE_MS < PDF_GATEWAY_DEADLINE_MS < PDF_CLIENT_DEADLINE_MS.",
    });
  }

  return { ok: problems.length === 0, problems, warnings };
}

/** True when this process is a production renderer that must not run open/default. */
export function rendererTokenIsInsecure(env: ConfigEnv): ConfigProblem | null {
  if ((env.NODE_ENV ?? "") !== "production") return null;
  const token = trimmed(env, "PDF_RENDERER_TOKEN");
  if (!token) {
    return {
      code: "pdf_token_missing",
      variable: "PDF_RENDERER_TOKEN",
      message: "Renderer production không được chạy với PDF_RENDERER_TOKEN rỗng.",
    };
  }
  if (token === LOCAL_DEFAULT_PDF_TOKEN) {
    return {
      code: "pdf_token_insecure",
      variable: "PDF_RENDERER_TOKEN",
      message: "Renderer production không được dùng token mặc định local.",
    };
  }
  return null;
}
