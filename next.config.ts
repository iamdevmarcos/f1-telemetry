import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.motorsport.com",
      },
      {
        protocol: "https",
        hostname: "**.autosport.com",
      },
      {
        protocol: "https",
        hostname: "**.racefans.net",
      },
      {
        protocol: "https",
        hostname: "www.racefans.net",
      },
    ],
  },
};

export default nextConfig;
