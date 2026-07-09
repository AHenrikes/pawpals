import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: {
    position: "bottom-right",
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "external-content.duckduckgo.com",
      },
      {
        protocol: "http",
        hostname: "192.168.1.219",
      },
    ],
    qualities: [75, 85],
  },
};

export default nextConfig;
