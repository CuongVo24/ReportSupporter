// W24-H predeploy gate: validate the deployment env contract BEFORE traffic.
// Run with the target deployment's env loaded, e.g.:
//   NODE_ENV=production TRUSTED_PROXY_MODE=vercel ... node scripts/check-production-config.mjs
//
// Prints variable NAMES + cause codes only — never secret values. Exits non-zero
// on any problem so CI/deploy fails early instead of the user hitting a 503.
import { validateProductionConfig } from "../src/lib/server/production-config.ts";

const report = validateProductionConfig(process.env);

if (report.warnings.length > 0) {
  for (const warning of report.warnings) {
    console.warn(`⚠️  [${warning.code}] ${warning.variable}: ${warning.message}`);
  }
}

if (report.ok) {
  console.log("✓ Production config hợp lệ (không lộ giá trị secret).");
} else {
  console.error("✗ Production config KHÔNG hợp lệ:");
  for (const problem of report.problems) {
    console.error(`  - [${problem.code}] ${problem.variable}: ${problem.message}`);
  }
  console.error("\nSửa các biến trên trước khi deploy. Xem .env.example và Design/Modules/Other/Deployment.md.");
  process.exitCode = 1;
}
