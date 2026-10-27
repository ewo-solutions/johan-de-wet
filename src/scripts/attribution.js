// First-touch attribution persisted in sessionStorage (UTMs, click ids, track A/B).
const KEY = 'jdw_attr';
const PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'fbclid', 'gclid'];

const read = () => {
  try { return JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch { return null; }
};

export function captureAttribution() {
  try {
    if (read()) return;
    const q = new URLSearchParams(location.search);
    const a = {};
    for (const p of PARAMS) a[p] = q.get(p) || '';
    a.track = /track-a/i.test(a.utm_campaign) ? 'A' : 'B';
    sessionStorage.setItem(KEY, JSON.stringify(a));
  } catch {}
}

export function getAttribution() {
  const a = read() || {};
  const out = { track: a.track || 'B' };
  for (const p of PARAMS) out[p] = a[p] || '';
  out.source_page = location.pathname;
  return out;
}
