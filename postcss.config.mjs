/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {},
    // Autoprefixer was absent, so anything needing a vendor prefix shipped
    // unprefixed. Tailwind does NOT add prefixes itself — it assumes
    // Autoprefixer is in the chain, which is why it is in the default
    // `create-next-app` template.
    autoprefixer: {},
  },
};

export default config;
