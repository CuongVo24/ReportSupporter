import path from "node:path";
import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const isDevelopment = process.env.NODE_ENV !== "production";

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self'${isDevelopment ? " ws: wss:" : ""}`,
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  // W24-I: the markdown pipeline runs inside a module Web Worker. Webpack resolves
  // the `browser` export condition for the worker bundle, which pulls
  // `decode-named-character-reference/index.dom.js` — a variant that touches
  // `document` and throws `document is not defined` in a worker. Force the
  // DOM-free `index.js` (the package's own `worker`/`default` entry) everywhere;
  // it is a pure lookup and works on the main thread too.
  webpack(config) {
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      "decode-named-character-reference$": path.resolve(
        process.cwd(),
        "node_modules/decode-named-character-reference/index.js",
      ),
    };
    return config;
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  register: true,
  disable: process.env.NODE_ENV !== "production",
  cacheOnNavigation: true,
  reloadOnOnline: false,
  additionalPrecacheEntries: [
    { url: "/", revision: "1" },
    { url: "/templates", revision: "1" },
    { url: "/offline", revision: "1" },
    { url: "/pdf.worker.mjs", revision: "1" },
  ],
});

export default withSerwist(nextConfig);
