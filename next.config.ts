import type { NextConfig } from "next";
import { getAllowedImageHosts } from "./lib/env";

const remotePatterns = getAllowedImageHosts().map((hostname) => ({
  protocol: "https" as const,
  hostname,
}));

const nextConfig: NextConfig = {
  images: {
    remotePatterns,
  },
};

export default nextConfig;
