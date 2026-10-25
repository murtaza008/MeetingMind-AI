import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The daily demo reset re-inserts the seeded meetings' recordings, which it
  // reads from disk, so they must ship inside that serverless function.
  outputFileTracingIncludes: {
    "/api/cron/demo-reset": ["./prisma/demo-audio/*.mp3"],
  },
};

export default nextConfig;
