/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Implémenter sécuriter dans header contre XSS, CRSF et SQL injection
  
  // Configuration cache optimisée
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },

  // Optimisation des images
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Every `quality` value used anywhere in the app MUST be listed here.
    //
    // Declaring this key at all switches Next 15 from warning to THROWING on an
    // unlisted value — "Invalid quality prop (80) … does not match
    // images.qualities" — which 500s the whole route. It is not a
    // Next-16-only concern. Keep this in sync with:
    //   60  diplomas-section (doc-comment example)
    //   78  visit-us-carousel
    //   80  doctor
    //   82  hero
    //   88  certificate-gallery cards
    //   92  certificate-gallery lightbox
    // 75 is next/image's own default and is required for any unannotated <Image>.
    qualities: [60, 75, 78, 80, 82, 88, 92],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Ajout domaines externes
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
    ],
  },

  // Browser cache headers.
  //
  // NOTE: there is deliberately NO blanket `source: '/:path*'` rule here.
  //
  // A previous `public, max-age=3600, stale-while-revalidate=86400` on every
  // path did three harmful things, because config headers take precedence over
  // Next's own cache policy (send-payload.js only sets Cache-Control when the
  // response does not already carry one):
  //
  //   1. It overrode the `private, no-store` that Next emits for /admin and
  //      /admin-dashboard. Those documents embed patient names, emails, phone
  //      numbers and appointment reasons in the RSC payload, so signing out on
  //      a shared clinic machine still left the full patient list served from
  //      disk cache for an hour, with no auth check.
  //   2. `stale-while-revalidate` made those same responses eligible for CDN
  //      caching at the edge.
  //   3. It served stale HTML for an hour after every deploy, referencing
  //      build assets that no longer exist.
  //
  // Only genuinely immutable, non-personal assets are cached below. Let Next
  // decide the policy for everything that renders.
  async headers() {
    return [
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
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

  // Experimental features pour performance
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  },

  // Compiler options
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Webpack optimizations - SIMPLIFIÉ pour éviter erreur exports
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    return config;
  },

  // Production optimizations
  poweredByHeader: false,
  compress: true,
  generateEtags: true,
};

export default nextConfig;
