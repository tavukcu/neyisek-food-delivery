/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercel deployment için optimize edildi
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  images: {
    unoptimized: true,
    domains: ['firebasestorage.googleapis.com']
  },
  experimental: {
    forceSwcTransforms: true,
    optimizePackageImports: ['lucide-react']
  },
  reactStrictMode: true,
  swcMinify: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Production optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Vercel için optimize edilmiş ayarlar
  poweredByHeader: false,
  compress: true,
  
  // Environment variables
  env: {
    CUSTOM_KEY: 'my-value',
  },
}

module.exports = nextConfig 