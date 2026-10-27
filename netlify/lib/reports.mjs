import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Latest report per complex name, read from the same JSON the site uses. */
export function latestReportByName(name) {
  const roots = [process.env.LAMBDA_TASK_ROOT, process.cwd()].filter(Boolean);
  for (const root of roots) {
    const base = join(root, 'src/content/reports');
    let best = null;
    try {
      for (const q of readdirSync(base)) {
        let files = [];
        try { files = readdirSync(join(base, q)); } catch { continue; }
        for (const f of files.filter((x) => x.endsWith('.json'))) {
          const r = JSON.parse(readFileSync(join(base, q, f), 'utf8'));
          if (r.name === name && (!best || r.published > best.published)) best = r;
        }
      }
    } catch { continue; }
    if (best) return best;
  }
  return null;
}
