import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Agent images are already small (icons ~33 KB) and every <Image> in the
    // app points at /images/agents/. Serving them as plain static files avoids
    // Vercel's image-optimization quota (images fail to load once it runs
    // out) and the extra /_next/image request per image size.
    unoptimized: true,
  },
  async headers() {
    return [
      {
        // Vercel's default for public/ files is max-age=0, must-revalidate,
        // which makes browsers re-check every image on every page load (each
        // check is an edge request). Let returning players reuse their copy
        // for a week instead. If an image is replaced under the same file
        // name, players may see the old one for up to a week; use a new file
        // name to make the change show immediately.
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, stale-while-revalidate=86400",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
