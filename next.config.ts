import type { NextConfig } from "next";

const isCapacitor = process.env.IS_CAPACITOR_BUILD === 'true';

const nextConfig: NextConfig = {
  output: isCapacitor ? 'export' : undefined,
  trailingSlash: isCapacitor ? true : false,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
