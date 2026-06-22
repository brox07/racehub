import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // @racehub/db is a workspace TS package consumed directly.
  transpilePackages: ["@racehub/db"],
  experimental: {
    serverActions: { bodySizeLimit: "2mb" },
  },
};

export default nextConfig;
