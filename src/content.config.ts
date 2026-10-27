import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const reports = defineCollection({
  // Quarter folders: src/content/reports/<quarter>/<slug>.json
  loader: glob({ pattern: '**/*.json', base: './src/content/reports' }),
  schema: z.object({
    slug: z.string(),
    name: z.string(),
    quarter: z.string(), // e.g. "Q2 2026"
    kicker: z.string().optional(), // overrides quarter in the kicker, e.g. "2026 to date"
    periodLabel: z.string(),
    figures: z.array(z.object({ value: z.string(), label: z.string() })).length(3),
    teaser: z.string(),
    pdf: z.string(),
    coverImage: z.string().optional(),
    previewImage: z.string().optional(),
    published: z.coerce.date(),
  }),
});

const insights = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/insights' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string(),
    pillar: z.string(),
    complex: z.string().optional(), // report slug
    // Remove this line once Johan has approved the article.
    status: z.enum(['placeholder-draft', 'published']).default('published'),
  }),
});

export const collections = { reports, insights };
