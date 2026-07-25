import path from "node:path";
import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const nextConfig: NextConfig = {
  // W24-I: force DOM-free decode-named-character-reference entry in Web Worker
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
    // Content-Security-Policy is set per-request in src/middleware.ts (it
    // needs a fresh nonce every request); everything else here is static
    // and applies to every route.
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
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
