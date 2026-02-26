/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Empty turbopack config to silence Next.js 16 warning about webpack config
  turbopack: {},
  webpack: (config, { dev }) => {
    // Suppress webpack warnings including big string serialization
    config.infrastructureLogging = {
      level: 'error',
      debug: false,
    }
    // Disable filesystem cache entirely to avoid serialization warnings
    config.cache = false
    return config
  },
  async headers() {
    return [
      {
        source: '/api/chat/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
        ],
      },
      {
        source: '/api/widget.js',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
        ],
      },
    ]
  },
}

export default nextConfig
