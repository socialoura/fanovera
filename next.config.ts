import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    localPatterns: [
      { pathname: "/api/image-proxy", search: "?url=*" },
    ],
  },
};

export default nextConfig;
