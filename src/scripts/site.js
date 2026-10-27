import { captureAttribution } from './attribution.js';
import { initTracking, getConsent, setConsent, startTracking } from './track.js';

captureAttribution();

let cfg = {};
try { cfg = JSON.parse(document.getElementById('jdw-config').textContent); } catch {}
initTracking(cfg);

// Mobile menu
const btn = document.querySelector('[data-menu-button]');
const nav = document.getElementById('site-nav');
if (btn && nav) {
  btn.addEventListener('click', () => {
    const open = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!open));
    nav.dataset.open = String(!open);
  });
}

// Consent banner
const banner = document.getElementById('consent');
const show = () => { if (banner) { banner.hidden = false; } };
const hide = () => { if (banner) banner.hidden = true; };
if (banner) {
  if (!getConsent()) show();
  banner.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-consent]');
    if (!b) return;
    setConsent(b.dataset.consent);
    hide();
    if (b.dataset.consent === 'granted') startTracking();
  });
}
document.querySelectorAll('[data-cookie-settings]').forEach((el) =>
  el.addEventListener('click', () => { show(); banner && banner.querySelector('button').focus(); })
);
