/**
 * Single source of truth for contact details, links and asset paths.
 * Everything that is a placeholder is marked TODO and listed in README.md
 * under "Placeholders and open items".
 */

// The Q3 2026 report PDFs use 079 496 8478 throughout (footers, covers and
// WhatsApp links), so that number is used. The brief also mentions 079 436 8478
// (old landing page): Johan to confirm. Change ONLY these two values; every
// page, link and JSON-LD reads from here.
const PHONE_NATIONAL = '079 496 8478';
const PHONE_E164_DIGITS = '27794968478'; // 27 + number without leading 0

export const SITE = {
  name: 'Johan de Wet',
  title: 'Johan de Wet · Property Practitioner · Paardevlei, Somerset West',
  tagline: 'Property Practitioner, Property.CoZa Protea',
  brokerage: 'Property.CoZa Protea',
  email: 'johan.dewet@propertycoza.co.za',
  phoneDisplay: PHONE_NATIONAL,
  phoneHref: `tel:+${PHONE_E164_DIGITS}`,
  // WhatsApp uses the same constant, so the two can never disagree.
  whatsappNumber: PHONE_E164_DIGITS,
  whatsappText: 'Hi Johan, I would like to ask about…',
  areaServed: 'Paardevlei, Somerset West and the Helderberg',
  ffc: 'PPRA FFC 1164169',
  nqf: 'NQF 5 Real Estate',
  // TODO(open item 7): Google Business Profile URL not supplied.
  googleBusinessProfile: '',
  // TODO: Facebook page URL not supplied.
  facebook: '',
  // TODO(open item 6): Information Officer name for the POPIA notice.
  informationOfficer: '[Information Officer name to be confirmed]',
} as const;

export const whatsappUrl = (text: string = SITE.whatsappText) =>
  `https://wa.me/${SITE.whatsappNumber}?text=${encodeURIComponent(text)}`;

export const STATS = {
  reviews: '34',
  years: '13',
  minutes: '45',
} as const;

export const OTHER_COMPLEX = 'Other Somerset West';

export const DATA_NOTICE =
  'All market data is sourced from publicly available property records and is accurate to the best of our knowledge at the time of publication. Property values are indicative only and do not constitute a formal valuation.';

export const WHEN_OPTIONS = [
  'Weekday mornings',
  'Weekday afternoons',
  'Weekday evenings',
  'Saturday',
  'I am flexible',
] as const;

/**
 * Every swappable placeholder asset is referenced here and nowhere else.
 * Drop real files into public/ and change the path (or overwrite the file).
 */
export const ASSETS = {
  // Text wordmark is used until the logo files are supplied (open item 9).
  logo: null as string | null, // e.g. '/images/logo-protea.jpg'
  logoWhite: null as string | null, // e.g. '/images/logo-protea-white.png'
  portrait: '/placeholders/portrait.svg', // -> /images/johan-portrait.jpg
  band: '/placeholders/band.svg', // full-bleed Helderberg / complex photograph
  reportPreview: '/placeholders/report-preview.svg', // blurred first report page
  ogDefault: '/placeholders/og-default.png', // 1200x630
} as const;
