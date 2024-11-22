/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config, { isServer }) => {
        config.watchOptions = {
            poll: 1000,   // Check for changes every second
            aggregateTimeout: 300,   // Delay before rebuilding
        }
        return config
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'yawmoopfkvsklcfailyf.supabase.co',
                pathname: '/storage/v1/object/public/**',
            },
        ],
    },
};

export default nextConfig;