/**
 * SPRINT 0 SPIKE — proves the core loop end-to-end:
 * Daytona sandbox → clone demo repo → install → dev server → public preview URL.
 * Status: ✅ GREEN (first pass 18 Jul — sandbox 0.9s, install 17s, HTTP 200 externally)
 *
 * Run: npm run spike   (from server/)
 */
import { config } from "./config.js";
import { launchPreview } from "./sandbox-runner.js";

const t0 = Date.now();
const log = (s: string, d = "") =>
  console.log(`[${((Date.now() - t0) / 1000).toFixed(1).padStart(6)}s] ${s} ${d}`);

const result = await launchPreview(
  {
    repo: config.github.demoRepo,
    port: 3100, // mongpt-marketing: next dev -p 3100
    env: {
      NEXT_PUBLIC_APP_URL: "$PREVIEW_URL",
      NEXT_PUBLIC_WIDGET_URL: "$PREVIEW_URL",
    },
  },
  log
);

console.log("\n════════════════════════════════════════════════════");
console.log("  🎉 SPIKE GREEN — core loop works end-to-end");
console.log(`  Sandbox:  ${result.sandboxId}`);
console.log(`  Preview:  ${result.previewUrl}`);
console.log(`  Total:    ${((Date.now() - t0) / 1000).toFixed(0)}s`);
console.log("  (sandbox auto-stops in ~60 min)");
console.log("════════════════════════════════════════════════════\n");
