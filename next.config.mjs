/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "rss-parser"],
  },
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
