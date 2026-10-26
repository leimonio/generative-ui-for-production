import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The talk shell ships TypeScript source.
  transpilePackages: ["@gen-ui/talk-shell"],
};

export default nextConfig;
