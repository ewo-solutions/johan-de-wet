import { getCollection, type CollectionEntry } from 'astro:content';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { ASSETS } from '../config';

export type Report = CollectionEntry<'reports'>['data'];

/** Display order on the site. Slugs not listed sort after, alphabetically. */
const ORDER = ['de-velde', 'paardevlei-lifestyle-estate', 'paardevlei-square', 'the-jade'];

/** Latest published report per complex slug. New quarters need only new JSON + PDF. */
export async function getLatestReports(): Promise<Report[]> {
  const all = (await getCollection('reports')).map((e) => e.data);
  const latest = new Map<string, Report>();
  for (const r of all) {
    const cur = latest.get(r.slug);
    if (!cur || r.published > cur.published) latest.set(r.slug, r);
  }
  const rank = (s: string) => (ORDER.includes(s) ? ORDER.indexOf(s) : ORDER.length);
  return [...latest.values()].sort((a, b) => rank(a.slug) - rank(b.slug) || a.slug.localeCompare(b.slug));
}

/** Use the report cover for OG if the file exists in public/, else the placeholder. */
export function ogImageFor(r: Report): string {
  if (r.coverImage && existsSync(join(process.cwd(), 'public', r.coverImage))) return r.coverImage;
  return ASSETS.ogDefault;
}
