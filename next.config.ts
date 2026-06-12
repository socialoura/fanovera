import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    localPatterns: [
      // Static assets served from /public (logo, OG images, …) — no query string.
      { pathname: "/**", search: "" },
      // Avatar/thumbnail proxy, which always carries a ?url= query.
      { pathname: "/api/image-proxy", search: "?url=*" },
    ],
  },
};

export default nextConfig;
