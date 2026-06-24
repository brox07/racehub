import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  output: "standalone",
  // Monorepo root, so standalone tracing bundles hoisted node_modules + workspace deps.
  outputFileTracingRoot: path.join(__dirname, "../.."),
  // @racehub/db is a workspace TS package consumed directly.
  transpilePackages: ["@racehub/db"],
  experimental: {
    serverActions: { bodySizeLimit: "2mb" },
  },
};

export default nextConfig;
