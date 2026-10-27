// Runs automatically after every Netlify Forms submission (spam-filtered by Netlify).
// Validates again server-side, rate-limits per IP, emails, and sends Meta CAPI.
import { processSubmission } from '../lib/process.mjs';

export const handler = async (event) => {
  try {
    const { payload } = JSON.parse(event.body || '{}');
    const status = await processSubmission(payload || {}, event);
    console.log('submission-created:', status);
  } catch (e) {
    console.error('submission-created failed', e);
  }
  // Always 200: Netlify has already stored the lead.
  return { statusCode: 200, body: 'ok' };
};
