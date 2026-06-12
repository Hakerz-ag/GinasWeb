/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['img.youtube.com', 'ginastennisworld.com'],
  },
  // Proxy API requests to FastAPI backend in development
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/:path*',
      },
    ];
  },
  // Allow large video files to be served from public directory
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(mp4|webm|mov)$/i,
      type: 'asset/resource',
    });
    return config;
  },
};

module.exports = nextConfig;