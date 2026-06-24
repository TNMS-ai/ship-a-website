// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// When SITE_CUSTOM_DOMAIN is set (in CI for the production deploy), serve from
// the apex/www custom domain at the root path. Otherwise fall back to the
// project-pages URL so local builds and PR previews still work.
const customDomain = process.env.SITE_CUSTOM_DOMAIN;
const site = customDomain ? `https://${customDomain}` : 'https://your-org.github.io';
const base = customDomain ? '/' : '/ship-a-website/';

export default defineConfig({
  site,
  base,
  output: 'static',

  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [
    mdx(),
    sitemap(),
  ],
});
