import type { NextConfig } from "next";

// Static export — deploys to Cloudflare Pages with zero adapters.
// The console is fully client-side; it talks to the Railway orchestrator via
// NEXT_PUBLIC_ORCHESTRATOR_URL (set at build time in the Pages dashboard).
const nextConfig: NextConfig = {
  output: "export",
};
export default nextConfig;
