// Shared by the browser (inline errors) and the Netlify function (server-side check).
// Plain JS, no dependencies.

/** Normalise a South African mobile number to +27XXXXXXXXX, or return null. */
export function normaliseMobile(input) {
  let s = String(input || '').replace(/[\s\-().]/g, '');
  if (s.startsWith('+')) s = s.slice(1);
  if (s.startsWith('0027')) s = s.slice(2);
  if (s.startsWith('27')) s = '0' + s.slice(2);
  if (!/^0[6-8]\d{8}$/.test(s)) return null;
  return '+27' + s.slice(1);
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const COMPLEX_NAMES = [
  'De Velde',
  'Paardevlei Lifestyle Estate',
  'Paardevlei Square',
  'The Jade',
  'Other Somerset West',
];

/**
 * kind: 'report' | 'valuation' | 'suburb'
 * Returns { errors: {field: message}, clean: {...} }
 */
export function validateLead(kind, v) {
  const errors = {};
  const clean = {};
  const str = (k) => String(v[k] == null ? '' : v[k]).trim();

  clean.name = str('name');
  if (clean.name.length < 2) errors.name = 'Please enter your name.';
  else if (clean.name.length > 100) errors.name = 'That name is too long.';

  clean.email = str('email').toLowerCase();
  if (!EMAIL.test(clean.email) || clean.email.length > 200) errors.email = 'Please enter a valid email address, like name@example.co.za.';

  const mobile = normaliseMobile(v.mobile);
  clean.mobile = mobile || str('mobile');
  if (!mobile) errors.mobile = 'Please enter a South African mobile number, like 082 123 4567.';

  if (kind === 'report') {
    clean.complex = str('complex');
    if (!COMPLEX_NAMES.includes(clean.complex)) errors.complex = 'Please choose your complex.';
  }
  if (kind === 'valuation') {
    clean.complex = str('complex');
    clean.complex_other = str('complex_other').slice(0, 120);
    if (!clean.complex) errors.complex = 'Please choose your complex or suburb.';
    else if (clean.complex === 'Other' && clean.complex_other.length < 2)
      errors.complex_other = 'Please tell me which complex or suburb.';
    clean.when = str('when');
    if (!clean.when) errors.when = 'Please choose when suits you.';
  }
  if (kind === 'suburb') {
    clean.suburb = str('suburb');
    if (clean.suburb.length < 2) errors.suburb = 'Please enter your suburb.';
    else if (clean.suburb.length > 120) errors.suburb = 'That suburb name is too long.';
  }

  const consent = v.consent;
  if (!(consent === true || consent === 'on' || consent === 'yes' || consent === 'true'))
    errors.consent = 'Please tick the box so I know I may contact you.';

  return { errors, clean };
}
