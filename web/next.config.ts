import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.agnes-ai.com",
      },
      {
        protocol: "https",
        hostname: "**.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "**.storage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "**.space",
      },
    ],
  },
};

export default nextConfig;
