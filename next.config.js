/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['img.youtube.com', 'ginastennisworld.com'],
  },
  // Proxy API requests to FastAPI backend
  // In production, set BACKEND_URL to your Render backend (e.g. https://ginas-backend.onrender.com)
  // In development, it defaults to http://localhost:8000
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/:path*`,
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