import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  devIndicators :{
    position: "bottom-left"
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'external-content.duckduckgo.com',
        
      }
    ],
    qualities: [75, 100],
  }
};

export default nextConfig;
