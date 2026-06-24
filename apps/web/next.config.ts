import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  output: "standalone",
  // Monorepo root, so standalone tracing bundles hoisted node_modules + workspace deps.
  outputFileTracingRoot: path.join(__dirname, "../.."),
  // @racehub/db is a workspace TS package consumed directly.
  transpilePackages: ["@racehub/db"],
  // node-ical is CJS with heavy deps; keep it external to server bundles.
  serverExternalPackages: ["node-ical"],
  experimental: {
    serverActions: { bodySizeLimit: "5mb" },
  },
};

export default nextConfig;
