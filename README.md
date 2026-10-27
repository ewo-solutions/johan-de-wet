# Johan de Wet website

Static Astro site (plain CSS) for Johan de Wet, Property Practitioner, Property.CoZa Protea. Two jobs: deliver the free quarterly complex reports (lead capture) and book free valuations. Hosted on Netlify (Forms + Functions), email via Resend.

## Setup

```bash
npm install
cp .env.example .env   # optional for local work; never commit real values
npm run dev            # http://localhost:4321
npm run build          # outputs dist/
npm test               # validation + submission-handler tests
```

Node 22.12 or newer.

## Structure

- `src/config.ts` single phone/WhatsApp constant, contact details, stats, asset paths.
- `src/content/reports/<quarter>/<slug>.json` report data (schema in `src/content.config.ts`).
- `src/content/insights/*.md` articles (`title, date, description, pillar, complex?`).
- `src/pages/` routes; `src/components/` and `src/layouts/Base.astro`.
- `src/scripts/` client JS (about 8 KB total, consent-gated tracking, UTM persistence, form validation).
- `src/lib/validate.js` validation shared by the browser and the function.
- `netlify/functions/submission-created.mjs` + `netlify/lib/` server side.
- `public/placeholders/` all placeholder images.

## How leads flow

1. Browser validates (inline errors, `+27` normalisation), then POSTs to Netlify Forms (`report-request`, `valuation-request`, `suburb-interest`) with hidden fields `source_page, utm_*, fbclid, gclid, track, event_id, tracking_consent`. Honeypot field is `bot-field`.
2. Netlify stores the lead and fires `submission-created`. The function re-validates, rate-limits per IP (default 5 per hour, Netlify Blobs with in-memory fallback), then:
   - report: emails the latest PDF for that complex (fetched from the deployed site, attached) and notifies Johan;
   - valuation: notifies Johan and sends the homeowner a confirmation;
   - suburb: notifies Johan (tag "Other Somerset West").
   - optional webhook (`NOTIFY_WEBHOOK_URL`) for a WhatsApp relay via Zapier/Make;
   - Meta CAPI `Lead` / `Schedule` with the same `event_id` as the browser pixel, only if the visitor accepted tracking.
3. Browser redirects to the thank-you page, which fires the pixel/GA4 event once (after consent). Without `RESEND_API_KEY` the function logs a dry run.

Reporting: leads in Netlify Forms carry complex, `track` (A if the landing `utm_campaign` contains `track-a`, else B) and UTMs.

## Environment variables

See `.env.example`. Set them in Netlify (Site configuration, Environment variables). `PUBLIC_*` values are embedded in the client; the rest are server-only. Without the pixel/GA IDs no tracking script loads at all.

## Add a Q3 report

1. Add `src/content/reports/q3-2026/<slug>.json` for each complex (copy the Q3 file, update figures, `quarter`, `periodLabel`, `pdf`, `coverImage`, `published`).
2. Add the PDFs and cover images under `public/reports/q3-2026/`.

No component or function changes. The site and the email function pick the latest `published` per complex. PDFs in `public/` are reachable by URL; if they must be private, move them to private storage and switch the function to signed links.

## Deploy

Connect the repo to Netlify (build `npm run build`, publish `dist`, set in `netlify.toml`). Set env vars, set `SITE_URL`, verify the Resend sending domain, then submit a test form per complex. Check that the three forms appear under Netlify Forms after the first deploy. Not yet tested against live Netlify, Resend or Meta.

## Placeholders and open items

Mirrors section 10 of the brief.

1. **Phone number (open).** `src/config.ts` now uses 079 496 8478, which the Q3 2026 report PDFs use everywhere (footers, covers, WhatsApp). The brief's other number is 079 436 8478 (old landing page). Confirm and change the two constants there; header, footer, buttons, JSON-LD and WhatsApp all follow.
2. **The Jade (resolved by Q3 data).** The Q3 report covers 1 May to 30 September (14 sales, only 4 registered in Q3 itself) because of the small sample. The Q2 15-vs-13 question is now moot for the live pages; Q2 JSON is kept as history.
3. **Domain and sending domain (open).** `SITE_URL` falls back to `https://www.example.co.za` (canonicals, sitemap, robots). Resend domain verification needed for `johan.dewet@propertycoza.co.za`.
4. **Report PDFs and covers (missing).** `public/reports/q2-2026/*.pdf` and `*-cover.jpg` do not exist. Until the PDFs are added the function emails the requester a holding message and flags Johan. OG falls back to `public/placeholders/og-default.png` (placeholder, 1200x630).
5. **Complex photographs (missing).** Placeholder grey blocks: `public/placeholders/band.svg` (home band), referenced only in `ASSETS.band`.
6. **POPIA text and Information Officer (missing).** `/privacy` has placeholder headings; officer name in `SITE.informationOfficer`.
7. **Reviews (missing).** `/about` shows a placeholder block; no quotes were invented. `SITE.googleBusinessProfile` and `SITE.facebook` are empty (omitted from JSON-LD until set).
8. **Meta Pixel ID, CAPI token, GA4 ID, Google Ads conversion (env).** Not set.
9. **Logos and portrait (missing).** Text wordmark used (`Wordmark.astro`); `ASSETS.logo` / `ASSETS.logoWhite` are null. Portrait placeholder `public/placeholders/portrait.svg` via `ASSETS.portrait`. Brokerage sign-off on the Property.CoZa Protea logo pending. Report-page blurred preview is `public/placeholders/report-preview.svg` (`ASSETS.reportPreview`).

### Copy needing Johan's approval

The brief refers to "existing copy" that was not supplied, so en-ZA drafts were written for: hero intro, the three steps, the four FAQ answers, About bio, closing banner, thank-you pages, email wording. Three insight articles in `src/content/insights/` are marked `status: placeholder-draft` (banner on the page, `noindex`, excluded from the sitemap); remove that line once approved. They use only figures from the brief.

### Decisions to note

- `/valuation`, thank-you pages and placeholder drafts are `noindex` and left out of `sitemap.xml`; `/valuation` stays crawlable so the tag is seen.
- Phase two (Cal.com embed) not built; Google Ads tag is wired behind `PUBLIC_GADS_CONVERSION`.
- GA4 is browser-only (no Measurement Protocol) to avoid double counting.
- No time-on-market, asking-vs-achieved or stock figures anywhere.

## Q3 2026 data
Report JSON in `src/content/reports/q3-2026/` is built from the tables in Johan's Q3 PDFs (medians and ranges computed from the registered sales). The four PDFs and a cover image per complex (page 1 of each PDF) are in `public/reports/q3-2026/`. The report page preview currently reuses the cover. The two placeholder insight articles still quote Q2 figures and should be refreshed before approval.
