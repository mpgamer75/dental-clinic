/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Every `quality` value used anywhere in the app MUST be listed here.
    //
    // Declaring this key at all switches Next from warning to THROWING on an
    // unlisted value — "Invalid quality prop (80) … does not match
    // images.qualities" — which 500s the whole route. Keep this in sync with:
    //   78  contact section (Cómo llegar)
    //   80  hero film posters
    //   88  diploma rail cards
    //   92  diploma lightbox
    // 75 is next/image's own default and is required for any unannotated <Image>.
    qualities: [75, 78, 80, 88, 92],
    // The optimiser keeps a variant for max(this, the source's max-age), and
    // /images/* is served with a one-day max-age below — so a replaced photo
    // propagates within a day instead of a year.
    minimumCacheTTL: 60,
    // No `remotePatterns`, no `dangerouslyAllowSVG`: every image is a local
    // JPEG/PNG under public/images. The picsum.photos pattern and the SVG
    // allowance were leftovers from a template, and an allow-listed remote
    // host is an open door for anyone who can get a URL rendered.
  },

  // Browser cache headers.
  //
  // NOTE: there is deliberately NO blanket `source: '/:path*'` rule here.
  // Config headers take precedence over Next's own cache policy, and a former
  // `public, max-age=3600` on every path overrode the `private, no-store` Next
  // emits for /admin — whose documents embed patient names and phone numbers —
  // made those responses CDN-cacheable, and served stale HTML after deploys.
  //
  // Nor is there a rule for /_next/static: Next already serves those assets
  // with `immutable`, and overriding it is what triggered the "custom
  // Cache-Control headers can break Next.js development behavior" warning on
  // every build.
  //
  // /images/* is NOT fingerprinted — the doctor's portrait, when it arrives,
  // will be saved under a plain name — so it must not be `immutable`. A year
  // of immutability meant a replaced photo stayed stale in every browser and
  // in the image optimiser for up to a year. One day, then revalidate in the
  // background for a week.
  async headers() {
    return [
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
    ];
  },

  experimental: {
    scrollRestoration: true,
  },

  compiler: {
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? {
            exclude: ['error', 'warn'],
          }
        : false,
  },

  // Next 16 builds with Turbopack by default. An empty object is the explicit
  // "no bundler customisation needed" signal.
  turbopack: {},

  poweredByHeader: false,
  compress: true,
  generateEtags: true,
};

export default nextConfig;
