import type { NextConfig } from "next";

const devImageHost = process.env.NEXT_PUBLIC_DEV_IMAGE_HOST;

const nextConfig: NextConfig = {
  allowedDevOrigins: [`${devImageHost}`, "192.168.1.219", "192.168.1.220"],

  devIndicators: {
    position: "bottom-right",
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "192.168.1.220",
      },
      {
        protocol: "https",
        hostname: "external-content.duckduckgo.com",
      },
      ...(devImageHost
        ? [
            {
              protocol: "http" as const,
              hostname: devImageHost,
            },
          ]
        : []),
    ],
    qualities: [75, 85],
  },
};

export default nextConfig;
