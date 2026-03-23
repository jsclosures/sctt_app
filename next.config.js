/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8180';

    return {
      beforeFiles: [
        {
          source: '/api/restservice',
          destination: `${backendUrl}/restservice`,
        },
        {
          source: '/api/authservice',
          destination: `${backendUrl}/authservice`,
        },
      ],
    };
  },
};

module.exports = nextConfig;