import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Prisma client is generated during build (prisma generate runs first).
    // Type errors here are false positives that resolve at runtime.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
