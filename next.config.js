/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // Allow mixed JS/TS during migration
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
