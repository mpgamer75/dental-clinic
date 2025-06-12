/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'wyospvndshfmkqvwkefn.supabase.co',
        port: '',
        pathname: '/**',
      },
    ],
    // Configuration pour les images locales
    unoptimized: false,
    formats: ['image/webp', 'image/avif'],
  },
  // Configuration pour servir les fichiers statiques
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://accounts.google.com;
              style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
              img-src 'self' data: https://picsum.photos https://wyospvndshfmkqvwkefn.supabase.co;
              font-src 'self' https://fonts.gstatic.com;
              frame-src 'self' https://www.google.com https://www.youtube.com https://www.google.com/maps/;
              connect-src 'self' https://www.google-analytics.com https://wyospvndshfmkqvwkefn.supabase.co;
            `.replace(/\s\s+/g, ' ').trim(),
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },
  // Configuration pour les fichiers statiques
  // async rewrites() {
  //   return [
  //     {
  //       source: '/images/:path*',
  //       destination: '/images/:path*',
  //     },
  //   ];
  // },
  // Optimisations de performance
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react'],
  },
  // Configuration de sécurité
  poweredByHeader: false,
  compress: true,
  // Configuration pour les fichiers statiques
  // webpack: (config) => {
  //   config.module.rules.push({
  //     test: /\.(png|jpe?g|gif|svg)$/i,
  //     type: 'asset/resource',
  //   });
  //   return config;
  // },
};

export default nextConfig;