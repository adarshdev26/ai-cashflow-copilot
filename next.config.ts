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
};

export default nextConfig;
