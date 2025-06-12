/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimisations pour la production
  typescript: {
    ignoreBuildErrors: false, // Vérifier les erreurs TypeScript en production
  },
  eslint: {
    ignoreDuringBuilds: false, // Vérifier ESLint en production
  },
  
  // Configuration des images optimisée
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
    // Optimisations pour la production
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 31536000, // 1 an
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Headers de sécurité pour la production
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
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
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Optimisations de performance
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },

  // Configuration de sécurité
  poweredByHeader: false,
  compress: true,
  
  // Optimisations de build
  swcMinify: true,
  
  // Configuration pour les variables d'environnement
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Redirections pour la production
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/admin/dashboard',
        permanent: false,
      },
    ];
  },

  // Configuration pour les erreurs 404 personnalisées
  async rewrites() {
    return [
      {
        source: '/404',
        destination: '/_error',
      },
    ];
  },
};

export default nextConfig; 