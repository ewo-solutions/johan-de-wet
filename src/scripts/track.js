// Consent-gated Meta Pixel + GA4 (+ Google Ads conversion). Nothing loads before consent.
import { getAttribution } from './attribution.js';

const CONSENT_KEY = 'jdw_consent';
const PENDING_KEY = 'jdw_pending_event';

const EVENTS = {
  lead: { fb: 'Lead', ga: 'generate_lead' },
  schedule: { fb: 'Schedule', ga: 'book_valuation' },
  whatsapp: { fb: 'Contact', ga: 'click_whatsapp' },
  phone: { fb: 'Contact', ga: 'click_phone' },
};

let cfg = {};
let loaded = false;

export const getConsent = () => {
  try { return localStorage.getItem(CONSENT_KEY); } catch { return null; }
};
export const setConsent = (v) => {
  try { localStorage.setItem(CONSENT_KEY, v); } catch {}
};

function loadMeta() {
  if (!cfg.pixelId || window.fbq) return;
  const n = (window.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); });
  if (!window._fbq) window._fbq = n;
  n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
  const s = document.createElement('script');
  s.async = true; s.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(s);
  window.fbq('init', cfg.pixelId);
  window.fbq('track', 'PageView');
}

function loadGa() {
  if (!cfg.ga4Id || window.gtag) return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  const s = document.createElement('script');
  s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(cfg.ga4Id);
  document.head.appendChild(s);
  window.gtag('js', new Date());
  window.gtag('config', cfg.ga4Id);
  if (cfg.gadsConversion && cfg.ga4Id) window.gtag('config', cfg.gadsConversion.split('/')[0]);
}

/** Fire a named event (lead, schedule, whatsapp, phone). No-op without consent. */
export function track(name, data = {}, eventId) {
  if (getConsent() !== 'granted' || !loaded) return;
  const e = EVENTS[name];
  if (!e) return;
  if (window.fbq) window.fbq('track', e.fb, data, eventId ? { eventID: eventId } : undefined);
  if (window.gtag) window.gtag('event', e.ga, data);
  if (name === 'schedule' && window.gtag && cfg.gadsConversion)
    window.gtag('event', 'conversion', { send_to: cfg.gadsConversion });
}

function flushPending() {
  let p;
  try { p = JSON.parse(sessionStorage.getItem(PENDING_KEY) || 'null'); } catch {}
  if (!p || !location.pathname.includes('thank-you')) return;
  try { sessionStorage.removeItem(PENDING_KEY); } catch {} // fire once
  track(p.name, p.data || {}, p.id);
}

export function startTracking() {
  if (loaded || getConsent() !== 'granted') return;
  loaded = true;
  loadMeta();
  loadGa();
  flushPending();
}

export function initTracking(config) {
  cfg = config || {};
  startTracking();
  // Contact events on WhatsApp / phone clicks.
  document.addEventListener('click', (ev) => {
    const a = ev.target.closest && ev.target.closest('a[data-track]');
    if (!a) return;
    const a2 = getAttribution();
    track(a.dataset.track, { track: a2.track, placement: a.dataset.place || 'page' });
  });
}

export function queuePending(name, data, id) {
  try { sessionStorage.setItem(PENDING_KEY, JSON.stringify({ name, data, id })); } catch {}
}
