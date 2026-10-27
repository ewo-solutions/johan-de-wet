import { validateLead } from '../../src/lib/validate.js';
import { allow } from './ratelimit.mjs';
import { sendEmail, cfg, pingWebhook } from './email.mjs';
import { sendCapi } from './capi.mjs';
import { latestReportByName } from './reports.mjs';

const SIGNOFF = '\nKind regards\nJohan de Wet\nProperty Practitioner, Property.CoZa Protea\nPPRA FFC 1164169';

const attribution = (d) =>
  ['source_page', 'track', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'fbclid', 'gclid']
    .map((k) => `${k}: ${d[k] || '-'}`).join('\n');

/**
 * Handles one Netlify Forms submission (from the submission-created event).
 * `payload` is the submission: { form_name, data, ip, user_agent, ... }.
 * Returns a short status string for logs/tests.
 */
export async function processSubmission(payload, event) {
  const form = payload.form_name;
  const d = payload.data || {};
  const kind = { 'report-request': 'report', 'valuation-request': 'valuation', 'suburb-interest': 'suburb' }[form];
  if (!kind) return 'ignored: unknown form';
  if (d['bot-field']) return 'ignored: honeypot';

  const { errors, clean } = validateLead(kind, d);
  if (Object.keys(errors).length) {
    console.warn('Rejected submission', form, Object.keys(errors).join(','));
    return 'rejected: validation';
  }
  if (!(await allow(payload.ip, event))) {
    console.warn('Rate limited', payload.ip);
    return 'rejected: rate limit';
  }

  const { notify } = cfg();
  const origin = process.env.URL || process.env.SITE_URL || '';
  const where = clean.complex === 'Other' ? `Other: ${clean.complex_other}` : clean.complex || clean.suburb;
  const lines = [
    `Form: ${form}`,
    `Name: ${clean.name}`,
    `Mobile: ${clean.mobile}`,
    `Email: ${clean.email}`,
    kind === 'suburb' ? `Suburb: ${clean.suburb} (tag: Other Somerset West)` : `Complex: ${where}`,
    clean.when ? `When suits: ${clean.when}` : '',
    '',
    attribution(d),
  ].filter((l) => l !== undefined);
  const hook = { form, name: clean.name, mobile: clean.mobile, email: clean.email, where, track: d.track || 'B', source_page: d.source_page };

  let eventName = null;
  let custom = {};

  if (kind === 'report') {
    eventName = 'Lead';
    custom = { complex: clean.complex, track: d.track || 'B' };
    const report = clean.complex === 'Other Somerset West' ? null : latestReportByName(clean.complex);
    let delivered = false;
    if (report) {
      let attachment = null;
      try {
        const res = await fetch(new URL(report.pdf, origin).toString());
        if (res.ok) attachment = { filename: `${report.slug}-${report.quarter.replace(/\s+/g, '-').toLowerCase()}.pdf`, content: Buffer.from(await res.arrayBuffer()).toString('base64') };
      } catch (e) { console.error('PDF fetch failed', e.message); }
      if (attachment) {
        delivered = await sendEmail({
          to: clean.email,
          replyTo: notify,
          subject: `Your ${report.quarter.split(' ')[0]} report for ${report.name}`,
          text: `Hi ${clean.name.split(/\s+/)[0]},\n\nThank you for asking. The ${report.quarter} property report for ${report.name} is attached.\n\nIt covers registered sales for ${report.periodLabel}. If you would like to know what your own unit is worth today, reply to this email or call me on the number below and we can set up a free valuation.\n\nAll market data is sourced from publicly available property records and is indicative only. It is not a formal valuation.\n${SIGNOFF}`,
          attachments: [attachment],
        });
      } else {
        lines.push('', 'ACTION NEEDED: report PDF could not be fetched. Please send it manually.');
        await sendEmail({
          to: clean.email, replyTo: notify,
          subject: `Your report for ${report.name}`,
          text: `Hi ${clean.name.split(/\s+/)[0]},\n\nThank you for asking. I am sending the ${report.name} report to you personally and you will have it shortly.\n${SIGNOFF}`,
        });
      }
    } else {
      lines.push('', clean.complex === 'Other Somerset West' ? 'No report for this area yet; tagged Other Somerset West.' : 'ACTION NEEDED: no report found for this complex.');
    }
    await sendEmail({ to: notify, subject: `New report request: ${clean.complex}${delivered ? '' : ' (check delivery)'}`, text: lines.join('\n') });
  } else if (kind === 'valuation') {
    eventName = 'Schedule';
    custom = { complex: clean.complex === 'Other' ? clean.complex_other : clean.complex, track: d.track || 'B' };
    await sendEmail({ to: notify, subject: `New valuation request: ${where} (${clean.when})`, text: lines.join('\n') });
    await sendEmail({
      to: clean.email, replyTo: notify,
      subject: 'Your free valuation request',
      text: `Hi ${clean.name.split(/\s+/)[0]},\n\nThank you, it is with me. I will be in touch shortly to confirm a time (you said: ${clean.when.toLowerCase()}).\n\nIf anything changes before then, simply reply to this email.\n${SIGNOFF}`,
    });
  } else {
    await sendEmail({ to: notify, subject: `New suburb interest: ${clean.suburb}`, text: lines.join('\n') });
  }

  await pingWebhook(hook);

  if (eventName && d.tracking_consent === 'granted' && d.event_id) {
    await sendCapi({
      eventName, eventId: d.event_id, ip: payload.ip, userAgent: payload.user_agent,
      url: origin + (d.source_page || ''), email: clean.email, phone: clean.mobile, name: clean.name,
      fbclid: d.fbclid, custom,
    });
  }
  return 'ok';
}
