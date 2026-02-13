import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: [
    "localhost:3000",
    "fluorescent-yuonne-unnervous.ngrok-free.dev",
  ],
};

export default nextConfig;
