import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { readdirSync, readFileSync } from 'node:fs';

// TODO(open item 3): final domain not confirmed. Set SITE_URL in Netlify.
const site = process.env.SITE_URL || process.env.URL || 'https://www.example.co.za';

// Keep placeholder insight drafts and noindex pages out of the sitemap.
const draftSlugs = [];
try {
  for (const f of readdirSync('./src/content/insights')) {
    if (!f.endsWith('.md')) continue;
    if (/^status:\s*placeholder-draft/m.test(readFileSync(`./src/content/insights/${f}`, 'utf8'))) {
      draftSlugs.push(f.replace(/\.md$/, ''));
    }
  }
} catch {}

const excluded = ['/valuation', '/valuation/thank-you', '/reports/thank-you', '/404'];

export default defineConfig({
  site,
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'directory' },
  integrations: [
    sitemap({
      filter: (page) => {
        const path = new URL(page).pathname.replace(/\/$/, '');
        if (excluded.includes(path)) return false;
        return !draftSlugs.some((s) => path === `/insights/${s}`);
      },
    }),
  ],
});
