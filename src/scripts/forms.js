import { validateLead, normaliseMobile } from '../lib/validate.js';
import { getAttribution, captureAttribution } from './attribution.js';

captureAttribution(); // idempotent; forms init before site.js runs
import { getConsent, queuePending } from './track.js';

const toBody = (fd) => new URLSearchParams([...fd.entries()].map(([k, v]) => [k, String(v)])).toString();

function setError(form, name, msg) {
  const field = form.elements[name];
  const box = form.querySelector(`[data-error-for="${name}"]`);
  if (!field || !box) return;
  box.textContent = msg || '';
  box.hidden = !msg;
  const inputs = field.length && !field.tagName ? [...field] : [field];
  inputs.forEach((el) => (msg ? el.setAttribute('aria-invalid', 'true') : el.removeAttribute('aria-invalid')));
}

function initForm(form) {
  const kind = form.dataset.leadForm;
  const status = form.querySelector('[data-status]');
  const other = form.querySelector('[data-other-wrap]');
  const complexSel = form.elements.complex;

  // Attribution into hidden fields.
  const a = getAttribution();
  for (const [k, v] of Object.entries(a)) if (form.elements[k]) form.elements[k].value = v;

  // Valuation: free-text field only when "Other" is chosen.
  const syncOther = () => {
    if (!other || !complexSel) return;
    other.hidden = complexSel.value !== 'Other';
  };
  if (other && complexSel) { syncOther(); complexSel.addEventListener('change', syncOther); }

  // Normalise mobile on blur.
  const mob = form.elements.mobile;
  if (mob) mob.addEventListener('blur', () => { const n = normaliseMobile(mob.value); if (n) mob.value = n; });

  // Clear an error as soon as the field is edited.
  form.addEventListener('input', (e) => { if (e.target.name) setError(form, e.target.name, ''); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (form.elements['bot-field'] && form.elements['bot-field'].value) return; // honeypot
    const values = Object.fromEntries(new FormData(form).entries());
    values.consent = form.elements.consent.checked;
    const { errors, clean } = validateLead(kind, values);
    for (const el of form.elements) if (el.name) setError(form, el.name, errors[el.name] || '');
    const first = Object.keys(errors)[0];
    if (first) {
      status.textContent = 'Please fix the highlighted fields.';
      const f = form.elements[first];
      (f.focus ? f : f[0]).focus();
      return;
    }
    status.textContent = '';
    if (clean.mobile) form.elements.mobile.value = clean.mobile;

    const eventId = (crypto.randomUUID && crypto.randomUUID()) || String(Date.now()) + Math.random().toString(16).slice(2);
    form.elements.event_id.value = eventId;
    form.elements.tracking_consent.value = getConsent() === 'granted' ? 'granted' : 'denied';

    const submit = form.querySelector('button[type=submit]');
    submit.disabled = true;
    submit.dataset.label = submit.textContent;
    submit.textContent = 'Sending…';
    try {
      const res = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: toBody(new FormData(form)),
      });
      if (!res.ok) throw new Error(String(res.status));
      const att = getAttribution();
      let url;
      if (kind === 'valuation') {
        queuePending('schedule', { complex: clean.complex_other || clean.complex, track: att.track }, eventId);
        url = '/valuation/thank-you';
      } else {
        const opt = form.elements.complex && form.elements.complex.selectedOptions[0];
        const slug = kind === 'suburb' ? 'other' : (opt && opt.dataset.slug) || 'other';
        queuePending('lead', { complex: clean.complex || 'Other Somerset West', track: att.track }, eventId);
        url = '/reports/thank-you?c=' + encodeURIComponent(slug);
      }
      location.assign(url);
    } catch {
      submit.disabled = false;
      submit.textContent = submit.dataset.label;
      status.textContent = 'Sorry, that did not go through. Please try again, or message me on WhatsApp.';
    }
  });
}

document.querySelectorAll('form[data-lead-form]').forEach(initForm);
