import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    async redirects() {
        return [
            {
                source: '/dashboard/finance/:path*',
                destination: '/dashboard/transactions/:path*',
                permanent: true,
            },
        ];
    },
    async headers() {
        return [
            {
                // Apply these security headers to all routes in the application
                source: '/(.*)',
                headers: [
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY', // Blocks iframe embedding to prevent clickjacking
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff', // Prevents MIME-type sniffing vulnerabilities
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'origin-when-cross-origin', // Prevents full URL leaking in referrer headers
                    },
                    {
                        key: 'Strict-Transport-Security',
                        value: 'max-age=31536000; includeSubDomains; preload', // Forces HTTPS connections
                    },
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()', // Blocks unused browser hardware APIs
                    },
                    {
                        key: 'X-XSS-Protection',
                        value: '1; mode=block', // Legacy browser XSS protection
                    },
                ],
            },
        ];
    },
};

export default nextConfig;