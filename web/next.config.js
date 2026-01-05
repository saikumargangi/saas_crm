/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,

    images: {
        remotePatterns: [
            {
                protocol: 'http',
                hostname: 'localhost',
            },
        ],
    },

    experimental: {
        optimizeCss: true,
    },

    // Empty turbopack config to silence Turbopack warning
    turbopack: {},

    // Headers for security
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    {
                        key: 'X-DNS-Prefetch-Control',
                        value: 'on',
                    },
                    {
                        key: 'X-Frame-Options',
                        value: 'SAMEORIGIN',
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'origin-when-cross-origin',
                    },
                ],
            },
        ];
    },

    async rewrites() {
        return [
            {
                source: '/api/v1/:path*',
                destination: process.env.INTERNAL_API_URL || 'http://localhost:8000/api/v1/:path*',
            },
        ];
    },
};

module.exports = nextConfig;
