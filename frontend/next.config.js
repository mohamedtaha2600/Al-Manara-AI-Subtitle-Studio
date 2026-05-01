/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,

    // Increase body size limit for file uploads
    experimental: {
        serverActions: {
            bodySizeLimit: '5gb',
        },
    },

    // Proxy API requests to Python backend
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: 'http://localhost:8000/api/:path*',
            },
        ]
    },
}

module.exports = nextConfig
