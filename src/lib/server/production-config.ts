// W24-H & W25-J: Production deployment config contract — server-only.
//
// Turns "tribal knowledge" env requirements into a checkable contract that fails
// EARLY (predeploy / readiness) instead of after a user hits a 503. Pure and
// dependency-free so it runs in `next build`, a predeploy script, and the
// readiness route. NEVER echoes a secret value — diagnostics carry the variable
// NAME and a cause code only.
//
// Do NOT import this into client code: it reads secrets from the environment.

import { timingSafeEqual } from "node:crypto";

export type ConfigProblemCode =
  | "redis_missing"
  | "redis_incomplete"
  | "redis_url_format"
  | "proxy_mode_invalid"
  | "proxy_mode_shared_bucket"
  | "proxy_hops_invalid"
  | "pdf_url_format"
  | "pdf_url_credentials"
  | "pdf_url_fragment"
  | "pdf_url_query"
  | "pdf_url_host_not_allowed"
  | "pdf_token_missing"
  | "pdf_token_insecure"
  | "pdf_remote_issuer_untrusted"
  | "rate_limit_secret_missing"
  | "rate_limit_secret_insecure"
  | "rate_limit_secret_version_missing"
  | "pdf_ticket_secret_missing"
  | "pdf_ticket_secret_insecure"
  | "pdf_ticket_secret_version_missing"
  | "secret_cross_purpose_reuse"
  | "operator_token_missing"
  | "operator_token_weak"
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
const MIN_SECRET_LENGTH = 24;
const MIN_OPERATOR_TOKEN_LENGTH = 24;

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

function requireBoundedInt(
  problems: ConfigProblem[],
  env: ConfigEnv,
  key: string,
  min: number,
  max: number,
  fallback: number,
): number {
  const raw = trimmed(env, key);
  if (!raw) return fallback;
  const parsed = parseBoundedInt(raw, min, max);
  if (!parsed.valid) {
    problems.push({
      code: "numeric_config_invalid",
      variable: key,
      message: `${key} phải là số nguyên từ ${min} đến ${max}.`,
    });
    return fallback;
  }
  return parsed.value;
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
  const pdfRemoteEnabled = trimmed(env, "PDF_REMOTE_ENABLED").toLowerCase() === "true";

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

  // --- Trusted proxy mode & hop count ---
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

  if (proxyMode === "forwarded" || proxyMode === "vercel") {
    const hopsRaw = trimmed(env, "TRUSTED_PROXY_HOPS");
    if (production && !hopsRaw) {
      problems.push({
        code: "proxy_hops_invalid",
        variable: "TRUSTED_PROXY_HOPS",
        message: "TRUSTED_PROXY_HOPS bắt buộc khi TRUSTED_PROXY_MODE=forwarded|vercel trong production (số hop proxy tin cậy đếm từ bên phải chuỗi XFF).",
      });
    } else if (hopsRaw && !parseBoundedInt(hopsRaw, 1, 10).valid) {
      problems.push({
        code: "proxy_hops_invalid",
        variable: "TRUSTED_PROXY_HOPS",
        message: "TRUSTED_PROXY_HOPS phải là số nguyên từ 1 đến 10.",
      });
    }
  }

  // --- Dedicated secrets: rate-limit HMAC, PDF ticket signing ---
  const rateLimitSecret = trimmed(env, "RATE_LIMIT_SECRET");
  const rateLimitSecretVersion = trimmed(env, "RATE_LIMIT_SECRET_VERSION");
  if (production) {
    if (!rateLimitSecret) {
      problems.push({
        code: "rate_limit_secret_missing",
        variable: "RATE_LIMIT_SECRET",
        message: "RATE_LIMIT_SECRET bắt buộc trong production; không được fallback sang Redis token.",
      });
    } else if (rateLimitSecret.length < MIN_SECRET_LENGTH) {
      problems.push({
        code: "rate_limit_secret_insecure",
        variable: "RATE_LIMIT_SECRET",
        message: `RATE_LIMIT_SECRET phải có ít nhất ${MIN_SECRET_LENGTH} ký tự.`,
      });
    }
    if (rateLimitSecret && !rateLimitSecretVersion) {
      problems.push({
        code: "rate_limit_secret_version_missing",
        variable: "RATE_LIMIT_SECRET_VERSION",
        message: "RATE_LIMIT_SECRET_VERSION bắt buộc đi kèm RATE_LIMIT_SECRET để hỗ trợ rotation.",
      });
    }
  }

  const pdfTicketSecret = trimmed(env, "PDF_TICKET_SECRET");
  const pdfTicketSecretVersion = trimmed(env, "PDF_TICKET_SECRET_VERSION");
  if (pdfRemoteEnabled) {
    if (!pdfTicketSecret) {
      problems.push({
        code: "pdf_ticket_secret_missing",
        variable: "PDF_TICKET_SECRET",
        message: "PDF_TICKET_SECRET bắt buộc khi PDF_REMOTE_ENABLED=true; không được fallback sang RATE_LIMIT_SECRET hay Redis token.",
      });
    } else if (pdfTicketSecret.length < MIN_SECRET_LENGTH) {
      problems.push({
        code: "pdf_ticket_secret_insecure",
        variable: "PDF_TICKET_SECRET",
        message: `PDF_TICKET_SECRET phải có ít nhất ${MIN_SECRET_LENGTH} ký tự.`,
      });
    }
    if (pdfTicketSecret && !pdfTicketSecretVersion) {
      problems.push({
        code: "pdf_ticket_secret_version_missing",
        variable: "PDF_TICKET_SECRET_VERSION",
        message: "PDF_TICKET_SECRET_VERSION bắt buộc đi kèm PDF_TICKET_SECRET để hỗ trợ rotation.",
      });
    }
    // Public deployments cannot mint a trustworthy capability without an
    // upstream identity boundary. See §4.2 of w25_fix-all-bugs.md.
    const trustedIssuer = trimmed(env, "PDF_TICKET_TRUSTED_ISSUER_MODE").toLowerCase();
    if (production && trustedIssuer !== "upstream-identity") {
      problems.push({
        code: "pdf_remote_issuer_untrusted",
        variable: "PDF_TICKET_TRUSTED_ISSUER_MODE",
        message: "PDF_REMOTE_ENABLED=true trong production đòi hỏi PDF_TICKET_TRUSTED_ISSUER_MODE=upstream-identity (issuer đứng sau trusted ingress đã xác thực identity). Public anonymous issuer không được coi là authorization boundary.",
      });
    }
  }

  // Dedicated secrets must not be reused across purposes, and must not equal
  // the local dev default or the Redis token (a capability-unrelated value).
  const secretPurposes: Array<[string, string]> = [
    ...(rateLimitSecret ? [["RATE_LIMIT_SECRET", rateLimitSecret] as [string, string]] : []),
    ...(pdfTicketSecret ? [["PDF_TICKET_SECRET", pdfTicketSecret] as [string, string]] : []),
  ];
  for (let i = 0; i < secretPurposes.length; i += 1) {
    for (let j = i + 1; j < secretPurposes.length; j += 1) {
      if (secretPurposes[i][1] === secretPurposes[j][1]) {
        problems.push({
          code: "secret_cross_purpose_reuse",
          variable: secretPurposes[j][0],
          message: `${secretPurposes[i][0]} và ${secretPurposes[j][0]} đang dùng chung giá trị. Mỗi secret phải độc lập theo mục đích.`,
        });
      }
    }
  }
  if (redisToken && (rateLimitSecret === redisToken || pdfTicketSecret === redisToken)) {
    problems.push({
      code: "secret_cross_purpose_reuse",
      variable: "UPSTASH_REDIS_REST_TOKEN",
      message: "RATE_LIMIT_SECRET/PDF_TICKET_SECRET không được trùng UPSTASH_REDIS_REST_TOKEN.",
    });
  }

  // --- Operator diagnostics token ---
  const operatorToken = trimmed(env, "OPERATOR_DIAGNOSTICS_TOKEN");
  if (production && !operatorToken) {
    problems.push({
      code: "operator_token_missing",
      variable: "OPERATOR_DIAGNOSTICS_TOKEN",
      message: "OPERATOR_DIAGNOSTICS_TOKEN bắt buộc trong production để tách readiness public khỏi diagnostics chi tiết.",
    });
  } else if (operatorToken && operatorToken.length < MIN_OPERATOR_TOKEN_LENGTH) {
    problems.push({
      code: "operator_token_weak",
      variable: "OPERATOR_DIAGNOSTICS_TOKEN",
      message: `OPERATOR_DIAGNOSTICS_TOKEN phải có ít nhất ${MIN_OPERATOR_TOKEN_LENGTH} ký tự.`,
    });
  }

  // --- PDF renderer pairing & URL security ---
  if (pdfEnabled) {
    if (pdfUrl) {
      let parsedUrl: URL | null = null;
      try {
        parsedUrl = new URL(pdfUrl);
      } catch {
        problems.push({
          code: "pdf_url_format",
          variable: "PDF_RENDERER_URL",
          message: "PDF_RENDERER_URL phải là URL http(s) hợp lệ.",
        });
      }
      if (parsedUrl) {
        if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
          problems.push({
            code: "pdf_url_format",
            variable: "PDF_RENDERER_URL",
            message: "PDF_RENDERER_URL phải dùng scheme http hoặc https.",
          });
        }
        if (production && parsedUrl.protocol !== "https:") {
          const allowedHosts = trimmed(env, "PDF_RENDERER_ALLOWED_HOSTS")
            .split(",")
            .map((h) => h.trim())
            .filter(Boolean);
          if (!allowedHosts.includes(parsedUrl.hostname)) {
            problems.push({
              code: "pdf_url_format",
              variable: "PDF_RENDERER_URL",
              message: "PDF_RENDERER_URL không-https trong production phải nằm trong PDF_RENDERER_ALLOWED_HOSTS (private service topology đã duyệt).",
            });
          }
        }
        if (parsedUrl.username || parsedUrl.password) {
          problems.push({
            code: "pdf_url_credentials",
            variable: "PDF_RENDERER_URL",
            message: "PDF_RENDERER_URL không được chứa user credentials trong URL.",
          });
        }
        if (parsedUrl.hash) {
          problems.push({
            code: "pdf_url_fragment",
            variable: "PDF_RENDERER_URL",
            message: "PDF_RENDERER_URL không được chứa fragment (#).",
          });
        }
        if (parsedUrl.search) {
          problems.push({
            code: "pdf_url_query",
            variable: "PDF_RENDERER_URL",
            message: "PDF_RENDERER_URL không được chứa query string.",
          });
        }
        const allowedHostsCsv = trimmed(env, "PDF_RENDERER_ALLOWED_HOSTS");
        if (production && allowedHostsCsv) {
          const allowedHosts = allowedHostsCsv.split(",").map((h) => h.trim()).filter(Boolean);
          if (!allowedHosts.includes(parsedUrl.hostname)) {
            problems.push({
              code: "pdf_url_host_not_allowed",
              variable: "PDF_RENDERER_URL",
              message: `PDF_RENDERER_URL host '${parsedUrl.hostname}' không nằm trong PDF_RENDERER_ALLOWED_HOSTS.`,
            });
          }
        }
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

  // --- PDF renderer process envs (validated centrally so predeploy catches
  // misconfiguration before the renderer container boots) ---
  const bodyReadTimeout = requireBoundedInt(problems, env, "PDF_BODY_READ_TIMEOUT_MS", 1_000, 60_000, 15_000);
  requireBoundedInt(problems, env, "PDF_MAX_CONCURRENCY", 1, 4, 2);
  requireBoundedInt(problems, env, "PDF_SHUTDOWN_GRACE_MS", 1_000, 60_000, 15_000);
  if (renderDeadline.valid && bodyReadTimeout >= renderDeadline.value) {
    problems.push({
      code: "deadline_hierarchy_invalid",
      variable: "PDF_BODY_READ_TIMEOUT_MS",
      message: "PDF_BODY_READ_TIMEOUT_MS phải nhỏ hơn PDF_RENDER_DEADLINE_MS (body read chỉ là một giai đoạn trong tổng deadline).",
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

/**
 * Timing-safe comparison for operator/admin tokens. Returns false (not a
 * throw) on length mismatch so callers get a uniform boolean without leaking
 * length via exceptions.
 */
export function timingSafeTokenMatch(expected: string, candidate: string): boolean {
  if (!expected) return false;
  const expectedBuf = Buffer.from(expected, "utf8");
  const candidateBuf = Buffer.from(candidate, "utf8");
  if (expectedBuf.length !== candidateBuf.length) {
    // Still run a constant-time compare against a same-length buffer so the
    // early return above does not become the dominant timing signal for an
    // attacker probing token length via response latency.
    timingSafeEqual(expectedBuf, expectedBuf);
    return false;
  }
  return timingSafeEqual(expectedBuf, candidateBuf);
}
