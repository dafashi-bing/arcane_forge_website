// @ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'nydmouxljprsfymcvqko.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'www.arcaneforge.ai',
        port: '',
        pathname: '/games/**',
      },
      {
        protocol: 'https',
        hostname: 'pic.gameggg.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;
