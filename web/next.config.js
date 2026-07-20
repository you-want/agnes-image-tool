/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.agnes-ai.com" },
      { protocol: "https", hostname: "**.googleapis.com" },
      { protocol: "https", hostname: "**.storage.googleapis.com" },
      { protocol: "https", hostname: "**.space" },
    ],
  },
};

module.exports = nextConfig;
