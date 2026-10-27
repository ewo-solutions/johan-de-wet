import { SITE } from '../config';

export function businessJsonLd(siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': ['RealEstateAgent', 'LocalBusiness'],
    name: SITE.name,
    description: `Property Practitioner at ${SITE.brokerage}. Free valuations and quarterly complex reports for Paardevlei, Somerset West.`,
    url: siteUrl,
    telephone: SITE.phoneHref.replace('tel:', ''),
    email: SITE.email,
    areaServed: ['Paardevlei', 'Somerset West', 'Helderberg'],
    address: { '@type': 'PostalAddress', addressLocality: 'Somerset West', addressRegion: 'Western Cape', addressCountry: 'ZA' },
    parentOrganization: { '@type': 'Organization', name: SITE.brokerage },
    sameAs: [SITE.googleBusinessProfile, SITE.facebook].filter(Boolean),
  };
}
