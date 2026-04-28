import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-libsql"],
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
