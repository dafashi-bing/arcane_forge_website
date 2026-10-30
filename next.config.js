// @ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    // Also cover framework-generated 404/405/error responses under this area.
    const headers = [
      { key: 'Cache-Control', value: 'private, no-store, max-age=0, must-revalidate' },
      { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive, nosnippet' },
      { key: 'Referrer-Policy', value: 'no-referrer' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
    ];
    return ['/internal/:path*', '/api/internal/:path*', '/login', '/auth/:path*']
      .map(source => ({ source, headers }));
  },
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
