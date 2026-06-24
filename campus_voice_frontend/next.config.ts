import type { NextConfig } from "next";

const backendOrigin = process.env.BACKEND_ORIGIN ?? "http://localhost:8000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/ws/:path*",
        destination: `${backendOrigin}/ws/:path*`,
      },
      {
        source: "/api/:path((?!auth(?:/|$)).*)",
        destination: `${backendOrigin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
