/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    // Tailwind 4 ships its PostCSS integration as a separate package, and does
    // its own vendor prefixing through Lightning CSS — so Autoprefixer, which
    // v3 required in the chain, is no longer part of it.
    '@tailwindcss/postcss': {},
  },
};

export default config;
