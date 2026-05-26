import type { NextConfig } from "next";
import { getAllowedImageHosts } from "./lib/env";

const remotePatterns = getAllowedImageHosts().map((hostname) => ({
  protocol: "https" as const,
  hostname,
}));

const nextConfig: NextConfig = {
  turbopack: {},
  images: {
    remotePatterns,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Exclude Node.js modules from client bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      };
    }
    return config;
  },
};

export default nextConfig;
