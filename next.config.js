/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'vtuber-fanhub-bsc3arfzhqhahshy.southeastasia-01.azurewebsites.net',
      },
    ],
  },
  // Enable path aliases
  webpack: (config) => {
    config.resolve.alias['@'] = require('path').join(__dirname, 'src');
    
    // Handle SVG and image imports as URLs (like Vite)
    
    return config;
  },
  // Turbopack config (required for Next.js 16+)
  turbopack: {
    resolveAlias: {
      '@': './src',
    },
  },
}

export default nextConfig
